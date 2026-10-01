"use client";

import { useEffect, useState, useMemo } from "react";
import type { MembershipStatus } from "@/lib/membership-verification";

export interface ApplicationRecord {
  id: string;
  user_id?: string;
  applicant_name: string;
  email: string;
  email_type: "corporate_institutional" | "personal_public";
  email_verified: boolean;
  phone?: string;
  institution: string;
  department?: string;
  role_title: string;
  tier_id: string;
  tier_name: string;
  annual_fee: number;
  proof_type?: string;
  document_filename?: string;
  document_file_url?: string;
  payment_status: "unpaid" | "paid" | "waived";
  status: MembershipStatus;
  reviewer_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  membership_id?: string;
  valid_from?: string;
  valid_until?: string;
  audit_log: Array<{
    timestamp: string;
    actor: string;
    action: string;
    reason?: string;
    fromStatus?: string;
    toStatus?: string;
  }>;
  created_at: string;
}

const SAMPLE_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "GIRSD-MEM-2026-000123",
    applicant_name: "Dr. Eleanor Vance",
    email: "e.vance@ucl.ac.uk",
    email_type: "corporate_institutional",
    email_verified: true,
    institution: "University College London",
    department: "Computer Science & AI",
    role_title: "Senior Lecturer & Research Fellow",
    tier_id: "fellow",
    tier_name: "Fellow (FGRSD)",
    annual_fee: 299,
    payment_status: "paid",
    status: "UNDER_REVIEW",
    document_filename: "ucl-faculty-appointment-letter.pdf",
    document_file_url: "/api/membership/document?file=ucl-faculty-appointment-letter.pdf",
    proof_type: "official_appointment",
    created_at: "2026-10-01T14:30:00Z",
    audit_log: [
      {
        timestamp: "2026-10-01T14:30:00Z",
        actor: "e.vance@ucl.ac.uk",
        action: "APPLICATION_SUBMITTED",
        reason: "Applied using verified university institutional domain (.ac.uk).",
        fromStatus: "REGISTERED",
        toStatus: "UNDER_REVIEW",
      },
      {
        timestamp: "2026-10-01T14:35:12Z",
        actor: "stripe_webhook",
        action: "PAYMENT_COMPLETED",
        reason: "Stripe checkout session confirmed (£299.00).",
        fromStatus: "UNDER_REVIEW",
        toStatus: "UNDER_REVIEW",
      },
    ],
  },
  {
    id: "GIRSD-MEM-2026-000124",
    applicant_name: "Marcus Aurelius Thorne",
    email: "marcus.thorne.research@gmail.com",
    email_type: "personal_public",
    email_verified: false,
    institution: "Imperial College London (Affiliate)",
    department: "Bioengineering",
    role_title: "Postdoctoral Research Fellow",
    tier_id: "professional",
    tier_name: "Professional Member",
    annual_fee: 149,
    payment_status: "paid",
    status: "UNDER_REVIEW",
    document_filename: "imperial-college-staff-id-badge.pdf",
    document_file_url: "/api/membership/document?file=imperial-college-staff-id-badge.pdf",
    proof_type: "faculty_staff_id",
    created_at: "2026-10-01T16:15:00Z",
    audit_log: [
      {
        timestamp: "2026-10-01T16:15:00Z",
        actor: "marcus.thorne.research@gmail.com",
        action: "APPLICATION_SUBMITTED",
        reason: "Personal email provider detected. Official staff ID submitted for verification.",
        fromStatus: "REGISTERED",
        toStatus: "UNDER_REVIEW",
      },
      {
        timestamp: "2026-10-01T16:20:00Z",
        actor: "stripe_webhook",
        action: "PAYMENT_COMPLETED",
        reason: "Stripe payment (£149.00) completed. Application placed in verification queue.",
        fromStatus: "UNDER_REVIEW",
        toStatus: "UNDER_REVIEW",
      },
    ],
  },
  {
    id: "GIRSD-MEM-2026-000125",
    applicant_name: "Sophia Lindqvist",
    email: "sophia.lindqvist@yahoo.co.uk",
    email_type: "personal_public",
    email_verified: false,
    institution: "University of Edinburgh",
    role_title: "Postgraduate Student",
    tier_id: "student",
    tier_name: "Student Member",
    annual_fee: 49,
    payment_status: "unpaid",
    status: "VERIFICATION_REQUIRED",
    created_at: "2026-10-01T17:00:00Z",
    reviewer_notes: "Personal email used without student enrolment letter attached. Awaiting proof.",
    audit_log: [
      {
        timestamp: "2026-10-01T17:00:00Z",
        actor: "sophia.lindqvist@yahoo.co.uk",
        action: "APPLICATION_SUBMITTED",
        reason: "Personal email domain. Institutional enrollment verification required.",
        fromStatus: "REGISTERED",
        toStatus: "VERIFICATION_REQUIRED",
      },
    ],
  },
];

export default function AdminVerificationQueue() {
  const [applications, setApplications] = useState<ApplicationRecord[]>(SAMPLE_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  
  // Selected application for full Dossier review
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  
  // Action state
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "REQUEST_INFO" | "SUSPEND" | "REACTIVATE" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const adminKey = typeof window !== "undefined" ? sessionStorage.getItem("girsd_admin_key") || "" : "";

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/membership/applications?adminKey=${encodeURIComponent(adminKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.applications) && data.applications.length > 0) {
          setApplications(data.applications);
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote applications; using local registry:", err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  }

  async function executeAction() {
    if (!selectedApp || !actionType) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/membership/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: actionType,
          reviewerNotes: actionNotes || undefined,
          rejectionReason: actionReason || undefined,
          reviewerEmail: "admin@globalrsd.co.uk",
          adminKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to record decision.");
        return;
      }

      // Update in local state
      const nowIso = new Date().toISOString();
      let updatedStatus: MembershipStatus = selectedApp.status;
      let assignedMemId = selectedApp.membership_id;

      if (actionType === "APPROVE") {
        updatedStatus = "ACTIVE_MEMBER";
        assignedMemId = data.membershipId || `GIRSD-M-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (actionType === "REJECT") {
        updatedStatus = "REJECTED";
      } else if (actionType === "REQUEST_INFO") {
        updatedStatus = "VERIFICATION_REQUIRED";
      } else if (actionType === "SUSPEND") {
        updatedStatus = "SUSPENDED";
      } else if (actionType === "REACTIVATE") {
        updatedStatus = "ACTIVE_MEMBER";
      }

      const newAuditEntry = {
        timestamp: nowIso,
        actor: "admin@globalrsd.co.uk",
        action: actionType,
        reason: actionNotes || actionReason || `Admin action: ${actionType}`,
        fromStatus: selectedApp.status,
        toStatus: updatedStatus,
      };

      const updatedRecord: ApplicationRecord = {
        ...selectedApp,
        status: updatedStatus,
        membership_id: assignedMemId,
        reviewed_by: "Academic Credentials Reviewer",
        reviewed_at: nowIso,
        reviewer_notes: actionNotes || selectedApp.reviewer_notes,
        rejection_reason: actionReason || selectedApp.rejection_reason,
        audit_log: [...selectedApp.audit_log, newAuditEntry],
      };

      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updatedRecord : a)));
      setSelectedApp(updatedRecord);
      setActionType(null);
      setActionReason("");
      setActionNotes("");
      showToast(`Decision recorded: ${selectedApp.id} → ${updatedStatus}`);
    } catch (err: any) {
      alert("Failed to submit decision: " + (err.message || String(err)));
    } finally {
      setProcessing(false);
    }
  }

  // Filter applications
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !search ||
        app.id.toLowerCase().includes(search.toLowerCase()) ||
        app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
        app.email.toLowerCase().includes(search.toLowerCase()) ||
        app.institution.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      const matchesType = typeFilter === "All" || app.email_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [applications, search, statusFilter, typeFilter]);

  // Statistics
  const pendingCount = applications.filter((a) => a.status === "UNDER_REVIEW" || a.status === "APPLICATION_SUBMITTED").length;
  const docsRequiredCount = applications.filter((a) => a.status === "VERIFICATION_REQUIRED").length;
  const approvedCount = applications.filter((a) => a.status === "ACTIVE_MEMBER" || a.status === "APPROVED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-3 text-xs text-emerald-300">
          ✓ {toastMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Under Board Review</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting eligibility decision</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Proof Required</p>
          <p className="mt-1 font-display text-2xl font-bold text-rose-400">{docsRequiredCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Personal webmail / pending proof</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Approved &amp; Active</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-400">{approvedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Membership credentials active</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rejected / Closed</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-400">{rejectedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ineligible credentials</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search ref ID, applicant, email, institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full text-xs pl-8 bg-slate-800/80 border-white/15 text-white placeholder:text-slate-400"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-slate-800 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="All">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="VERIFICATION_REQUIRED">Verification Required</option>
              <option value="ACTIVE_MEMBER">Approved / Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Email Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-slate-800 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="All">All Types</option>
              <option value="corporate_institutional">Institutional (.edu, .ac.uk)</option>
              <option value="personal_public">Personal Webmail</option>
            </select>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3.5">Ref / Applicant</th>
              <th className="px-4 py-3.5">Institution &amp; Role</th>
              <th className="px-4 py-3.5">Email &amp; Domain Type</th>
              <th className="px-4 py-3.5">Tier &amp; Fee</th>
              <th className="px-4 py-3.5">Payment</th>
              <th className="px-4 py-3.5">Verification Status</th>
              <th className="px-4 py-3.5">Proof File</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No applications found matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs font-bold text-gold">{app.id}</p>
                    <p className="text-white font-medium mt-0.5">{app.applicant_name}</p>
                    <p className="text-[10px] text-slate-400">
                      Applied: {new Date(app.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{app.institution}</p>
                    {app.department && <p className="text-[10px] text-slate-400">{app.department}</p>}
                    <p className="text-[10px] text-gold-light mt-0.5">{app.role_title}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-200">{app.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          app.email_type === "corporate_institutional"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {app.email_type === "corporate_institutional" ? "Institutional" : "Personal Webmail"}
                      </span>
                      {app.email_verified ? (
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-300 font-semibold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">
                          Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-white">{app.tier_name}</span>
                    <p className="text-[10px] text-slate-400">£{app.annual_fee}/year</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        app.payment_status === "paid"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {app.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        app.status === "ACTIVE_MEMBER" || app.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : app.status === "UNDER_REVIEW"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : app.status === "VERIFICATION_REQUIRED"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          app.status === "ACTIVE_MEMBER"
                            ? "bg-emerald-400"
                            : app.status === "UNDER_REVIEW"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                      {app.status.replace(/_/g, " ")}
                    </span>
                    {app.membership_id && (
                      <p className="mt-1 font-mono text-[9px] text-gold">{app.membership_id}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {app.document_filename ? (
                      <a
                        href={app.document_file_url ? `${app.document_file_url}&adminKey=${encodeURIComponent(adminKey)}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                        title={app.document_filename}
                      >
                        <span>📄</span>
                        <span className="truncate max-w-[120px]">{app.document_filename}</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No document</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="rounded-lg bg-navy border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold hover:text-navy transition shadow-xs"
                    >
                      Review Dossier →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* APPLICATION REVIEW DOSSIER MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-gold">{selectedApp.id}</span>
                <h3 className="font-display text-lg font-bold text-white mt-0.5">
                  Membership Eligibility Dossier: {selectedApp.applicant_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setActionType(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-xs">
              {/* Status and Gate Summary */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-950 p-4 border border-white/10">
                <div>
                  <span className="text-slate-400">Current Status:</span>
                  <p className="font-bold text-sm text-gold mt-0.5">{selectedApp.status.replace(/_/g, " ")}</p>
                  {selectedApp.membership_id && (
                    <p className="text-[11px] font-mono text-emerald-400 mt-1">
                      Assigned ID: {selectedApp.membership_id}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">Payment Status:</span>
                  <p className="font-bold text-sm text-white mt-0.5 uppercase">
                    {selectedApp.payment_status} (£{selectedApp.annual_fee}/yr)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {selectedApp.payment_status === "paid"
                      ? "Payment received · Approval gate enforced"
                      : "Subscription payment pending"}
                  </p>
                </div>
              </div>

              {/* Applicant Affiliation */}
              <div className="rounded-xl bg-slate-950 p-4 border border-white/10 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Affiliation Details</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-400">Institution:</span>
                    <p className="font-semibold text-white">{selectedApp.institution}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Department:</span>
                    <p className="text-white">{selectedApp.department || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Role / Title:</span>
                    <p className="text-white">{selectedApp.role_title}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Selected Tier:</span>
                    <p className="font-semibold text-gold">{selectedApp.tier_name}</p>
                  </div>
                </div>
              </div>

              {/* Verification Evidence */}
              <div className="rounded-xl bg-slate-950 p-4 border border-white/10 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Verification Evidence</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="font-mono text-white">{selectedApp.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Email Domain Classification:</span>
                    <span className="font-semibold text-white">
                      {selectedApp.email_type === "corporate_institutional"
                        ? "Institutional Domain (.edu / .ac.uk)"
                        : "Personal Webmail Domain"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Email Ownership Verified:</span>
                    <span className={selectedApp.email_verified ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {selectedApp.email_verified ? "✓ Verified" : "Pending Verification"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Uploaded Supporting Document:</span>
                    {selectedApp.document_filename ? (
                      <a
                        href={selectedApp.document_file_url ? `${selectedApp.document_file_url}&adminKey=${encodeURIComponent(adminKey)}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gold/20 text-gold px-3 py-1 font-semibold hover:bg-gold hover:text-navy transition"
                      >
                        <span>📄 View Document ({selectedApp.document_filename})</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">None attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Log History */}
              <div className="rounded-xl bg-slate-950 p-4 border border-white/10 space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Audit Trail &amp; History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApp.audit_log && selectedApp.audit_log.length > 0 ? (
                    selectedApp.audit_log.map((entry, idx) => (
                      <div key={idx} className="rounded border border-white/5 bg-slate-900/60 p-2 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-mono text-gold">{entry.action}</span>
                          <span>{new Date(entry.timestamp).toLocaleString("en-GB")}</span>
                        </div>
                        <p className="mt-1 text-slate-300">{entry.reason}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Actor: {entry.actor}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No historical actions logged.</p>
                  )}
                </div>
              </div>

              {/* Action Decision Form */}
              {actionType && (
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gold uppercase tracking-wider">
                      Execute Decision: {actionType}
                    </span>
                    <button onClick={() => setActionType(null)} className="text-xs text-slate-400 hover:text-white">
                      Cancel
                    </button>
                  </div>

                  {actionType === "REJECT" ? (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Reason for Rejection *</label>
                      <input
                        type="text"
                        required
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="e.g. Unverifiable institution or expired credentials."
                        className="input w-full bg-slate-950 border-white/20 text-white text-xs"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Reviewer Notes (Recorded in Audit Trail)</label>
                      <input
                        type="text"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="e.g. Academic credentials confirmed via institution faculty registry."
                        className="input w-full bg-slate-950 border-white/20 text-white text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={executeAction}
                      disabled={processing}
                      className="btn-gold text-xs py-1.5 px-4"
                    >
                      {processing ? "Recording…" : `Confirm ${actionType}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!actionType && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActionType("APPROVE")}
                    className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                  >
                    ✓ Approve &amp; Activate
                  </button>
                  <button
                    onClick={() => setActionType("REQUEST_INFO")}
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    Request Documents
                  </button>
                  <button
                    onClick={() => setActionType("REJECT")}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    ✕ Reject
                  </button>
                  {selectedApp.status === "ACTIVE_MEMBER" && (
                    <button
                      onClick={() => setActionType("SUSPEND")}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Suspend
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Close Dossier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
