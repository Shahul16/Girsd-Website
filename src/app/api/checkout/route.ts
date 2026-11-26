import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRegistrationPhase, phasePrice, type Event } from "@/lib/data/events";
import type { Course } from "@/lib/data/courses";
import type { MembershipTier } from "@/lib/data/memberships";
import { SITE } from "@/lib/site";
import { getAdminClient, getUserFromRequest, hasActiveMembership } from "@/lib/server/supabase-admin";
import { getSiteContent } from "@/lib/server/site-content";

export const runtime = "nodejs";

/**
 * Creates a real Stripe Checkout Session. Prices are computed SERVER-SIDE
 * from the site's data files (never trusted from the client), and the member
 * discount (10% tickets / 5% courses) is verified against the orders table.
 *
 * Env (Railway → Variables): STRIPE_SECRET_KEY (+ Supabase vars for auth).
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payments are not configured yet (STRIPE_SECRET_KEY missing)." },
      { status: 503 }
    );
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in to complete checkout." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const type = String(body.type ?? "");
  const quantity = Math.min(5, Math.max(1, Number(body.quantity) || 1));
  const [eventContent, courseContent, tierContent, siteContent] = await Promise.all([
    getSiteContent("events"),
    getSiteContent("courses"),
    getSiteContent("membership_tiers"),
    getSiteContent("site"),
  ]);
  const currentEvents = Array.isArray(eventContent) ? eventContent as Event[] : [];
  const currentCourses = Array.isArray(courseContent) ? courseContent as Course[] : [];
  const currentTiers = Array.isArray(tierContent) ? tierContent as MembershipTier[] : [];
  const site = siteContent && typeof siteContent === "object" ? siteContent as typeof SITE : SITE;
  let applicationId = "";

  // --- Build the priced item server-side --------------------------------
  let title = "";
  let description = "";
  let unitPrice = 0; // GBP
  let discountRate = 0;
  let slug = "";
  let tierName = "";

  if (type === "ticket") {
    const event = currentEvents.find((item) => item.slug === String(body.event ?? ""));
    const tier = event?.tickets.find((t: { id: string }) => t.id === String(body.tier ?? ""));
    if (!event || !tier) return NextResponse.json({ error: "Unknown event or ticket tier." }, { status: 400 });
    const isMember = await hasActiveMembership(user.id);
    const phase = getRegistrationPhase(event);
    title = `${event.acronym} — ${tier.name}`;
    description = `${event.title} · ${phase.label}`;
    unitPrice = phasePrice(tier.price, phase.multiplier);
    discountRate = isMember ? site.memberDiscount : 0;
    slug = event.slug;
    tierName = tier.name;
  } else if (type === "course") {
    const course = currentCourses.find((item) => item.slug === String(body.course ?? ""));
    if (!course) return NextResponse.json({ error: "Unknown course." }, { status: 400 });
    const isMember = await hasActiveMembership(user.id);
    title = course.title;
    description = `${course.duration} online course`;
    unitPrice = course.price;
    discountRate = isMember ? site.courseMemberDiscount : 0;
    slug = course.slug;
  } else if (type === "membership") {
    applicationId = String(body.application_id ?? "");
    if (!applicationId) {
      return NextResponse.json({ error: "Submit a membership application before checkout." }, { status: 400 });
    }
    const admin = getAdminClient();
    if (!admin) return NextResponse.json({ error: "Membership checkout is temporarily unavailable." }, { status: 503 });
    const { data: application, error: applicationError } = await admin
      .from("membership_applications")
      .select("id, user_id, tier_id, tier_name, annual_fee, payment_status")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (applicationError) {
      console.error("Could not verify membership application for checkout:", applicationError);
      return NextResponse.json({ error: "Could not verify your membership application." }, { status: 503 });
    }
    if (!application || application.payment_status !== "unpaid") {
      return NextResponse.json({ error: "This membership application is unavailable for payment." }, { status: 404 });
    }
    const selectedTier = currentTiers.find((item) => item.id === application.tier_id);
    if (!selectedTier || selectedTier.id !== String(body.tier ?? "")) {
      return NextResponse.json({ error: "The membership tier does not match your application." }, { status: 400 });
    }
    const fee = Number(application.annual_fee);
    if (!Number.isFinite(fee) || fee <= 0) {
      return NextResponse.json({ error: "The membership fee on your application is invalid." }, { status: 400 });
    }
    title = `GIRSD ${application.tier_name} Membership`;
    description = "Annual membership — 12 months from purchase";
    unitPrice = fee;
    slug = application.tier_id;
    tierName = application.tier_name;
  } else {
    return NextResponse.json({ error: "Unknown item type." }, { status: 400 });
  }

  const qty = type === "ticket" ? quantity : 1;
  const unitPence = Math.round(unitPrice * (1 - discountRate) * 100);
  if (discountRate > 0) {
    description += ` · includes ${Math.round(discountRate * 100)}% member discount`;
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE.domain;
  const returnTo = typeof body.returnTo === "string" && body.returnTo.startsWith("/")
    ? body.returnTo
    : "/";

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: "gbp",
            unit_amount: unitPence,
            product_data: { name: title, description },
          },
        },
      ],
      metadata: {
        user_id: user.id,
        kind: type,
        slug,
        tier: tierName,
        quantity: String(qty),
        title,
        application_id: applicationId,
      },
      success_url: `${origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnTo}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again in a moment." },
      { status: 502 }
    );
  }
}
