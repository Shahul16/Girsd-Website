import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { getAdminClient, getSupabaseSetupHint } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type EditableNominationField =
  | "nominator_name"
  | "nominator_email"
  | "nomination_type"
  | "category"
  | "nominee_name"
  | "nominee_email"
  | "nominee_affiliation"
  | "nominee_country"
  | "statement"
  | "supporting_links"
  | "attachment_url"
  | "attachment_filename";

const fieldLimits: Record<EditableNominationField, number> = {
  nominator_name: 160,
  nominator_email: 254,
  nomination_type: 100,
  category: 200,
  nominee_name: 160,
  nominee_email: 254,
  nominee_affiliation: 200,
  nominee_country: 100,
  statement: 10000,
  supporting_links: 2000,
  attachment_url: 2048,
  attachment_filename: 255,
};

const requiredFields: EditableNominationField[] = [
  "nominator_name",
  "nominator_email",
  "nomination_type",
  "category",
  "nominee_name",
  "nominee_email",
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.nominationRef !== "string") {
    return NextResponse.json({ error: "A nomination reference is required." }, { status: 400 });
  }

  const nominationRef = body.nominationRef.trim();
  if (!nominationRef) return NextResponse.json({ error: "A nomination reference is required." }, { status: 400 });

  const values = {} as Record<EditableNominationField, string>;
  for (const field of Object.keys(fieldLimits) as EditableNominationField[]) {
    if (typeof body[field] !== "string") {
      return NextResponse.json({ error: `The ${field.replace(/_/g, " ")} field must be text.` }, { status: 400 });
    }

    values[field] = body[field].trim();
    if (values[field].length > fieldLimits[field]) {
      return NextResponse.json(
        { error: `The ${field.replace(/_/g, " ")} field is too long.` },
        { status: 400 }
      );
    }
  }

  if (requiredFields.some((field) => !values[field])) {
    return NextResponse.json({ error: "Complete all required nomination fields." }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(values.nominator_email) || !emailPattern.test(values.nominee_email)) {
    return NextResponse.json({ error: "Enter valid email addresses for the nominator and nominee." }, { status: 400 });
  }

  if (values.attachment_url && !isHttpUrl(values.attachment_url)) {
    return NextResponse.json({ error: "The supporting document URL must use HTTP or HTTPS." }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const update = {
    ...values,
    nominee_affiliation: values.nominee_affiliation || null,
    nominee_country: values.nominee_country || null,
    statement: values.statement || null,
    supporting_links: values.supporting_links || null,
    attachment_url: values.attachment_url || null,
    attachment_filename: values.attachment_filename || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("award_nominations")
    .update(update)
    .eq("nomination_ref", nominationRef)
    .eq("status", "pending_review")
    .select("nomination_ref")
    .maybeSingle();

  if (error) {
    console.error("Could not edit award nomination:", error);
    return NextResponse.json(
      { error: getSupabaseSetupHint(error) ?? "Could not update the nomination." },
      { status: 503 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Nomination not found or no longer pending review. Refresh the list and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, message: `Nomination ${nominationRef} updated.` });
}
