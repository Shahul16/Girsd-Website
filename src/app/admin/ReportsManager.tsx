"use client";

import { useState } from "react";

type ReportsProps = {
  reports: any;
  onSave?: (data: any) => void;
  saving?: boolean;
};

type ReportSubTab =
  | "overview"
  | "events"
  | "submissions"
  | "internships"
  | "feedback"
  | "financials";

export default function ReportsManager({ reports }: ReportsProps) {
  const [subTab, setSubTab] = useState<ReportSubTab>("overview");
  const [search, setSearch] = useState("");

  const summary = reports?.summary || {};
  const financialBreakdown = reports?.financialBreakdown || [];
  const eventRegistrations = reports?.eventRegistrations || [];
  const candidateSubmissions = reports?.candidateSubmissions || [];
  const internshipApplications = reports?.internshipApplications || [];
  const feedbackSummary = reports?.feedbackSummary || [];

  function exportSubTabCSV(title: string, headers: string[], rows: (string | number)[][]) {
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `globalrsd_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportCurrent() {
    if (subTab === "events") {
      const headers = ["ID", "Event", "Delegate", "Email", "Tier", "Amount (£)", "Date", "Payment Status", "Attendance Mode"];
      const rows = eventRegistrations.map((e: any) => [
        e.id,
        `"${e.event}"`,
        `"${e.delegate}"`,
        e.email,
        `"${e.tier}"`,
        e.amountGBP,
        e.date,
        e.paymentStatus,
        `"${e.attendance}"`,
      ]);
      exportSubTabCSV("conference_registrations", headers, rows);
    } else if (subTab === "submissions") {
      const headers = ["ID", "Title", "Author", "Event", "Track", "Date", "Status", "Peer Review Score"];
      const rows = candidateSubmissions.map((s: any) => [
        s.id,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.author}"`,
        s.event,
        `"${s.track}"`,
        s.date,
        `"${s.status}"`,
        s.peerReviewScore,
      ]);
      exportSubTabCSV("candidate_submissions", headers, rows);
    } else if (subTab === "internships") {
      const headers = ["ID", "Applicant", "Email", "Role", "Education", "Applied Date", "Status", "CV File"];
      const rows = internshipApplications.map((a: any) => [
        a.id,
        `"${a.applicant}"`,
        a.email,
        `"${a.role}"`,
        `"${a.education}"`,
        a.appliedDate,
        `"${a.status}"`,
        `"${a.cvFile}"`,
      ]);
      exportSubTabCSV("internship_applications", headers, rows);
    } else if (subTab === "feedback") {
      const headers = ["Ticket", "Name", "Rating", "Task Completed", "Topic", "Comment", "Date"];
      const rows = feedbackSummary.map((f: any) => [
        f.ticket,
        `"${f.name}"`,
        `"${f.rating}"`,
        f.taskCompleted,
        `"${f.topic}"`,
        `"${f.comment.replace(/"/g, '""')}"`,
        f.date,
      ]);
      exportSubTabCSV("website_feedback", headers, rows);
    } else {
      const headers = ["Category", "Gross Amount (£)", "Transactions Count", "Yearly Trend"];
      const rows = financialBreakdown.map((b: any) => [
        `"${b.category}"`,
        b.amountGBP,
        b.count,
        b.trend,
      ]);
      exportSubTabCSV("financial_ledger", headers, rows);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Institutional Analytics &amp; Detailed Reports</h2>
          <p className="text-sm text-slate-400">
            Real-time reports on conference attendance, candidate submissions, internship applications, and financial ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCurrent}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Report (CSV)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2 text-xs font-semibold scrollbar-none">
        {[
          { id: "overview", label: "📈 Executive Summary" },
          { id: "events", label: "🎟️ Conference Registrations" },
          { id: "submissions", label: "📄 Abstracts & Papers" },
          { id: "internships", label: "💼 Internship Applications" },
          { id: "feedback", label: "⭐ Website Feedback" },
          { id: "financials", label: "💷 Financial Ledger" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id as ReportSubTab)}
            className={`rounded-lg px-3.5 py-2 transition ${
              subTab === tab.id
                ? "bg-gold text-navy font-bold shadow-md"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: EXECUTIVE SUMMARY */}
      {subTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Delegates Registered</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{summary.totalDelegatesRegistered}</p>
              <p className="text-xs text-emerald-400 mt-1">Across 7 International Conferences</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CPD Certificates Issued</p>
              <p className="mt-2 font-display text-3xl font-bold text-emerald-400">{summary.cpdCertificatesIssued}</p>
              <p className="text-xs text-slate-400 mt-1">Provider Code #788000</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Research Abstracts Submitted</p>
              <p className="mt-2 font-display text-3xl font-bold text-gold">{summary.abstractsSubmitted}</p>
              <p className="text-xs text-slate-400 mt-1">Under peer review &amp; curation</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gross Revenue</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">£{summary.totalGrossRevenueGBP?.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 mt-1">+22% YoY Global Growth</p>
            </div>
          </div>

          {/* Revenue Distribution Bars */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-white mb-4">Revenue Stream Breakdown (GBP £)</h3>
            <div className="space-y-4">
              {financialBreakdown.map((item: any) => {
                const percent = Math.round((item.amountGBP / summary.totalGrossRevenueGBP) * 100);
                return (
                  <div key={item.category} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-semibold">{item.category} ({item.count} items)</span>
                      <span>£{item.amountGBP.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONFERENCE REGISTRATIONS */}
      {subTab === "events" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Conference</th>
                  <th className="px-4 py-3">Delegate Name</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {eventRegistrations.map((e: any) => (
                  <tr key={e.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{e.id}</td>
                    <td className="px-4 py-3 font-bold text-white">{e.event}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{e.delegate}</p>
                      <p className="text-[10px] text-slate-400">{e.email}</p>
                    </td>
                    <td className="px-4 py-3">{e.tier}</td>
                    <td className="px-4 py-3 font-semibold text-white">£{e.amountGBP}</td>
                    <td className="px-4 py-3">{e.attendance}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {e.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ABSTRACTS & PAPERS */}
      {subTab === "submissions" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Paper ID</th>
                  <th className="px-4 py-3">Paper Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Conference &amp; Track</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Editorial Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidateSubmissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-white max-w-xs">{s.title}</td>
                    <td className="px-4 py-3">{s.author}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{s.event}</p>
                      <p className="text-[10px] text-slate-400">{s.track}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gold">{s.peerReviewScore}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: INTERNSHIP APPLICATIONS */}
      {subTab === "internships" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">App ID</th>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Position Applied</th>
                  <th className="px-4 py-3">University / Degree</th>
                  <th className="px-4 py-3">Date Applied</th>
                  <th className="px-4 py-3">CV Attached</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {internshipApplications.map((a: any) => (
                  <tr key={a.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{a.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{a.applicant}</p>
                      <p className="text-[10px] text-slate-400">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gold-light">{a.role}</td>
                    <td className="px-4 py-3">{a.education}</td>
                    <td className="px-4 py-3">{a.appliedDate}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 text-xs">📄 {a.cvFile}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: WEBSITE FEEDBACK */}
      {subTab === "feedback" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Visitor Name</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Task Completed</th>
                  <th className="px-4 py-3">Feedback Comments</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {feedbackSummary.map((f: any) => (
                  <tr key={f.ticket} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[10px] text-gold">{f.ticket}</td>
                    <td className="px-4 py-3 font-bold text-white">{f.name}</td>
                    <td className="px-4 py-3 text-amber-400 font-semibold">{f.rating}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {f.taskCompleted}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm text-slate-300">{f.comment}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">{f.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: FINANCIAL LEDGER */}
      {subTab === "financials" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Revenue Category</th>
                  <th className="px-4 py-3">Gross Value (GBP £)</th>
                  <th className="px-4 py-3">Volume Count</th>
                  <th className="px-4 py-3">YoY Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {financialBreakdown.map((b: any) => (
                  <tr key={b.category} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-white">{b.category}</td>
                    <td className="px-4 py-3 font-display text-base font-bold text-gold">£{b.amountGBP.toLocaleString()}</td>
                    <td className="px-4 py-3">{b.count} orders</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">{b.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
