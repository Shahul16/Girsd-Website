import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { SITE } from "@/lib/site";
import { AWARDS_REGISTRATION_FEE_PENCE, AWARDS_REGISTRATION_FEE_GBP } from "@/lib/awards";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAttendanceMode(value: unknown): value is "in_person" | "virtual" | "proxy" {
  return value === "in_person" || value === "virtual" || value === "proxy";
}

function isAwardsAssetUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawSupabaseUrl) return false;
  try {
    const projectUrl = new URL(rawSupabaseUrl.startsWith("http") ? rawSupabaseUrl : `https://${rawSupabaseUrl}`);
    const assetUrl = new URL(value);
    return assetUrl.origin === projectUrl.origin &&
      assetUrl.pathname.includes("/storage/v1/object/public/awards-assets/");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "checkout");
  if (limited) return limited;

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe payments are not configured yet (STRIPE_SECRET_KEY missing)." },
        { status: 503 }
      );
    }

    const body: unknown = await req.json().catch(() => null);
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid registration payload." }, { status: 400 });
    }

    const {
      nomination_ref,
      award_category,
      full_name_engraving,
      designation,
      organization,
      department,
      country,
      city,
      email,
      phone_whatsapp,
      headshot_url,
      logo_url,
      linkedin_url,
      website_orcid_url,
      name_pronunciation,
      attendance_mode,
      proxy_name,
      proxy_relationship,
      proxy_email,
      proxy_phone,
      accompanying_guests_count,
      guests_details,
      shipping_address,
      billing_entity_type,
      billing_name,
      billing_address,
      vat_tax_number,
      media_consent,
      no_refund_consent,
    } = body;

    if (
      !isNonEmptyString(nomination_ref) ||
      !isNonEmptyString(award_category) ||
      !isNonEmptyString(full_name_engraving) ||
      !isNonEmptyString(designation) ||
      !isNonEmptyString(organization) ||
      !isNonEmptyString(country) ||
      !isNonEmptyString(city) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone_whatsapp)
    ) {
      return NextResponse.json(
        { error: "Please complete all mandatory personal and award details in Section A." },
        { status: 400 }
      );
    }

    if (!isAwardsAssetUrl(headshot_url)) {
      return NextResponse.json(
        { error: "Upload a headshot to the official awards media library before continuing." },
        { status: 400 }
      );
    }
    if (logo_url && !isAwardsAssetUrl(logo_url)) {
      return NextResponse.json({ error: "Upload the logo to the official awards media library." }, { status: 400 });
    }

    if (!isAttendanceMode(attendance_mode)) {
      return NextResponse.json(
        { error: "Please select your attendance mode in Section C." },
        { status: 400 }
      );
    }

    if (attendance_mode === "proxy") {
      if (
        !isNonEmptyString(proxy_name) ||
        !isNonEmptyString(proxy_relationship) ||
        !isNonEmptyString(proxy_email) ||
        !isNonEmptyString(proxy_phone)
      ) {
        return NextResponse.json(
          { error: "Please provide all representative / proxy details." },
          { status: 400 }
        );
      }
    }

    if (attendance_mode === "virtual") {
      if (
        !isRecord(shipping_address) ||
        !isNonEmptyString(shipping_address.street) ||
        !isNonEmptyString(shipping_address.city) ||
        !isNonEmptyString(shipping_address.postalCode) ||
        !isNonEmptyString(shipping_address.country) ||
        !isNonEmptyString(shipping_address.deliveryPhone)
      ) {
        return NextResponse.json(
          { error: "Please complete all physical courier address fields for trophy shipment." },
          { status: 400 }
        );
      }
    }

    if (!isNonEmptyString(billing_name) || !isNonEmptyString(billing_address)) {
      return NextResponse.json(
        { error: "Please provide complete billing name and address details." },
        { status: 400 }
      );
    }

    if (!media_consent || !no_refund_consent) {
      return NextResponse.json(
        { error: "You must accept both mandatory policy checkboxes (Media Consent & No-Refund Policy) to proceed." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Award registration is temporarily unavailable." }, { status: 503 });
    }

    const nominationRef = nomination_ref.trim().toUpperCase();
    const { data: nomination, error: nominationError } = await admin
      .from("award_nominations")
      .select("nomination_ref, category, status")
      .ilike("nomination_ref", nominationRef)
      .maybeSingle();
    if (nominationError) {
      console.error("Could not verify nomination before award checkout:", nominationError);
      return NextResponse.json({ error: "Could not verify this award selection." }, { status: 503 });
    }
    if (!nomination) {
      return NextResponse.json({ error: "Nomination reference was not found." }, { status: 404 });
    }
    if (nomination.status !== "selected") {
      return NextResponse.json({ error: "Only selected nominations can register for an award." }, { status: 409 });
    }
    if (nomination.category.trim().toLowerCase() !== award_category.trim().toLowerCase()) {
      return NextResponse.json({ error: "Award category does not match the selected nomination." }, { status: 400 });
    }

    const { data: paidRegistration, error: paidReadError } = await admin
      .from("award_registrations")
      .select("id")
      .eq("nomination_ref", nomination.nomination_ref)
      .eq("payment_status", "paid")
      .limit(1)
      .maybeSingle();
    if (paidReadError) {
      console.error("Could not check existing award payment:", paidReadError);
      return NextResponse.json({ error: "Could not check this award registration." }, { status: 503 });
    }
    if (paidRegistration) {
      return NextResponse.json({ error: "This nomination already has a paid registration." }, { status: 409 });
    }

    const { data: pendingRegistration, error: pendingReadError } = await admin
      .from("award_registrations")
      .select("id, stripe_session_id")
      .eq("nomination_ref", nomination.nomination_ref)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingReadError) {
      console.error("Could not check pending award registration:", pendingReadError);
      return NextResponse.json({ error: "Could not check this award registration." }, { status: 503 });
    }

    const stripe = new Stripe(secretKey);
    if (pendingRegistration?.stripe_session_id) {
      const previousSession = await stripe.checkout.sessions.retrieve(pendingRegistration.stripe_session_id);
      if (previousSession.status === "open") {
        await stripe.checkout.sessions.expire(previousSession.id);
      }
      if (previousSession.status === "complete") {
        return NextResponse.json({ error: "Payment is already processing for this nomination." }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const registrationPayload = {
      nomination_ref: nomination.nomination_ref,
      award_category: nomination.category,
      full_name_engraving: full_name_engraving.trim(),
      designation: designation.trim(),
      organization: organization.trim(),
      department: typeof department === "string" ? department.trim() || null : null,
      country: country.trim(),
      city: city.trim(),
      email: email.trim().toLowerCase(),
      phone_whatsapp: phone_whatsapp.trim(),
      headshot_url,
      logo_url: typeof logo_url === "string" ? logo_url.trim() || null : null,
      linkedin_url: typeof linkedin_url === "string" ? linkedin_url.trim() || null : null,
      website_orcid_url: typeof website_orcid_url === "string" ? website_orcid_url.trim() || null : null,
      name_pronunciation: typeof name_pronunciation === "string" ? name_pronunciation.trim() || null : null,
      attendance_mode,
      proxy_name: attendance_mode === "proxy" && typeof proxy_name === "string" ? proxy_name.trim() : null,
      proxy_relationship: attendance_mode === "proxy" && typeof proxy_relationship === "string" ? proxy_relationship.trim() : null,
      proxy_email: attendance_mode === "proxy" && typeof proxy_email === "string" ? proxy_email.trim().toLowerCase() : null,
      proxy_phone: attendance_mode === "proxy" && typeof proxy_phone === "string" ? proxy_phone.trim() : null,
      accompanying_guests_count: Math.max(0, Math.min(10, Math.floor(Number(accompanying_guests_count) || 0))),
      guests_details: Array.isArray(guests_details) ? guests_details : [],
      shipping_address: isRecord(shipping_address) ? shipping_address : null,
      amount_gbp: AWARDS_REGISTRATION_FEE_GBP,
      payment_status: "pending",
      billing_entity_type: billing_entity_type === "organization" ? "organization" : "individual",
      billing_name: billing_name.trim(),
      billing_address: billing_address.trim(),
      vat_tax_number: typeof vat_tax_number === "string" ? vat_tax_number.trim() || null : null,
      media_consent: true,
      media_consent_at: now,
      no_refund_consent: true,
      no_refund_consent_at: now,
      stripe_session_id: null,
      updated_at: now,
    };

    let registrationId: string;
    if (pendingRegistration) {
      const { data: updated, error: updateError } = await admin
        .from("award_registrations")
        .update(registrationPayload)
        .eq("id", pendingRegistration.id)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();
      if (updateError || !updated) {
        console.error("Could not update pending award registration:", updateError);
        return NextResponse.json({ error: "Could not save your award registration." }, { status: 503 });
      }
      registrationId = updated.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from("award_registrations")
        .insert(registrationPayload)
        .select("id")
        .single();
      if (insertError || !inserted) {
        console.error("Could not create award registration:", insertError);
        return NextResponse.json({ error: "Could not save your award registration." }, { status: 503 });
      }
      registrationId = inserted.id;
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || SITE.domain;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email.trim().toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: AWARDS_REGISTRATION_FEE_PENCE, // Pence
            product_data: {
              name: `GIRSD Global Awards 2026 Registration — ${nomination.category}`,
              description: `Laser-Engraved Trophy, Hardcopy & Digital Certificate, Live Recognition for ${full_name_engraving} (${nomination.nomination_ref})`,
            },
          },
        },
      ],
      metadata: {
        kind: "award_registration",
        registration_id: registrationId,
        nomination_ref: nomination.nomination_ref,
        awardee_name: full_name_engraving.trim(),
        email: email.trim().toLowerCase(),
      },
      success_url: `${origin}/awards/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/awards/register?ref=${encodeURIComponent(nomination.nomination_ref)}`,
    });

    if (!session.url) {
      await stripe.checkout.sessions.expire(session.id);
      return NextResponse.json({ error: "Could not create the Stripe checkout link." }, { status: 503 });
    }
    const { error: sessionUpdateError } = await admin
      .from("award_registrations")
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", registrationId)
      .eq("payment_status", "pending");
    if (sessionUpdateError) {
      console.error("Could not link Stripe checkout to award registration:", sessionUpdateError);
      await stripe.checkout.sessions.expire(session.id);
      return NextResponse.json({ error: "Could not save the Stripe checkout details." }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      url: session.url,
      registrationId,
    });
  } catch (err: any) {
    console.error("Stripe checkout error for awards registration:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initialize Stripe checkout session." },
      { status: 500 }
    );
  }
}

