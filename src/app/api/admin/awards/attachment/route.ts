import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const filePath = req.nextUrl.searchParams.get("path") ?? "";
  if (!/^nominations\/[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(filePath)) {
    return NextResponse.json({ error: "Invalid nomination document reference." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Document storage is unavailable." }, { status: 503 });

  const { data: signedUrl, error } = await admin.storage
    .from("award-documents")
    .createSignedUrl(filePath, 60);
  if (error || !signedUrl?.signedUrl) {
    console.error("Could not create admin link for award document:", error);
    return NextResponse.json({ error: "Could not access this supporting document." }, { status: 503 });
  }

  return NextResponse.redirect(signedUrl.signedUrl, 302);
}
