import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { handlePaidAwardRegistration } from "@/lib/server/awards-service";

export const runtime = "nodejs";

/**
 * Stripe webhook — records paid Checkout Sessions into the Supabase
 * `orders` table so tickets, enrolments and memberships appear on the
 * member dashboard.
 *
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   https://<your-domain>/api/stripe/webhook
 *   Event: checkout.session.completed
 *
 * Env (Railway → Variables): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const admin = getAdminClient();
      if (!admin) {
        console.error("Supabase admin not configured — order not recorded:", session.id);
        return NextResponse.json({ error: "Database not configured." }, { status: 503 });
      }
      const m = session.metadata ?? {};
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

      // If this is an award registration payment (£255 GBP)
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
