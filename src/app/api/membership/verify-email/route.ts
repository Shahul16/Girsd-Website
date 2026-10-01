import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { classifyEmailDomain } from "@/lib/membership-verification";

export const runtime = "nodejs";

// In-memory verification code store with 15-minute expiration
interface StoredCode {
  code: string;
  expiresAt: number;
  applicationId?: string;
}

const emailCodeStore = new Map<string, StoredCode>();

// Automatic cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of emailCodeStore.entries()) {
      if (value.expiresAt < now) {
        emailCodeStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Handles University / Institutional Domain Verification Code dispatch.
 * Sends a 6-digit verification code to the applicant's email address.
 */
export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, "auth");
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const rawEmail = String(body.email || "").trim().toLowerCase();
    const applicationId = body.applicationId ? String(body.applicationId).trim() : undefined;
    const applicantName = body.name ? String(body.name).trim() : "Applicant";

    let targetEmail = rawEmail;
    let targetName = applicantName;

    const admin = getAdminClient();

    // If applicationId is provided, look up the application details
    if (applicationId && admin) {
      const { data: app } = await admin
        .from("membership_applications")
        .select("email, applicant_name")
        .eq("id", applicationId)
        .maybeSingle();

      if (app?.email) {
        targetEmail = app.email.toLowerCase();
        targetName = app.applicant_name || targetName;
      }
    }

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const domainInfo = classifyEmailDomain(targetEmail);

    // Generate secure 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Save to memory store
    emailCodeStore.set(targetEmail, {
      code: verificationCode,
      expiresAt,
      applicationId,
    });

    // If applicationId exists in DB, update audit trail & reviewer notes
    if (applicationId && admin) {
      const { data: appRecord } = await admin
        .from("membership_applications")
        .select("audit_log, reviewer_notes")
        .eq("id", applicationId)
        .maybeSingle();

      const currentAudit = Array.isArray(appRecord?.audit_log) ? appRecord.audit_log : [];
      const newAudit = [
        ...currentAudit,
        {
          timestamp: new Date().toISOString(),
          actor: "system",
          action: "EMAIL_VERIFICATION_SENT",
          reason: `6-digit verification code sent to ${targetEmail} (${domainInfo.type}).`,
        },
      ];

      await admin
        .from("membership_applications")
        .update({
          audit_log: newAudit,
          reviewer_notes: `${appRecord?.reviewer_notes ? appRecord.reviewer_notes + " | " : ""}EmailToken:${verificationCode}:${new Date(expiresAt).toISOString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);
    }

    // Dispatch email via Resend if API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "GIRSD Verification <membership@globalrsd.co.uk>",
          to: targetEmail,
          subject: `[GIRSD] ${verificationCode} is your domain verification code`,
          text: `Dear ${targetName},\n\nYour 6-digit verification code for GIRSD membership verification is:\n\n${verificationCode}\n\nThis code will expire in 15 minutes.\n\nInstitutional / University Domain: ${domainInfo.domain || "Registered Domain"}\n\nImportant Note: Verification confirms ownership of your email address. It enables your application to proceed to the Academic Board eligibility review. Benefits are activated only after board approval.\n\nKind regards,\nAcademic & Membership Board\nGlobal Institute of Research & Skills Development\nLondon, United Kingdom · www.globalrsd.co.uk`,
        });
      } catch (emailErr) {
        console.warn("Could not dispatch verification email via Resend:", emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `A 6-digit verification code has been dispatched to ${targetEmail}.`,
      domain: domainInfo.domain,
      isInstitutional: domainInfo.isInstitutional,
      verificationHint: process.env.NODE_ENV === "development" ? verificationCode : undefined,
    });
  } catch (err: any) {
    console.error("Email verification request error:", err);
    return NextResponse.json({ error: "Failed to dispatch verification code." }, { status: 500 });
  }
}

/**
 * Confirms verification code for the email address.
 */
export async function PUT(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, "auth");
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.code) {
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    }

    const rawEmail = String(body.email || "").trim().toLowerCase();
    const code = String(body.code).trim();
    const applicationId = body.applicationId ? String(body.applicationId).trim() : undefined;

    let targetEmail = rawEmail;
    const admin = getAdminClient();

    if (applicationId && admin && !targetEmail) {
      const { data: app } = await admin
        .from("membership_applications")
        .select("email")
        .eq("id", applicationId)
        .maybeSingle();

      if (app?.email) {
        targetEmail = app.email.toLowerCase();
      }
    }

    // 1. Check in-memory store
    const stored = targetEmail ? emailCodeStore.get(targetEmail) : null;
    let isValid = false;

    if (stored && stored.code === code && stored.expiresAt > Date.now()) {
      isValid = true;
      emailCodeStore.delete(targetEmail);
    }

    // 2. Check DB notes fallback if in-memory missed
    if (!isValid && applicationId && admin) {
      const { data: app } = await admin
        .from("membership_applications")
        .select("reviewer_notes")
        .eq("id", applicationId)
        .maybeSingle();

      const match = (app?.reviewer_notes || "").match(/EmailToken:(\d{6}):([^\s|]+)/);
      if (match) {
        const storedCode = match[1];
        const expiry = new Date(match[2]);
        if (storedCode === code && expiry > new Date()) {
          isValid = true;
        }
      }
    }

    // 3. Dev fallback for testing
    if (!isValid && code === "123456" && process.env.NODE_ENV === "development") {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // 4. Update database application record if applicationId exists
    if (applicationId && admin) {
      const { data: appRecord } = await admin
        .from("membership_applications")
        .select("audit_log")
        .eq("id", applicationId)
        .maybeSingle();

      const currentAudit = Array.isArray(appRecord?.audit_log) ? appRecord.audit_log : [];
      const newAudit = [
        ...currentAudit,
        {
          timestamp: new Date().toISOString(),
          actor: targetEmail || "applicant",
          action: "EMAIL_VERIFIED",
          reason: "Domain ownership verified via 6-digit one-time code. Proceeding to board eligibility review.",
        },
      ];

      await admin
        .from("membership_applications")
        .update({
          email_verified: true,
          audit_log: newAudit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);
    }

    return NextResponse.json({
      ok: true,
      emailVerified: true,
      message: "Email domain successfully verified! Your application will proceed to Academic Board review.",
    });
  } catch (err: any) {
    console.error("Confirm email verification error:", err);
    return NextResponse.json({ error: "Failed to confirm verification code." }, { status: 500 });
  }
}
