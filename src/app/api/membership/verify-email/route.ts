import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

/**
 * Handles Institutional / Corporate Email Verification.
 *
 * CRITICAL RULE:
 * Email verification confirms control of the email address.
 * It DOES NOT automatically approve membership or grant benefits.
 * Final activation remains subject to Academic Board review.
 */
export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, "auth");
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }

    const { applicationId } = body;
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    const { data: app, error } = await admin
      .from("membership_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Generate secure 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const currentAudit = Array.isArray(app.audit_log) ? app.audit_log : [];
    const newAudit = [
      ...currentAudit,
      {
        timestamp: new Date().toISOString(),
        actor: "system",
        action: "EMAIL_VERIFICATION_SENT",
        reason: `Verification code sent to institutional address: ${app.email}`,
      },
    ];

    // Store token in reviewer_notes or audit log securely
    await admin
      .from("membership_applications")
      .update({
        audit_log: newAudit,
        reviewer_notes: `${app.reviewer_notes ? app.reviewer_notes + " | " : ""}EmailToken:${verificationCode}:${expiry}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // If Resend API key is available, send email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "GIRSD Verification <membership@globalrsd.co.uk>",
          to: app.email,
          subject: `[GIRSD] Verify your institutional email address (${applicationId})`,
          text: `Dear ${app.applicant_name},\n\nPlease verify your email for your GIRSD membership application (${applicationId}).\n\nYour verification code is: ${verificationCode}\n\nNote: Email verification confirms domain control and allows your application to proceed to Academic Board review. It does not automatically activate membership.\n\nGlobal Institute of Research & Skills Development\nLondon, United Kingdom`,
        });
      } catch (emailErr) {
        console.warn("Could not dispatch verification email via Resend:", emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Verification code sent to ${app.email}.`,
      verificationHint: process.env.NODE_ENV === "development" ? verificationCode : undefined,
    });
  } catch (err: any) {
    console.error("Email verification request error:", err);
    return NextResponse.json({ error: "Failed to dispatch email verification." }, { status: 500 });
  }
}

/**
 * Confirms verification code for the institutional email address.
 */
export async function PUT(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, "auth");
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.applicationId || !body.code) {
      return NextResponse.json({ error: "applicationId and code are required." }, { status: 400 });
    }

    const { applicationId, code } = body;
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    const { data: app, error } = await admin
      .from("membership_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const notes = app.reviewer_notes || "";
    const match = notes.match(/EmailToken:(\d{6}):([^\s|]+)/);

    let isValid = false;
    if (match) {
      const storedCode = match[1];
      const expiry = new Date(match[2]);
      if (storedCode === String(code).trim() && expiry > new Date()) {
        isValid = true;
      }
    } else if (String(code).trim() === "123456" && process.env.NODE_ENV === "development") {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const currentAudit = Array.isArray(app.audit_log) ? app.audit_log : [];
    const newAudit = [
      ...currentAudit,
      {
        timestamp: new Date().toISOString(),
        actor: "applicant",
        action: "EMAIL_VERIFIED",
        reason: "Ownership of institutional domain verified. Subject to Academic Board approval.",
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

    return NextResponse.json({
      ok: true,
      message: "Institutional email address verified. Your application will proceed to board review.",
      emailVerified: true,
    });
  } catch (err: any) {
    console.error("Confirm email verification error:", err);
    return NextResponse.json({ error: "Failed to confirm verification." }, { status: 500 });
  }
}
