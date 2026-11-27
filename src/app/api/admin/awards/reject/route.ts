import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient, getSupabaseSetupHint } from "@/lib/server/supabase-admin";

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
  const { data, error } = await admin
    .from("award_nominations")
    .update({
      status: "rejected",
      reviewer_notes: reason,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("nomination_ref", nominationRef)
    .eq("status", "pending_review")
    .select("nomination_ref")
    .maybeSingle();

  if (error) {
    console.error("Could not reject award nomination:", error);
    return NextResponse.json(
      { error: getSupabaseSetupHint(error) ?? "Could not update nomination." },
      { status: 503 }
    );
  }
  if (!data) return NextResponse.json({ error: "Nomination not found or already closed." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
