import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const TABLES = [
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
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const requestedPage = Number(req.nextUrl.searchParams.get("page") || 1);
  const pageSize = 50;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await admin
    .from(table)
    .select("*", { count: "exact" })
    .order(table === "certificates" ? "issued_date" : table === "site_content" ? "updated_at" : "created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(`Admin database query failed for ${table}:`, error);
    return NextResponse.json({ error: `Could not load ${table}.` }, { status: 503 });
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
