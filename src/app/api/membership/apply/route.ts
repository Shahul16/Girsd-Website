import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import {
  classifyEmailDomain,
  generateApplicationId,
  type MembershipStatus,
  type ProofType,
} from "@/lib/membership-verification";
import { getTier } from "@/lib/data/memberships";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

/**
 * Submits a new Membership Eligibility Application.
 *
 * Core rule:
 * Submitting an application or making payment NEVER automatically activates membership.
 * Applications undergo verification (institutional domain check or document proof)
 * and formal administrative review before activation.
 */
export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection against automated spam/bot attacks
  const rateLimitRes = enforceRateLimit(req, "membership_apply");
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getUserFromRequest(req);
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      institution,
      department,
      roleTitle,
      tierId,
      verificationMethod,
      proofType,
      documentFileName,
      documentFileUrl,
      emailVerified,
    } = body;

    // 2. Strict Input Validation & Length Limits
    if (!name || !email || !institution || !roleTitle || !tierId) {
      return NextResponse.json(
        { error: "Please provide all required fields (Name, Email, Institution, Role, Tier)." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanInstitution = String(institution).trim();
    const cleanRole = String(roleTitle).trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 150) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (cleanInstitution.length < 2 || cleanInstitution.length > 150) {
      return NextResponse.json({ error: "Institution name must be between 2 and 150 characters." }, { status: 400 });
    }

    const tier = getTier(tierId);
    if (!tier) {
      return NextResponse.json({ error: "Invalid membership tier selected." }, { status: 400 });
    }

    const classification = classifyEmailDomain(cleanEmail);
    const applicationId = generateApplicationId();

    const isDomainVerified = Boolean(emailVerified) || verificationMethod === "domain";
    const isUniversityProof = verificationMethod === "university" || classification.requiresDocumentProof;

    // Determine initial lifecycle state:
    // If university proof selected and no document uploaded yet: VERIFICATION_REQUIRED
    // If university proof selected and document uploaded: UNDER_REVIEW
    // If domain verification confirmed: UNDER_REVIEW
    let initialStatus: MembershipStatus = "UNDER_REVIEW";
    if (isUniversityProof && !documentFileName && !documentFileUrl) {
      initialStatus = "VERIFICATION_REQUIRED";
    }

    const reasonDesc = verificationMethod === "domain"
      ? "Applicant completed institutional domain verification via one-time code."
      : isUniversityProof
      ? "Applicant applied via University Verification (academic proof document required/submitted)."
      : "Applicant applied using institutional credentials.";

    const initialAudit = [
      {
        timestamp: new Date().toISOString(),
        actor: user ? user.email || user.id : cleanEmail,
        action: "APPLICATION_SUBMITTED",
        reason: reasonDesc,
        fromStatus: "REGISTERED" as MembershipStatus,
        toStatus: initialStatus,
      },
    ];

    const admin = getAdminClient();
    const newRecord = {
      id: applicationId,
      user_id: user?.id ?? null,
      applicant_name: cleanName,
      email: cleanEmail,
      email_type: classification.type,
      email_verified: isDomainVerified || !classification.requiresDocumentProof,
      phone: phone ? String(phone).trim().slice(0, 30) : null,
      institution: cleanInstitution,
      department: department ? String(department).trim().slice(0, 100) : null,
      role_title: cleanRole,
      tier_id: tier.id,
      tier_name: tier.name,
      annual_fee: tier.price,
      proof_type: (proofType as ProofType) || (verificationMethod === "domain" ? "employment_confirmation" : "student_id"),
      document_filename: documentFileName ? String(documentFileName).slice(0, 200) : null,
      document_file_url: documentFileUrl ? String(documentFileUrl).slice(0, 300) : null,
      payment_status: "unpaid",
      status: initialStatus,
      audit_log: initialAudit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (admin) {
      const { error: dbError } = await admin
        .from("membership_applications")
        .insert(newRecord);

      if (dbError) {
        console.error("Database insert error for membership application:", dbError);
      }
    }

    return NextResponse.json({
      ok: true,
      application: {
        id: applicationId,
        status: initialStatus,
        emailType: classification.type,
        requiresDocumentProof: classification.requiresDocumentProof,
        tierName: tier.name,
        annualFee: tier.price,
      },
      message: classification.requiresDocumentProof
        ? "Application registered. Please upload institutional identification to complete verification."
        : "Application registered. Your institutional credentials are under review by the Academic Board.",
    });
  } catch (err: any) {
    console.error("Membership application error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred processing your application." },
      { status: 500 }
    );
  }
}
