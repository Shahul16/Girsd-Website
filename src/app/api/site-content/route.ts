import { NextRequest, NextResponse } from "next/server";
import { getDefaultSiteContent, getSiteContent, isSiteContentCollection } from "@/lib/server/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("collection") ?? "";
  if (!isSiteContentCollection(requested)) {
    return NextResponse.json({ error: "Unknown content collection." }, { status: 400 });
  }

  try {
    const data = await getSiteContent(requested);
    return NextResponse.json({ collection: requested, data });
  } catch (error) {
    console.error("Could not load public site content:", error);
    return NextResponse.json(
      { error: "Content is temporarily unavailable." },
      { status: 503 }
    );
  }
}
