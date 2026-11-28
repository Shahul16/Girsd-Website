import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

const FULFILLMENT_LABELS: Record<string, string> = {
  printed_certificate: "Printed certificate",
  trophy: "Physical trophy",
};

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId.trim() : "";
  const amountGbp = typeof body?.amountGbp === "number" ? body.amountGbp : Number(body?.amountGbp);
  const amountPence = Math.round(amountGbp * 100);
  if (!/^[0-9a-f-]{36}$/i.test(registrationId)) {
    return NextResponse.json({ error: "A valid award registration ID is required." }, { status: 400 });
  }
  if (
    !Number.isFinite(amountGbp) ||
    amountPence < 1 ||
    amountPence > 1_000_000 ||
    Math.abs(amountGbp * 100 - amountPence) > 0.001
  ) {
    return NextResponse.json({ error: "Enter a fulfillment quote from £0.01 to £10,000.00, with at most two decimals." }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe invoicing is not configured." }, { status: 503 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Award records are temporarily unavailable." }, { status: 503 });

  const { data: registration, error: readError } = await admin
    .from("award_registrations")
    .select("id, nomination_ref, full_name_engraving, email, payment_status, physical_fulfillment_items, physical_fulfillment_status, physical_fulfillment_quote_gbp, physical_fulfillment_invoice_id, physical_fulfillment_invoice_url, shipping_address")
    .eq("id", registrationId)
    .maybeSingle();
  if (readError) {
    console.error("Could not load award fulfillment request:", readError);
    return NextResponse.json({ error: "Could not load this fulfillment request." }, { status: 503 });
  }
  if (!registration || registration.payment_status !== "paid") {
    return NextResponse.json({ error: "The base award registration must be paid before quoting fulfillment." }, { status: 409 });
  }
  const items = Array.isArray(registration.physical_fulfillment_items)
    ? registration.physical_fulfillment_items.filter((item: unknown): item is string => typeof item === "string" && item in FULFILLMENT_LABELS)
    : [];
  if (!items.length || !registration.shipping_address) {
    return NextResponse.json({ error: "This registration has no complete physical fulfillment request." }, { status: 409 });
  }
  if (registration.physical_fulfillment_status === "paid") {
    return NextResponse.json({ error: "Physical fulfillment has already been paid." }, { status: 409 });
  }
  if (registration.physical_fulfillment_invoice_id) {
    if (Number(registration.physical_fulfillment_quote_gbp) !== amountGbp) {
      return NextResponse.json({ error: "An invoice already exists for a different quote. Void it in Stripe before issuing a new quote." }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      invoiceUrl: registration.physical_fulfillment_invoice_url,
      message: "The existing fulfillment invoice is already recorded.",
    });
  }
  if (
    registration.physical_fulfillment_status === "invoicing" &&
    Number(registration.physical_fulfillment_quote_gbp) !== amountGbp
  ) {
    return NextResponse.json({ error: "An invoice is already being created for a different quote." }, { status: 409 });
  }

  const { data: reserved, error: lockError } = await admin.rpc("reserve_award_fulfillment_quote", {
    p_registration_id: registrationId,
    p_quote_gbp: amountGbp,
  });
  if (lockError) {
    console.error("Could not reserve fulfillment invoice creation:", lockError);
    return NextResponse.json({ error: "Could not prepare the fulfillment invoice." }, { status: 503 });
  }
  if (reserved !== true) {
    return NextResponse.json({ error: "This fulfillment request changed or is already being invoiced. Refresh the record and try again." }, { status: 409 });
  }

  const itemDescription = items.map((item) => FULFILLMENT_LABELS[item]).join(", ");
  const idempotencyKey = `award-fulfillment-${registration.id}-${amountPence}`;
  try {
    const stripe = new Stripe(stripeKey);
    const customer = await stripe.customers.create(
      {
        email: registration.email,
        name: registration.full_name_engraving,
        metadata: { award_registration_id: registration.id, nomination_ref: registration.nomination_ref },
      },
      { idempotencyKey: `award-customer-${registration.id}` }
    );
    const invoice = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: 14,
        auto_advance: false,
        metadata: {
          kind: "award_fulfillment",
          registration_id: registration.id,
          nomination_ref: registration.nomination_ref,
          quote_gbp: amountGbp.toFixed(2),
        },
      },
      { idempotencyKey: `${idempotencyKey}-invoice` }
    );
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        amount: amountPence,
        currency: "gbp",
        description: `Physical award fulfillment (${itemDescription}) and destination-based courier`,
        metadata: { award_registration_id: registration.id, nomination_ref: registration.nomination_ref },
      },
      { idempotencyKey: `${idempotencyKey}-item` }
    );
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      invoice.id,
      {},
      { idempotencyKey: `${idempotencyKey}-finalize` }
    );
    const sentInvoice = await stripe.invoices.sendInvoice(
      finalizedInvoice.id,
      {},
      { idempotencyKey: `${idempotencyKey}-send` }
    );
    if (!sentInvoice.hosted_invoice_url) {
      throw new Error("Stripe did not provide a hosted invoice URL.");
    }

    const { data: updatedRegistration, error: updateError } = await admin
      .from("award_registrations")
      .update({
        physical_fulfillment_status: "invoiced",
        physical_fulfillment_invoice_id: sentInvoice.id,
        physical_fulfillment_invoice_url: sentInvoice.hosted_invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registration.id)
      .eq("physical_fulfillment_status", "invoicing")
      .select("id")
      .maybeSingle();
    if (updateError) {
      console.error("Stripe sent the fulfillment invoice but the database update failed:", updateError);
      return NextResponse.json({
        ok: true,
        invoiceUrl: sentInvoice.hosted_invoice_url,
        warning: "The invoice was sent, but its status could not be saved. Refresh the record and contact support if it remains marked as invoicing.",
      });
    }
    if (!updatedRegistration) {
      const { data: current, error: currentError } = await admin
        .from("award_registrations")
        .select("physical_fulfillment_status, physical_fulfillment_invoice_id")
        .eq("id", registration.id)
        .maybeSingle();
      if (
        currentError ||
        !["invoiced", "paid"].includes(current?.physical_fulfillment_status) ||
        current?.physical_fulfillment_invoice_id !== sentInvoice.id
      ) {
        console.error("Stripe sent the fulfillment invoice but the database status is inconsistent:", currentError ?? current);
        return NextResponse.json({
          ok: true,
          invoiceUrl: sentInvoice.hosted_invoice_url,
          warning: "The invoice was sent, but its status could not be confirmed. Refresh the record and contact support if it remains marked as invoicing.",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      invoiceUrl: sentInvoice.hosted_invoice_url,
      message: `A £${amountGbp.toFixed(2)} physical fulfillment invoice was sent to ${registration.email}.`,
    });
  } catch (error) {
    console.error("Could not create or send award fulfillment invoice:", error);
    return NextResponse.json({ error: "Could not create or send the separate fulfillment invoice. Retry using the same quote amount." }, { status: 502 });
  }
}
