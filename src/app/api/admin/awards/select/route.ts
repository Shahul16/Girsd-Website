import { NextRequest, NextResponse } from "next/server";
import { approveSelection } from "@/lib/server/awards-service";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    if (!isAdminRequest(req)) {
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

