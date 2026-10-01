"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import siteJson from "@/content/site.json";
import heroJson from "@/content/hero.json";
import eventsJson from "@/content/events.json";
import coursesJson from "@/content/courses.json";
import awardsJson from "@/content/awards.json";
import newsJson from "@/content/news.json";
import pagesJson from "@/content/pages.json";
import membersJson from "@/content/members.json";
import reportsJson from "@/content/reports.json";
import MembersManager from "./MembersManager";
import ReportsManager from "./ReportsManager";

type TabKey = "members" | "reports" | "site" | "hero" | "events" | "courses" | "awards" | "news" | "pages" | "media";

type MediaItem = {
  name: string;
  path: string;
  size: number;
  mtime: number;
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>("members");

  // State data for all collections
  const [membersData, setMembersData] = useState<any[]>(membersJson);
  const [reportsData, setReportsData] = useState<any>(reportsJson);
  const [siteData, setSiteData] = useState<any>(siteJson);
  const [heroData, setHeroData] = useState<any[]>(heroJson);
  const [eventsData, setEventsData] = useState<any[]>(eventsJson);
  const [coursesData, setCoursesData] = useState<any[]>(coursesJson);
  const [awardsData, setAwardsData] = useState<any[]>(awardsJson);
  const [newsData, setNewsData] = useState<any[]>(newsJson);
  const [pagesData, setPagesData] = useState<any>(pagesJson);

  // Media Library
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<((path: string) => void) | null>(null);

  // Editor modal state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Status and publish states
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("girsd_admin_key");
    if (saved) {
      setKey(saved);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked) {
      fetchMedia();
    }
  }, [unlocked]);

  async function fetchMedia() {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`);
      const d = await res.json();
      if (d.ok && Array.isArray(d.media)) {
        setMediaList(d.media);
      }
    } catch (e) {
      console.warn("Could not load media:", e);
    }
    setMediaLoading(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const c = key.trim();
    if (!c) return;
    setSigningIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: c }),
      });
      if (res.ok || res.status === 503) {
        sessionStorage.setItem("girsd_admin_key", c);
        setUnlocked(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setLoginError(d.error ?? "Incorrect password.");
      }
    } catch {
      setLoginError("Network error — please try again.");
    }
    setSigningIn(false);
  }

  function handleLogout() {
    sessionStorage.removeItem("girsd_admin_key");
    setUnlocked(false);
    setKey("");
  }

  // Generic Save Handler for any collection
  async function saveCollection(collection: string, dataToSave: any) {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, data: dataToSave, adminKey: key }),
      });
      const d = await res.json();
      if (res.ok) {
        setStatus({ kind: "ok", msg: d.message || "Changes saved successfully!" });
      } else {
        setStatus({ kind: "err", msg: d.error || "Save failed." });
      }
    } catch (e: any) {
      setStatus({ kind: "err", msg: "Network error: " + e.message });
    }
    setSaving(false);
  }

  // Publish All changes
  async function publishAll() {
    if (!confirm("Publish all pending changes to the live site? This will update your live website.")) return;
    setPublishing(true);
    setStatus(null);
    try {
      // Save all collections
      await saveCollection("site", siteData);
      await saveCollection("hero", heroData);
      await saveCollection("events", eventsData);
      await saveCollection("courses", coursesData);
      await saveCollection("awards", awardsData);
      await saveCollection("news", newsData);
      await saveCollection("pages", pagesData);
      await saveCollection("members", membersData);
      await saveCollection("reports", reportsData);
      setStatus({
        kind: "ok",
        msg: "All changes published! Live site redeploy triggered — updates appear within ~1-2 minutes.",
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: "Error publishing all: " + e.message });
    }
    setPublishing(false);
  }

  // Picture upload helper
  async function handlePictureUpload(file: File, onUploaded: (path: string) => void, customFilename?: string) {
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("adminKey", key);
      fd.append("file", file);
      if (customFilename) fd.append("filename", customFilename);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok && d.path) {
        onUploaded(d.path);
        setStatus({ kind: "ok", msg: "Picture uploaded successfully!" });
        fetchMedia();
      } else {
        setStatus({ kind: "err", msg: d.error || "Upload failed." });
      }
    } catch (e: any) {
      setStatus({ kind: "err", msg: "Upload error: " + e.message });
    }
    setUploading(false);
  }

  // Delete uploaded media file
  async function deleteMediaFile(filePath: string) {
    if (!confirm(`Delete image "${filePath}"?`)) return;
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, adminKey: key }),
      });
      const d = await res.json();
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.path !== filePath));
        setStatus({ kind: "ok", msg: "Image deleted." });
      } else {
        setStatus({ kind: "err", msg: d.error || "Delete failed." });
      }
    } catch (e: any) {
      setStatus({ kind: "err", msg: "Error deleting file: " + e.message });
    }
  }

  if (!unlocked) {
    return (
      <section className="flex min-h-[85vh] items-center justify-center px-4 py-16 bg-navy text-white">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Image src="/logo-white.png" alt="GIRSD" width={240} height={70} unoptimized className="h-14 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold text-white">GIRSD CMS Console</h1>
            <p className="mt-1.5 text-sm text-slate-300">Staff & Management Sign In</p>
          </div>
          <form onSubmit={signIn} className="rounded-xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <label htmlFor="adminuser" className="label text-slate-200">Username</label>
            <input id="adminuser" type="text" className="input mt-1.5" autoComplete="username" defaultValue="admin" />
            <label htmlFor="adminkey" className="label mt-5 text-slate-200">Admin Password</label>
            <input
              id="adminkey"
              type="password"
              className="input mt-1.5"
              autoComplete="current-password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
              autoFocus
            />
            {loginError && <p className="mt-3 text-sm text-rose-400 font-medium">{loginError}</p>}
            <button type="submit" disabled={signingIn} className="btn-gold mt-6 w-full shadow-lg">
              {signingIn ? "Verifying..." : "Sign In to Console"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo-white.png" alt="GIRSD" width={160} height={42} unoptimized className="h-9 w-auto" />
            </Link>
            <span className="hidden sm:inline-block rounded bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold border border-gold/30">
              CMS Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={publishAll}
              disabled={publishing || saving}
              className="btn-gold text-xs sm:text-sm py-2 px-4 shadow-lg shadow-gold/20 flex items-center gap-2"
            >
              {publishing ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                  Publishing Live...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Publish to Live Site
                </>
              )}
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              View Site ↗
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Global Status Banner */}
      {status && (
        <div
          className={`px-4 py-2.5 text-center text-sm font-semibold transition-all ${
            status.kind === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {status.msg}
          <button onClick={() => setStatus(null)} className="ml-3 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-header / Tabs */}
      <nav className="border-b border-white/10 bg-navy-dark/90 px-4">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: "members", label: "👥 Members & Users" },
            { id: "reports", label: "📊 Detailed Reports" },
            { id: "site", label: "🏢 Site & Logos" },
            { id: "hero", label: "🎠 Hero Slides" },
            { id: "events", label: "📅 Events & Conferences" },
            { id: "courses", label: "🎓 Online Courses" },
            { id: "awards", label: "🏆 Global Awards" },
            { id: "news", label: "📰 News & Press" },
            { id: "pages", label: "📄 Page Content" },
            { id: "media", label: "🖼️ Media Library" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabKey);
                setEditingIndex(null);
                setEditItem(null);
                setStatus(null);
              }}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold sm:text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-gold text-navy font-bold shadow-md"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl flex-1 w-full px-4 py-8">
        {/* ========================================================= */}
        {/* TAB 0A: MEMBERS & CANDIDATE DATABASE */}
        {/* ========================================================= */}
        {activeTab === "members" && (
          <MembersManager
            members={membersData}
            onSave={(updated) => {
              setMembersData(updated);
              saveCollection("members", updated);
            }}
            saving={saving}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 0B: INSTITUTIONAL REPORTS */}
        {/* ========================================================= */}
        {activeTab === "reports" && (
          <ReportsManager
            reports={reportsData}
            onSave={(updated) => {
              setReportsData(updated);
              saveCollection("reports", updated);
            }}
            saving={saving}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 1: SITE SETTINGS & LOGOS */}
        {/* ========================================================= */}
        {activeTab === "site" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Site Identity, Logos & Global Settings</h2>
                <p className="text-sm text-slate-400">Manage logos, institution contact info, and public impact stats.</p>
              </div>
              <button
                onClick={() => saveCollection("site", siteData)}
                disabled={saving}
                className="btn-gold text-xs sm:text-sm py-2 px-5"
              >
                {saving ? "Saving..." : "Save Site Settings"}
              </button>
            </div>

            {/* Visual Logos Section */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-gold uppercase tracking-wider mb-4">Logos & Favicon</h3>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Header Logo */}
                <div className="rounded-lg border border-white/10 bg-slate-950 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Header Logo (Light Navbar)</span>
                    <div className="mt-3 flex h-24 items-center justify-center rounded bg-white p-3">
                      <img src={siteData.logoHeader} alt="Header Logo" className="max-h-16 max-w-full object-contain" />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">{siteData.logoHeader}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <label className="btn-gold text-xs py-1.5 px-3 flex-1 text-center cursor-pointer">
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePictureUpload(file, (p) => setSiteData({ ...siteData, logoHeader: p }), "logo-header");
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* White Logo */}
                <div className="rounded-lg border border-white/10 bg-slate-950 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">White Logo (Dark Footer/Hero)</span>
                    <div className="mt-3 flex h-24 items-center justify-center rounded bg-navy-dark p-3 border border-white/10">
                      <img src={siteData.logoWhite} alt="White Logo" className="max-h-16 max-w-full object-contain" />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">{siteData.logoWhite}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <label className="btn-gold text-xs py-1.5 px-3 flex-1 text-center cursor-pointer">
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePictureUpload(file, (p) => setSiteData({ ...siteData, logoWhite: p }), "logo-white");
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Favicon */}
                <div className="rounded-lg border border-white/10 bg-slate-950 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Browser Tab Favicon</span>
                    <div className="mt-3 flex h-24 items-center justify-center rounded bg-slate-800 p-3">
                      <img src={siteData.favicon || "/favicon.ico"} alt="Favicon" className="h-10 w-10 object-contain" />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">{siteData.favicon || "/favicon.ico"}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <label className="btn-gold text-xs py-1.5 px-3 flex-1 text-center cursor-pointer">
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePictureUpload(file, (p) => setSiteData({ ...siteData, favicon: p }), "favicon");
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-gold uppercase tracking-wider mb-4">Institution Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Institute Name</label>
                  <input
                    type="text"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.name || ""}
                    onChange={(e) => setSiteData({ ...siteData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Short Name / Brand</label>
                  <input
                    type="text"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.shortName || ""}
                    onChange={(e) => setSiteData({ ...siteData, shortName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Primary Contact Email</label>
                  <input
                    type="email"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.email || ""}
                    onChange={(e) => setSiteData({ ...siteData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Awards Enquiry Email</label>
                  <input
                    type="email"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.awardsEmail || ""}
                    onChange={(e) => setSiteData({ ...siteData, awardsEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Membership Email</label>
                  <input
                    type="email"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.membershipEmail || ""}
                    onChange={(e) => setSiteData({ ...siteData, membershipEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.phone || ""}
                    onChange={(e) => setSiteData({ ...siteData, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Registered Office / HQ Address</label>
                  <input
                    type="text"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={
                      typeof siteData.address === "string"
                        ? siteData.address
                        : siteData.address && typeof siteData.address === "object"
                        ? [siteData.address.line1, [siteData.address.city, siteData.address.postcode].filter(Boolean).join(" "), siteData.address.country].filter(Boolean).join(", ")
                        : ""
                    }
                    onChange={(e) => setSiteData({ ...siteData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Impact Stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-gold uppercase tracking-wider mb-4">Public Impact Stats</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Members Worldwide</label>
                  <input
                    type="number"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.stats?.members ?? 25}
                    onChange={(e) =>
                      setSiteData({ ...siteData, stats: { ...siteData.stats, members: Number(e.target.value) } })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Conferences Delivered</label>
                  <input
                    type="number"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.stats?.conferences ?? 3}
                    onChange={(e) =>
                      setSiteData({ ...siteData, stats: { ...siteData.stats, conferences: Number(e.target.value) } })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Countries Represented</label>
                  <input
                    type="number"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.stats?.countries ?? 1}
                    onChange={(e) =>
                      setSiteData({ ...siteData, stats: { ...siteData.stats, countries: Number(e.target.value) } })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Papers Presented</label>
                  <input
                    type="number"
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                    value={siteData.stats?.papers ?? 70}
                    onChange={(e) =>
                      setSiteData({ ...siteData, stats: { ...siteData.stats, papers: Number(e.target.value) } })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HERO SLIDESHOW MANAGER */}
        {/* ========================================================= */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Home Page Hero Slides</h2>
                <p className="text-sm text-slate-400">Customize the automatic slides, background pictures, headlines, and buttons.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newSlide = {
                      id: "slide-" + Date.now(),
                      tabTitle: "New Service",
                      title: "New Service",
                      href: "/events",
                      cta: "Explore",
                      eyebrow: "Global Academic Forums",
                      headline: "Headline Line 1",
                      highlight: "Highlight Subheadline",
                      description: "Enter slide narrative description here.",
                      primaryCta: { label: "Book Tickets", href: "/events" },
                      secondaryCta: { label: "Learn More", href: "/about" },
                      cardType: "conference",
                      image: "/hero.jpg",
                      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253",
                    };
                    const next = [...heroData, newSlide];
                    setHeroData(next);
                    setEditingIndex(next.length - 1);
                    setEditItem(newSlide);
                  }}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  + Add Slide
                </button>
                <button
                  onClick={() => saveCollection("hero", heroData)}
                  disabled={saving}
                  className="btn-gold text-xs sm:text-sm py-2 px-5"
                >
                  {saving ? "Saving..." : "Save Slides"}
                </button>
              </div>
            </div>

            {/* Slides list */}
            <div className="grid gap-6 md:grid-cols-2">
              {heroData.map((slide, i) => (
                <div
                  key={slide.id || i}
                  className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 p-5 shadow-lg flex flex-col justify-between"
                >
                  {/* Slide background thumbnail */}
                  <div className="relative h-40 w-full overflow-hidden rounded-lg bg-slate-950">
                    <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{slide.eyebrow}</span>
                      <h4 className="font-display text-base font-bold truncate">
                        {slide.headline} <span className="text-gold">{slide.highlight}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="text-xs text-slate-300 line-clamp-2">{slide.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="rounded bg-white/10 px-2 py-0.5">Card: {slide.cardType}</span>
                      <span className="rounded bg-white/10 px-2 py-0.5">Tab: {slide.tabTitle}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditItem(JSON.parse(JSON.stringify(slide)));
                      }}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Edit Slide Details & Picture →
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this slide?")) {
                          setHeroData(heroData.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide Editor Modal */}
            {editingIndex !== null && editItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl my-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">Edit Slide: {editItem.tabTitle}</h3>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Picture uploader */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Background Photograph</label>
                      <div className="mt-2 flex items-center gap-4">
                        <img src={editItem.image} alt="Preview" className="h-16 w-24 rounded object-cover border border-white/20" />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editItem.image}
                            onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                            className="input text-xs flex-1 bg-slate-950 border-white/20"
                          />
                          <label className="btn-gold text-xs py-1.5 px-3 cursor-pointer shrink-0">
                            <span>Upload Picture</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePictureUpload(f, (p) => setEditItem({ ...editItem, image: p }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Tab Title (Bottom Pill)</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.tabTitle || ""}
                          onChange={(e) => setEditItem({ ...editItem, tabTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Category / Eyebrow</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.eyebrow || ""}
                          onChange={(e) => setEditItem({ ...editItem, eyebrow: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Headline Line 1 (White)</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.headline || ""}
                          onChange={(e) => setEditItem({ ...editItem, headline: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Subheadline Line 2 (Gold)</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.highlight || ""}
                          onChange={(e) => setEditItem({ ...editItem, highlight: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Description Copy</label>
                      <textarea
                        rows={3}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.description || ""}
                        onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Primary Button Label</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.primaryCta?.label || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              primaryCta: { ...editItem.primaryCta, label: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Primary Button Link</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.primaryCta?.href || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              primaryCta: { ...editItem.primaryCta, href: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Secondary Button Label</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.secondaryCta?.label || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              secondaryCta: { ...editItem.secondaryCta, label: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Secondary Button Link</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.secondaryCta?.href || ""}
                          onChange={(e) =>
                            setEditItem({
                              ...editItem,
                              secondaryCta: { ...editItem.secondaryCta, href: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Right-Hand Card Spotlight Type</label>
                      <select
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                        value={editItem.cardType || "conference"}
                        onChange={(e) => setEditItem({ ...editItem, cardType: e.target.value })}
                      >
                        <option value="conference">Conference (Countdown + Crest)</option>
                        <option value="course">Online Courses (CPD Accredited)</option>
                        <option value="award">Global Awards (Trophy & Honours)</option>
                        <option value="membership">Membership (10% Discount & Network)</option>
                        <option value="workshop">Workshops (Masterclasses)</option>
                        <option value="partnership">Partnerships & Internships (MOUs)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...heroData];
                        updated[editingIndex] = editItem;
                        setHeroData(updated);
                        setEditingIndex(null);
                        setStatus({ kind: "ok", msg: "Slide updated! Click 'Save Slides' or 'Publish' to persist." });
                      }}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EVENTS & CONFERENCES */}
        {/* ========================================================= */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Conferences & Skills Workshops</h2>
                <p className="text-sm text-slate-400">Add, edit, or remove events, ticket tiers, agendas, and cover pictures.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newEvent = {
                      slug: "new-conference-" + Date.now(),
                      category: "Research Conferences",
                      title: "New International Conference",
                      acronym: "CONF 2027",
                      date: "2027-06-15T09:00:00Z",
                      endDate: "2027-06-16T17:00:00Z",
                      venue: "Conference Centre",
                      city: "London, UK",
                      image: "/ev-icmdr-2026.jpg",
                      summary: "Brief event card summary.",
                      description: "Detailed description of the conference.",
                      themes: ["Theme 1", "Theme 2"],
                      tickets: [{ id: "standard", name: "Standard Delegate", price: 150, includes: ["Conference access", "Proceedings"] }],
                      agenda: [{ day: "Day 1", items: [{ time: "09:00", title: "Registration" }] }],
                      speakers: [],
                    };
                    const next = [newEvent, ...eventsData];
                    setEventsData(next);
                    setEditingIndex(0);
                    setEditItem(newEvent);
                  }}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  + Add Event
                </button>
                <button
                  onClick={() => saveCollection("events", eventsData)}
                  disabled={saving}
                  className="btn-gold text-xs sm:text-sm py-2 px-5"
                >
                  {saving ? "Saving..." : "Save Events"}
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search events by title, acronym, or city..."
                className="input text-xs w-full bg-slate-950 border-white/20 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Events list */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventsData
                .filter((ev) =>
                  !searchQuery ||
                  ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ev.acronym?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ev.city?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((ev, i) => (
                  <div
                    key={ev.slug || i}
                    className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 p-4 shadow-lg flex flex-col justify-between"
                  >
                    <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-950">
                      <img src={ev.image || "/ev-icmdr-2026.jpg"} alt={ev.title} className="h-full w-full object-cover" />
                      <span className="absolute top-2 right-2 rounded bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                        {ev.acronym}
                      </span>
                    </div>

                    <div className="mt-3 flex-1">
                      <span className="text-[10px] uppercase font-semibold text-gold-light">{ev.category}</span>
                      <h4 className="font-display text-sm font-bold text-white line-clamp-1">{ev.title}</h4>
                      <p className="mt-1 text-xs text-slate-300">{ev.city} · {new Date(ev.date).toLocaleDateString()}</p>
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2">{ev.summary}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <button
                        onClick={() => {
                          setEditingIndex(i);
                          setEditItem(JSON.parse(JSON.stringify(ev)));
                        }}
                        className="text-xs font-semibold text-gold hover:underline"
                      >
                        Edit Event →
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete event "${ev.title}"?`)) {
                            setEventsData(eventsData.filter((_, idx) => idx !== i));
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Event Editor Modal */}
            {editingIndex !== null && editItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl my-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">Edit Event: {editItem.title}</h3>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Cover picture */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Cover Picture</label>
                      <div className="mt-2 flex items-center gap-4">
                        <img src={editItem.image || "/ev-icmdr-2026.jpg"} alt="Preview" className="h-16 w-24 rounded object-cover border border-white/20" />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editItem.image || ""}
                            onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                            className="input text-xs flex-1 bg-slate-950 border-white/20"
                          />
                          <label className="btn-gold text-xs py-1.5 px-3 cursor-pointer shrink-0">
                            <span>Upload Picture</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePictureUpload(f, (p) => setEditItem({ ...editItem, image: p }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Category</label>
                        <select
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.category || "Research Conferences"}
                          onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                        >
                          <option value="Research Conferences">Research Conferences</option>
                          <option value="Skills Development Workshops">Skills Development Workshops</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Acronym</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.acronym || ""}
                          onChange={(e) => setEditItem({ ...editItem, acronym: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.slug || ""}
                          onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Full Title</label>
                      <input
                        type="text"
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                        value={editItem.title || ""}
                        onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Start Date & Time (ISO)</label>
                        <input
                          type="datetime-local"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.date ? editItem.date.slice(0, 16) : ""}
                          onChange={(e) => setEditItem({ ...editItem, date: new Date(e.target.value).toISOString() })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">End Date & Time (ISO)</label>
                        <input
                          type="datetime-local"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.endDate ? editItem.endDate.slice(0, 16) : ""}
                          onChange={(e) => setEditItem({ ...editItem, endDate: new Date(e.target.value).toISOString() })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Venue</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.venue || ""}
                          onChange={(e) => setEditItem({ ...editItem, venue: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">City, Country</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.city || ""}
                          onChange={(e) => setEditItem({ ...editItem, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Card Summary</label>
                      <textarea
                        rows={2}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.summary || ""}
                        onChange={(e) => setEditItem({ ...editItem, summary: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Full Description</label>
                      <textarea
                        rows={4}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.description || ""}
                        onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Themes / Tracks (one per line)</label>
                      <textarea
                        rows={3}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm font-mono"
                        value={Array.isArray(editItem.themes) ? editItem.themes.join("\n") : ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            themes: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...eventsData];
                        updated[editingIndex] = editItem;
                        setEventsData(updated);
                        setEditingIndex(null);
                        setStatus({ kind: "ok", msg: "Event updated! Click 'Save Events' or 'Publish' to persist." });
                      }}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ONLINE COURSES */}
        {/* ========================================================= */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Certified Online Courses</h2>
                <p className="text-sm text-slate-400">Add, edit, or remove courses, fees, syllabus modules, and cover pictures.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newCourse = {
                      slug: "new-course-" + Date.now(),
                      title: "New Certified Course",
                      level: "Foundation",
                      category: "Skills Development Courses",
                      duration: "6 weeks",
                      effort: "3–4 hours per week",
                      price: 295,
                      image: "/co-data-science-with-python.jpg",
                      summary: "Course overview summary.",
                      description: "Detailed curriculum description.",
                      syllabus: [{ module: "Module 1", topics: ["Introduction"] }],
                      certification: "GIRSD Certificate of Completion accredited by UK CPD Standards Office.",
                    };
                    const next = [newCourse, ...coursesData];
                    setCoursesData(next);
                    setEditingIndex(0);
                    setEditItem(newCourse);
                  }}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  + Add Course
                </button>
                <button
                  onClick={() => saveCollection("courses", coursesData)}
                  disabled={saving}
                  className="btn-gold text-xs sm:text-sm py-2 px-5"
                >
                  {saving ? "Saving..." : "Save Courses"}
                </button>
              </div>
            </div>

            {/* Courses grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {coursesData.map((course, i) => (
                <div
                  key={course.slug || i}
                  className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 p-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-950">
                    <img src={course.image || "/co-generic.jpg"} alt={course.title} className="h-full w-full object-cover" />
                    <span className="absolute top-2 right-2 rounded bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                      £{course.price}
                    </span>
                  </div>

                  <div className="mt-3 flex-1">
                    <span className="text-[10px] uppercase font-semibold text-gold-light">{course.level} · {course.duration}</span>
                    <h4 className="font-display text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">{course.summary}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditItem(JSON.parse(JSON.stringify(course)));
                      }}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Edit Course →
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete course "${course.title}"?`)) {
                          setCoursesData(coursesData.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Editor Modal */}
            {editingIndex !== null && editItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl my-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">Edit Course: {editItem.title}</h3>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Picture uploader */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Cover Picture</label>
                      <div className="mt-2 flex items-center gap-4">
                        <img src={editItem.image || "/co-generic.jpg"} alt="Preview" className="h-16 w-24 rounded object-cover border border-white/20" />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editItem.image || ""}
                            onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                            className="input text-xs flex-1 bg-slate-950 border-white/20"
                          />
                          <label className="btn-gold text-xs py-1.5 px-3 cursor-pointer shrink-0">
                            <span>Upload Picture</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePictureUpload(f, (p) => setEditItem({ ...editItem, image: p }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Level</label>
                        <select
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.level || "Foundation"}
                          onChange={(e) => setEditItem({ ...editItem, level: e.target.value })}
                        >
                          <option value="Foundation">Foundation</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Price (£)</label>
                        <input
                          type="number"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.price ?? 295}
                          onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Duration</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.duration || "6 weeks"}
                          onChange={(e) => setEditItem({ ...editItem, duration: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Course Title</label>
                      <input
                        type="text"
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                        value={editItem.title || ""}
                        onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Card Summary</label>
                      <textarea
                        rows={2}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.summary || ""}
                        onChange={(e) => setEditItem({ ...editItem, summary: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Full Description</label>
                      <textarea
                        rows={4}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.description || ""}
                        onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...coursesData];
                        updated[editingIndex] = editItem;
                        setCoursesData(updated);
                        setEditingIndex(null);
                        setStatus({ kind: "ok", msg: "Course updated! Click 'Save Courses' or 'Publish' to persist." });
                      }}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: GLOBAL AWARDS */}
        {/* ========================================================= */}
        {activeTab === "awards" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Global Awards Categories</h2>
                <p className="text-sm text-slate-400">Add, edit, or remove award categories, criteria, and tracks.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newAward = {
                      id: "award-" + Date.now(),
                      name: "New Global Award",
                      type: "Individual",
                      track: "Academia",
                      description: "Award criteria and description.",
                    };
                    const next = [newAward, ...awardsData];
                    setAwardsData(next);
                    setEditingIndex(0);
                    setEditItem(newAward);
                  }}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  + Add Award
                </button>
                <button
                  onClick={() => saveCollection("awards", awardsData)}
                  disabled={saving}
                  className="btn-gold text-xs sm:text-sm py-2 px-5"
                >
                  {saving ? "Saving..." : "Save Awards"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {awardsData.map((award, i) => (
                <div key={award.id || i} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{award.track} · {award.type}</span>
                    <h4 className="mt-1 font-display text-base font-bold text-white">{award.name}</h4>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3">{award.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditItem(JSON.parse(JSON.stringify(award)));
                      }}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Edit Award →
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete award "${award.name}"?`)) {
                          setAwardsData(awardsData.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Award Editor Modal */}
            {editingIndex !== null && editItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">Edit Award</h3>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Award Name</label>
                      <input
                        type="text"
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                        value={editItem.name || ""}
                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Type</label>
                        <select
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.type || "Individual"}
                          onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                        >
                          <option value="Individual">Individual</option>
                          <option value="Institutional">Institutional</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Track</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.track || ""}
                          onChange={(e) => setEditItem({ ...editItem, track: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Description</label>
                      <textarea
                        rows={4}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.description || ""}
                        onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...awardsData];
                        updated[editingIndex] = editItem;
                        setAwardsData(updated);
                        setEditingIndex(null);
                        setStatus({ kind: "ok", msg: "Award updated!" });
                      }}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: NEWS & ARTICLES */}
        {/* ========================================================= */}
        {activeTab === "news" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">News & Press Releases</h2>
                <p className="text-sm text-slate-400">Publish articles, announcements, and calls for papers.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newArticle = {
                      slug: "new-article-" + Date.now(),
                      title: "New Announcement",
                      author: "GIRSD",
                      date: new Date().toISOString().slice(0, 10),
                      excerpt: "Brief summary of article.",
                      body: ["Full article paragraph content."],
                    };
                    const next = [newArticle, ...newsData];
                    setNewsData(next);
                    setEditingIndex(0);
                    setEditItem(newArticle);
                  }}
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  + Add Article
                </button>
                <button
                  onClick={() => saveCollection("news", newsData)}
                  disabled={saving}
                  className="btn-gold text-xs sm:text-sm py-2 px-5"
                >
                  {saving ? "Saving..." : "Save News"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newsData.map((article, i) => (
                <div key={article.slug || i} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400">{article.date} · {article.author}</span>
                    <h4 className="mt-1 font-display text-base font-bold text-white line-clamp-2">{article.title}</h4>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3">{article.excerpt}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditItem(JSON.parse(JSON.stringify(article)));
                      }}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Edit Article →
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete article "${article.title}"?`)) {
                          setNewsData(newsData.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Article Editor Modal */}
            {editingIndex !== null && editItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg font-bold text-white">Edit Article</h3>
                    <button onClick={() => setEditingIndex(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Headline</label>
                      <input
                        type="text"
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                        value={editItem.title || ""}
                        onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Author</label>
                        <input
                          type="text"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.author || ""}
                          onChange={(e) => setEditItem({ ...editItem, author: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Date (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                          value={editItem.date || ""}
                          onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Excerpt / Card Summary</label>
                      <textarea
                        rows={2}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={editItem.excerpt || ""}
                        onChange={(e) => setEditItem({ ...editItem, excerpt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Article Body (one paragraph per line)</label>
                      <textarea
                        rows={5}
                        className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                        value={Array.isArray(editItem.body) ? editItem.body.join("\n\n") : ""}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            body: e.target.value.split("\n\n").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const updated = [...newsData];
                        updated[editingIndex] = editItem;
                        setNewsData(updated);
                        setEditingIndex(null);
                        setStatus({ kind: "ok", msg: "Article updated!" });
                      }}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: PAGE EDITORIAL CONTENT */}
        {/* ========================================================= */}
        {activeTab === "pages" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Page-by-Page Editorial Content</h2>
                <p className="text-sm text-slate-400">Edit text, mission, vision, and team details for About, Membership, and Internships.</p>
              </div>
              <button
                onClick={() => saveCollection("pages", pagesData)}
                disabled={saving}
                className="btn-gold text-xs sm:text-sm py-2 px-5"
              >
                {saving ? "Saving..." : "Save Page Content"}
              </button>
            </div>

            {/* About Page Box */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-gold uppercase tracking-wider mb-4">About Us Page</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Eyebrow</label>
                    <input
                      type="text"
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                      value={pagesData.about?.eyebrow || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, about: { ...pagesData.about, eyebrow: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Page Headline</label>
                    <input
                      type="text"
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                      value={pagesData.about?.title || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, about: { ...pagesData.about, title: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Introduction Paragraph</label>
                  <textarea
                    rows={2}
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                    value={pagesData.about?.intro || ""}
                    onChange={(e) =>
                      setPagesData({ ...pagesData, about: { ...pagesData.about, intro: e.target.value } })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Mission Statement</label>
                    <textarea
                      rows={3}
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                      value={pagesData.about?.mission || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, about: { ...pagesData.about, mission: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Vision Statement</label>
                    <textarea
                      rows={3}
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                      value={pagesData.about?.vision || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, about: { ...pagesData.about, vision: e.target.value } })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Page Box */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-gold uppercase tracking-wider mb-4">Membership Page</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Eyebrow</label>
                    <input
                      type="text"
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                      value={pagesData.membership?.eyebrow || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, membership: { ...pagesData.membership, eyebrow: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Headline</label>
                    <input
                      type="text"
                      className="input mt-1 w-full bg-slate-950 border-white/20 text-white"
                      value={pagesData.membership?.title || ""}
                      onChange={(e) =>
                        setPagesData({ ...pagesData, membership: { ...pagesData.membership, title: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Intro Copy</label>
                  <textarea
                    rows={2}
                    className="input mt-1 w-full bg-slate-950 border-white/20 text-white text-sm"
                    value={pagesData.membership?.intro || ""}
                    onChange={(e) =>
                      setPagesData({ ...pagesData, membership: { ...pagesData.membership, intro: e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: MEDIA & PICTURE ASSET LIBRARY */}
        {/* ========================================================= */}
        {activeTab === "media" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Central Media & Picture Library</h2>
                <p className="text-sm text-slate-400">
                  Browse, upload, preview, and delete pictures. Click any picture to copy its path.
                </p>
              </div>
              <div>
                <label className="btn-gold text-xs sm:text-sm py-2 px-5 cursor-pointer flex items-center gap-2 shadow-lg">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{uploading ? "Uploading..." : "Upload New Picture"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePictureUpload(f, () => fetchMedia());
                    }}
                  />
                </label>
              </div>
            </div>

            {mediaLoading ? (
              <div className="py-12 text-center text-slate-400">Loading media library...</div>
            ) : mediaList.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 py-16 text-center text-slate-400">
                No uploaded pictures found in /public/uploads/. Click "Upload New Picture" above to add some!
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {mediaList.map((m) => (
                  <div
                    key={m.path}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-2 shadow-md flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-lg bg-slate-900">
                      <img src={m.path} alt={m.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-slate-300 truncate" title={m.name}>
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(m.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(m.path);
                          setStatus({ kind: "ok", msg: `Copied path "${m.path}" to clipboard!` });
                        }}
                        className="text-gold font-semibold hover:underline"
                      >
                        Copy Path
                      </button>
                      {m.path.startsWith("/uploads/") && (
                        <button
                          onClick={() => deleteMediaFile(m.path)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
