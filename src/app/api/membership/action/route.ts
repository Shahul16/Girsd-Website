import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";
import { generateMembershipId, type MembershipStatus } from "@/lib/membership-verification";

export const runtime = "nodejs";

/**
 * Handles administrative verification actions on membership applications:
 * APPROVE, REJECT, REQUEST_INFO, SUSPEND, REACTIVATE.
 *
 * Enforces audit logging for every decision.
 */
export async function POST(req: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    if (adminKey && body.adminKey !== adminKey) {
      return NextResponse.json({ error: "Unauthorized administrative access." }, { status: 401 });
    }

    const { applicationId, action, reviewerNotes, rejectionReason, reviewerEmail } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: "applicationId and action are required." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    // Fetch the existing application record
    const { data: app, error: fetchErr } = await admin
      .from("membership_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    let toStatus: MembershipStatus = app.status;
    const updateFields: Record<string, any> = {
      reviewed_by: reviewerEmail || "GIRSD Academic Reviewer",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (reviewerNotes) {
      updateFields.reviewer_notes = reviewerNotes;
    }

    const currentAudit = Array.isArray(app.audit_log) ? app.audit_log : [];

    switch (action.toUpperCase()) {
      case "APPROVE": {
        toStatus = "ACTIVE_MEMBER";
        const membershipId = app.membership_id || generateMembershipId();
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        updateFields.status = toStatus;
        updateFields.membership_id = membershipId;
        updateFields.valid_from = validFrom.toISOString();
        updateFields.valid_until = validUntil.toISOString();
        break;
      }
      case "REJECT": {
        toStatus = "REJECTED";
        updateFields.status = toStatus;
        updateFields.rejection_reason = rejectionReason || "Eligibility criteria not satisfied.";
        break;
      }
      case "REQUEST_INFO": {
        toStatus = "VERIFICATION_REQUIRED";
        updateFields.status = toStatus;
        updateFields.reviewer_notes = reviewerNotes || "Additional institutional documentation requested.";
        break;
      }
      case "SUSPEND": {
        toStatus = "SUSPENDED";
        updateFields.status = toStatus;
        break;
      }
      case "REACTIVATE": {
        toStatus = "ACTIVE_MEMBER";
        updateFields.status = toStatus;
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const auditEntry = {
      timestamp: new Date().toISOString(),
      actor: reviewerEmail || "admin@globalrsd.co.uk",
      action: action.toUpperCase(),
      reason: reviewerNotes || rejectionReason || `Membership status set to ${toStatus}`,
      fromStatus: app.status,
      toStatus,
    };

    updateFields.audit_log = [...currentAudit, auditEntry];

    const { error: updateErr } = await admin
      .from("membership_applications")
      .update(updateFields)
      .eq("id", applicationId);

    if (updateErr) {
      console.error("Failed to update application:", updateErr);
      return NextResponse.json({ error: "Failed to record decision." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Application ${applicationId} successfully updated to ${toStatus}.`,
      status: toStatus,
      membershipId: updateFields.membership_id || app.membership_id,
    });
  } catch (err: any) {
    console.error("Admin membership action error:", err);
    return NextResponse.json({ error: "Internal processing error." }, { status: 500 });
  }
}
