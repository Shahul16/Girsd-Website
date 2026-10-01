import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import membersJson from "@/content/members.json";

export const runtime = "nodejs";

/**
 * Public membership & credential verification endpoint.
 * Returns minimal verifiable information (validity, credential type, institution, validUntil)
 * without leaking private applicant details (emails, phone numbers, addresses).
 */
export async function GET(req: NextRequest) {
  // Enforce rate limiting against automated scraping / enumeration
  const rateLimitRes = enforceRateLimit(req, "verify_lookup");
  if (rateLimitRes) return rateLimitRes;

  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("id") || searchParams.get("query") || "").trim().toUpperCase();

    if (!query || query.length < 3 || query.length > 50) {
      return NextResponse.json({ error: "Please enter a valid credential or reference identifier." }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Check membership_applications table
    if (admin) {
      const { data, error } = await admin
        .from("membership_applications")
        .select("id, membership_id, tier_name, status, valid_until, institution")
        .or(`membership_id.eq.${query},id.eq.${query}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const isValid =
          data.status === "ACTIVE_MEMBER" &&
          (!data.valid_until || new Date(data.valid_until) > new Date());

        return NextResponse.json({
          found: true,
          status: isValid ? "VALID" : "NOT_VALID",
          membershipId: data.membership_id || data.id,
          credentialType: "Official Membership Credential",
          tier: data.tier_name,
          institution: data.institution,
          validUntil: data.valid_until ? new Date(data.valid_until).toLocaleDateString("en-GB") : "Active",
          issuedBy: "Global Institute of Research & Skills Development (GIRSD, UK)",
        });
      }

      // 2. Check certificates table for course / paper certificates
      const { data: certData, error: certErr } = await admin
        .from("certificates")
        .select("id, course, issued_date")
        .ilike("id", query)
        .limit(1)
        .maybeSingle();

      if (!certErr && certData) {
        return NextResponse.json({
          found: true,
          status: "VALID",
          membershipId: certData.id,
          credentialType: "Accredited CPD / Conference Certificate",
          tier: certData.course,
          institution: "Global Institute of Research & Skills Development",
          validUntil: certData.issued_date ? new Date(certData.issued_date).toLocaleDateString("en-GB") : "Verified",
          issuedBy: "Global Institute of Research & Skills Development (GIRSD, UK)",
        });
      }
    }

    // 3. Check local members.json registry fallback
    const local = (membersJson as any[]).find(
      (m) => m.id?.toUpperCase() === query
    );
    if (local) {
      const isValid = local.status === "Active";
      return NextResponse.json({
        found: true,
        status: isValid ? "VALID" : "NOT_VALID",
        membershipId: local.id,
        credentialType: "Fellowship / Professional Register",
        tier: local.tier,
        institution: local.institution || "Registered Member Institution",
        validUntil: local.renewsAt ? new Date(local.renewsAt).toLocaleDateString("en-GB") : "Active",
        issuedBy: "Global Institute of Research & Skills Development (GIRSD, UK)",
      });
    }

    return NextResponse.json({
      found: false,
      status: "NOT_FOUND",
      message: "No active credential found matching this reference code.",
    });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Verification system error." }, { status: 500 });
  }
}
