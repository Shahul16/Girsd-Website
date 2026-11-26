import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to view your profile." }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Profile service is temporarily unavailable." }, { status: 503 });

  const { data, error } = await admin
    .from("member_profiles")
    .select("profile, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Could not load member profile:", error);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 503 });
  }
  return NextResponse.json({ profile: data?.profile ?? null, updatedAt: data?.updated_at ?? null });
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to save your profile." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.profile || typeof body.profile !== "object" || Array.isArray(body.profile)) {
    return NextResponse.json({ error: "A profile object is required." }, { status: 400 });
  }
  const serialized = JSON.stringify(body.profile);
  if (serialized.length > 100_000) {
    return NextResponse.json({ error: "Profile details must be smaller than 100 KB." }, { status: 413 });
  }
  if (typeof body.profile.photoUrl === "string" && body.profile.photoUrl.startsWith("data:")) {
    return NextResponse.json({ error: "Profile images cannot be saved as embedded data." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Profile service is temporarily unavailable." }, { status: 503 });

  const { data: current, error: readError } = await admin
    .from("member_profiles")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("Could not load member profile before saving:", readError);
    return NextResponse.json({ error: "Could not load your existing profile." }, { status: 503 });
  }
  const profile = {
    ...body.profile,
    cv: current?.profile?.cv ?? null,
  };
  const { error } = await admin.from("member_profiles").upsert(
    { user_id: user.id, profile, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("Could not save member profile:", error);
    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, profile });
}
