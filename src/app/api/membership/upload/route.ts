import { NextRequest, NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import {
  getAdminClient,
  getSupabaseSetupHint,
  getUserFromRequest,
} from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { DOCUMENT_UPLOAD_CONSTRAINTS } from "@/lib/membership-verification";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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
  const rateLimitRes = await enforceRateLimit(req, "document_upload");
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Please sign in before uploading a verification document." }, { status: 401 });
    }

    const form = await req.formData().catch(() => null);

    if (!form) {
      return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    const applicationId = String(form.get("applicationId") || "").trim();

    if (!applicationId) {
      return NextResponse.json({ error: "Application reference is required." }, { status: 400 });
    }

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
    const contentType = MIME_TYPES[originalExt];
    if (!contentType || (file.type && file.type !== contentType)) {
      return NextResponse.json({ error: "The selected file type does not match its contents." }, { status: 415 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            getSupabaseSetupHint(new Error("Supabase service role is not configured")) ??
            "Membership applications are temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const { data: appRecord, error: lookupError } = await admin
      .from("membership_applications")
      .select("user_id, audit_log, status, document_file_url")
      .eq("id", applicationId)
      .maybeSingle();

    if (lookupError) {
      console.error("Could not verify membership application before document upload:", lookupError);
      return NextResponse.json(
        {
          error:
            getSupabaseSetupHint(lookupError) ??
            "Could not verify the membership application. Please try again.",
        },
        { status: 503 }
      );
    }
    if (!appRecord || appRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Membership application not found." }, { status: 404 });
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}${originalExt}`;
    const { error: storageError } = await admin.storage
      .from("membership-verifications")
      .upload(storagePath, buffer, { contentType, upsert: false });
    if (storageError) {
      console.error("Could not store membership verification document:", storageError);
      return NextResponse.json({ error: "Could not securely store your document. Please try again." }, { status: 503 });
    }
    const currentAudit = Array.isArray(appRecord.audit_log) ? appRecord.audit_log : [];
    const newAudit = [
      ...currentAudit,
      {
        timestamp: new Date().toISOString(),
        actor: user.email || user.id,
        action: "DOCUMENT_UPLOADED",
        reason: `Uploaded ${file.name} (${Math.round(file.size / 1024)} KB).`,
        fromStatus: appRecord.status || "APPLICATION_SUBMITTED",
        toStatus: "UNDER_REVIEW",
      },
    ];

    const { data: updatedRecord, error: updateError } = await admin
      .from("membership_applications")
      .update({
        document_filename: file.name,
        document_file_url: storagePath,
        status: "UNDER_REVIEW",
        audit_log: newAudit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRecord) {
      console.error("Could not save membership document details:", updateError);
      const { error: cleanupError } = await admin.storage
        .from("membership-verifications")
        .remove([storagePath]);
      if (cleanupError) console.error("Could not remove unreferenced membership document:", cleanupError);
      if (!updatedRecord && !updateError) {
        return NextResponse.json({ error: "Membership application not found." }, { status: 404 });
      }
      return NextResponse.json(
        {
          error:
            getSupabaseSetupHint(updateError) ??
            "Could not save the verification document. Please try again.",
        },
        { status: 503 }
      );
    }

    const previousPath = appRecord.document_file_url;
    if (
      typeof previousPath === "string" &&
      /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpe?g|png|webp)$/i.test(previousPath) &&
      previousPath !== storagePath
    ) {
      const { error: removeError } = await admin.storage
        .from("membership-verifications")
        .remove([previousPath]);
      if (removeError) console.error("Could not remove replaced membership document:", removeError);
    }

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      documentUrl: `/api/membership/document?file=${encodeURIComponent(storagePath)}`,
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
