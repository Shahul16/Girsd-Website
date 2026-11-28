import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient, getSupabaseSetupHint } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const DATABASE_TABLES = [
  "orders",
  "certificates",
  "membership_applications",
  "award_nominations",
  "award_registrations",
  "website_enquiries",
  "site_content",
  "abstract_submissions",
  "job_applications",
] as const;

const USER_ACCOUNTS_TABLE = "user_accounts";
const TABLES = [...DATABASE_TABLES, USER_ACCOUNTS_TABLE] as const;

type TableName = (typeof TABLES)[number];
type WorkflowTable = "website_enquiries" | "abstract_submissions" | "job_applications";

const allowedStatuses: Record<WorkflowTable, readonly string[]> = {
  website_enquiries: ["new", "in_progress", "resolved", "spam"],
  abstract_submissions: ["submitted", "in_review", "accepted", "rejected"],
  job_applications: ["submitted", "in_review", "shortlisted", "rejected"],
};

function isWorkflowTable(value: unknown): value is WorkflowTable {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(allowedStatuses, value);
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const table = req.nextUrl.searchParams.get("table") as TableName | null;
  if (!table || !TABLES.includes(table)) {
    return NextResponse.json({ error: "Choose a supported database table." }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({
      error: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the deployment environment.",
    }, { status: 503 });
  }

  const requestedPage = Number(req.nextUrl.searchParams.get("page") || 1);
  const pageSize = 50;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (table === USER_ACCOUNTS_TABLE) {
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
      if (error) {
        console.error("Admin user account query failed:", error);
        return NextResponse.json({ error: "Could not load user accounts." }, { status: 503 });
      }

      const records = data.users.map((user) => {
        const metadata = user.user_metadata ?? {};
        return {
          id: user.id,
          full_name:
            (typeof metadata.full_name === "string" && metadata.full_name) ||
            (typeof metadata.name === "string" && metadata.name) ||
            null,
          email: user.email ?? null,
          phone: user.phone ?? null,
          provider: typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : null,
          email_confirmed_at: user.email_confirmed_at ?? null,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
        };
      });

      return NextResponse.json({
        table,
        records,
        total: data.total,
        page,
        pageSize,
        availableTables: TABLES,
      });
    } catch (error) {
      console.error("Admin user account query failed:", error);
      return NextResponse.json({ error: "Could not load user accounts." }, { status: 503 });
    }
  }

  const { data, error, count } = await admin
    .from(table)
    .select("*", { count: "exact" })
    .order(table === "certificates" ? "issued_date" : table === "site_content" ? "updated_at" : "created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(`Admin database query failed for ${table}:`, error);
    const setupHint = getSupabaseSetupHint(error);
    return NextResponse.json(
      {
        error: setupHint
          ? `Could not load ${table}: ${setupHint}`
          : `Could not load ${table}. Check the deployment server logs.`,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    table,
    records: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    availableTables: TABLES,
  });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string") {
    return NextResponse.json({ error: "A record id is required." }, { status: 400 });
  }

  const requestedTable: unknown = body.table;
  if (!isWorkflowTable(requestedTable)) {
    return NextResponse.json({ error: "This status update is not supported." }, { status: 400 });
  }
  const table = requestedTable;
  if (typeof body.status !== "string" || !allowedStatuses[table].includes(body.status)) {
    return NextResponse.json({ error: "This status update is not supported." }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { error } = await admin
    .from(table)
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id);
  if (error) {
    console.error("Could not update enquiry status:", error);
    return NextResponse.json({ error: "Could not update the enquiry." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
