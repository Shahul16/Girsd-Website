import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await admin.storage.from("site-media").list("", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) {
    console.error("Could not list site media:", error);
    return NextResponse.json({ error: "Could not load media from Supabase Storage." }, { status: 503 });
  }

  const media = (data ?? []).map((file) => {
    const { data: publicUrl } = admin.storage.from("site-media").getPublicUrl(file.name);
    return {
      name: file.name,
      path: publicUrl.publicUrl,
      size: Number(file.metadata?.size ?? 0),
      mtime: file.created_at ? new Date(file.created_at).getTime() : 0,
    };
  });
  return NextResponse.json({ ok: true, media });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const mediaUrl = typeof body?.path === "string" ? body.path : "";
  let objectPath = "";
  try {
    const parsedUrl = new URL(mediaUrl);
    const marker = "/site-media/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex >= 0) objectPath = decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
  } catch {
    return NextResponse.json({ error: "Invalid media reference." }, { status: 400 });
  }
  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid media reference." }, { status: 400 });
  }

  const { error } = await admin.storage.from("site-media").remove([objectPath]);
  if (error) {
    console.error("Could not delete site media:", error);
    return NextResponse.json({ error: "Could not delete media." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
