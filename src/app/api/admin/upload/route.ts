import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function hasValidImageSignature(buffer: Buffer, ext: string): boolean {
  if (ext === ".jpg" || ext === ".jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === ".png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === ".webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (ext === ".gif") return ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6));
  if (ext === ".ico") return buffer.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]));
  return false;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 15 MB or smaller." }, { status: 413 });
  }

  const extension = path.extname(file.name).toLowerCase();
  const contentType = MIME_BY_EXTENSION[extension];
  if (!contentType || (file.type && file.type !== contentType)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, or ICO image." }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, extension)) {
    return NextResponse.json({ error: "The image contents do not match the selected file type." }, { status: 400 });
  }

  const requestedName = String(form.get("filename") || "").trim();
  const fixedName = ["logo-header", "logo-white", "favicon"].includes(requestedName) ? requestedName : "";
  const originalBase = path.basename(file.name, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "image";
  const objectName = fixedName
    ? `${fixedName}${extension}`
    : `${originalBase}-${randomUUID()}${extension}`;

  const { error } = await admin.storage.from("site-media").upload(objectName, bytes, {
    contentType,
    cacheControl: "3600",
    upsert: Boolean(fixedName),
  });
  if (error) {
    console.error("Could not upload site media:", error);
    return NextResponse.json({ error: "Could not store image in Supabase Storage." }, { status: 503 });
  }

  const { data } = admin.storage.from("site-media").getPublicUrl(objectName);
  return NextResponse.json({ ok: true, path: data.publicUrl, message: "Image uploaded to Supabase Storage." });
}
