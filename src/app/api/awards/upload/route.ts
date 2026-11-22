import { NextRequest, NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  headshot: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/png", "image/svg+xml", "image/jpeg", "image/webp"],
  attachment: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "headshot").toLowerCase();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Please select a valid file to upload." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum permitted size of 5 MB." },
        { status: 413 }
      );
    }

    const allowedTypes = ALLOWED_MIME_TYPES[kind] || ALLOWED_MIME_TYPES.headshot;
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Allowed formats: ${allowedTypes.join(", ")}` },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate safe unique filename
    const ext = path.extname(file.name).toLowerCase() || (file.type === "image/png" ? ".png" : ".jpg");
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const safeFilename = `${kind}_${Date.now()}_${uniqueHash}${ext}`;
    const storagePath = `${kind}s/${safeFilename}`;

    const admin = getAdminClient();
    if (admin) {
      // Ensure bucket exists or attempt upload
      const { data: uploadData, error: uploadErr } = await admin.storage
        .from("awards-assets")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = admin.storage
          .from("awards-assets")
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            ok: true,
            url: publicUrlData.publicUrl,
            filename: file.name,
            size: file.size,
          });
        }
      } else if (uploadErr) {
        console.warn("Supabase Storage upload warning, falling back to data URL:", uploadErr.message);
      }
    }

    // Fallback: Return data URL so user can still complete checkout even if bucket is pending
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64Data}`;

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to upload file. Please try again." }, { status: 500 });
  }
}

