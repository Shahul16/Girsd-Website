import "server-only";
import { Resend } from "resend";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { SITE } from "@/lib/site";
import {
  type AwardNomination,
  type AwardRegistration,
  generateNominationRef,
  AWARDS_REGISTRATION_FEE_GBP,
} from "@/lib/awards";

export const runtime = "nodejs";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromEmail(): string {
  // Use configured LEAD_FROM_EMAIL or standard awards sender
  return process.env.LEAD_FROM_EMAIL || `GIRSD Awards <${SITE.awardsEmail}>`;
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 1: SUBMIT AWARDS NOMINATION
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function submitNomination(data: {
  nominatorName: string;
  nominatorEmail: string;
  nominationType: string;
  category: string;
  nomineeName: string;
  nomineeEmail: string;
  nomineeAffiliation?: string;
  nomineeCountry?: string;
  statement?: string;
  supportingLinks?: string;
  attachmentUrl?: string;
  attachmentFilename?: string;
  attachmentBuffer?: Buffer;
}): Promise<{ ok: boolean; nominationRef?: string; error?: string }> {
  const nominationRef = generateNominationRef();
  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, error: "Award nominations are temporarily unavailable. Please try again later." };
  }

  const record: AwardNomination = {
    nomination_ref: nominationRef,
    nominator_name: data.nominatorName.trim(),
    nominator_email: data.nominatorEmail.trim().toLowerCase(),
    nomination_type: data.nominationType || "Self-nomination",
    category: data.category.trim(),
    nominee_name: data.nomineeName.trim(),
    nominee_email: (data.nomineeEmail || data.nominatorEmail).trim().toLowerCase(),
    nominee_affiliation: data.nomineeAffiliation?.trim() || "",
    nominee_country: data.nomineeCountry?.trim() || "",
    statement: data.statement?.trim() || "",
    supporting_links: data.supportingLinks?.trim() || "",
    attachment_url: data.attachmentUrl || "",
    attachment_filename: data.attachmentFilename || "",
    status: "pending_review",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { error: insertErr } = await admin.from("award_nominations").insert({
      nomination_ref: record.nomination_ref,
      nominator_name: record.nominator_name,
      nominator_email: record.nominator_email,
      nomination_type: record.nomination_type,
      category: record.category,
      nominee_name: record.nominee_name,
      nominee_email: record.nominee_email,
      nominee_affiliation: record.nominee_affiliation,
      nominee_country: record.nominee_country,
      statement: record.statement,
      supporting_links: record.supporting_links,
      attachment_url: record.attachment_url,
      attachment_filename: record.attachment_filename,
      status: record.status,
      created_at: record.created_at,
      updated_at: record.updated_at,
    });

    if (insertErr) {
      console.error("Supabase error saving award nomination:", insertErr);
      return { ok: false, error: "Could not save your nomination. Please try again." };
    }
  } catch (dbErr) {
    console.error("Database connection exception saving nomination:", dbErr);
    return { ok: false, error: "Could not save your nomination. Please try again." };
  }

  // Send Emails via Resend
  await sendNominationEmails(record, data.attachmentBuffer);

  return { ok: true, nominationRef };
}

/**
 * Sends nomination receipt to nominee/nominator and admin notification
 */
async function sendNominationEmails(nomination: AwardNomination, attachmentBuffer?: Buffer) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend API key not set — nomination emails skipped.");
    return;
  }

  const from = getFromEmail();
  const adminTo = SITE.awardsEmail;

  // 1. Nominee Receipt Email
  const nomineeHtml = `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B192C;max-width:620px;margin:0 auto;line-height:1.6;background:#FDFBF7;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
  <div style="background:#0B192C;padding:32px 28px;text-align:center;border-bottom:3px solid #DDA853">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#DDA853">Global Institute of Research &amp; Skills Development</p>
    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700">GIRSD Global Awards 2026</h1>
    <p style="margin:8px 0 0;color:#94A3B8;font-size:13px">Official Nomination Receipt</p>
  </div>

  <div style="padding:28px">
    <p style="font-size:15px;margin:0 0 16px">Dear <strong>${escapeHtml(nomination.nominee_name)}</strong>,</p>
    <p style="font-size:14px;color:#334155;margin:0 0 20px">
      Thank you for submitting a nomination for the <strong>GIRSD Global Awards 2026</strong>. We are pleased to confirm that your nomination dossier has been safely received by the Awards Secretariat and entered into the preliminary jury evaluation cycle.
    </p>

    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-left:4px solid #DDA853;border-radius:8px;padding:18px 20px;margin:20px 0">
      <div style="margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;display:block">Nomination Reference ID</span>
        <span style="font-size:18px;font-weight:800;color:#0B192C;font-family:monospace">${escapeHtml(nomination.nomination_ref)}</span>
      </div>
      <div style="margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;display:block">Award Category</span>
        <span style="font-size:14px;font-weight:700;color:#0B192C">${escapeHtml(nomination.category)}</span>
      </div>
      <div>
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;display:block">Evaluation Status</span>
        <span style="font-size:13px;font-weight:600;color:#0284C7;background:#E0F2FE;padding:3px 8px;border-radius:4px;display:inline-block">Under Review</span>
      </div>
    </div>

    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:24px 0 10px">Next Steps in the Evaluation Process:</h3>
    <ol style="font-size:13px;color:#475569;margin:0 0 24px;padding-left:20px;line-height:1.7">
      <li><strong>Peer Review &amp; Merit Assessment:</strong> The independent GIRSD Honours Committee reviews the submitted evidence, scholarly contribution, and institutional impact.</li>
      <li><strong>Official Notification:</strong> If selected, you will receive an official invitation letter by email containing a secured registration link to confirm your trophy engraving details and ceremony attendance.</li>
    </ol>

    <p style="font-size:13px;color:#64748B;margin:24px 0 0;border-top:1px solid #E2E8F0;padding-top:16px">
      If you have questions regarding your nomination, quote reference <strong>${escapeHtml(nomination.nomination_ref)}</strong> to <a href="mailto:${SITE.awardsEmail}" style="color:#0B192C;font-weight:600">${SITE.awardsEmail}</a>.
    </p>
  </div>
</div>`;

  try {
    const recipients = [nomination.nominee_email];
    if (nomination.nominator_email && nomination.nominator_email !== nomination.nominee_email) {
      recipients.push(nomination.nominator_email);
    }

    await resend.emails.send({
      from,
      to: recipients,
      subject: `GIRSD Awards Nomination Received – ${nomination.nomination_ref}`,
      html: nomineeHtml,
      replyTo: SITE.awardsEmail,
    });
  } catch (err) {
    console.error("Error sending nominee confirmation email:", err);
  }

  // 2. Admin Alert Email
  const adminHtml = `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B192C;max-width:650px;margin:0 auto;line-height:1.6;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
  <div style="background:#0B192C;padding:24px 28px;border-bottom:3px solid #DDA853">
    <h2 style="margin:0;color:#DDA853;font-size:20px">🏆 New Award Nomination Submitted</h2>
    <p style="margin:6px 0 0;color:#94A3B8;font-size:13px">Reference: <strong>${escapeHtml(nomination.nomination_ref)}</strong> · ${new Date().toUTCString()}</p>
  </div>

  <div style="padding:24px 28px">
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;width:35%">Reference ID</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-family:monospace;font-weight:700;color:#0B192C">${escapeHtml(nomination.nomination_ref)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Category</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;color:#DDA853">${escapeHtml(nomination.category)}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Nominee Name</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:600">${escapeHtml(nomination.nominee_name)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Nominee Email</td><td style="padding:8px 12px;border:1px solid #E2E8F0"><a href="mailto:${escapeHtml(nomination.nominee_email)}">${escapeHtml(nomination.nominee_email)}</a></td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Affiliation / Org</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(nomination.nominee_affiliation || "N/A")}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Country</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(nomination.nominee_country || "N/A")}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Nomination Type</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(nomination.nomination_type)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Nominator</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(nomination.nominator_name)} (${escapeHtml(nomination.nominator_email)})</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Supporting Links</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(nomination.supporting_links || "None")}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Evidence Statement</td><td style="padding:8px 12px;border:1px solid #E2E8F0;white-space:pre-wrap">${escapeHtml(nomination.statement || "N/A")}</td></tr>
      ${
        nomination.attachment_url
          ? `<tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Attachment</td><td style="padding:8px 12px;border:1px solid #E2E8F0"><a href="${escapeHtml(nomination.attachment_url)}" target="_blank" style="color:#0284C7;font-weight:600">Download Supporting Document</a></td></tr>`
          : ""
      }
    </table>

    <div style="margin-top:24px;text-align:center">
      <a href="https://${SITE.domainDisplay}/awards/register?ref=${escapeHtml(nomination.nomination_ref)}" style="display:inline-block;background:#0B192C;color:#DDA853;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #DDA853">
        View Direct Registration Form Link
      </a>
    </div>
  </div>
</div>`;

  try {
    const attachments = attachmentBuffer && nomination.attachment_filename
      ? [{ filename: nomination.attachment_filename, content: attachmentBuffer }]
      : undefined;

    await resend.emails.send({
      from,
      to: [adminTo],
      subject: `[NOMINATION] ${nomination.nominee_name} – ${nomination.category} [${nomination.nomination_ref}]`,
      html: adminHtml,
      replyTo: nomination.nominee_email,
      attachments,
    });
  } catch (err) {
    console.error("Error sending admin nomination alert:", err);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN SELECTION TRIGGER:
 * Marks nomination as 'selected' and sends official registration invitation
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function approveSelection(
  nominationRef: string
): Promise<{ ok: boolean; error?: string; resent?: boolean }> {
  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "Database not configured." };

  const { data: selected, error: selectError } = await admin
    .from("award_nominations")
    .update({
      status: "selected",
      selected_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("nomination_ref", nominationRef)
    .eq("status", "pending_review")
    .select("*")
    .maybeSingle();

  if (selectError) {
    console.error("Could not select award nomination:", selectError);
    return { ok: false, error: "Could not update the nomination status." };
  }

  let nomination = selected as AwardNomination | null;
  let resent = false;
  if (!nomination) {
    const { data: existing, error: readError } = await admin
      .from("award_nominations")
      .select("*")
      .eq("nomination_ref", nominationRef)
      .maybeSingle();
    if (readError) {
      console.error("Could not load award nomination for invitation resend:", readError);
      return { ok: false, error: "Could not load the nomination." };
    }
    if (!existing) return { ok: false, error: "Nomination record not found." };
    if (existing.status !== "selected") {
      return { ok: false, error: `Cannot send an invitation while nomination status is ${existing.status}.` };
    }
    nomination = existing as AwardNomination;
    resent = true;
  }

  const invitation = await sendSelectionInvitationEmail(nomination);
  if (!invitation.ok) {
    return {
      ok: false,
      resent,
      error: `Nomination is selected, but the invitation was not sent: ${invitation.error}`,
    };
  }
  return { ok: true, resent };
}

/**
 * Sends official Award Selection & Final Registration Invitation email
 */
export async function sendSelectionInvitationEmail(
  nomination: AwardNomination
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) return { ok: false, error: "Resend is not configured." };

  const from = getFromEmail();
  const registerUrl = `https://${SITE.domainDisplay}/awards/register?ref=${encodeURIComponent(nomination.nomination_ref)}`;

  const invitationHtml = `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B192C;max-width:620px;margin:0 auto;line-height:1.6;background:#FDFBF7;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
  <div style="background:#0B192C;padding:36px 28px;text-align:center;border-bottom:3px solid #DDA853">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#DDA853">Global Institute of Research &amp; Skills Development</p>
    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700">Official Award Selection Notification</h1>
    <p style="margin:8px 0 0;color:#94A3B8;font-size:14px">GIRSD Global Honours &amp; Awards 2026</p>
  </div>

  <div style="padding:32px 28px">
    <p style="font-size:16px;margin:0 0 16px">Dear <strong>${escapeHtml(nomination.nominee_name)}</strong>,</p>

    <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 18px">
      On behalf of the Governing Council and the International Honours Committee of the <strong>Global Institute of Research and Skills Development (GIRSD)</strong>, we are pleased to inform you that you have been formally <strong>selected as a recipient</strong> in the <strong>GIRSD Global Awards 2026</strong>.
    </p>

    <div style="background:#FFFFFF;border:2px solid #DDA853;border-radius:10px;padding:22px;margin:24px 0;text-align:center">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748B;display:block;margin-bottom:6px">Selected Award Category</span>
      <h2 style="margin:0 0 12px;color:#0B192C;font-size:20px;font-weight:800">${escapeHtml(nomination.category)}</h2>
      <div style="display:inline-block;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px;padding:6px 14px;font-family:monospace;font-size:13px;font-weight:700;color:#0B192C">
        Reference: ${escapeHtml(nomination.nomination_ref)}
      </div>
    </div>

    <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 18px">
      Your exceptional leadership, contributions to scholarship, and dedication to institutional advancement have distinguished your nomination among an international pool of candidates.
    </p>

    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:24px 0 12px">Required Action: Complete Final Registration &amp; Trophy Confirmation</h3>
    <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 18px">
      To accept this honour and initiate the production of your bespoke laser-engraved trophy, embossed parchment certificate, and media features, please complete the final registration form. The award registration fee is <strong>£255.00 GBP</strong>.
    </p>

    <div style="text-align:center;margin:32px 0">
      <a href="${registerUrl}" style="display:inline-block;background:#DDA853;color:#0B192C;text-decoration:none;padding:15px 36px;border-radius:8px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(221,168,83,0.3)">
        Complete Final Award Registration &rarr;
      </a>
      <p style="font-size:11px;color:#64748B;margin:10px 0 0">
        Your Nomination Reference ID (<strong>${escapeHtml(nomination.nomination_ref)}</strong>) will be pre-filled automatically.
      </p>
    </div>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px 20px;margin-top:28px">
      <p style="font-size:12px;color:#64748B;margin:0">
        <strong>What your registration covers:</strong> Bespoke heavyweight engraved trophy, official hardcopy &amp; digital certificate, ceremony stage presentation / live stream recognition, international courier delivery, and permanent listing on the GlobalRSD Hall of Fame.
      </p>
    </div>

    <p style="font-size:13px;color:#64748B;margin:28px 0 0;border-top:1px solid #E2E8F0;padding-top:16px">
      For questions regarding the ceremony or registration, please contact the Awards Committee at <a href="mailto:${SITE.awardsEmail}" style="color:#0B192C;font-weight:600">${SITE.awardsEmail}</a>.
    </p>
  </div>
</div>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [nomination.nominee_email],
      subject: `Official Invitation: GIRSD Award Selection & Final Registration – ${nomination.nomination_ref}`,
      html: invitationHtml,
      replyTo: SITE.awardsEmail,
    });
    if (error) {
      console.error("Could not send award selection invitation:", error);
      return { ok: false, error: "Email delivery failed." };
    }
    return { ok: true };
  } catch (err) {
    console.error("Error sending selection invitation email:", err);
    return { ok: false, error: "Email delivery failed." };
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 2: POST-PAYMENT NOTIFICATIONS & DATABASE SYNC
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function handlePaidAwardRegistration(stripeSessionId: string, paymentIntentId: string, metadata: Record<string, any>) {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error(`Admin client unavailable for paid award registration ${stripeSessionId}.`);
  }

  const registrationId = metadata.registration_id;
  const nominationRef = metadata.nomination_ref;

  // 1. Fetch the registration record
  let regQuery = admin.from("award_registrations").select("*");
  if (registrationId) {
    regQuery = regQuery.eq("id", registrationId);
  } else if (nominationRef) {
    regQuery = regQuery.eq("nomination_ref", nominationRef);
  } else {
    regQuery = regQuery.eq("stripe_session_id", stripeSessionId);
  }

  const { data: reg, error: fetchErr } = await regQuery.maybeSingle();

  if (fetchErr || !reg) {
    throw new Error(`Award registration record not found for webhook processing: ${fetchErr?.message ?? registrationId ?? nominationRef ?? stripeSessionId}`);
  }
  if (nominationRef && reg.nomination_ref !== nominationRef) {
    throw new Error(`Award registration ${reg.id} does not match the Stripe nomination reference.`);
  }
  if (reg.stripe_session_id && reg.stripe_session_id !== stripeSessionId) {
    throw new Error(`Stripe session does not match award registration ${reg.id}.`);
  }
  if (!["pending", "paid"].includes(reg.payment_status)) {
    throw new Error(`Award registration ${reg.id} cannot transition from ${reg.payment_status} to paid.`);
  }
  let alreadyPaid = reg.payment_status === "paid" && reg.stripe_session_id === stripeSessionId;

  if (!alreadyPaid) {
    const { data: updatedRegistration, error: paymentUpdateError } = await admin
      .from("award_registrations")
      .update({
        payment_status: "paid",
        stripe_session_id: stripeSessionId,
        stripe_payment_intent: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reg.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();
    if (paymentUpdateError) {
      throw new Error(`Could not mark award registration ${reg.id} as paid: ${paymentUpdateError.message}`);
    }
    if (!updatedRegistration) {
      const { data: current, error: currentError } = await admin
        .from("award_registrations")
        .select("payment_status, stripe_session_id")
        .eq("id", reg.id)
        .maybeSingle();
      if (currentError || current?.payment_status !== "paid" || current.stripe_session_id !== stripeSessionId) {
        throw new Error(`Award registration ${reg.id} could not be marked as paid.`);
      }
      alreadyPaid = true;
    }
  }

  const { data: registeredNomination, error: nominationUpdateError } = await admin
    .from("award_nominations")
    .update({
      status: "registered",
      registered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("nomination_ref", reg.nomination_ref)
    .eq("status", "selected")
    .select("nomination_ref")
    .maybeSingle();
  if (nominationUpdateError) {
    throw new Error(`Could not mark award nomination ${reg.nomination_ref} as registered: ${nominationUpdateError.message}`);
  }
  if (!registeredNomination) {
    const { data: nomination, error: readNominationError } = await admin
      .from("award_nominations")
      .select("status")
      .eq("nomination_ref", reg.nomination_ref)
      .maybeSingle();
    if (readNominationError || nomination?.status !== "registered") {
      throw new Error(`Award nomination ${reg.nomination_ref} is not in a payable state.`);
    }
  }

  if (alreadyPaid) return;

  await sendUserPaymentConfirmationEmail(reg, paymentIntentId);
  await sendAdminCompleteDataEmail(reg, paymentIntentId);
}

/**
 * User Confirmation Email via Resend from awards@globalrsd.co.uk
 */
async function sendUserPaymentConfirmationEmail(reg: AwardRegistration, paymentIntentId: string) {
  const resend = getResendClient();
  if (!resend) return;

  const from = getFromEmail();
  const subject = `Confirmed: Your GIRSD Award Registration & Payment Receipt (£255 GBP) – ${reg.nomination_ref}`;

  const attendanceModeLabel =
    reg.attendance_mode === "in_person"
      ? "In-Person Attendance (Awards Ceremony)"
      : reg.attendance_mode === "virtual"
      ? "Virtual Attendance (Live Stream + International Courier)"
      : "Proxy / Representative Attending on Behalf";

  const userHtml = `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B192C;max-width:620px;margin:0 auto;line-height:1.6;background:#FDFBF7;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
  <div style="background:#0B192C;padding:32px 28px;text-align:center;border-bottom:3px solid #DDA853">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#DDA853">Global Institute of Research &amp; Skills Development</p>
    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700">Payment &amp; Registration Confirmed</h1>
    <p style="margin:8px 0 0;color:#94A3B8;font-size:13px">Official Award Receipt &amp; Production Docket</p>
  </div>

  <div style="padding:28px">
    <p style="font-size:15px;margin:0 0 16px">Dear <strong>${escapeHtml(reg.full_name_engraving)}</strong>,</p>
    <p style="font-size:14px;color:#334155;margin:0 0 20px">
      We are pleased to confirm that your <strong>GIRSD Global Awards 2026</strong> final registration and payment of <strong>£${AWARDS_REGISTRATION_FEE_GBP}.00 GBP</strong> have been successfully processed. Your award details have been queued for master engraving.
    </p>

    <!-- Receipt Box -->
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin:20px 0">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#64748B;font-weight:600">Nomination Ref:</td>
          <td style="padding:8px 0;font-family:monospace;font-weight:700;color:#0B192C;text-align:right">${escapeHtml(reg.nomination_ref)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-weight:600">Award Category:</td>
          <td style="padding:8px 0;font-weight:700;color:#0B192C;text-align:right">${escapeHtml(reg.award_category)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-weight:600">Engraved Full Name:</td>
          <td style="padding:8px 0;font-weight:700;color:#DDA853;text-align:right">${escapeHtml(reg.full_name_engraving)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-weight:600">Attendance Mode:</td>
          <td style="padding:8px 0;font-weight:600;color:#0B192C;text-align:right">${escapeHtml(attendanceModeLabel)}</td>
        </tr>
        <tr style="border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0">
          <td style="padding:12px 0;font-size:14px;font-weight:700;color:#0B192C">Amount Paid:</td>
          <td style="padding:12px 0;font-size:16px;font-weight:800;color:#059669;text-align:right">£${AWARDS_REGISTRATION_FEE_GBP}.00 GBP</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B">Payment Method / ID:</td>
          <td style="padding:8px 0;font-family:monospace;font-size:11px;color:#64748B;text-align:right">${escapeHtml(paymentIntentId || "Stripe Checkout")}</td>
        </tr>
      </table>
    </div>

    <!-- Notice -->
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:14px 16px;margin:20px 0">
      <p style="margin:0;font-size:12px;color:#92400E;line-height:1.6">
        <strong>Important Notice:</strong> As acknowledged upon submission, the £255 GBP Award Registration Fee is strictly non-refundable, and engraving production begins immediately. Name spelling and titles cannot be modified once production has commenced.
      </p>
    </div>

    <h3 style="font-size:14px;font-weight:700;color:#0B192C;margin:24px 0 10px">What Happens Next:</h3>
    <ul style="font-size:13px;color:#475569;margin:0 0 24px;padding-left:20px;line-height:1.8">
      <li><strong>Trophy &amp; Certificate Production:</strong> Our master craftsmen will engrave your personalized crystal trophy and print your gold-embossed parchment certificate.</li>
      <li><strong>Ceremony Briefing &amp; Media Feature:</strong> You will receive a ceremony itinerary, live streaming link, and digital media banner assets.</li>
      <li><strong>Dispatch &amp; Delivery:</strong> Virtual attendees will receive international courier tracking details once your package is dispatched.</li>
    </ul>

    <p style="font-size:13px;color:#64748B;margin:24px 0 0;border-top:1px solid #E2E8F0;padding-top:16px">
      For any enquiries or assistance, please reach out directly to the Awards Secretariat at <a href="mailto:${SITE.awardsEmail}" style="color:#0B192C;font-weight:600">${SITE.awardsEmail}</a> quoting your reference <strong>${escapeHtml(reg.nomination_ref)}</strong>.
    </p>
  </div>
</div>`;

  try {
    await resend.emails.send({
      from,
      to: [reg.email],
      subject,
      html: userHtml,
      replyTo: SITE.awardsEmail,
    });
  } catch (err) {
    console.error("Error sending user registration confirmation email:", err);
  }
}

/**
 * Admin Notification Email: Contains 100% of all submitted data in a clean HTML table
 */
async function sendAdminCompleteDataEmail(reg: AwardRegistration, paymentIntentId: string) {
  const resend = getResendClient();
  if (!resend) return;

  const from = getFromEmail();
  const to = SITE.awardsEmail;
  const subject = `NEW PAID AWARD REGISTRATION: ${reg.full_name_engraving} – ${reg.award_category} (£255 GBP)`;

  const guestRows = Array.isArray(reg.guests_details) && reg.guests_details.length > 0
    ? reg.guests_details.map((g, i) => `${i + 1}. ${g.name} (${g.relationship})`).join("<br>")
    : "None";

  const courierAddress = reg.shipping_address
    ? `${reg.shipping_address.street}, ${reg.shipping_address.city}${reg.shipping_address.state ? `, ${reg.shipping_address.state}` : ""}, ${reg.shipping_address.postalCode}, ${reg.shipping_address.country} (Phone: ${reg.shipping_address.deliveryPhone})`
    : "Not provided / Not requested";

  const adminHtml = `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B192C;max-width:700px;margin:0 auto;line-height:1.6;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
  <div style="background:#0B192C;padding:24px 28px;border-bottom:3px solid #DDA853">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2 style="margin:0;color:#DDA853;font-size:20px">🎉 PAID AWARD REGISTRATION CONFIRMED</h2>
      <span style="background:#059669;color:#FFFFFF;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700">£255 GBP PAID</span>
    </div>
    <p style="margin:6px 0 0;color:#94A3B8;font-size:13px">
      Nomination Ref: <strong>${escapeHtml(reg.nomination_ref)}</strong> · Payment Intent: <strong>${escapeHtml(paymentIntentId)}</strong>
    </p>
  </div>

  <div style="padding:24px 28px">
    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0;padding-bottom:6px">
      Section A: Official Awardee &amp; Engraving Details
    </h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:20px">
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;width:38%">Nomination Reference ID</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-family:monospace;font-weight:700">${escapeHtml(reg.nomination_ref)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Award Category</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;color:#DDA853">${escapeHtml(reg.award_category)}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Full Name (for Engraving)</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:15px;font-weight:800;color:#0B192C">${escapeHtml(reg.full_name_engraving)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Designation / Title</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.designation)}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Organization / University</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.organization)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Department / Faculty</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.department || "N/A")}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Country &amp; City</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.city)}, ${escapeHtml(reg.country)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Primary Email</td><td style="padding:8px 12px;border:1px solid #E2E8F0"><a href="mailto:${escapeHtml(reg.email)}">${escapeHtml(reg.email)}</a></td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">WhatsApp / Phone</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.phone_whatsapp)}</td></tr>
    </table>

    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:24px 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0;padding-bottom:6px">
      Section B: Media &amp; Profile Assets
    </h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:20px">
      <tr style="background:#F8FAFC">
        <td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;width:38%">Professional Headshot</td>
        <td style="padding:8px 12px;border:1px solid #E2E8F0">
          <a href="${escapeHtml(reg.headshot_url)}" target="_blank" style="color:#0284C7;font-weight:700">View / Download Headshot &rarr;</a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Organization Logo</td>
        <td style="padding:8px 12px;border:1px solid #E2E8F0">
          ${reg.logo_url ? `<a href="${escapeHtml(reg.logo_url)}" target="_blank" style="color:#0284C7;font-weight:700">View / Download Logo &rarr;</a>` : "Not provided"}
        </td>
      </tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">LinkedIn Profile</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${reg.linkedin_url ? `<a href="${escapeHtml(reg.linkedin_url)}" target="_blank">${escapeHtml(reg.linkedin_url)}</a>` : "Not provided"}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Website / ORCID / Scholar</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${reg.website_orcid_url ? `<a href="${escapeHtml(reg.website_orcid_url)}" target="_blank">${escapeHtml(reg.website_orcid_url)}</a>` : "Not provided"}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Pronunciation Guide</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.name_pronunciation || "N/A")}</td></tr>
    </table>

    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:24px 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0;padding-bottom:6px">
      Section C: Attendance, Proxy &amp; Courier Logistics
    </h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:20px">
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;width:38%">Attendance Mode</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">${escapeHtml(reg.attendance_mode)}</td></tr>
      ${
        reg.attendance_mode === "proxy"
          ? `<tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Proxy Representative</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.proxy_name)} (${escapeHtml(reg.proxy_relationship)})<br>Email: ${escapeHtml(reg.proxy_email)} | Phone: ${escapeHtml(reg.proxy_phone)}</td></tr>`
          : ""
      }
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Accompanying Guests (${reg.accompanying_guests_count})</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${guestRows}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Physical Courier Address</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(courierAddress)}</td></tr>
    </table>

    <h3 style="font-size:15px;font-weight:700;color:#0B192C;margin:24px 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0;padding-bottom:6px">
      Section D: Billing, Policies &amp; Stripe Metadata
    </h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:20px">
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;width:38%">Registration Fee</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;color:#059669">£${AWARDS_REGISTRATION_FEE_GBP}.00 GBP (PAID)</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">Billing Entity</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.billing_entity_type)}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Billing Name &amp; Address</td><td style="padding:8px 12px;border:1px solid #E2E8F0"><strong>${escapeHtml(reg.billing_name)}</strong><br>${escapeHtml(reg.billing_address)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">VAT / Tax ID</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(reg.vat_tax_number || "None")}</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Media Consent</td><td style="padding:8px 12px;border:1px solid #E2E8F0">✅ Accepted (${reg.media_consent_at || "Yes"})</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700;background:#F8FAFC">No-Refund &amp; Engraving Policy</td><td style="padding:8px 12px;border:1px solid #E2E8F0">✅ Accepted (${reg.no_refund_consent_at || "Yes"})</td></tr>
      <tr style="background:#F8FAFC"><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:700">Stripe Payment Intent</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-family:monospace">${escapeHtml(paymentIntentId)}</td></tr>
    </table>
  </div>
</div>`;

  try {
    await resend.emails.send({
      from,
      to: [to],
      subject,
      html: adminHtml,
      replyTo: reg.email,
    });
  } catch (err) {
    console.error("Error sending complete data email to admin:", err);
  }
}

