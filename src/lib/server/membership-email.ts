import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";

type MembershipDecision = {
  applicant_name: string;
  email: string;
  status: string;
  membership_id?: string | null;
  valid_until?: string | null;
  rejection_reason?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMembershipDecisionEmail(application: MembershipDecision): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not configured." };

  const resend = new Resend(apiKey);
  const from = process.env.LEAD_FROM_EMAIL || `GIRSD Membership <${SITE.awardsEmail}>`;
  const name = escapeHtml(application.applicant_name || "Applicant");
  const status = application.status;
  const approved = ["ACTIVE_MEMBER", "APPROVED"].includes(status);
  const title = approved ? "Membership application approved" : status === "REJECTED" ? "Membership application update" : "Membership application status update";
  const message = approved
    ? `Your membership application has been approved. Your membership ID is <strong>${escapeHtml(application.membership_id || "pending")}</strong>${application.valid_until ? ` and is valid until <strong>${escapeHtml(new Date(application.valid_until).toLocaleDateString("en-GB"))}</strong>` : ""}.`
    : status === "REJECTED"
      ? `We are unable to approve your membership application at this time.${application.rejection_reason ? ` Reason: <strong>${escapeHtml(application.rejection_reason)}</strong>` : ""}`
      : status === "VERIFICATION_REQUIRED"
        ? "The review team needs additional information before it can complete your application. Please reply to this email for guidance."
        : status === "SUSPENDED"
          ? "Your membership has been suspended. Please contact the membership team if you need assistance."
          : `Your membership status is now ${escapeHtml(status)}.`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [application.email],
      subject: `${SITE.shortName} membership: ${title}`,
      replyTo: SITE.awardsEmail,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0B192C;line-height:1.6"><div style="background:#0B192C;padding:24px;color:#fff"><h1 style="margin:0;color:#DDA853;font-size:22px">${escapeHtml(title)}</h1><p style="margin:8px 0 0">${escapeHtml(SITE.name)}</p></div><div style="padding:24px"><p>Dear <strong>${name}</strong>,</p><p>${message}</p><p>For questions, contact <a href="mailto:${escapeHtml(SITE.awardsEmail)}">${escapeHtml(SITE.awardsEmail)}</a>.</p></div></div>`,
    });
    if (error) {
      console.error("Could not send membership decision email:", error);
      return { ok: false, error: "Email delivery failed." };
    }
    return { ok: true };
  } catch (error) {
    console.error("Error sending membership decision email:", error);
    return { ok: false, error: "Email delivery failed." };
  }
}
