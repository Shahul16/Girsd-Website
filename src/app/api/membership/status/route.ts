import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/**
 * Retrieves the current user's membership application status and verification trail.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ application: null, status: "UNCONFIGURED" });
    }

    const { data, error } = await admin
      .from("membership_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching application status:", error);
      return NextResponse.json({ application: null });
    }

    return NextResponse.json({
      application: data || null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to retrieve status." }, { status: 500 });
  }
}
