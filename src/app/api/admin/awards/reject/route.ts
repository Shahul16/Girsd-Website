import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const nominationRef = typeof body?.nominationRef === "string" ? body.nominationRef.trim() : "";
  if (!nominationRef) return NextResponse.json({ error: "Nomination reference is required." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data, error } = await admin
    .from("award_nominations")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("nomination_ref", nominationRef)
    .in("status", ["pending_review", "selected"])
    .select("nomination_ref")
    .maybeSingle();

  if (error) {
    console.error("Could not reject award nomination:", error);
    return NextResponse.json({ error: "Could not update nomination." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: "Nomination not found or already closed." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
