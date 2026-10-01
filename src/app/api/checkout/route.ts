import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getEvent, getRegistrationPhase, phasePrice } from "@/lib/data/events";
import { getCourse } from "@/lib/data/courses";
import { getTier } from "@/lib/data/memberships";
import { SITE } from "@/lib/site";
import { getUserFromRequest, hasActiveMembership } from "@/lib/server/supabase-admin";

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

  // --- Build the priced item server-side --------------------------------
  let title = "";
  let description = "";
  let unitPrice = 0; // GBP
  let discountRate = 0;
  let slug = "";
  let tierName = "";

  if (type === "ticket") {
    const event = getEvent(String(body.event ?? ""));
    const tier = event?.tickets.find((t: { id: string }) => t.id === String(body.tier ?? ""));
    if (!event || !tier) return NextResponse.json({ error: "Unknown event or ticket tier." }, { status: 400 });
    const isMember = await hasActiveMembership(user.id);
    const phase = getRegistrationPhase(event);
    title = `${event.acronym} — ${tier.name}`;
    description = `${event.title} · ${phase.label}`;
    unitPrice = phasePrice(tier.price, phase.multiplier);
    discountRate = isMember ? SITE.memberDiscount : 0;
    slug = event.slug;
    tierName = tier.name;
  } else if (type === "course") {
    const course = getCourse(String(body.course ?? ""));
    if (!course) return NextResponse.json({ error: "Unknown course." }, { status: 400 });
    const isMember = await hasActiveMembership(user.id);
    title = course.title;
    description = `${course.duration} online course`;
    unitPrice = course.price;
    discountRate = isMember ? SITE.courseMemberDiscount : 0;
    slug = course.slug;
  } else if (type === "membership") {
    const tier = getTier(String(body.tier ?? ""));
    if (!tier) return NextResponse.json({ error: "Unknown membership tier." }, { status: 400 });
    title = `GIRSD ${tier.name} Membership`;
    description = "Annual membership — 12 months from purchase";
    unitPrice = tier.price;
    slug = tier.id;
    tierName = tier.name;
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
        application_id: typeof body.application_id === "string" ? body.application_id : "",
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
