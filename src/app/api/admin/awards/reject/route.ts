import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient, getSupabaseSetupHint } from "@/lib/server/supabase-admin";
import { sendNominationRejectionEmail } from "@/lib/server/awards-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const nominationRef = typeof body?.nominationRef === "string" ? body.nominationRef.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!nominationRef) return NextResponse.json({ error: "Nomination reference is required." }, { status: 400 });
  if (!reason || reason.length > 500) {
    return NextResponse.json({ error: "Provide a rejection reason of up to 500 characters." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: current, error: readError } = await admin
    .from("award_nominations")
    .select("nomination_ref, nominee_email, nominee_name, category, status")
    .eq("nomination_ref", nominationRef)
    .maybeSingle();

  if (readError) {
    console.error("Could not load award nomination for rejection:", readError);
    return NextResponse.json(
      { error: getSupabaseSetupHint(readError) ?? "Could not load nomination." },
      { status: 503 }
    );
  }
  if (!current || !["pending_review", "rejected"].includes(current.status)) {
    return NextResponse.json({ error: "Nomination not found or cannot be rejected from its current status." }, { status: 409 });
  }

  const { data: updated, error: updateError } = await admin
    .from("award_nominations")
    .update({
      status: "rejected",
      reviewer_notes: reason,
      reviewed_at: new Date().toISOString(),
      decision_email_sent_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("nomination_ref", nominationRef)
    .in("status", ["pending_review", "rejected"])
    .select("nomination_ref")
    .maybeSingle();
  if (updateError) {
    console.error("Could not reject award nomination:", updateError);
    return NextResponse.json(
      { error: getSupabaseSetupHint(updateError) ?? "Could not update nomination." },
      { status: 503 }
    );
  }
  if (!updated) return NextResponse.json({ error: "Nomination status changed. Refresh and retry." }, { status: 409 });

  const emailResult = await sendNominationRejectionEmail(current, reason);
  if (!emailResult.ok) {
    return NextResponse.json({
      ok: true,
      message: `Nomination ${nominationRef} was rejected.`,
      warning: `The decision email was not sent: ${emailResult.error || "Email delivery failed."} Use the resend action after correcting email configuration.`,
    });
  }

  const { error: emailStatusError } = await admin
    .from("award_nominations")
    .update({ decision_email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("nomination_ref", nominationRef)
    .eq("status", "rejected");
  if (emailStatusError) {
    console.error("Rejection email was sent but its delivery status could not be saved:", emailStatusError);
    return NextResponse.json({
      ok: true,
      message: `Nomination ${nominationRef} was rejected.`,
      warning: "The decision email was sent, but its delivery status could not be saved.",
    });
  }

  return NextResponse.json({ ok: true, message: `Nomination ${nominationRef} was rejected and the nominee was notified.` });
}
