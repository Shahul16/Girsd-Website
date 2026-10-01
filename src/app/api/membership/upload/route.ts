import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { DOCUMENT_UPLOAD_CONSTRAINTS } from "@/lib/membership-verification";

export const runtime = "nodejs";

// Magic bytes signatures for permitted formats
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return true;
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // WebP: 'RIFF'....'WEBP'
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const rateLimitRes = enforceRateLimit(req, "document_upload");
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getUserFromRequest(req);
    const form = await req.formData().catch(() => null);

    if (!form) {
      return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    const applicationId = String(form.get("applicationId") || "").trim();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Please select a verification document." }, { status: 400 });
    }

    // 2. File size enforcement (5 MB)
    if (file.size > DOCUMENT_UPLOAD_CONSTRAINTS.maxSizeBytes) {
      return NextResponse.json(
        { error: "Document exceeds maximum allowed size of 5 MB." },
        { status: 413 }
      );
    }

    // 3. Permitted extension verification
    const originalExt = path.extname(file.name).toLowerCase();
    if (!DOCUMENT_UPLOAD_CONSTRAINTS.allowedExtensions.includes(originalExt)) {
      return NextResponse.json(
        { error: "Only PDF documents, JPG, PNG, or WebP images are permitted for verification." },
        { status: 415 }
      );
    }

    // 4. File buffer and magic byte verification
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer)) {
      return NextResponse.json(
        { error: "File contents do not match a valid PDF or image file signature." },
        { status: 400 }
      );
    }

    // 5. Generate secure random filename outside public web root
    const cleanExt = originalExt.replace(/[^a-z0-9]/g, "");
    const safeStorageName = `girsd-doc-${crypto.randomUUID()}.${cleanExt}`;

    // Stored in private directory outside web root
    const privateDir = path.join(process.cwd(), "private_documents", "verifications");
    await fs.mkdir(privateDir, { recursive: true });
    await fs.writeFile(path.join(privateDir, safeStorageName), buffer);

    const secureUrl = `/api/membership/document?file=${safeStorageName}`;

    // 6. Update application record if applicationId is provided
    if (applicationId) {
      const admin = getAdminClient();
      if (admin) {
        const { data: appRecord } = await admin
          .from("membership_applications")
          .select("audit_log, status")
          .eq("id", applicationId)
          .maybeSingle();

        const currentAudit = Array.isArray(appRecord?.audit_log) ? appRecord.audit_log : [];
        const newAudit = [
          ...currentAudit,
          {
            timestamp: new Date().toISOString(),
            actor: user?.email || user?.id || "applicant",
            action: "DOCUMENT_UPLOADED",
            reason: `Uploaded ${file.name} (${Math.round(file.size / 1024)} KB).`,
            fromStatus: appRecord?.status || "APPLICATION_SUBMITTED",
            toStatus: "UNDER_REVIEW",
          },
        ];

        await admin
          .from("membership_applications")
          .update({
            document_filename: file.name,
            document_file_url: secureUrl,
            status: "UNDER_REVIEW",
            audit_log: newAudit,
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);
      }
    }

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      documentUrl: secureUrl,
      message: "Verification document uploaded successfully.",
    });
  } catch (err: any) {
    console.error("Document upload failed:", err);
    return NextResponse.json(
      { error: "Failed to process document upload. Please try again." },
      { status: 500 }
    );
  }
}
