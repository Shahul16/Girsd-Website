import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";

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
        try {
          const appId = m.application_id;
          let targetQuery = admin.from("membership_applications");

          let appRecord: any = null;
          if (appId) {
            const { data } = await admin.from("membership_applications").select("*").eq("id", appId).maybeSingle();
            appRecord = data;
          } else if (m.user_id) {
            const { data } = await admin.from("membership_applications").select("*").eq("user_id", m.user_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
            appRecord = data;
          }

          if (appRecord) {
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

            await admin.from("membership_applications").update({
              payment_status: "paid",
              stripe_session_id: session.id,
              status: "UNDER_REVIEW",
              audit_log: newAudit,
              updated_at: new Date().toISOString(),
            }).eq("id", appRecord.id);
          }
        } catch (memErr) {
          console.error("Error updating membership application status from webhook:", memErr);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
