import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import {
  getAllSiteContent,
  getSiteContent,
  isSiteContentCollection,
} from "@/lib/server/site-content";
import { getSupabaseSetupHint } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const collection = req.nextUrl.searchParams.get("collection");
  if (collection) {
    if (!isSiteContentCollection(collection)) {
      return NextResponse.json({ error: "Unknown content collection." }, { status: 400 });
    }
    return readOne(collection);
  }

  try {
    return NextResponse.json({ content: await getAllSiteContent() });
  } catch (error) {
    console.error("Could not load admin content:", error);
    const hint = getSupabaseSetupHint(error);
    return NextResponse.json({
      error: hint ?? "Could not load content from Supabase. Check the deployment server logs.",
    }, { status: 503 });
  }
}

async function readOne(collection: import("@/lib/server/site-content").SiteContentCollection) {
  try {
    return NextResponse.json({ collection, data: await getSiteContent(collection) });
  } catch (error) {
    console.error(`Could not load admin content "${collection}":`, error);
    return NextResponse.json({ error: "Could not load content." }, { status: 503 });
  }
}
