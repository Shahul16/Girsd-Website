import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(path)) {
    return NextResponse.json({ error: "Invalid member file reference." }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data, error } = await admin.storage.from("member-files").createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    console.error("Could not create admin CV link:", error);
    return NextResponse.json({ error: "Could not access this CV." }, { status: 503 });
  }
  return NextResponse.redirect(data.signedUrl);
}
