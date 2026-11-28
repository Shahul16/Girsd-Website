import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { handlePaidAwardRegistration } from "@/lib/server/awards-service";
import { AWARDS_REGISTRATION_FEE_GBP, AWARDS_REGISTRATION_FEE_PENCE } from "@/lib/awards";

export const runtime = "nodejs";

/**
 * Stripe webhook — records paid Checkout Sessions into the Supabase
 * `orders` table so tickets, enrolments and memberships appear on the
 * member dashboard.
 *
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   https://<your-domain>/api/stripe/webhook
 *   Events: checkout.session.completed, invoice.paid
 *
 * Env (Railway → Variables): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
async function handlePaidFulfillmentInvoice(invoice: Stripe.Invoice) {
  const admin = getAdminClient();
  if (!admin) throw new Error("Supabase admin client is unavailable.");

  const registrationId = invoice.metadata?.registration_id;
  if (!registrationId) throw new Error(`Fulfillment invoice ${invoice.id} is missing its registration reference.`);

  const { data: registration, error: readError } = await admin
    .from("award_registrations")
    .select("id, payment_status, physical_fulfillment_status, physical_fulfillment_quote_gbp, physical_fulfillment_invoice_id")
    .eq("id", registrationId)
    .maybeSingle();
  if (readError || !registration) {
    throw new Error(`Could not find registration for fulfillment invoice ${invoice.id}: ${readError?.message ?? registrationId}`);
  }

  const expectedPence = Math.round(Number(registration.physical_fulfillment_quote_gbp) * 100);
  if (
    registration.payment_status !== "paid" ||
    invoice.currency !== "gbp" ||
    !Number.isFinite(expectedPence) ||
    invoice.amount_paid !== expectedPence
  ) {
    throw new Error(`Fulfillment invoice ${invoice.id} does not match the recorded GBP quote.`);
  }
  if (registration.physical_fulfillment_invoice_id && registration.physical_fulfillment_invoice_id !== invoice.id) {
    throw new Error(`Fulfillment invoice ${invoice.id} does not match the invoice recorded for registration ${registration.id}.`);
  }
  if (
    registration.physical_fulfillment_status === "paid" &&
    registration.physical_fulfillment_invoice_id === invoice.id
  ) {
    return;
  }
  if (!["invoicing", "invoiced"].includes(registration.physical_fulfillment_status)) {
    throw new Error(`Registration ${registration.id} is not awaiting fulfillment invoice payment.`);
  }

  const { data: updated, error: updateError } = await admin
    .from("award_registrations")
    .update({
      physical_fulfillment_status: "paid",
      physical_fulfillment_invoice_id: invoice.id,
      physical_fulfillment_paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", registration.id)
    .eq("payment_status", "paid")
    .in("physical_fulfillment_status", ["invoicing", "invoiced"])
    .select("id")
    .maybeSingle();
  if (updateError) throw new Error(`Could not record fulfillment payment ${invoice.id}: ${updateError.message}`);
  if (updated) return;

  const { data: current, error: currentError } = await admin
    .from("award_registrations")
    .select("physical_fulfillment_status, physical_fulfillment_invoice_id")
    .eq("id", registration.id)
    .maybeSingle();
  if (
    currentError ||
    current?.physical_fulfillment_status !== "paid" ||
    current.physical_fulfillment_invoice_id !== invoice.id
  ) {
    throw new Error(`Fulfillment payment ${invoice.id} could not be recorded.`);
  }
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.metadata?.kind === "award_fulfillment") {
      try {
        await handlePaidFulfillmentInvoice(invoice);
      } catch (error) {
        console.error("Could not process paid award fulfillment invoice:", error);
        return NextResponse.json({ error: "Could not record fulfillment invoice payment." }, { status: 500 });
      }
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const m = session.metadata ?? {};
      if (
        m.kind === "award_registration" &&
        (session.currency !== "gbp" || session.amount_total !== AWARDS_REGISTRATION_FEE_PENCE)
      ) {
        const admin = getAdminClient();
        if (!admin) {
          console.error("Could not flag underpaid award registration; Supabase is unavailable:", session.id);
          return NextResponse.json({ error: "Database not configured." }, { status: 503 });
        }
        const registrationId = m.registration_id;
        if (!registrationId) {
          console.error("Underpaid award checkout is missing its registration ID:", session.id);
          return NextResponse.json({ error: "Award registration reference is missing." }, { status: 500 });
        }
        const receivedAmount = (session.amount_total ?? 0) / 100;
        const reason = `Stripe received ${session.currency?.toUpperCase() ?? "unknown currency"} ${receivedAmount.toFixed(2)}; expected GBP ${AWARDS_REGISTRATION_FEE_GBP.toFixed(2)}. Review for a refund or balance invoice.`;
        const { data: flagged, error: flagError } = await admin
          .from("award_registrations")
          .update({
            payment_status: "failed",
            payment_review_required: true,
            payment_review_reason: reason,
            stripe_session_id: session.id,
            stripe_payment_intent: String(session.payment_intent || ""),
            updated_at: new Date().toISOString(),
          })
          .eq("id", registrationId)
          .eq("payment_status", "pending")
          .select("id")
          .maybeSingle();
        if (flagError || !flagged) {
          if (!flagError) {
            const { data: existing, error: existingError } = await admin
              .from("award_registrations")
              .select("payment_status, payment_review_required, stripe_session_id")
              .eq("id", registrationId)
              .maybeSingle();
            if (
              !existingError &&
              existing?.payment_status === "failed" &&
              existing.payment_review_required &&
              existing.stripe_session_id === session.id
            ) {
              return NextResponse.json({ received: true, reviewRequired: true });
            }
          }
          console.error("Could not flag underpaid award registration:", flagError ?? registrationId);
          return NextResponse.json({ error: "Could not flag the award payment for manual review." }, { status: 500 });
        }
        console.error(`Award registration ${registrationId} requires payment review: ${reason}`);
        return NextResponse.json({ received: true, reviewRequired: true });
      }

      const admin = getAdminClient();
      if (!admin) {
        console.error("Supabase admin not configured — order not recorded:", session.id);
        return NextResponse.json({ error: "Database not configured." }, { status: 503 });
      }
      const { error } = await admin.from("orders").upsert(
        {
          user_id: m.user_id ?? null,
          email: session.customer_details?.email ?? session.customer_email ?? null,
          kind: m.kind ?? "unknown",
          title: m.title ?? "Order",
          slug: m.slug ?? null,
          tier: m.tier || null,
          quantity: Number(m.quantity) || 1,
          amount: session.amount_total ?? 0, // pence
          currency: session.currency ?? "gbp",
          stripe_session_id: session.id,
          status: "paid",
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: true }
      );
      if (error) {
        console.error("Failed to record order:", error);
        // Return 500 so Stripe retries the webhook
        return NextResponse.json({ error: "Could not record order." }, { status: 500 });
      }

      // If this is a membership payment, update the application record to PAYMENT_COMPLETED / UNDER_REVIEW
      // CRITICAL RULE: Payment does NOT activate membership benefits automatically.
      if (m.kind === "membership") {
        const appId = m.application_id;
        if (!appId) {
          console.error("Membership checkout session is missing its application id:", session.id);
          return NextResponse.json({ error: "Membership application reference is missing." }, { status: 500 });
        }
        const { data: appRecord, error: appReadError } = await admin
          .from("membership_applications")
          .select("id, user_id, status, payment_status, stripe_session_id, audit_log")
          .eq("id", appId)
          .eq("user_id", m.user_id)
          .maybeSingle();
        if (appReadError || !appRecord) {
          console.error("Could not find membership application for paid checkout:", appReadError ?? appId);
          return NextResponse.json({ error: "Membership application could not be updated." }, { status: 500 });
        }
        if (appRecord.payment_status === "paid" && appRecord.stripe_session_id === session.id) {
          return NextResponse.json({ received: true });
        }

        const currentAudit = Array.isArray(appRecord.audit_log) ? appRecord.audit_log : [];
        const newAudit = [
          ...currentAudit,
          {
            timestamp: new Date().toISOString(),
            actor: "stripe_webhook",
            action: "PAYMENT_COMPLETED",
            reason: `Stripe session ${session.id} confirmed (£${((session.amount_total ?? 0) / 100).toFixed(2)})`,
            fromStatus: appRecord.status,
            toStatus: "UNDER_REVIEW",
          },
        ];

        const { error: appUpdateError } = await admin.from("membership_applications").update({
          payment_status: "paid",
          stripe_session_id: session.id,
          status: "UNDER_REVIEW",
          audit_log: newAudit,
          updated_at: new Date().toISOString(),
        }).eq("id", appRecord.id);
        if (appUpdateError) {
          console.error("Could not mark membership application as paid:", appUpdateError);
          return NextResponse.json({ error: "Membership application could not be updated." }, { status: 500 });
        }
      }

      // If this is an award registration payment
      if (m.kind === "award_registration") {
        try {
          await handlePaidAwardRegistration(
            session.id,
            String(session.payment_intent || ""),
            m
          );
        } catch (awardErr) {
          console.error("Error processing award registration webhook:", awardErr);
          return NextResponse.json({ error: "Could not process award registration payment." }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
