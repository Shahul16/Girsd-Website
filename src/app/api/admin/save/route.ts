import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { isSiteContentCollection, saveSiteContent } from "@/lib/server/site-content";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.collection !== "string" || body.data === undefined || body.data === null) {
    return NextResponse.json({ error: "A collection and data are required." }, { status: 400 });
  }
  if (!isSiteContentCollection(body.collection)) {
    return NextResponse.json({ error: "Unknown content collection." }, { status: 400 });
  }

  const serialized = JSON.stringify(body.data);
  if (serialized.length > 2_000_000) {
    return NextResponse.json({ error: "Content must be smaller than 2 MB." }, { status: 413 });
  }

  try {
    await saveSiteContent(body.collection, body.data, "admin");
    return NextResponse.json({ ok: true, message: "Saved to the content database." });
  } catch (error) {
    console.error("Could not save site content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save content." },
      { status: 503 }
    );
  }
}
