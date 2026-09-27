"use client";

import { useState, useMemo } from "react";

type Member = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  institution?: string;
  title?: string;
  tier: string;
  status: "Active" | "Pending Verification" | "Expired" | "Suspended";
  since: string;
  renewsAt?: string;
  annualFee: number;
  paymentStatus: string;
  cvAttached: boolean;
  cvFileName?: string;
  profileCompletion?: number;
  disciplines?: string[];
  eventsRegistered?: string[];
  coursesEnrolled?: string[];
  certificatesIssued?: number;
  notes?: string;
};

interface MembersManagerProps {
  members: Member[];
  onSave: (updatedMembers: Member[]) => void;
  saving: boolean;
}

export default function MembersManager({ members, onSave, saving }: MembersManagerProps) {
  const [data, setData] = useState<Member[]>(members);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [tierFilter, setTierFilter] = useState<string>("All");

  // Modals
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New Member Form State
  const [newMember, setNewMember] = useState<Partial<Member>>({
    id: `GRSD-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    email: "",
    phone: "",
    location: "London, United Kingdom",
    institution: "",
    title: "Research Scholar & Candidate",
    tier: "Professional Member",
    status: "Active",
    since: new Date().toISOString().split("T")[0],
    renewsAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    annualFee: 149,
    paymentStatus: "Paid (Stripe)",
    cvAttached: false,
    cvFileName: "",
    profileCompletion: 60,
    disciplines: ["Multidisciplinary Research"],
    eventsRegistered: [],
    coursesEnrolled: [],
    certificatesIssued: 0,
    notes: "",
  });

  // Filtered members list
  const filtered = useMemo(() => {
    return data.filter((m) => {
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        (m.institution && m.institution.toLowerCase().includes(search.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      const matchesTier = tierFilter === "All" || m.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [data, search, statusFilter, tierFilter]);

  // Statistics
  const totalCount = data.length;
  const activeCount = data.filter((m) => m.status === "Active").length;
  const fellowsCount = data.filter((m) => m.tier.includes("Fellow")).length;
  const cvCount = data.filter((m) => m.cvAttached).length;
  const totalRevenue = data.reduce((acc, m) => acc + (m.annualFee || 0), 0);

  // Handlers
  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const created: Member = {
      ...(newMember as Member),
      id: newMember.id || `GRSD-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const updated = [created, ...data];
    setData(updated);
    onSave(updated);
    setIsAdding(false);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editMember) return;

    const updated = data.map((m) => (m.id === editMember.id ? editMember : m));
    setData(updated);
    onSave(updated);
    setEditMember(null);
  }

  function handleDeleteMember(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} (${id}) from the database?`)) return;
    const updated = data.filter((m) => m.id !== id);
    setData(updated);
    onSave(updated);
  }

  function handleToggleStatus(m: Member) {
    const nextStatus: Member["status"] =
      m.status === "Active" ? "Suspended" : m.status === "Suspended" ? "Active" : "Active";
    const updated = data.map((item) => (item.id === m.id ? { ...item, status: nextStatus } : item));
    setData(updated);
    onSave(updated);
  }

  function exportToCSV() {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Location",
      "Institution",
      "Title",
      "Tier",
      "Status",
      "Since",
      "Renews At",
      "Annual Fee (£)",
      "Payment Status",
      "CV Attached",
      "CV File Name",
      "Profile Completion %",
      "Disciplines",
      "Events Registered",
      "Courses Enrolled",
      "Certificates Issued",
      "Notes",
    ];

    const rows = data.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.email,
      m.phone || "",
      `"${(m.location || "").replace(/"/g, '""')}"`,
      `"${(m.institution || "").replace(/"/g, '""')}"`,
      `"${(m.title || "").replace(/"/g, '""')}"`,
      `"${m.tier.replace(/"/g, '""')}"`,
      m.status,
      m.since,
      m.renewsAt || "",
      m.annualFee || 0,
      m.paymentStatus || "",
      m.cvAttached ? "Yes" : "No",
      m.cvFileName || "",
      m.profileCompletion || 0,
      `"${(m.disciplines || []).join("; ").replace(/"/g, '""')}"`,
      `"${(m.eventsRegistered || []).join("; ").replace(/"/g, '""')}"`,
      `"${(m.coursesEnrolled || []).join("; ").replace(/"/g, '""')}"`,
      m.certificatesIssued || 0,
      `"${(m.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `globalrsd_members_database_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Members &amp; Candidate Users Database</h2>
          <p className="text-sm text-slate-400">
            Manage registered members, candidate scholars, subscription tiers, attached CVs, and renewal statuses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Database (CSV)
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn-gold flex items-center gap-2 text-xs py-2 px-4 shadow-md"
          >
            <span>➕ Add New Member</span>
          </button>
          <button
            type="button"
            onClick={() => onSave(data)}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Database"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users &amp; Candidates</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across all tiers worldwide</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Members</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-400">{activeCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((activeCount / totalCount) * 100)}% active rate</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Fellows (FGRSD)</p>
          <p className="mt-1 font-display text-2xl font-bold text-gold">{fellowsCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Distinguished Fellows</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Candidates with CV</p>
          <p className="mt-1 font-display text-2xl font-bold text-blue-400">{cvCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ready for 1-Click apply</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Annual Membership Value</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">£{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Projected ARR (GBP)</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search name, email, ID, institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full text-xs pl-8 bg-slate-800/80 border-white/15 text-white placeholder:text-slate-400"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-slate-800 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Verification">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-slate-800 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="All">All Tiers</option>
              <option value="Fellow (FGRSD)">Fellow (FGRSD)</option>
              <option value="Professional Member">Professional Member</option>
              <option value="Student Member">Student Member</option>
              <option value="Candidate Scholar">Candidate Scholar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3.5">Candidate / Member</th>
              <th className="px-4 py-3.5">Contact &amp; Location</th>
              <th className="px-4 py-3.5">Tier &amp; Fee</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">CV File</th>
              <th className="px-4 py-3.5">Events / Courses</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy border border-white/20 font-bold text-white text-xs">
                      {m.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">{m.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{m.id}</p>
                      {m.institution && <p className="text-[10px] text-gold-light mt-0.5">{m.institution}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-white">{m.email}</p>
                  <p className="text-[10px] text-slate-400">{m.phone || "—"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.location || "—"}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      m.tier.includes("Fellow")
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : m.tier.includes("Professional")
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : m.tier.includes("Student")
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {m.tier}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">£{m.annualFee || 0} / year</p>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : m.status === "Pending Verification"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : m.status === "Expired"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        m.status === "Active"
                          ? "bg-emerald-400"
                          : m.status === "Pending Verification"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    {m.status}
                  </span>
                  {m.renewsAt && <p className="text-[9px] text-slate-500 mt-1">Renews: {m.renewsAt}</p>}
                </td>
                <td className="px-4 py-3.5">
                  {m.cvAttached ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span>📄</span>
                      <span className="truncate max-w-[120px] text-[10px]" title={m.cvFileName}>
                        {m.cvFileName || "CV Attached"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No CV</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-[11px] text-slate-300">
                    {(m.eventsRegistered || []).length} Event(s) · {(m.coursesEnrolled || []).length} Course(s)
                  </p>
                  <p className="text-[10px] text-gold-light mt-0.5">Certificates: {m.certificatesIssued || 0}</p>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewMember(m)}
                      title="View Full Profile Dossier"
                      className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/15 hover:text-white"
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMember(m)}
                      title="Edit Member Details"
                      className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/15 hover:text-white"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(m)}
                      title={m.status === "Active" ? "Suspend Member" : "Activate Member"}
                      className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/15 hover:text-white"
                    >
                      🔄
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      title="Delete Member"
                      className="rounded-md border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No members match your search or filter.</p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setTierFilter("All");
              }}
              className="mt-2 text-xs font-semibold text-gold underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW MEMBER DOSSIER MODAL */}
      {viewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy border border-gold/40 text-gold font-display text-lg font-bold">
                  {viewMember.name.charAt(0)}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{viewMember.name}</h3>
                  <p className="font-mono text-xs text-gold">{viewMember.id}</p>
                  <p className="text-xs text-slate-400">{viewMember.title}</p>
                </div>
              </div>
              <button onClick={() => setViewMember(null)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Contact Details</p>
                <p className="mt-1 font-semibold text-white">{viewMember.email}</p>
                <p className="text-slate-300 mt-0.5">{viewMember.phone || "No phone registered"}</p>
                <p className="text-slate-300 mt-0.5">{viewMember.location || "London, United Kingdom"}</p>
                <p className="text-gold-light mt-0.5">{viewMember.institution || "Independent Researcher"}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Membership &amp; Subscription</p>
                <p className="mt-1 font-semibold text-white">{viewMember.tier}</p>
                <p className="text-slate-300 mt-0.5">Status: <strong className="text-emerald-400">{viewMember.status}</strong></p>
                <p className="text-slate-300 mt-0.5">Annual Fee: £{viewMember.annualFee} ({viewMember.paymentStatus})</p>
                <p className="text-slate-300 mt-0.5">Member Since: {viewMember.since}</p>
                <p className="text-slate-300 mt-0.5">Renews At: {viewMember.renewsAt || "N/A"}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:col-span-2">
                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Academic Disciplines &amp; CV</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(viewMember.disciplines || []).map((d) => (
                    <span key={d} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                  <span>CV Document: <strong>{viewMember.cvFileName || "None Attached"}</strong></span>
                  <span className="text-emerald-400 font-bold">{viewMember.cvAttached ? "✓ Verified on file" : "Pending"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:col-span-2">
                <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Events &amp; Course Enrolments</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-white">Registered Conferences:</p>
                    <ul className="mt-1 list-disc list-inside text-slate-300">
                      {(viewMember.eventsRegistered || []).length > 0 ? (
                        viewMember.eventsRegistered?.map((e) => <li key={e}>{e}</li>)
                      ) : (
                        <li className="italic text-slate-500">None</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Enrolled CPD Courses:</p>
                    <ul className="mt-1 list-disc list-inside text-slate-300">
                      {(viewMember.coursesEnrolled || []).length > 0 ? (
                        viewMember.coursesEnrolled?.map((c) => <li key={c}>{c}</li>)
                      ) : (
                        <li className="italic text-slate-500">None</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {viewMember.notes && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:col-span-2">
                  <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Administrative Notes</p>
                  <p className="mt-1 text-slate-300 leading-relaxed">{viewMember.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditMember(viewMember);
                  setViewMember(null);
                }}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Edit Member Record
              </button>
              <button
                type="button"
                onClick={() => setViewMember(null)}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Edit Member Details</h3>
              <button onClick={() => setEditMember(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editMember.name}
                  onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                  className="input w-full bg-slate-800 border-white/15 text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editMember.email}
                    onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editMember.phone || ""}
                    onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Institution</label>
                  <input
                    type="text"
                    value={editMember.institution || ""}
                    onChange={(e) => setEditMember({ ...editMember, institution: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={editMember.location || ""}
                    onChange={(e) => setEditMember({ ...editMember, location: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Membership Tier</label>
                  <select
                    value={editMember.tier}
                    onChange={(e) => setEditMember({ ...editMember, tier: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  >
                    <option value="Fellow (FGRSD)">Fellow (FGRSD)</option>
                    <option value="Professional Member">Professional Member</option>
                    <option value="Student Member">Student Member</option>
                    <option value="Candidate Scholar">Candidate Scholar</option>
                    <option value="Institutional Member">Institutional Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editMember.status}
                    onChange={(e) => setEditMember({ ...editMember, status: e.target.value as any })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Annual Fee (£)</label>
                  <input
                    type="number"
                    value={editMember.annualFee}
                    onChange={(e) => setEditMember({ ...editMember, annualFee: parseInt(e.target.value, 10) || 0 })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={editMember.renewsAt || ""}
                    onChange={(e) => setEditMember({ ...editMember, renewsAt: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Notes</label>
                <textarea
                  rows={3}
                  value={editMember.notes || ""}
                  onChange={(e) => setEditMember({ ...editMember, notes: e.target.value })}
                  className="input w-full bg-slate-800 border-white/15 text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 font-semibold text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold py-2 px-5 text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW MEMBER MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Add New Member / Candidate</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Davies"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="input w-full bg-slate-800 border-white/15 text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. r.davies@ed.ac.uk"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+44 79..."
                    value={newMember.phone || ""}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. University of Edinburgh"
                    value={newMember.institution || ""}
                    onChange={(e) => setNewMember({ ...newMember, institution: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Edinburgh, United Kingdom"
                    value={newMember.location || ""}
                    onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Membership Tier</label>
                  <select
                    value={newMember.tier}
                    onChange={(e) => setNewMember({ ...newMember, tier: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  >
                    <option value="Fellow (FGRSD)">Fellow (FGRSD)</option>
                    <option value="Professional Member">Professional Member</option>
                    <option value="Student Member">Student Member</option>
                    <option value="Candidate Scholar">Candidate Scholar</option>
                    <option value="Institutional Member">Institutional Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={newMember.status}
                    onChange={(e) => setNewMember({ ...newMember, status: e.target.value as any })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Annual Fee (£)</label>
                  <input
                    type="number"
                    value={newMember.annualFee}
                    onChange={(e) => setNewMember({ ...newMember, annualFee: parseInt(e.target.value, 10) || 0 })}
                    className="input w-full bg-slate-800 border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Candidate ID</label>
                  <input
                    type="text"
                    value={newMember.id}
                    onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
                    className="input w-full bg-slate-800 border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 font-semibold text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold py-2 px-5 text-xs">
                  Create Member Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
