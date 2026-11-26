import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    const { data: nominations, error: nomErr } = await admin
      .from("award_nominations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: registrations, error: regErr } = await admin
      .from("award_registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (nomErr || regErr) {
      return NextResponse.json(
        { error: nomErr?.message || regErr?.message || "Failed to query records." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      nominations: nominations || [],
      registrations: registrations || [],
    });
  } catch (err: any) {
    console.error("Error in awards list API:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

