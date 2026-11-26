import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "verify_lookup");
  if (limited) return limited;

  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "A valid checkout session is required." }, { status: 400 });
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment verification is unavailable." }, { status: 503 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Registration verification is unavailable." }, { status: 503 });

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.kind !== "award_registration") {
      return NextResponse.json({ error: "This checkout session is not an award registration." }, { status: 404 });
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "unpaid" });
    }
    if (session.currency !== "gbp" || session.amount_total !== 25_500) {
      return NextResponse.json({ error: "Payment details do not match an award registration." }, { status: 409 });
    }

    const registrationId = session.metadata.registration_id;
    if (!registrationId) {
      return NextResponse.json({ error: "Award registration reference is missing." }, { status: 503 });
    }
    const { data: registration, error: registrationError } = await admin
      .from("award_registrations")
      .select("id, nomination_ref, payment_status")
      .eq("id", registrationId)
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (registrationError) {
      console.error("Could not verify award registration payment:", registrationError);
      return NextResponse.json({ error: "Could not verify award registration." }, { status: 503 });
    }
    if (!registration || registration.payment_status !== "paid") {
      return NextResponse.json({ status: "processing" });
    }

    const { data: nomination, error: nominationError } = await admin
      .from("award_nominations")
      .select("status")
      .eq("nomination_ref", registration.nomination_ref)
      .maybeSingle();
    if (nominationError) {
      console.error("Could not verify paid award nomination:", nominationError);
      return NextResponse.json({ error: "Could not verify award registration." }, { status: 503 });
    }
    return NextResponse.json({ status: nomination?.status === "registered" ? "confirmed" : "processing" });
  } catch (error) {
    console.error("Could not retrieve award checkout session:", error);
    return NextResponse.json({ error: "Could not verify this checkout session." }, { status: 404 });
  }
}
