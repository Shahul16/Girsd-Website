import { NextRequest, NextResponse } from "next/server";
import { approveSelection } from "@/lib/server/awards-service";
import { getUserFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const suppliedKey = body.adminKey || req.headers.get("x-admin-key");
    const user = await getUserFromRequest(req);

    // Validate admin key or logged in user
    if (adminKey && suppliedKey !== adminKey && !user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const nominationRef = String(body.nominationRef || "").trim();
    if (!nominationRef) {
      return NextResponse.json({ error: "nominationRef is required." }, { status: 400 });
    }

    const result = await approveSelection(nominationRef);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to approve nomination selection." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Nomination ${nominationRef} marked as selected and invitation email dispatched.`,
    });
  } catch (err: any) {
    console.error("Error in awards select API:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

