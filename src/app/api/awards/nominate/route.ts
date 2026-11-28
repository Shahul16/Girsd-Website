import { NextRequest, NextResponse } from "next/server";
import { submitNomination } from "@/lib/server/awards-service";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import path from "path";

export const runtime = "nodejs";

const MAX_ATTACHMENT = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "award_nomination");
  if (limited) return limited;

  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    // Honeypot check
    if (String(form.get("website") ?? "")) {
      return NextResponse.json({ ok: true });
    }

    const nominatorName = String(form.get("nominator-name") || form.get("nominatorName") || "").trim();
    const nominatorEmail = String(form.get("nominator-email") || form.get("nominatorEmail") || "").trim();
    const nominationType = String(form.get("nomination-type") || form.get("nominationType") || "Self-nomination").trim();
    const category = String(form.get("category") || form.get("awardCategory") || "").trim();
    const nomineeName = String(form.get("nominee") || form.get("nomineeName") || "").trim();
    const nomineeEmail = String(form.get("nominee-email") || form.get("nomineeEmail") || nominatorEmail).trim();
    const nomineeAffiliation = String(form.get("affiliation") || form.get("nomineeAffiliation") || "").trim();
    const nomineeCountry = String(form.get("country") || form.get("nomineeCountry") || "").trim();
    const statement = String(form.get("statement") || "").trim();
    const supportingLinks = String(form.get("links") || form.get("supportingLinks") || "").trim();

    if (!nominatorName || !nominatorEmail || !category || !nomineeName) {
      return NextResponse.json({ error: "Please fill in all mandatory nomination fields." }, { status: 400 });
    }

    const attachmentFile = form.get("attachment");
    if (!(attachmentFile instanceof File) || attachmentFile.size === 0) {
      return NextResponse.json({ error: "Please attach a CV or other supporting document." }, { status: 400 });
    }
    if (attachmentFile.size > MAX_ATTACHMENT) {
      return NextResponse.json({ error: "Attachment exceeds 10 MB limit." }, { status: 413 });
    }
    const attachmentFilename = path.basename(attachmentFile.name || "supporting-document.pdf");
    const attachmentBuffer = Buffer.from(await attachmentFile.arrayBuffer());

    const result = await submitNomination({
      nominatorName,
      nominatorEmail,
      nominationType,
      category,
      nomineeName,
      nomineeEmail,
      nomineeAffiliation,
      nomineeCountry,
      statement,
      supportingLinks,
      attachmentFilename,
      attachmentBuffer,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to submit nomination." }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      nominationRef: result.nominationRef,
      message: "Nomination submitted successfully.",
    });
  } catch (err: any) {
    console.error("Nomination submission error:", err);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

