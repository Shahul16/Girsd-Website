import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function isSupportedDocument(extension: string, buffer: Buffer): boolean {
  if (extension === ".pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".doc") return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (extension === ".docx") return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  return false;
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "document_upload");
  if (limited) return limited;

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to upload your CV." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a CV file to upload." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "CV files must be 15 MB or smaller." }, { status: 413 });

  const extension = path.extname(file.name).toLowerCase();
  const contentType = MIME_TYPES[extension];
  if (!contentType) return NextResponse.json({ error: "Upload a PDF or Word document." }, { status: 415 });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isSupportedDocument(extension, buffer)) {
    return NextResponse.json({ error: "The file contents do not match a supported document format." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "CV storage is temporarily unavailable." }, { status: 503 });
  const storagePath = `${user.id}/${randomUUID()}${extension}`;
  const { error: uploadError } = await admin.storage.from("member-files").upload(storagePath, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadError) {
    console.error("Could not store member CV:", uploadError);
    return NextResponse.json({ error: "Could not store your CV. Please try again." }, { status: 503 });
  }

  const { data: current, error: readError } = await admin
    .from("member_profiles")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("Could not load member profile after CV upload:", readError);
    await admin.storage.from("member-files").remove([storagePath]);
    return NextResponse.json({ error: "Could not update your profile with the CV." }, { status: 503 });
  }

  const previous = current?.profile?.cv?.path;
  const uploadedAt = new Date().toISOString();
  const profile = {
    ...(current?.profile ?? {}),
    cv: {
      fileName: file.name.slice(0, 255),
      fileSize: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedAt,
      path: storagePath,
    },
  };
  const { error: updateError } = await admin.from("member_profiles").upsert(
    { user_id: user.id, profile, updated_at: uploadedAt },
    { onConflict: "user_id" }
  );
  if (updateError) {
    console.error("Could not update profile CV metadata:", updateError);
    await admin.storage.from("member-files").remove([storagePath]);
    return NextResponse.json({ error: "Could not update your profile with the CV." }, { status: 503 });
  }
  if (typeof previous === "string" && previous.startsWith(`${user.id}/`)) {
    const { error: removeError } = await admin.storage.from("member-files").remove([previous]);
    if (removeError) console.error("Could not remove replaced member CV:", removeError);
  }

  return NextResponse.json({ ok: true, profile });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to manage your CV." }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "CV storage is temporarily unavailable." }, { status: 503 });

  const { data: current, error: readError } = await admin
    .from("member_profiles")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("Could not load CV profile for removal:", readError);
    return NextResponse.json({ error: "Could not load your CV details." }, { status: 503 });
  }
  const profile = { ...(current?.profile ?? {}) };
  const previous = profile.cv?.path;
  delete profile.cv;
  const { error: updateError } = await admin.from("member_profiles").upsert(
    { user_id: user.id, profile, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (updateError) {
    console.error("Could not remove CV metadata:", updateError);
    return NextResponse.json({ error: "Could not remove your CV. Please try again." }, { status: 503 });
  }
  if (typeof previous === "string" && previous.startsWith(`${user.id}/`)) {
    const { error: removeError } = await admin.storage.from("member-files").remove([previous]);
    if (removeError) console.error("Could not remove CV from private storage:", removeError);
  }
  return NextResponse.json({ ok: true, profile });
}
