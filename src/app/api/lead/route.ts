import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SITE } from "@/lib/site";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

const MAX_ATTACHMENT = 10 * 1024 * 1024; // 10 MB

const RECAPTCHA_SCORE_THRESHOLD = 0.5;

/**
 * Verifies a reCAPTCHA v3 token via Google's legacy siteverify endpoint
 * (compatible with score-based keys created in the reCAPTCHA admin console,
 * including ones shown under the "reCAPTCHA Enterprise" branding that still
 * issue a classic secret key). Returns true if the token is valid, its score
 * is at/above threshold, and — if provided — the action matches.
 */
async function verifyRecaptcha(token: string, remoteip: string | null, expectedAction?: string): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // not configured — don't block submissions
  if (!token) return { ok: false, reason: "missing token" };

  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteip) params.set("remoteip", remoteip);
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await res.json();
    if (!data.success) return { ok: false, reason: "verification failed" };
    if (typeof data.score === "number" && data.score < RECAPTCHA_SCORE_THRESHOLD) {
      return { ok: false, reason: `low score (${data.score})` };
    }
    if (expectedAction && data.action && data.action !== expectedAction) {
      return { ok: false, reason: "action mismatch" };
    }
    return { ok: true };
  } catch (err) {
    console.error("reCAPTCHA verify failed:", err);
    return { ok: true }; // fail open on network errors so a Google outage never blocks real leads
  }
}

/**
 * Receives every enquiry form (Contact, Membership, Committee, Partner,
 * Awards, Careers, Internship) as multipart/form-data, verifies it isn't a bot via
 * Cloudflare Turnstile or reCAPTCHA, and emails it to the admin via Resend.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The enquiry service is not configured yet. Please email us directly at " + SITE.email },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot — real visitors never fill this hidden field.
  if (String(form.get("website") ?? "")) {
    return NextResponse.json({ ok: true }); // silently drop bots
  }

  const formName = String(form.get("_form") ?? "Website enquiry").slice(0, 80);
  const remoteip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 1. Cloudflare Turnstile Verification
  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileToken = String(form.get("cf-turnstile-response") || form.get("turnstileToken") || "");
    const turnstileResult = await verifyTurnstile(turnstileToken, remoteip, String(form.get("turnstileAction") || ""));
    if (!turnstileResult.ok) {
      console.warn(`Turnstile blocked a "${formName}" submission:`, turnstileResult.reason);
      return NextResponse.json(
        { error: "Bot verification failed. Please complete the security challenge and try again." },
        { status: 400 }
      );
    }
  }

  // 2. Google reCAPTCHA Verification (if configured)
  if (process.env.RECAPTCHA_SECRET_KEY) {
    const recaptchaToken = String(form.get("recaptchaToken") ?? "");
    const recaptcha = await verifyRecaptcha(recaptchaToken, remoteip, String(form.get("recaptchaAction") ?? ""));
    if (!recaptcha.ok) {
      console.warn(`reCAPTCHA blocked a "${formName}" submission:`, recaptcha.reason);
      return NextResponse.json(
        { error: "We couldn't verify you're not a bot. Please refresh the page and try again." },
        { status: 400 }
      );
    }
  }

  const fields: [string, string][] = [];
  const attachments: { filename: string; content: Buffer }[] = [];
  let visitorEmail = "";
  let visitorName = "";

  for (const [key, value] of form.entries()) {
    if (
      key === "_form" ||
      key === "website" ||
      key === "recaptchaToken" ||
      key === "recaptchaAction" ||
      key === "cf-turnstile-response" ||
      key === "turnstileToken" ||
      key === "turnstileAction"
    ) {
      continue;
    }
    if (value instanceof File) {
      if (value.size === 0) continue;
      if (value.size > MAX_ATTACHMENT) {
        return NextResponse.json({ error: "Attachment is too large (10 MB max)." }, { status: 413 });
      }
      attachments.push({
        filename: value.name || "attachment",
        content: Buffer.from(await value.arrayBuffer()),
      });
      continue;
    }
    const text = String(value).slice(0, 5000);
    if (!text) continue;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "email" || normalizedKey.endsWith("-email") || normalizedKey.endsWith("_email")) {
      visitorEmail = text;
    }
    if (normalizedKey === "name" || normalizedKey.endsWith("-name") || normalizedKey.endsWith("_name")) {
      visitorName = text;
    }
    fields.push([label(key), text]);
  }

  if (formName === "Award nomination" && attachments.length === 0) {
    return NextResponse.json({ error: "Please attach a CV or other supporting document." }, { status: 400 });
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "The form is empty." }, { status: 400 });
  }

  const selectedSubject = String(form.get("subject") ?? "");

  let to = process.env.LEAD_TO_EMAIL || SITE.email;
  if (formName === "Award nomination" || selectedSubject === "Awards & nominations") {
    to = SITE.awardsEmail;
  } else if (formName === "Committee membership application" || selectedSubject === "Membership") {
    to = SITE.membershipEmail;
  } else if (formName === "Job application" || formName === "Internship application") {
    to = SITE.hrEmail;
  } else if (selectedSubject === "Conference / event enquiry") {
    to = SITE.researchEmail;
  } else if (
    formName === "Website feedback" ||
    formName === "Website Feedback Form" ||
    formName === "Quick Website Feedback"
  ) {
    to = SITE.email;
  }

  const from = process.env.LEAD_FROM_EMAIL || `GIRSD <${SITE.leadsEmail}>`;
  const contactEmail = to;
  const subject = `[${formName}] ${visitorName || visitorEmail || "New submission"}`;

  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 12px;border:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  const html =
    `<div style="font-family:Arial,sans-serif;color:#14213D">` +
    `<h2 style="margin:0 0 4px">${escapeHtml(formName)}</h2>` +
    `<p style="margin:0 0 16px;color:#64748b;font-size:13px">Submitted via ${SITE.domainDisplay} on ${new Date().toUTCString()}</p>` +
    `<table style="border-collapse:collapse;font-size:14px">${rows}</table>` +
    (attachments.length ? `<p style="font-size:13px;color:#64748b">${attachments.length} attachment(s) included.</p>` : "") +
    `</div>`;
  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      replyTo: visitorEmail || undefined,
      attachments: attachments.length
        ? attachments.map((a) => ({ filename: a.filename, content: a.content }))
        : undefined,
    });
    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "We could not send your enquiry just now. Please email us at " + contactEmail },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Lead send failed:", err);
    return NextResponse.json(
      { error: "We could not send your enquiry just now. Please email us at " + contactEmail },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function label(key: string): string {
  return key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
