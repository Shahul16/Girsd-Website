import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

const STORAGE_PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpe?g|png|webp)$/i;
const LEGACY_NAME_PATTERN = /^girsd-doc-[0-9a-f-]{36}\.(pdf|jpe?g|png|webp)$/i;

export async function GET(req: NextRequest) {
  const fileRef = req.nextUrl.searchParams.get("file") ?? "";
  if (!fileRef) return NextResponse.json({ error: "Missing document reference." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Document storage is unavailable." }, { status: 503 });

  const isAdmin = isAdminRequest(req);
  const user = isAdmin ? null : await getUserFromRequest(req);
  const userId = user?.id;

  if (STORAGE_PATH_PATTERN.test(fileRef)) {
    let query = admin
      .from("membership_applications")
      .select("id, user_id")
      .eq("document_file_url", fileRef);
    if (!isAdmin && userId) query = query.eq("user_id", userId);
    const { data: record, error } = await query.maybeSingle();
    if (error) {
      console.error("Could not verify membership document ownership:", error);
      return NextResponse.json({ error: "Could not verify document access." }, { status: 503 });
    }
    if (!record) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    if (!isAdmin && !userId) {
      return NextResponse.json({ error: "Please sign in to view this document." }, { status: 401 });
    }

    const { data, error: signedUrlError } = await admin.storage
      .from("membership-verifications")
      .createSignedUrl(fileRef, 60);
    if (signedUrlError || !data?.signedUrl) {
      console.error("Could not create membership document link:", signedUrlError);
      return NextResponse.json({ error: "Could not access this document." }, { status: 503 });
    }
    return NextResponse.redirect(data.signedUrl, 302);
  }

  const safeName = path.basename(fileRef);
  if (safeName !== fileRef || !LEGACY_NAME_PATTERN.test(safeName)) {
    return NextResponse.json({ error: "Invalid document identifier." }, { status: 400 });
  }

  let legacyQuery = admin
    .from("membership_applications")
    .select("id, user_id")
    .ilike("document_file_url", `%${safeName}%`);
  if (!isAdmin && userId) legacyQuery = legacyQuery.eq("user_id", userId);
  const { data: legacyRecord, error: lookupError } = await legacyQuery.maybeSingle();
  if (lookupError) {
    console.error("Could not verify legacy membership document ownership:", lookupError);
    return NextResponse.json({ error: "Could not verify document access." }, { status: 503 });
  }
  if (!legacyRecord) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!isAdmin && !userId) {
    return NextResponse.json({ error: "Please sign in to view this document." }, { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), "private_documents", "verifications", safeName);
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType =
      ext === ".pdf" ? "application/pdf" :
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" :
      "image/jpeg";
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Legacy document is no longer available on this server." }, { status: 404 });
    }
    console.error("Could not retrieve legacy membership document:", error);
    return NextResponse.json({ error: "Failed to retrieve document." }, { status: 500 });
  }
}
