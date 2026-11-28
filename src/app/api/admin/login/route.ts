import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/server/admin-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

/**
 * Verifies the admin password and creates a short-lived HttpOnly session.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "admin_login");
  if (limited) return limited;

  const adminKey = process.env.ADMIN_KEY;
  const body = await req.json().catch(() => null);
  const supplied = String(body?.key ?? "");

  if (!adminKey) {
    return NextResponse.json(
      { error: "Admin access is not configured yet (ADMIN_KEY is not set).", configured: false },
      { status: 503 }
    );
  }
  if (!supplied || supplied.length !== adminKey.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(adminKey))) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSession(response);
  return response;
}
