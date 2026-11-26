import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Revokes active membership benefits and records the member's cancellation. */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to manage your membership." }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Membership service is temporarily unavailable." }, { status: 503 });

  const { data: application, error: readError } = await admin
    .from("membership_applications")
    .select("id, status, valid_until, audit_log")
    .eq("user_id", user.id)
    .in("status", ["ACTIVE_MEMBER", "APPROVED", "Active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) {
    console.error("Could not load membership for cancellation:", readError);
    return NextResponse.json({ error: "Could not load your membership." }, { status: 503 });
  }
  if (!application || (application.valid_until && new Date(application.valid_until) <= new Date())) {
    return NextResponse.json({ error: "There is no active membership to cancel." }, { status: 409 });
  }

  const auditLog = Array.isArray(application.audit_log) ? application.audit_log : [];
  const { error: updateError } = await admin
    .from("membership_applications")
    .update({
      status: "CANCELLED",
      updated_at: new Date().toISOString(),
      audit_log: [
        ...auditLog,
        {
          timestamp: new Date().toISOString(),
          actor: user.email ?? user.id,
          action: "MEMBERSHIP_CANCELLED",
          reason: "Member requested cancellation.",
          fromStatus: application.status,
          toStatus: "CANCELLED",
        },
      ],
    })
    .eq("id", application.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Could not cancel membership:", updateError);
    return NextResponse.json({ error: "Could not cancel your membership. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, status: "CANCELLED" });
}
