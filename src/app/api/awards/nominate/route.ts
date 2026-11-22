import { NextRequest, NextResponse } from "next/server";
import { submitNomination } from "@/lib/server/awards-service";
import { getAdminClient } from "@/lib/server/supabase-admin";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_ATTACHMENT = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
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

    // Attachment processing
    let attachmentUrl = "";
    let attachmentFilename = "";
    let attachmentBuffer: Buffer | undefined;

    const attachmentFile = form.get("attachment") as File | null;
    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > MAX_ATTACHMENT) {
        return NextResponse.json({ error: "Attachment exceeds 10 MB limit." }, { status: 413 });
      }

      attachmentFilename = attachmentFile.name || "supporting-document.pdf";
      const arrayBuffer = await attachmentFile.arrayBuffer();
      attachmentBuffer = Buffer.from(arrayBuffer);

      // Attempt Supabase storage upload
      const admin = getAdminClient();
      if (admin) {
        const ext = path.extname(attachmentFilename).toLowerCase() || ".pdf";
        const uniqueKey = crypto.randomBytes(6).toString("hex");
        const storagePath = `nominations/${Date.now()}_${uniqueKey}${ext}`;

        const { data: uploadData, error: uploadErr } = await admin.storage
          .from("awards-assets")
          .upload(storagePath, attachmentBuffer, {
            contentType: attachmentFile.type || "application/octet-stream",
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = admin.storage.from("awards-assets").getPublicUrl(storagePath);
          attachmentUrl = publicData?.publicUrl || "";
        }
      }
    }

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
      attachmentUrl,
      attachmentFilename,
      attachmentBuffer,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to submit nomination." }, { status: 500 });
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

