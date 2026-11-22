import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { SITE } from "@/lib/site";
import { AWARDS_REGISTRATION_FEE_PENCE, AWARDS_REGISTRATION_FEE_GBP } from "@/lib/awards";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe payments are not configured yet (STRIPE_SECRET_KEY missing)." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
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

    // Field validations
    if (!nomination_ref || !award_category || !full_name_engraving || !designation || !organization || !country || !city || !email || !phone_whatsapp) {
      return NextResponse.json(
        { error: "Please complete all mandatory personal and award details in Section A." },
        { status: 400 }
      );
    }

    if (!headshot_url) {
      return NextResponse.json(
        { error: "A high-resolution professional headshot is required in Section B." },
        { status: 400 }
      );
    }

    if (!attendance_mode || !["in_person", "virtual", "proxy"].includes(attendance_mode)) {
      return NextResponse.json(
        { error: "Please select your attendance mode in Section C." },
        { status: 400 }
      );
    }

    if (attendance_mode === "proxy") {
      if (!proxy_name || !proxy_relationship || !proxy_email || !proxy_phone) {
        return NextResponse.json(
          { error: "Please provide all representative / proxy details." },
          { status: 400 }
        );
      }
    }

    if (attendance_mode === "virtual") {
      if (!shipping_address || !shipping_address.street || !shipping_address.city || !shipping_address.postalCode || !shipping_address.country || !shipping_address.deliveryPhone) {
        return NextResponse.json(
          { error: "Please complete all physical courier address fields for trophy shipment." },
          { status: 400 }
        );
      }
    }

    if (!billing_name || !billing_address) {
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
    let registrationId = `reg_${Date.now()}`;

    // Record into Supabase table public.award_registrations
    if (admin) {
      const { data: inserted, error: insertErr } = await admin
        .from("award_registrations")
        .insert({
          nomination_ref: nomination_ref.trim(),
          award_category: award_category.trim(),
          full_name_engraving: full_name_engraving.trim(),
          designation: designation.trim(),
          organization: organization.trim(),
          department: department?.trim() || null,
          country: country.trim(),
          city: city.trim(),
          email: email.trim().toLowerCase(),
          phone_whatsapp: phone_whatsapp.trim(),
          headshot_url: headshot_url.trim(),
          logo_url: logo_url?.trim() || null,
          linkedin_url: linkedin_url?.trim() || null,
          website_orcid_url: website_orcid_url?.trim() || null,
          name_pronunciation: name_pronunciation?.trim() || null,
          attendance_mode,
          proxy_name: attendance_mode === "proxy" ? proxy_name.trim() : null,
          proxy_relationship: attendance_mode === "proxy" ? proxy_relationship.trim() : null,
          proxy_email: attendance_mode === "proxy" ? proxy_email.trim().toLowerCase() : null,
          proxy_phone: attendance_mode === "proxy" ? proxy_phone.trim() : null,
          accompanying_guests_count: Number(accompanying_guests_count) || 0,
          guests_details: Array.isArray(guests_details) ? guests_details : [],
          shipping_address: shipping_address || null,
          amount_gbp: AWARDS_REGISTRATION_FEE_GBP,
          payment_status: "pending",
          billing_entity_type: billing_entity_type === "organization" ? "organization" : "individual",
          billing_name: billing_name.trim(),
          billing_address: billing_address.trim(),
          vat_tax_number: vat_tax_number?.trim() || null,
          media_consent: true,
          media_consent_at: new Date().toISOString(),
          no_refund_consent: true,
          no_refund_consent_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("Error creating award registration in Supabase:", insertErr);
        // We will continue if table is missing or errored so user can still pay, but log it
      } else if (inserted) {
        registrationId = inserted.id;
      }
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || SITE.domain;
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email.trim().toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: AWARDS_REGISTRATION_FEE_PENCE, // 25500 (£255.00)
            product_data: {
              name: `GIRSD Global Awards 2026 Registration — ${award_category}`,
              description: `Laser-Engraved Trophy, Hardcopy & Digital Certificate, Live Recognition for ${full_name_engraving} (${nomination_ref})`,
            },
          },
        },
      ],
      metadata: {
        kind: "award_registration",
        registration_id: registrationId,
        nomination_ref: nomination_ref.trim(),
        awardee_name: full_name_engraving.trim(),
        email: email.trim().toLowerCase(),
      },
      success_url: `${origin}/awards/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/awards/register?ref=${encodeURIComponent(nomination_ref.trim())}`,
    });

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

