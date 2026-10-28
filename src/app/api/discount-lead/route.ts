import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const ADMIN_EMAIL = "info@globalrsd.co.uk";
const GRANT_CODE = "PAAVAI100";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST /api/discount-lead
 *
 * Receives the PAAVAI100 grant claim form, sends:
 *  1. A lead notification to info@globalrsd.co.uk
 *  2. A confirmation / thank-you email to the applicant
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The enquiry service is not configured yet. Please email us directly at " +
          ADMIN_EMAIL,
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot check
  if (String(form.get("website") ?? "")) {
    return NextResponse.json({ ok: true }); // silently drop bots
  }

  const fullName   = String(form.get("fullName")   ?? "").slice(0, 200).trim();
  const email      = String(form.get("email")       ?? "").slice(0, 200).trim();
  const phone      = String(form.get("phone")       ?? "").slice(0, 100).trim();
  const institution= String(form.get("institution") ?? "").slice(0, 300).trim();
  const role       = String(form.get("role")        ?? "").slice(0, 200).trim();
  const interest   = String(form.get("interest")    ?? "").slice(0, 200).trim();
  const grantCode  = String(form.get("grantCode")   ?? GRANT_CODE).trim();
  const gdpr       = form.get("gdpr") === "on" || form.get("gdpr") === "true";
  const submittedAt = new Date().toUTCString();

  if (!fullName || !email || !phone || !institution || !role || !interest) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  if (!gdpr) {
    return NextResponse.json({ error: "Please accept the GDPR consent to proceed." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const from = process.env.LEAD_FROM_EMAIL || `GIRSD <${SITE.leadsEmail}>`;

  // ── 1. Admin notification email ──────────────────────────────────────────────
  const adminHtml = `
<div style="font-family:Arial,sans-serif;color:#0b1f3a;max-width:600px">
  <div style="background:linear-gradient(135deg,#0b1f3a,#1a3a5c);border-radius:12px 12px 0 0;padding:24px 28px">
    <h2 style="margin:0;color:#b88a2e;font-size:22px">🎓 New PAAVAI100 Grant Claim</h2>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Submitted via ${escapeHtml(SITE.domainDisplay)} on ${submittedAt}</p>
  </div>

  <!-- Prominent email reply block -->
  <div style="background:#fffbeb;border:2px solid #b88a2e;border-top:0;padding:16px 28px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:200px">
      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92400e">📧 Applicant Email</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0b1f3a">${escapeHtml(email)}</p>
    </div>
    <a href="mailto:${escapeHtml(email)}?subject=Re: Your PAAVAI100 Grant Application — GIRSD"
       style="display:inline-block;background:#b88a2e;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;white-space:nowrap">
      ✉️ Reply to Applicant
    </a>
  </div>

  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px 28px">
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;width:40%;background:#f8fafc">Full Name</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${escapeHtml(fullName)}</td></tr>
      <tr style="background:#fffbeb"><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#fef3c7">Email Address</td><td style="padding:10px 12px;border:1px solid #fde68a;font-weight:600"><a href="mailto:${escapeHtml(email)}" style="color:#b88a2e">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">WhatsApp / Phone</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">Institution</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${escapeHtml(institution)}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">Professional Role</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${escapeHtml(role)}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">Primary Interest</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${escapeHtml(interest)}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">Grant Code</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;color:#b88a2e;letter-spacing:2px">${escapeHtml(grantCode)}</td></tr>
      <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc">GDPR Consent</td><td style="padding:10px 12px;border:1px solid #e2e8f0">${gdpr ? "✅ Accepted" : "❌ Not accepted"}</td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#64748b">
      Reply directly to this email to contact the lead, or reach them on WhatsApp at ${escapeHtml(phone)}.
    </p>
  </div>
</div>`;

  // ── 2. Thank-you / confirmation email for the applicant ──────────────────────
  const applicantHtml = `
<div style="font-family:Arial,sans-serif;color:#0b1f3a;max-width:600px">
  <div style="background:linear-gradient(135deg,#0b1f3a,#1a3a5c);border-radius:12px 12px 0 0;padding:32px 28px;text-align:center">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#b88a2e">Global Institute of Research &amp; Skills Development</p>
    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700">Thank You, ${escapeHtml(fullName.split(" ")[0])}! 🎉</h1>
    <p style="margin:10px 0 0;color:#94a3b8;font-size:14px">Your PAAVAI100 Grant Application Has Been Received</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
      Dear <strong>${escapeHtml(fullName)}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
      Thank you for applying for the <strong style="color:#b88a2e">PAAVAI100 — 100% Keynote Academic Research Grant</strong>.
      We have successfully received your application and our team is reviewing your details.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:20px 0">
      <p style="margin:0;font-size:14px;font-weight:700;color:#15803d">✅ What happens next?</p>
      <ul style="margin:10px 0 0;padding-left:20px;font-size:14px;color:#166534;line-height:1.8">
        <li>We will contact you within <strong>7 working days</strong> with your exclusive grant voucher.</li>
        <li>Your voucher will be delivered via email and WhatsApp to <strong>${escapeHtml(phone)}</strong>.</li>
        <li>Apply the code <strong style="letter-spacing:2px">${escapeHtml(grantCode)}</strong> at checkout for 100% off.</li>
      </ul>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92400e">Your Grant Code</p>
      <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:#b88a2e">${escapeHtml(grantCode)}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#b45309">Valid for 10 days — Memberships, CPD Courses &amp; Masterclasses</p>
    </div>

    <p style="font-size:14px;line-height:1.7;margin:20px 0 8px"><strong>Explore &amp; Connect with GIRSD:</strong></p>
    <table style="width:100%;border-collapse:separate;border-spacing:0 8px">
      <tr>
        <td>
          <a href="https://www.globalrsd.co.uk/" style="display:inline-flex;align-items:center;gap:8px;background:#0b1f3a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;margin:4px 4px 4px 0">
            🌐 Visit Website
          </a>
          <a href="https://www.linkedin.com/company/girsd" style="display:inline-flex;align-items:center;gap:8px;background:#0A66C2;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;margin:4px">
            💼 LinkedIn
          </a>
          <a href="https://chat.whatsapp.com/Hzz8bB36if83vGNL9PFoRE" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;margin:4px">
            💬 WhatsApp Community
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0">
      Questions? Reply to this email or contact us at
      <a href="mailto:info@globalrsd.co.uk" style="color:#b88a2e">info@globalrsd.co.uk</a>.<br />
      GIRSD — Global Institute of Research &amp; Skills Development | <a href="https://www.globalrsd.co.uk/" style="color:#b88a2e">www.globalrsd.co.uk</a><br />
      Q Tech Private Ltd, 23 Kinnaird Avenue, Bromley BR1 4HG, England &amp; Wales (Co. No. 15754767)
    </p>
  </div>
</div>`;

  try {
    // Send admin notification
    const { error: adminErr } = await resend.emails.send({
      from,
      to: [ADMIN_EMAIL],
      subject: `[PAAVAI100 Grant Claim] ${fullName} — ${institution}`,
      html: adminHtml,
      text: `New PAAVAI100 grant claim\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nInstitution: ${institution}\nRole: ${role}\nInterest: ${interest}\nGrant Code: ${grantCode}\nGDPR: ${gdpr ? "Yes" : "No"}\nSubmitted: ${submittedAt}`,
      replyTo: email || undefined,
    });

    if (adminErr) {
      console.error("Resend admin email error:", adminErr);
      return NextResponse.json(
        { error: "We could not send your application. Please email us at " + ADMIN_EMAIL },
        { status: 502 }
      );
    }

    // Send applicant confirmation (best-effort — don't fail the submission if this fails)
    if (email) {
      await resend.emails.send({
        from,
        to: [email],
        subject: `✅ Your GIRSD Grant Application Is Received — ${grantCode}`,
        html: applicantHtml,
        text: `Dear ${fullName},\n\nThank you for applying for the PAAVAI100 grant. We will contact you within 7 working days.\n\nGrant Code: ${grantCode}\n\nExplore GIRSD: https://www.globalrsd.co.uk/\nLinkedIn: https://www.linkedin.com/company/girsd\nWhatsApp Community: https://chat.whatsapp.com/Hzz8bB36if83vGNL9PFoRE\n\nBest regards,\nGIRSD Team\ninfo@globalrsd.co.uk`,
      }).catch((err) => console.error("Applicant confirmation email failed (non-fatal):", err));
    }
  } catch (err) {
    console.error("Discount lead send failed:", err);
    return NextResponse.json(
      { error: "We could not send your application. Please email us at " + ADMIN_EMAIL },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
