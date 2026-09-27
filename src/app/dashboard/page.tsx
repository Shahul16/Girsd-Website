"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";
import eventsData from "@/content/events.json";
import coursesData from "@/content/courses.json";
import { openings, type JobOpening } from "@/lib/data/careers";

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/Hzz8bB36if83vGNL9PFoRE?mode=gi_t";

type CandidateProfile = {
  photoUrl?: string | null;
  phone: string;
  location: string;
  title: string;
  bio: string;
  disciplines: string[];
  skills: string[];
  languages: string[];
  education: { degree: string; institution: string; year: string; field?: string }[];
  experience: { role: string; organization: string; duration: string; summary: string }[];
  cv: {
    fileName: string;
    fileSize: string;
    uploadedAt: string;
  } | null;
};

const DEFAULT_PROFILE: CandidateProfile = {
  photoUrl: null,
  phone: "+44 7586 261118",
  location: "London, United Kingdom",
  title: "Research Scholar & Candidate",
  bio: "Passionate multidisciplinary researcher engaged in academic presentations, scientific publications, and continuous professional development.",
  disciplines: ["Multidisciplinary Research", "Information Technology", "Bioinformatics", "Data Analytics"],
  skills: ["Research Methodology", "Data Analysis", "Python", "Academic Writing", "Statistical Modelling", "Project Coordination"],
  languages: ["English (Fluent)", "French (Intermediate)"],
  education: [
    {
      degree: "Postgraduate / Master of Science",
      institution: "School of Engineering & Advanced Sciences",
      year: "2024",
      field: "Data & Systems Analysis",
    },
    {
      degree: "Undergraduate / Bachelor of Science",
      institution: "Faculty of Applied Sciences & Technology",
      year: "2021",
      field: "Computer Applications",
    },
  ],
  experience: [
    {
      role: "Graduate Research Assistant",
      organization: "International Research Consortium",
      duration: "2023 – Present",
      summary: "Coordinated conference paper submissions, peer reviews, literature syntheses, and technical symposium proceedings.",
    },
  ],
  cv: null,
};

type ActiveTab =
  | "dashboard"
  | "profile"
  | "events"
  | "courses"
  | "membership"
  | "careers"
  | "awards"
  | "certificates"
  | "support";

export default function DashboardPage() {
  const { user, ready, logout, cancelMembership, refresh } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [profileSubTab, setProfileSubTab] = useState<"profile" | "research" | "statistics">("profile");
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  
  // Profile State
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newDisciplineInput, setNewDisciplineInput] = useState("");
  
  // Modals
  const [abstractModalEvent, setAbstractModalEvent] = useState<{ title: string; slug: string } | null>(null);
  const [abstractForm, setAbstractForm] = useState({ title: "", track: "", abstractText: "" });
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [showAiResumeModal, setShowAiResumeModal] = useState(false);

  // File Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/dashboard");
  }, [ready, user, router]);

  useEffect(() => {
    if (ready && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Load candidate profile from localStorage
  useEffect(() => {
    if (user?.email) {
      try {
        const stored = localStorage.getItem(`girsd_profile_${user.email}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setEditFormData(parsed);
        } else {
          const initial = {
            ...DEFAULT_PROFILE,
            title: `Candidate — ${user.name}`,
          };
          setProfile(initial);
          setEditFormData(initial);
        }
      } catch (err) {
        console.error("Failed to read profile:", err);
      }
    }
  }, [user]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  }

  function saveProfileToStorage(updated: CandidateProfile) {
    setProfile(updated);
    setEditFormData(updated);
    if (user?.email) {
      localStorage.setItem(`girsd_profile_${user.email}`, JSON.stringify(updated));
    }
    showToast("Profile details saved successfully.");
  }

  function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15 MB. Please select a smaller document.");
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : Math.round(file.size / 1024) + " KB";

    const updated: CandidateProfile = {
      ...profile,
      cv: {
        fileName: file.name,
        fileSize: sizeFormatted,
        uploadedAt: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
    };

    saveProfileToStorage(updated);
    showToast(`Curriculum Vitae "${file.name}" attached to your profile.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveCv() {
    if (!confirm("Remove this CV from your profile?")) return;
    const updated: CandidateProfile = {
      ...profile,
      cv: null,
    };
    saveProfileToStorage(updated);
    showToast("CV removed from profile.");
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Photo must be less than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated: CandidateProfile = {
        ...profile,
        photoUrl: base64,
      };
      saveProfileToStorage(updated);
      showToast("Candidate profile photo updated successfully!");
      if (photoInputRef.current) photoInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    if (!confirm("Remove your profile photo?")) return;
    const updated: CandidateProfile = {
      ...profile,
      photoUrl: null,
    };
    saveProfileToStorage(updated);
    showToast("Profile photo removed.");
  }

  function addSkill() {
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!profile.skills.includes(trimmed)) {
      const updated = { ...profile, skills: [...profile.skills, trimmed] };
      saveProfileToStorage(updated);
    }
    setNewSkillInput("");
  }

  function removeSkill(skillToRemove: string) {
    const updated = {
      ...profile,
      skills: profile.skills.filter((s) => s !== skillToRemove),
    };
    saveProfileToStorage(updated);
  }

  function addDiscipline() {
    if (!newDisciplineInput.trim()) return;
    const trimmed = newDisciplineInput.trim();
    if (!profile.disciplines.includes(trimmed)) {
      const updated = { ...profile, disciplines: [...profile.disciplines, trimmed] };
      saveProfileToStorage(updated);
    }
    setNewDisciplineInput("");
  }

  function removeDiscipline(dToRemove: string) {
    const updated = {
      ...profile,
      disciplines: profile.disciplines.filter((d) => d !== dToRemove),
    };
    saveProfileToStorage(updated);
  }

  function handleProfileSaveModal(e: React.FormEvent) {
    e.preventDefault();
    saveProfileToStorage(editFormData);
    setIsEditingProfile(false);
  }

  async function onCancelMembership() {
    if (!window.confirm("Cancel your membership? Your discounts stop immediately and the annual fee is not refunded automatically.")) return;
    setCancelError("");
    const res = await cancelMembership();
    if (res.error) setCancelError(res.error);
    else showToast("Membership successfully cancelled.");
  }

  function handleAbstractSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!abstractForm.title || !abstractForm.abstractText) {
      alert("Please provide both a paper title and an abstract.");
      return;
    }
    showToast(`Abstract "${abstractForm.title}" submitted successfully for peer review!`);
    setAbstractModalEvent(null);
    setAbstractForm({ title: "", track: "", abstractText: "" });
  }

  function handleQuickJobApply(job: JobOpening) {
    if (!profile.cv) {
      setActiveTab("profile");
      showToast("Please upload your CV in 'My Profile' first to enable 1-Click Application.");
      return;
    }
    showToast(`Application with your CV "${profile.cv.fileName}" submitted for ${job.title}!`);
    setSelectedJob(null);
  }

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return eventsData.filter((ev) => {
      const matchesCategory =
        eventCategoryFilter === "All" ||
        (eventCategoryFilter === "Conferences" && ev.category.includes("Conference")) ||
        (eventCategoryFilter === "Workshops" && ev.category.includes("Workshop")) ||
        (eventCategoryFilter === "Education" && ev.category.includes("Education"));
      
      const matchesSearch =
        !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.city.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [eventCategoryFilter, searchQuery]);

  if (!ready || !user) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-navy border-t-gold" />
          <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wide uppercase">Loading Candidate Workspace…</p>
        </div>
      </section>
    );
  }

  const m = user.membership;
  const candidateId = `GIRSD-${user.email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "CAND"}-2026`;
  const profileCompletion = (profile.cv ? 35 : 0) + (profile.skills.length > 0 ? 25 : 0) + (profile.education.length > 0 ? 25 : 0) + 15;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-slate-900 px-5 py-3.5 text-xs font-medium text-white shadow-xl animate-fadeUp">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-navy">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP COMMAND SUB-BAR (Refined & Uncluttered) */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          
          {/* Breadcrumb & Portal Identifier */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Toggle Sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-navy">Portal</span>
              <span className="text-slate-300">/</span>
              <span className="capitalize font-medium text-slate-500">
                {activeTab === "profile" ? "Research Profile (CV)" : activeTab}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* OFFICIAL WHATSAPP COMMUNITY CHIP */}
            <a
              href={WHATSAPP_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <svg className="h-3.5 w-3.5 fill-current text-emerald-600" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.896.954 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.868-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.758-.242-1.743-.889-2.586-1.733-.844-.844-1.491-1.829-1.734-2.587-.138-.429-.106-.815-.06-1.127.049-.333.418-1.026.823-1.17.135-.045.27-.03.361.015.09.045.18.135.225.225.225.45.675 1.62.721 1.755.045.135.03.27-.045.361-.075.09-.135.15-.225.225-.09.09-.18.18-.09.36.18.361.54 1.036 1.171 1.576.63.54 1.261.765 1.576.855.18.045.27-.045.36-.135.09-.09.18-.225.27-.315.09-.09.225-.09.36-.045.135.045 1.305.63 1.53.765.225.135.27.225.27.315 0 .09-.045.54-.18.945zM12 2C6.477 2 2 6.477 2 12c0 1.82.487 3.53 1.338 5L2.05 22l5.165-1.355A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
              <span>WhatsApp Community (2.5k+)</span>
            </a>

            {/* Candidate Identity Pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50 py-1 pl-1 pr-3">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white shadow-2xs">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="text-left text-xs leading-none">
                <p className="font-semibold text-navy">{user.name.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{candidateId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD WORKSPACE */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          
          {/* PROFESSIONAL SIDEBAR (Grouped & Clean) */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white p-5 shadow-xl transition-transform lg:static lg:block lg:w-auto lg:rounded-2xl lg:border lg:border-slate-200/80 lg:p-4 lg:shadow-xs ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
              <p className="font-display text-sm font-bold text-navy">Candidate Workspace</p>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-navy">✕</button>
            </div>

            <nav className="space-y-6" aria-label="Portal Navigation">
              
              {/* SECTION: MAIN */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Overview</p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "dashboard"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "dashboard" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      <span>Dashboard</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "profile"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "profile" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span>Research CV Profile</span>
                    </div>
                    {profile.cv && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION: ACADEMICS & PROGRAMMES */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Sessions</p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => { setActiveTab("events"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "events"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "events" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>Conferences &amp; Events</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 font-bold">{eventsData.length}</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("courses"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "courses"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "courses" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      <span>CPD Courses &amp; Modules</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION: CAREERS & HONOURS */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Opportunities</p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => { setActiveTab("careers"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "careers"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "careers" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span>Career Support &amp; Jobs</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">New</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("awards"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "awards"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "awards" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      <span>Nominate For Award</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("membership"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "membership"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "membership" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      <span>My Membership</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION: CREDENTIALS & ACCOUNT */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Account</p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => { setActiveTab("certificates"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "certificates"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "certificates" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span>Certificates &amp; Rewards</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("support"); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      activeTab === "support"
                        ? "bg-navy text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`h-4 w-4 ${activeTab === "support" ? "text-gold" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <span>Help &amp; Support</span>
                    </div>
                  </button>

                  <Link
                    href="/feedback"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100/70 hover:text-navy transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                      <span>Website Feedback</span>
                    </div>
                    <span className="text-[10px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded-full">Feedback</span>
                  </Link>

                  <button
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="min-w-0">
            
            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* WELCOME BANNER (Clean, Light & Academic) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1 text-[11px] font-bold text-navy">
                        Candidate Portal · Academic Year 2026
                      </span>
                      <h1 className="mt-3 font-display text-2xl font-bold text-navy sm:text-3xl">
                        Welcome back, {user.name}
                      </h1>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {profile.title} · Member ID: <span className="font-mono font-semibold text-navy">{candidateId}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        onClick={() => setActiveTab("profile")}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-navy hover:bg-slate-50 transition shadow-2xs"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setActiveTab("events")}
                        className="btn-navy text-xs py-2.5 px-5"
                      >
                        Submit Paper
                      </button>
                    </div>
                  </div>
                </div>

                {/* WHATSAPP SCHOLAR COMMUNITY CARD (Sleek, Refined, Uncluttered) */}
                <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.896.954 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.868-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.758-.242-1.743-.889-2.586-1.733-.844-.844-1.491-1.829-1.734-2.587-.138-.429-.106-.815-.06-1.127.049-.333.418-1.026.823-1.17.135-.045.27-.03.361.015.09.045.18.135.225.225.225.45.675 1.62.721 1.755.045.135.03.27-.045.361-.075.09-.135.15-.225.225-.09.09-.18.18-.09.36.18.361.54 1.036 1.171 1.576.63.54 1.261.765 1.576.855.18.045.27-.045.36-.135.09-.09.18-.225.27-.315.09-.09.225-.09.36-.045.135.045 1.305.63 1.53.765.225.135.27.225.27.315 0 .09-.045.54-.18.945zM12 2C6.477 2 2 6.477 2 12c0 1.82.487 3.53 1.338 5L2.05 22l5.165-1.355A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-emerald-950">Official WhatsApp Scholar Community</h2>
                        <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">2,500+ Peers</span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-800/90 leading-relaxed max-w-xl">
                        Connect with international researchers, authors, and delegates. Get real-time updates on conference deadlines, paper notifications, and webinar links.
                      </p>
                    </div>
                  </div>

                  <a
                    href={WHATSAPP_COMMUNITY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition text-center"
                  >
                    Join WhatsApp Community →
                  </a>
                </div>

                {/* STAT COUNTERS (4 Crisp Cards) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Conferences &amp; Events</p>
                    <p className="mt-2 font-display text-2xl font-bold text-navy">{eventsData.length} Scheduled</p>
                    <button onClick={() => setActiveTab("events")} className="mt-2 text-xs font-semibold text-navy hover:text-gold transition">
                      View Call for Papers →
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CPD Courses</p>
                    <p className="mt-2 font-display text-2xl font-bold text-navy">{coursesData.length} Certified</p>
                    <button onClick={() => setActiveTab("courses")} className="mt-2 text-xs font-semibold text-navy hover:text-gold transition">
                      Browse Curriculum →
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidate CV</p>
                    <p className="mt-2 font-display text-xl font-bold text-navy flex items-center gap-1.5">
                      {profile.cv ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Attached
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
                        </span>
                      )}
                    </p>
                    <button onClick={() => setActiveTab("profile")} className="mt-2 text-xs font-semibold text-navy hover:text-gold transition">
                      {profile.cv ? "Manage CV File →" : "Upload Candidate CV →"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Affiliation Tier</p>
                    <p className="mt-2 font-display text-xl font-bold text-navy truncate">
                      {m ? m.tierName : "Registered Member"}
                    </p>
                    <button onClick={() => setActiveTab("membership")} className="mt-2 text-xs font-semibold text-navy hover:text-gold transition">
                      {m ? "View Member Pass →" : "Upgrade to 20% Off →"}
                    </button>
                  </div>
                </div>

                {/* PROFILE COMPLETION CHECKLIST */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-navy">Candidate Profile Readiness</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Ensure your academic record is complete for conference author badges and career opportunities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
                      </div>
                      <span className="text-xs font-bold text-emerald-800">{profileCompletion}%</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Verified Email</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Academic Background</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Disciplines &amp; Skills</span>
                    </div>
                    <div className={`flex items-center gap-2 ${profile.cv ? "text-slate-600" : "text-amber-800 font-semibold"}`}>
                      {profile.cv ? (
                        <span className="text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-amber-600 font-bold">!</span>
                      )}
                      <span>{profile.cv ? "CV Attached" : "Upload Candidate CV"}</span>
                    </div>
                  </div>
                </div>

                {/* RECENT ACTIVITY & UPCOMING SESSIONS */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-navy">Featured Conferences</h3>
                      <button onClick={() => setActiveTab("events")} className="text-xs text-navy font-semibold hover:underline">
                        View All
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {eventsData.slice(0, 3).map((ev) => (
                        <div key={ev.slug} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-gold-dark">{ev.acronym}</span>
                            <p className="text-xs font-bold text-navy line-clamp-1">{ev.title}</p>
                            <p className="text-[11px] text-slate-400">{ev.city} · {new Date(ev.date).toLocaleDateString("en-GB")}</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab("events");
                              setAbstractModalEvent({ title: ev.title, slug: ev.slug });
                            }}
                            className="shrink-0 btn-navy text-[11px] py-1.5 px-3 rounded-lg"
                          >
                            Submit Paper
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-navy">Open Career &amp; Intern Positions</h3>
                      <button onClick={() => setActiveTab("careers")} className="text-xs text-navy font-semibold hover:underline">
                        View All
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {openings.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-navy">{job.title}</p>
                              {job.highlight && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                  Hiring
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{job.department} · {job.type}</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab("careers");
                              setSelectedJob(job);
                            }}
                            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-navy hover:bg-slate-50 transition"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: MY PROFILE (RESEARCH CV) - CANDIDATE ACADEMIC STRUCTURE */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                
                {/* Horizontal Section Tabs */}
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2 text-xs font-bold">
                  {[
                    { id: "profile", label: "Curriculum Vitae" },
                    { id: "research", label: "Research & Disciplines" },
                    { id: "statistics", label: "Activity & Stats" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setProfileSubTab(sub.id as any)}
                      className={`pb-2 transition ${
                        profileSubTab === sub.id
                          ? "border-b-2 border-navy text-navy"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                  
                  {/* LEFT COLUMN: CANDIDATE IDENTITY & CV UPLOAD (Screenshot 1 Match) */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-center">
                      
                      {/* Avatar & Candidate Photo */}
                      <div className="relative mx-auto h-24 w-24">
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={user.name}
                            className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-slate-100"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-slate-900 flex items-center justify-center font-display text-3xl font-bold text-gold shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          title="Upload / Change Photo"
                          aria-label="Upload profile photo"
                          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white shadow-md hover:bg-gold hover:text-navy transition"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>

                      {/* Photo Actions */}
                      <div className="mt-2.5 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-slate-50 transition shadow-2xs"
                        >
                          {profile.photoUrl ? "Change Photo" : "Upload Photo"}
                        </button>
                        {profile.photoUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />

                      <h2 className="mt-4 font-display text-lg font-bold text-navy">{user.name}</h2>
                      <p className="text-xs text-slate-500">{profile.location}</p>
                      
                      <div className="mt-3 flex justify-center">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                          {m ? `${m.tierName} Member` : "Verified Candidate"}
                        </span>
                      </div>

                      {/* AI Resume Action */}
                      <div className="mt-5">
                        <button
                          onClick={() => setShowAiResumeModal(true)}
                          className="w-full rounded-xl bg-navy py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                        >
                          Generate AI Resume Summary
                        </button>
                      </div>

                      {/* UPLOAD CV SECTION */}
                      <div className="mt-5 pt-5 border-t border-slate-100 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attached Curriculum Vitae</p>
                        
                        {profile.cv ? (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xl">📄</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-navy">{profile.cv.fileName}</p>
                                <p className="text-[10px] text-slate-500">{profile.cv.fileSize} · Uploaded {profile.cv.uploadedAt}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-center text-xs font-semibold text-navy hover:bg-slate-50 transition"
                              >
                                Replace
                              </button>
                              <button
                                onClick={handleRemoveCv}
                                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300 p-5 text-center hover:border-navy transition">
                            <svg className="mx-auto h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="mt-2 text-xs font-bold text-navy">Upload Candidate CV</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">PDF or Word (max 15 MB)</p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-navy mt-3 w-full py-1.5 text-xs"
                            >
                              Choose File
                            </button>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleCvUpload}
                        />
                      </div>

                    </div>
                  </div>

                  {/* RIGHT COLUMN: RESEARCH DETAILS (Screenshot 1 Details Match) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
                    
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-display text-xl font-bold text-navy">{user.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{profile.title}</p>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 transition shadow-2xs"
                      >
                        Edit Details
                      </button>
                    </div>

                    {/* BIO / STATEMENT */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Research Statement</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {profile.bio}
                      </p>
                    </div>

                    {/* DISCIPLINES */}
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disciplines</p>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {profile.disciplines.map((d) => (
                          <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
                            {d}
                            <button onClick={() => removeDiscipline(d)} className="text-slate-400 hover:text-rose-500 text-[11px]">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex max-w-sm gap-2">
                        <input
                          type="text"
                          placeholder="Add discipline (e.g. AI Ethics, Applied Physics)..."
                          className="input text-xs py-1.5"
                          value={newDisciplineInput}
                          onChange={(e) => setNewDisciplineInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addDiscipline()}
                        />
                        <button onClick={addDiscipline} className="btn-navy text-xs px-3 py-1.5">Add</button>
                      </div>
                    </div>

                    {/* SKILLS & EXPERTISE */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skills &amp; Expertise</p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="text-gold-dark hover:text-rose-500 text-[11px]">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex max-w-sm gap-2">
                        <input
                          type="text"
                          placeholder="Add skill (e.g. SPSS, Literature Review)..."
                          className="input text-xs py-1.5"
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSkill()}
                        />
                        <button onClick={addSkill} className="btn-navy text-xs px-3 py-1.5">Add</button>
                      </div>
                    </div>

                    {/* EDUCATION HISTORY */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Education History</p>
                      <div className="mt-3 space-y-3">
                        {profile.education.map((edu, idx) => (
                          <div key={idx} className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <div>
                              <p className="text-xs font-bold text-navy">{edu.degree}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{edu.institution}</p>
                              {edu.field && <p className="text-[11px] text-slate-400 mt-0.5">{edu.field}</p>}
                            </div>
                            <span className="text-xs font-semibold text-slate-400">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PROFESSIONAL & ACADEMIC EXPERIENCE */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                      <div className="mt-3 space-y-3">
                        {profile.experience.map((exp, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-navy">{exp.role}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{exp.organization}</p>
                              </div>
                              <span className="text-xs font-semibold text-slate-400">{exp.duration}</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 leading-relaxed">{exp.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: CONFERENCES & EVENTS - ACADEMIC SUB-TAB & CARD STRUCTURE */}
            {activeTab === "events" && (
              <div className="space-y-6">
                
                {/* Horizontal Category Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
                    {["All", "Conferences", "Workshops", "Education"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEventCategoryFilter(cat)}
                        className={`rounded-xl px-3.5 py-1.5 transition ${
                          eventCategoryFilter === cat
                            ? "bg-navy text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search conference or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input text-xs py-1.5 sm:w-64"
                  />
                </div>

                {/* MY BOOKED TICKETS (IF CONFIRMED) */}
                {user.tickets.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Confirmed Delegate Registrations ({user.tickets.length})
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400">
                            <th className="py-2 pr-4 font-semibold">Event</th>
                            <th className="py-2 pr-4 font-semibold">Tier</th>
                            <th className="py-2 pr-4 font-semibold">Qty</th>
                            <th className="py-2 pr-4 font-semibold">Paid</th>
                            <th className="py-2 font-semibold">Order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.tickets.map((t) => (
                            <tr key={t.orderId} className="border-b border-slate-50">
                              <td className="py-2.5 pr-4 font-bold text-navy">{t.eventTitle}</td>
                              <td className="py-2.5 pr-4 text-slate-600">{t.tierName}</td>
                              <td className="py-2.5 pr-4 font-medium">{t.quantity}</td>
                              <td className="py-2.5 pr-4 font-bold text-navy">£{t.paid}</td>
                              <td className="py-2.5 font-mono text-slate-400">{t.orderId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* EVENT CARDS GRID (Screenshot 2 Match) */}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEvents.map((ev) => (
                    <div key={ev.slug} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-navy/5 border border-navy/10 px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase tracking-wider">
                            {ev.acronym}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(ev.date).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <h4 className="mt-3 font-display text-base font-bold text-navy line-clamp-2">{ev.title}</h4>
                        <p className="mt-1 text-xs text-slate-500 font-medium">{ev.city}</p>
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">{ev.summary}</p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => setAbstractModalEvent({ title: ev.title, slug: ev.slug })}
                          className="flex-1 btn-gold text-xs py-2 text-center"
                        >
                          Submit Abstract
                        </button>
                        <Link
                          href={`/events/${ev.slug}`}
                          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-navy hover:bg-slate-50 transition"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 4: COURSES & ENROLMENTS */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">CPD Certified Training Programmes</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Continuing professional development modules and certification credentials.</p>
                </div>

                {/* MY ENROLLED COURSES */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">My Active Enrolments</h3>
                  {user.enrolments.length === 0 ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-6 text-center">
                      <p className="text-xs text-slate-500">You are not currently enrolled in any course cohort.</p>
                      <Link href="/courses" className="btn-navy mt-3 inline-block text-xs py-2 px-4">
                        Browse Courses →
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {user.enrolments.map((enr) => (
                        <div key={enr.orderId} className="rounded-xl border border-slate-200 p-4">
                          <p className="font-bold text-sm text-navy">{enr.courseTitle}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Enrolled {new Date(enr.date).toLocaleDateString("en-GB")}</p>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-semibold">● CPD Certified</span>
                            <Link href={`/courses/${enr.courseSlug}`} className="text-navy font-bold underline">
                              Open Modules
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ALL COURSES */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {coursesData.map((c) => (
                    <div key={c.slug} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">{c.duration} · {c.effort}</span>
                        <h4 className="mt-2 font-display text-base font-bold text-navy">{c.title}</h4>
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">{c.summary}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-navy">£{c.price}</span>
                        <Link href={`/courses/${c.slug}`} className="btn-navy text-xs py-1.5 px-3">
                          Enrol
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: MEMBERSHIP */}
            {activeTab === "membership" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">Institutional Membership</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Global Institute of Research &amp; Skills Development accreditation credentials.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border-t-4 border-t-gold border-slate-200/80 bg-white p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-navy">Active Plan</h3>
                    
                    {m ? (
                      <div className="mt-4 space-y-4">
                        <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          {m.tierName} Member · Active
                        </div>
                        <dl className="space-y-2 text-xs">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <dt className="text-slate-400">Membership Ref</dt>
                            <dd className="font-mono font-bold text-navy">{candidateId}</dd>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <dt className="text-slate-400">Active Since</dt>
                            <dd className="font-semibold text-navy">{new Date(m.since).toLocaleDateString("en-GB")}</dd>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <dt className="text-slate-400">Renews On</dt>
                            <dd className="font-semibold text-navy">{new Date(m.renewsAt).toLocaleDateString("en-GB")}</dd>
                          </div>
                        </dl>

                        <div className="rounded-xl bg-gold/10 p-3 text-xs text-navy leading-relaxed">
                          ✨ <strong>Active Member Perk:</strong> 20% discount on conference passes and 10% on certified CPD courses is automatically deducted at checkout.
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Link href={`/checkout?type=membership&tier=${m.tierId}`} className="btn-navy text-xs py-2 px-4">
                            Renew Plan
                          </Link>
                          <button
                            onClick={onCancelMembership}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          You do not currently have an active membership. Upgrading unlocks 20% off all international conferences, preferential review, and certified CPD recognition.
                        </p>
                        <Link href="/membership" className="btn-gold inline-block text-xs py-2 px-4">
                          Explore Membership →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* DIGITAL CREDENTIAL CARD */}
                  <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Official Credential</p>
                    <h3 className="mt-2 font-display text-lg font-bold">Global Institute of Research &amp; Skills Development</h3>
                    <p className="text-xs text-slate-400 mt-0.5">London, United Kingdom · CPD Provider #788000</p>
                    
                    <div className="mt-6 rounded-xl bg-white/10 p-4 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Candidate / Scholar</p>
                      <p className="font-display text-base font-bold text-white">{user.name}</p>
                      <div className="mt-3 flex justify-between text-xs text-slate-300 font-mono">
                        <span>ID: {candidateId}</span>
                        <span>STATUS: {m ? "ACTIVE" : "VERIFIED"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: CAREERS & INTERNSHIPS (WITH 1-CLICK APPLY) */}
            {activeTab === "careers" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-navy">Open Roles &amp; Placements</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Apply directly using your attached profile Curriculum Vitae.</p>
                  </div>
                  {profile.cv && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      ✓ CV Ready: {profile.cv.fileName}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {openings.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold text-navy">{job.title}</h3>
                            {job.highlight && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                {job.highlight}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {job.department} · {job.type} · {job.location} · <span className="font-semibold text-navy">{job.salary}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleQuickJobApply(job)}
                          className="btn-navy text-xs py-2 px-5 shrink-0"
                        >
                          1-Click Apply
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-slate-600 leading-relaxed">{job.summary}</p>
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-navy">Package:</span> {job.package}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: AWARDS */}
            {activeTab === "awards" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">GIRSD Global Awards 2026</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Nominate exceptional researchers, faculty innovators, and emerging scholars.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-navy">Nomination Categories</h3>
                    <ul className="mt-4 space-y-3 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-gold font-bold">★</span>
                        <div><strong className="text-navy">Young Researcher Award:</strong> Open to early-career scholars and postgraduates demonstrating outstanding scientific output.</div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold font-bold">★</span>
                        <div><strong className="text-navy">Academic Excellence &amp; Leadership:</strong> Honoring senior faculty and department chairs with notable research mentorship.</div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold font-bold">★</span>
                        <div><strong className="text-navy">Women in Science &amp; Innovation:</strong> Recognizing pioneering contributions by female researchers worldwide.</div>
                      </li>
                    </ul>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Link href="/awards" className="btn-gold block text-center text-xs py-2">
                        Submit Official Nomination →
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-navy p-6 text-white shadow-xs">
                    <h3 className="font-display text-base font-bold text-gold">Awards Committee Contact</h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      Nominations are evaluated by the GIRSD International Honors Committee against academic merit, peer-reviewed contributions, and community impact.
                    </p>
                    <div className="mt-6 rounded-xl bg-white/10 p-4 text-xs">
                      <p className="font-semibold text-white">Direct Enquiries:</p>
                      <a href="mailto:awards@globalrsd.co.uk" className="text-gold-light underline mt-1 block">
                        awards@globalrsd.co.uk
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: CERTIFICATES & REWARDS */}
            {activeTab === "certificates" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">Certificates &amp; Verified Records</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Accredited CPD certificates and verified delegate registrations.</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Credentials</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">Verified</span>
                        <p className="font-bold text-xs text-navy mt-1">Certificate of Candidate Registration</p>
                        <p className="text-[11px] text-slate-400">Global Institute of Research &amp; Skills Development · CPD Provider #788000</p>
                      </div>
                      <Link
                        href={`/verify-certificate?id=${candidateId}`}
                        className="rounded-xl border border-navy px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white transition"
                      >
                        Verify Record
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: HELP & SUPPORT */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">Candidate Support Desk &amp; Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Contact the London Secretariat, connect via WhatsApp, or submit website feedback.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* WhatsApp Community */}
                  <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-6 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-950">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>
                        <h3 className="text-sm font-bold">Official WhatsApp Community</h3>
                      </div>
                      <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
                        Join 2,500+ global scholars, co-authors, and candidates. Real-time conference announcements, call-for-papers alerts, and rapid coordinator access.
                      </p>
                    </div>
                    <a
                      href={WHATSAPP_COMMUNITY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2.5 px-4 font-bold transition shadow-xs"
                    >
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.896.954 3.181 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.868-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.758-.242-1.743-.889-2.586-1.733-.844-.844-1.491-1.829-1.734-2.587-.138-.429-.106-.815-.06-1.127.049-.333.418-1.026.823-1.17.135-.045.27-.03.361.015.09.045.18.135.225.225.225.45.675 1.62.721 1.755.045.135.03.27-.045.361-.075.09-.135.15-.225.225-.09.09-.18.18-.09.36.18.361.54 1.036 1.171 1.576.63.54 1.261.765 1.576.855.18.045.27-.045.36-.135.09-.09.18-.225.27-.315.09-.09.225-.09.36-.045.135.045 1.305.63 1.53.765.225.135.27.225.27.315 0 .09-.045.54-.18.945zM12 2C6.477 2 2 6.477 2 12c0 1.82.487 3.53 1.338 5L2.05 22l5.165-1.355A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
                      <span>Join WhatsApp Community</span>
                    </a>
                  </div>

                  {/* Website Feedback Form Card */}
                  <div className="rounded-2xl border border-blue-200/90 bg-blue-50/60 p-6 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-navy">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy text-white text-xs font-bold">
                          ★
                        </span>
                        <h3 className="text-sm font-bold text-navy">Website Feedback Form</h3>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        Share your candidate experience, rate portal navigation, and recommend improvements directly to our QA team.
                      </p>
                    </div>
                    <Link
                      href="/feedback"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs py-2.5 px-4 font-bold transition shadow-xs"
                    >
                      <span>Submit Website Feedback →</span>
                    </Link>
                  </div>

                  {/* Direct Contact Phone & Address */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy">London Headquarters</h3>
                      <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                        <p><strong>Registry:</strong> 23 Kinnaird Avenue, Bromley BR1 4HG, England</p>
                        <p><strong>Hotline:</strong> <a href="tel:+447586261118" className="text-navy font-semibold hover:underline">+44 7586 261118</a></p>
                        <p><strong>Provider Code:</strong> CPD Provider #788000</p>
                      </div>
                    </div>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-navy text-xs py-2.5 px-4 font-semibold transition"
                    >
                      <span>View Full Directory →</span>
                    </Link>
                  </div>
                </div>

                {/* Complete Department Email Directory */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-navy mb-4">Official Department Email Matrix</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">General Secretariat &amp; Verification</p>
                      <a href="mailto:info@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">info@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: verify@, help@, support@, contact@</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">Research &amp; Conferences</p>
                      <a href="mailto:research@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">research@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: papers@, events@, conferences@</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">Membership &amp; Fellowship</p>
                      <a href="mailto:membership@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">membership@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: fellowship@, committee@</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">Awards &amp; Nominations</p>
                      <a href="mailto:awards@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">awards@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: nominations@globalrsd.co.uk</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">Careers &amp; Human Resources</p>
                      <a href="mailto:hr@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">hr@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: jobs@, cv@, careers@</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="font-bold text-navy">Finance, Accounts &amp; Refunds</p>
                      <a href="mailto:finance@globalrsd.co.uk" className="font-semibold text-navy hover:underline block mt-0.5">finance@globalrsd.co.uk</a>
                      <p className="text-[10px] text-slate-400 mt-1">Aliases: refunds@, accounts@, billing@</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fadeUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-navy">Edit Candidate Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-navy">✕</button>
            </div>

            <form onSubmit={handleProfileSaveModal} className="mt-4 space-y-4 text-xs">
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="relative h-14 w-14 shrink-0">
                  {editFormData.photoUrl ? (
                    <img
                      src={editFormData.photoUrl}
                      alt="Candidate photo"
                      className="h-14 w-14 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 font-display text-lg font-bold text-gold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy text-xs">Profile Photo</p>
                  <p className="text-[10px] text-slate-500">JPG, PNG, or WEBP (Max 5 MB)</p>
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-navy hover:bg-slate-50"
                    >
                      {editFormData.photoUrl ? "Change Photo" : "Upload Photo"}
                    </button>
                    {editFormData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({ ...editFormData, photoUrl: null });
                          handleRemovePhoto();
                        }}
                        className="rounded-md border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Academic Title / Headline</label>
                <input
                  type="text"
                  className="input mt-1 w-full text-xs"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  className="input mt-1 w-full text-xs"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Research Statement / Bio</label>
                <textarea
                  rows={4}
                  className="input mt-1 w-full text-xs leading-relaxed"
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-navy py-2 px-5">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI RESUME SUMMARY MODAL */}
      {showAiResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fadeUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-navy">Candidate Academic Summary</h3>
              <button onClick={() => setShowAiResumeModal(false)} className="text-slate-400 hover:text-navy">✕</button>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700 leading-relaxed border border-slate-200/80">
              <p className="font-bold text-navy">{user.name}</p>
              <p className="text-slate-500">{profile.title} | {profile.location}</p>
              <p className="mt-2"><strong>Disciplines:</strong> {profile.disciplines.join(", ")}</p>
              <p><strong>Methodologies:</strong> {profile.skills.join(", ")}</p>
              <p className="mt-2"><strong>CV Status:</strong> {profile.cv ? `Verified (${profile.cv.fileName})` : "Pending upload"}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${user.name}\n${profile.title}\nDisciplines: ${profile.disciplines.join(", ")}\nSkills: ${profile.skills.join(", ")}`);
                  showToast("Summary copied to clipboard!");
                  setShowAiResumeModal(false);
                }}
                className="btn-navy text-xs py-2 px-4"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT ABSTRACT MODAL */}
      {abstractModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fadeUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display text-base font-bold text-navy">Submit Paper Abstract</h3>
                <p className="text-xs text-slate-500">{abstractModalEvent.title}</p>
              </div>
              <button onClick={() => setAbstractModalEvent(null)} className="text-slate-400 hover:text-navy">✕</button>
            </div>

            <form onSubmit={handleAbstractSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Paper / Presentation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advancements in Machine Learning for Healthcare..."
                  className="input mt-1 w-full text-xs"
                  value={abstractForm.title}
                  onChange={(e) => setAbstractForm({ ...abstractForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Conference Track</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Applied Sciences..."
                  className="input mt-1 w-full text-xs"
                  value={abstractForm.track}
                  onChange={(e) => setAbstractForm({ ...abstractForm, track: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Abstract (Max 300 words)</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste research abstract text..."
                  className="input mt-1 w-full text-xs leading-relaxed"
                  value={abstractForm.abstractText}
                  onChange={(e) => setAbstractForm({ ...abstractForm, abstractText: e.target.value })}
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-slate-500 border border-slate-100">
                Author: <strong>{user.name}</strong> ({user.email}) · Your candidate profile and CV will be linked to this submission.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAbstractModalEvent(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-navy py-2 px-5">
                  Submit Abstract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK JOB APPLY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fadeUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display text-base font-bold text-navy">Apply for Position</h3>
                <p className="text-xs text-slate-500">{selectedJob.title}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-navy">✕</button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="font-bold text-navy">Candidate Details:</p>
                <p className="mt-1 text-slate-600">Name: {user.name}</p>
                <p className="text-slate-600">Email: {user.email}</p>
                <p className="text-slate-600">Location: {profile.location}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Attached Curriculum Vitae:</p>
                {profile.cv ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-800">
                    <span>📄</span>
                    <span className="font-bold truncate">{profile.cv.fileName}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-rose-600">
                    No CV attached! Please upload your CV in the profile tab.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickJobApply(selectedJob)}
                  className="btn-navy py-2 px-5"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
