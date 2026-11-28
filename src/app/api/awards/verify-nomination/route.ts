import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req, "verify_lookup");
  if (limited) return limited;

  const ref = req.nextUrl.searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json({ ok: false, error: "Nomination reference is required." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Award verification is temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await admin
      .from("award_nominations")
      .select("nomination_ref, nominee_name, nominee_email, category, status, nominee_affiliation, nominee_country")
      .ilike("nomination_ref", ref)
      .maybeSingle();

    if (error) {
      console.error("Could not verify award nomination:", error);
      return NextResponse.json(
        { ok: false, error: "Award verification is temporarily unavailable." },
        { status: 503 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "We could not find an award nomination matching this reference code." },
        { status: 404 }
      );
    }
    if (data.status !== "selected") {
      return NextResponse.json(
        { ok: false, error: "This nomination has not been selected for award registration." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      nomination: {
        nomination_ref: data.nomination_ref,
        nominee_name: data.nominee_name,
        nominee_email: data.nominee_email,
        category: data.category,
        status: data.status,
        affiliation: data.nominee_affiliation,
        country: data.nominee_country,
      },
    });
  } catch (err) {
    console.error("Error verifying nomination reference:", err);
    return NextResponse.json({ ok: false, error: "Server error checking nomination reference." }, { status: 500 });
  }
}

