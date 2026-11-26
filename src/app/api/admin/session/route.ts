import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession, isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_KEY) {
    return NextResponse.json({ authenticated: false, error: "Admin access is not configured." }, { status: 503 });
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAdminSession(response);
  return response;
}
