import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/**
 * Lists all membership applications for the administrative approval portal.
 * Requires valid ADMIN_KEY.
 */
export async function GET(req: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const suppliedKey =
      req.nextUrl.searchParams.get("adminKey") ||
      req.headers.get("x-admin-key") ||
      "";

    if (adminKey && suppliedKey !== adminKey) {
      return NextResponse.json({ error: "Unauthorized administrative access." }, { status: 401 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({
        applications: [],
        message: "Supabase database not connected.",
      });
    }

    const { data, error } = await admin
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load membership applications:", error);
      return NextResponse.json({ error: "Database query failed." }, { status: 500 });
    }

    return NextResponse.json({
      applications: data || [],
    });
  } catch (err: any) {
    console.error("Admin applications error:", err);
    return NextResponse.json({ error: "Internal processing error." }, { status: 500 });
  }
}
