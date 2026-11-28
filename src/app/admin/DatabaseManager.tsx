"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

const TABLES = [
  { id: "orders", label: "Paid Orders" },
  { id: "user_accounts", label: "User Accounts" },
  { id: "certificates", label: "Certificates" },
  { id: "membership_applications", label: "Membership Applications" },
  { id: "award_nominations", label: "Award Nominations" },
  { id: "award_registrations", label: "Award Registrations" },
  { id: "website_enquiries", label: "Website Enquiries" },
  { id: "site_content", label: "Published Content" },
  { id: "abstract_submissions", label: "Abstract Submissions" },
  { id: "job_applications", label: "Job Applications" },
] as const;

type TableId = (typeof TABLES)[number]["id"];
type RecordRow = Record<string, unknown> & { id?: string; nomination_ref?: string; status?: string };
type NominationEditValues = {
  nominator_name: string;
  nominator_email: string;
  nomination_type: string;
  category: string;
  nominee_name: string;
  nominee_email: string;
  nominee_affiliation: string;
  nominee_country: string;
  statement: string;
  supporting_links: string;
  attachment_url: string;
  attachment_filename: string;
};

const emptyNominationEdit: NominationEditValues = {
  nominator_name: "",
  nominator_email: "",
  nomination_type: "Self-nomination",
  category: "",
  nominee_name: "",
  nominee_email: "",
  nominee_affiliation: "",
  nominee_country: "",
  statement: "",
  supporting_links: "",
  attachment_url: "",
  attachment_filename: "",
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function nominationText(record: RecordRow, field: keyof NominationEditValues): string {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function membershipDocumentReference(value: string): string {
  if (!value.includes("file=")) return value;
  try {
    return new URL(value, "https://girsd.invalid").searchParams.get("file") ?? "";
  } catch {
    return "";
  }
}

export default function DatabaseManager() {
  const [table, setTable] = useState<TableId>("orders");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingNomination, setEditingNomination] = useState<RecordRow | null>(null);
  const [editValues, setEditValues] = useState<NominationEditValues>(emptyNominationEdit);
  const [editError, setEditError] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/database?table=${table}&page=${page}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load database records.");
      setRecords(Array.isArray(body.records) ? body.records : []);
      setTotal(Number(body.total) || 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load database records.");
    } finally {
      setLoading(false);
    }
  }, [page, table]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [records, search]);

  const columns = useMemo(() => {
    return [...new Set(records.flatMap((row) => Object.keys(row)))];
  }, [records]);

  function startEditingNomination(record: RecordRow) {
    setEditingNomination(record);
    setEditValues({
      nominator_name: nominationText(record, "nominator_name"),
      nominator_email: nominationText(record, "nominator_email"),
      nomination_type: nominationText(record, "nomination_type") || "Self-nomination",
      category: nominationText(record, "category"),
      nominee_name: nominationText(record, "nominee_name"),
      nominee_email: nominationText(record, "nominee_email"),
      nominee_affiliation: nominationText(record, "nominee_affiliation"),
      nominee_country: nominationText(record, "nominee_country"),
      statement: nominationText(record, "statement"),
      supporting_links: nominationText(record, "supporting_links"),
      attachment_url: nominationText(record, "attachment_url"),
      attachment_filename: nominationText(record, "attachment_filename"),
    });
    setEditError("");
    setError("");
    setNotice("");
  }

  async function saveNominationEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nominationRef = String(editingNomination?.nomination_ref ?? "");
    if (!nominationRef) return;

    setBusyId(nominationRef);
    setEditError("");
    try {
      const response = await fetch("/api/admin/awards/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nominationRef, ...editValues }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update the nomination.");
      setNotice(body?.message || "Nomination updated.");
      setEditingNomination(null);
      await loadRecords();
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : "Could not update the nomination.");
    } finally {
      setBusyId("");
    }
  }

  async function runAction(record: RecordRow, action: "approve" | "reject" | "select" | "enquiry-status" | "resend-email") {
    const recordId = String(record.id ?? record.nomination_ref ?? "");
    if (!recordId) return;
    const rejectReason = action === "reject" && (table === "membership_applications" || table === "award_nominations")
      ? window.prompt(
          table === "award_nominations" ? "Add a reason for rejecting this nomination:" : "Add a short reason for rejecting this application:",
          table === "award_nominations" ? String(record.reviewer_notes ?? "") : String(record.rejection_reason ?? "")
        )
      : undefined;
    if (action === "reject" && (table === "membership_applications" || table === "award_nominations") && !rejectReason?.trim()) return;

    setBusyId(recordId);
    setError("");
    setNotice("");
    try {
      let response: Response;
      if (table === "membership_applications") {
        response = await fetch("/api/membership/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: recordId,
            action: action === "approve" ? "APPROVE" : action === "reject" ? "REJECT" : "RESEND_DECISION_EMAIL",
            rejectionReason: rejectReason,
          }),
        });
      } else if (table === "award_nominations" && action === "select") {
        response = await fetch("/api/admin/awards/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominationRef: record.nomination_ref }),
        });
      } else if (table === "award_nominations" && action === "reject") {
        response = await fetch("/api/admin/awards/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominationRef: record.nomination_ref, reason: rejectReason }),
        });
      } else if (table === "website_enquiries") {
        const nextStatus = record.status === "resolved" ? "in_progress" : "resolved";
        response = await fetch("/api/admin/database", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, id: recordId, status: nextStatus }),
        });
      } else {
        return;
      }

      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Action could not be completed.");
      setNotice([body?.message, body?.warning].filter(Boolean).join(" ") || "Record updated.");
      await loadRecords();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action could not be completed.");
    } finally {
      setBusyId("");
    }
  }

  async function setWorkflowStatus(record: RecordRow, status: string) {
    const recordId = String(record.id ?? "");
    if (!recordId) return;
    setBusyId(recordId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/database", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id: recordId, status }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update the submission.");
      setNotice("Submission status updated.");
      await loadRecords();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update the submission.");
    } finally {
      setBusyId("");
    }
  }

  async function sendFulfillmentQuote(record: RecordRow) {
    const registrationId = String(record.id ?? "");
    if (!registrationId) return;

    const currentQuote = Number(record.physical_fulfillment_quote_gbp);
    const input = window.prompt(
      "Enter the separate physical-item and destination-based courier quote in GBP:",
      Number.isFinite(currentQuote) && currentQuote > 0 ? currentQuote.toFixed(2) : ""
    );
    if (input === null) return;
    if (!/^\d+(?:\.\d{1,2})?$/.test(input.trim()) || Number(input) <= 0) {
      setError("Enter a valid GBP quote with no more than two decimal places.");
      return;
    }

    const amountGbp = Number(input);
    if (!window.confirm(`Send a separate £${amountGbp.toFixed(2)} Stripe invoice to ${String(record.email ?? "the registrant")}?`)) return;

    setBusyId(registrationId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/awards/fulfillment-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, amountGbp }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not send the fulfillment invoice.");
      setNotice(body?.message || "The separate fulfillment invoice was sent.");
      await loadRecords();
      if (body?.warning) setError(body.warning);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Could not send the fulfillment invoice.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="database-heading">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Operations</p>
          <h1 id="database-heading" className="mt-1 font-display text-2xl font-bold text-white">Database &amp; Approvals</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Browse business records and process membership or award decisions. Payment records remain read-only and are sourced from verified provider events.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRecords()}
          disabled={loading}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TABLES.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              setTable(item.id);
              setPage(1);
              setSearch("");
            }}
            aria-pressed={table === item.id}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${
              table === item.id
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">{TABLES.find((item) => item.id === table)?.label}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{total.toLocaleString()} total records · page size 50</p>
        </div>
        <label className="sr-only" htmlFor="database-search">Search loaded records</label>
        <input
          id="database-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search this page…"
          className="input w-full sm:max-w-xs"
        />
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">{notice}</p>}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400" role="status">Loading records…</p>
        ) : visibleRecords.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No records found on this page.</p>
        ) : (
          <table className="w-full min-w-[960px] border-collapse text-left text-xs text-slate-300">
            <thead className="bg-white/[0.05] text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                {columns.map((column) => <th key={column} scope="col" className="max-w-64 px-3 py-3 font-semibold">{column.replace(/_/g, " ")}</th>)}
                <th scope="col" className="sticky right-0 bg-slate-900 px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleRecords.map((record, rowIndex) => {
                const recordId = String(record.id ?? record.nomination_ref ?? record.collection ?? rowIndex);
                return (
                  <tr key={recordId} className="align-top hover:bg-white/[0.03]">
                    {columns.map((column) => (
                      <td key={column} className="max-w-64 break-words px-3 py-3 leading-relaxed">
                        {column === "audit_log" || column === "fields" || column === "data" || column === "profile_snapshot" || column === "statement" || column === "supporting_links" || column === "guests_details" ? (
                          <details>
                            <summary className="cursor-pointer text-gold">View details</summary>
                            <pre className="mt-2 max-h-64 max-w-lg overflow-auto whitespace-pre-wrap break-words text-[10px] text-slate-300">
                              {displayValue(record[column])}
                            </pre>
                          </details>
                        ) : column === "payment_review_required" && record[column] === true ? (
                          <span className="font-bold text-rose-300">Manual payment review required</span>
                        ) : column === "physical_fulfillment_invoice_url" && typeof record[column] === "string" && /^https:\/\//i.test(String(record[column])) ? (
                          <a href={String(record[column])} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold underline">
                            Open Stripe invoice
                          </a>
                        ) : column === "attachment_url" && typeof record[column] === "string" && String(record[column]).startsWith("nominations/") ? (
                          <a
                            href={`/api/admin/awards/attachment?path=${encodeURIComponent(String(record[column]))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gold underline"
                          >
                            Open private supporting document
                          </a>
                        ) : column === "attachment_url" && typeof record[column] === "string" && /^https?:\/\//i.test(String(record[column])) ? (
                          <a href={String(record[column])} target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-300 underline">
                            Legacy public attachment
                          </a>
                        ) : column === "document_file_url" && typeof record[column] === "string" ? (
                          <a
                            href={`/api/membership/document?file=${encodeURIComponent(membershipDocumentReference(String(record[column])))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gold underline"
                          >
                            Open private verification document
                          </a>
                        ) : column === "cv_path" && typeof record[column] === "string" ? (
                            <a
                              href={`/api/admin/member-file?path=${encodeURIComponent(String(record[column]))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-gold underline"
                            >
                              Open private CV
                            </a>
                          ) : (
                            <span className={column === "id" || column.endsWith("_ref") ? "font-mono text-[10px]" : ""}>
                              {displayValue(record[column])}
                            </span>
                          )
                        }
                      </td>
                    ))}
                    <td className="sticky right-0 min-w-40 bg-slate-950/95 px-3 py-3 text-right">
                      {table === "membership_applications" && !["ACTIVE_MEMBER", "APPROVED", "REJECTED", "SUSPENDED", "CANCELLED"].includes(String(record.status)) && (
                        <div className="flex justify-end gap-2">
                          {["paid", "waived"].includes(String(record.payment_status).toLowerCase()) ? (
                            <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "approve")} className="rounded-md bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
                              {busyId === recordId ? "Saving…" : "Approve"}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1.5 text-[10px] text-slate-400">Payment required</span>
                          )}
                          <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "reject")} className="rounded-md border border-rose-400/30 px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/40 disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      )}
                      {table === "membership_applications" && record.decision_email_sent_at == null && !["PENDING", "SUBMITTED", "PAYMENT_COMPLETED", "UNDER_REVIEW"].includes(String(record.status).toUpperCase()) && (
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => void runAction(record, "resend-email")}
                          className="mt-2 rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          Resend decision email
                        </button>
                      )}
                      {table === "award_nominations" && record.status === "pending_review" && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "select")} className="rounded-md bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">Select</button>
                          <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "reject")} className="rounded-md border border-rose-400/30 px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/40 disabled:opacity-50">Reject</button>
                          <button type="button" disabled={Boolean(busyId)} onClick={() => startEditingNomination(record)} className="rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50">Edit</button>
                        </div>
                      )}
                      {table === "award_nominations" && record.status === "selected" && (
                        <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "select")} className="rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50">
                          Resend invitation
                        </button>
                      )}
                      {table === "award_nominations" && record.status === "rejected" && record.decision_email_sent_at == null && (
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => void runAction(record, "reject")}
                          className="rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          Retry rejection email
                        </button>
                      )}
                      {table === "award_registrations" && record.payment_status === "paid" && Array.isArray(record.physical_fulfillment_items) && record.physical_fulfillment_items.length > 0 && record.physical_fulfillment_status !== "paid" && (
                        record.physical_fulfillment_invoice_url ? (
                          <a
                            href={String(record.physical_fulfillment_invoice_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10"
                          >
                            View fulfillment invoice
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => void sendFulfillmentQuote(record)}
                            className="rounded-md bg-gold px-2.5 py-1.5 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                          >
                            {busyId === recordId ? "Sending…" : record.physical_fulfillment_status === "invoicing" ? "Retry invoice" : "Quote & invoice"}
                          </button>
                        )
                      )}
                      {table === "website_enquiries" && record.status !== "spam" && (
                        <button type="button" disabled={Boolean(busyId)} onClick={() => void runAction(record, "enquiry-status")} className="rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50">
                          {record.status === "resolved" ? "Reopen" : "Resolve"}
                        </button>
                      )}
                      {(table === "abstract_submissions" || table === "job_applications") && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {record.status === "submitted" && (
                            <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "in_review")} className="rounded-md border border-white/15 px-2.5 py-1.5 font-semibold text-white hover:bg-white/10 disabled:opacity-50">Mark in review</button>
                          )}
                          {record.status === "in_review" && table === "abstract_submissions" && (
                            <>
                              <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "accepted")} className="rounded-md bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">Accept</button>
                              <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "rejected")} className="rounded-md border border-rose-400/30 px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/40 disabled:opacity-50">Reject</button>
                            </>
                          )}
                          {record.status === "in_review" && table === "job_applications" && (
                            <>
                              <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "shortlisted")} className="rounded-md bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">Shortlist</button>
                              <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "rejected")} className="rounded-md border border-rose-400/30 px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/40 disabled:opacity-50">Reject</button>
                            </>
                          )}
                          {record.status === "shortlisted" && table === "job_applications" && (
                            <button type="button" disabled={Boolean(busyId)} onClick={() => void setWorkflowStatus(record, "rejected")} className="rounded-md border border-rose-400/30 px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/40 disabled:opacity-50">Close</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Private applicant and payment information is visible to admin sessions only.</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Previous</button>
          <button type="button" disabled={page * 50 >= total || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Next</button>
        </div>
      </footer>

      {editingNomination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-nomination-heading"
            className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Pending review</p>
                <h2 id="edit-nomination-heading" className="mt-1 font-display text-xl font-bold text-white">Edit award nomination</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Reference: <span className="font-mono">{String(editingNomination.nomination_ref ?? "")}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingNomination(null)}
                disabled={Boolean(busyId)}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {editError && <p role="alert" className="mt-4 rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-200">{editError}</p>}

            <form onSubmit={saveNominationEdits} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Nominator name *
                  <input required maxLength={160} value={editValues.nominator_name} onChange={(event) => setEditValues({ ...editValues, nominator_name: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Nominator email *
                  <input required type="email" maxLength={254} value={editValues.nominator_email} onChange={(event) => setEditValues({ ...editValues, nominator_email: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Nomination type *
                  <select required value={editValues.nomination_type} onChange={(event) => setEditValues({ ...editValues, nomination_type: event.target.value })} className="input">
                    <option value="Self-nomination">Self-nomination</option>
                    <option value="Nominating someone else">Nominating someone else</option>
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Award category *
                  <input required maxLength={200} value={editValues.category} onChange={(event) => setEditValues({ ...editValues, category: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Nominee name *
                  <input required maxLength={160} value={editValues.nominee_name} onChange={(event) => setEditValues({ ...editValues, nominee_name: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Nominee email *
                  <input required type="email" maxLength={254} value={editValues.nominee_email} onChange={(event) => setEditValues({ ...editValues, nominee_email: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Affiliation
                  <input maxLength={200} value={editValues.nominee_affiliation} onChange={(event) => setEditValues({ ...editValues, nominee_affiliation: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Country
                  <input maxLength={100} value={editValues.nominee_country} onChange={(event) => setEditValues({ ...editValues, nominee_country: event.target.value })} className="input" />
                </label>
              </div>
              <label className="block space-y-1 text-xs font-semibold text-slate-300">
                Nomination statement
                <textarea maxLength={10000} rows={5} value={editValues.statement} onChange={(event) => setEditValues({ ...editValues, statement: event.target.value })} className="input" />
              </label>
              <label className="block space-y-1 text-xs font-semibold text-slate-300">
                Supporting links
                <textarea maxLength={2000} rows={3} value={editValues.supporting_links} onChange={(event) => setEditValues({ ...editValues, supporting_links: event.target.value })} className="input" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Supporting document URL
                  <input type="url" maxLength={2048} value={editValues.attachment_url} onChange={(event) => setEditValues({ ...editValues, attachment_url: event.target.value })} className="input" />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-slate-300">
                  Supporting document filename
                  <input maxLength={255} value={editValues.attachment_filename} onChange={(event) => setEditValues({ ...editValues, attachment_filename: event.target.value })} className="input" />
                </label>
              </div>
              <p className="text-xs text-slate-400">Only pending nominations can be edited. The nomination reference and decision status cannot be changed here.</p>
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setEditingNomination(null)} disabled={Boolean(busyId)} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={Boolean(busyId)} className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold/90 disabled:opacity-50">
                  {busyId ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
