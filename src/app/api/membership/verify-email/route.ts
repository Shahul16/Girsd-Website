import { createHmac, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { classifyEmailDomain } from "@/lib/membership-verification";

export const runtime = "nodejs";

const CODE_TTL_MS = 15 * 60 * 1000;

function hashCode(userId: string, email: string, code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Supabase service role key is not configured.");
  return createHmac("sha256", secret).update(`${userId}\n${email}\n${code}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "auth");
  if (limited) return limited;

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in before verifying your email." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "Applicant";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (classifyEmailDomain(email).requiresDocumentProof) {
    return NextResponse.json(
      { error: "This email requires document-based membership verification." },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 503 });
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email verification delivery is not configured." }, { status: 503 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const { error: saveError } = await admin.from("membership_email_verifications").upsert(
    {
      user_id: user.id,
      email,
      code_hash: hashCode(user.id, email, code),
      attempts: 0,
      expires_at: expiresAt,
      verified_at: null,
      consumed_at: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,email" }
  );
  if (saveError) {
    console.error("Could not save membership email verification:", saveError);
    return NextResponse.json({ error: "Could not start email verification. Please try again." }, { status: 503 });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: "GIRSD Verification <membership@globalrsd.co.uk>",
      to: [email],
      subject: "[GIRSD] Your membership verification code",
      text: `Dear ${name || "Applicant"},\n\nYour membership email verification code is ${code}. It expires in 15 minutes.\n\nThis confirms control of your email address and does not itself approve membership.\n\nKind regards,\nGIRSD Membership Team`,
    });
    if (error) {
      console.error("Resend rejected membership verification email:", error);
      await admin
        .from("membership_email_verifications")
        .delete()
        .eq("user_id", user.id)
        .eq("email", email);
      return NextResponse.json({ error: "We could not send the verification code. Please try again." }, { status: 502 });
    }
  } catch (error) {
    console.error("Could not dispatch membership verification email:", error);
    await admin
      .from("membership_email_verifications")
      .delete()
      .eq("user_id", user.id)
      .eq("email", email);
    return NextResponse.json({ error: "We could not send the verification code. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: `A verification code has been sent to ${email}.`,
    domain: classifyEmailDomain(email).domain,
  });
}

export async function PUT(req: NextRequest) {
  const limited = await enforceRateLimit(req, "auth");
  if (limited) return limited;

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in before verifying your email." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the valid email address and 6-digit code." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 503 });

  const { data: result, error } = await admin.rpc("verify_membership_email_code", {
    p_user_id: user.id,
    p_email: email,
    p_code_hash: hashCode(user.id, email, code),
  });
  if (error) {
    console.error("Could not confirm membership email verification:", error);
    return NextResponse.json({ error: "Could not verify the code. Please try again." }, { status: 503 });
  }
  if (result === "locked") {
    return NextResponse.json({ error: "Too many incorrect codes. Request a new verification code." }, { status: 429 });
  }
  if (result !== "verified") {
    return NextResponse.json(
      { error: result === "expired" ? "The verification code expired. Request a new one." : "Invalid verification code." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    emailVerified: true,
    message: "Email ownership verified. Your membership application still requires review.",
  });
}
