import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/**
 * Secure document retrieval endpoint.
 * Protected against IDOR (Insecure Direct Object Reference).
 * Only the applicant who uploaded the document OR an authorized administrator can view/download it.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const adminKey = searchParams.get("adminKey") || req.headers.get("x-admin-key");

    if (!fileName) {
      return NextResponse.json({ error: "Missing document reference." }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeBaseName = path.basename(fileName);
    if (!safeBaseName.startsWith("girsd-doc-") && !safeBaseName.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      return NextResponse.json({ error: "Invalid document identifier." }, { status: 400 });
    }

    // Check authorization:
    let isAuthorized = false;
    let reviewerEmail: string | null = null;

    // 1. Check if admin credentials provided
    const configuredAdminKey = process.env.ADMIN_KEY;
    if (configuredAdminKey && adminKey === configuredAdminKey) {
      isAuthorized = true;
      reviewerEmail = "admin";
    }

    // 2. Check if logged-in user owns the document
    if (!isAuthorized) {
      const user = await getUserFromRequest(req);
      if (user) {
        const admin = getAdminClient();
        if (admin) {
          const { data } = await admin
            .from("membership_applications")
            .select("id, user_id, document_file_url")
            .eq("user_id", user.id)
            .ilike("document_file_url", `%${safeBaseName}%`)
            .maybeSingle();

          if (data) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access denied. You are not authorized to view this document." },
        { status: 403 }
      );
    }

    // Locate file in private storage outside public root
    const filePath = path.join(process.cwd(), "private_documents", "verifications", safeBaseName);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(safeBaseName).toLowerCase();
      let contentType = "application/octet-stream";

      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".webp") contentType = "image/webp";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${safeBaseName}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json({ error: "Document not found on storage." }, { status: 404 });
    }
  } catch (err: any) {
    console.error("Document retrieval error:", err);
    return NextResponse.json({ error: "Failed to retrieve document." }, { status: 500 });
  }
}
