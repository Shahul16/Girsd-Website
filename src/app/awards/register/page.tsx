"use client";

import { useState, useEffect, Suspense, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { awards } from "@/lib/data/awards";
import { AWARDS_REGISTRATION_FEE_GBP } from "@/lib/awards";

const allCategories = awards.map((a) => a.name);

interface GuestItem {
  name: string;
  relationship: string;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refParam = searchParams.get("ref") || "";

  // Verification state
  const [nominationRef, setNominationRef] = useState(refParam);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Section A: Official Awardee & Engraving Details
  const [awardCategory, setAwardCategory] = useState("");
  const [fullNameEngraving, setFullNameEngraving] = useState("");
  const [designation, setDesignation] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phoneWhatsApp, setPhoneWhatsApp] = useState("");

  // Section B: Media & Profile Assets
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>("");
  const [headshotUrl, setHeadshotUrl] = useState<string>("");
  const [headshotUploading, setHeadshotUploading] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteOrcidUrl, setWebsiteOrcidUrl] = useState("");
  const [namePronunciation, setNamePronunciation] = useState("");

  // Section C: Attendance & Courier Logistics
  const [attendanceMode, setAttendanceMode] = useState<"in_person" | "virtual" | "proxy">("in_person");
  const [proxyName, setProxyName] = useState("");
  const [proxyRelationship, setProxyRelationship] = useState("");
  const [proxyEmail, setProxyEmail] = useState("");
  const [proxyPhone, setProxyPhone] = useState("");

  const [accompanyingCount, setAccompanyingCount] = useState<number>(0);
  const [guests, setGuests] = useState<GuestItem[]>([]);

  const [courierStreet, setCourierStreet] = useState("");
  const [courierCity, setCourierCity] = useState("");
  const [courierState, setCourierState] = useState("");
  const [courierPostal, setCourierPostal] = useState("");
  const [courierCountry, setCourierCountry] = useState("");
  const [courierPhone, setCourierPhone] = useState("");

  // Section D: Billing & Policies
  const [billingEntityType, setBillingEntityType] = useState<"individual" | "organization">("individual");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [vatTaxNumber, setVatTaxNumber] = useState("");

  const [mediaConsent, setMediaConsent] = useState(false);
  const [noRefundConsent, setNoRefundConsent] = useState(false);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Automatic verification when ref is provided in query
  useEffect(() => {
    if (refParam) {
      setNominationRef(refParam);
      verifyReferenceCode(refParam);
    }
  }, [refParam]);

  // Adjust guest inputs dynamically
  useEffect(() => {
    setGuests((prev) => {
      const next = [...prev];
      if (accompanyingCount > next.length) {
        for (let i = next.length; i < accompanyingCount; i++) {
          next.push({ name: "", relationship: "" });
        }
      } else if (accompanyingCount < next.length) {
        return next.slice(0, accompanyingCount);
      }
      return next;
    });
  }, [accompanyingCount]);

  async function verifyReferenceCode(codeToVerify: string) {
    if (!codeToVerify.trim()) return;
    setVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch(`/api/awards/verify-nomination?ref=${encodeURIComponent(codeToVerify.trim())}`);
      const data = await res.json();

      if (res.ok && data.ok && data.nomination) {
        setIsVerified(true);
        if (data.nomination.nomination_ref) {
          setNominationRef(data.nomination.nomination_ref);
        }
        if (data.nomination.category) {
          setAwardCategory(data.nomination.category);
        }
        if (data.nomination.nominee_name && !fullNameEngraving) {
          setFullNameEngraving(data.nomination.nominee_name);
        }
        if (data.nomination.nominee_email && !email) {
          setEmail(data.nomination.nominee_email);
        }
        if (data.nomination.affiliation && !organization) {
          setOrganization(data.nomination.affiliation);
        }
        if (data.nomination.country && !country) {
          setCountry(data.nomination.country);
        }
      } else {
        setIsVerified(false);
        setVerifyError(data.error || "Nomination reference code not found. You may still complete the form with a valid reference.");
      }
    } catch {
      setIsVerified(false);
      setVerifyError("Could not connect to nomination verification service. Manual entry enabled.");
    } finally {
      setVerifying(false);
    }
  }

  // Handle headshot file change & auto upload
  async function handleHeadshotChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Headshot file exceeds 5 MB limit. Please select a smaller JPG or PNG image.");
      return;
    }

    setHeadshotFile(file);
    setHeadshotPreview(URL.createObjectURL(file));
    setHeadshotUploading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "headshot");

      const res = await fetch("/api/awards/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setHeadshotUrl(data.url);
      } else {
        setFormError(data.error || "Failed to upload headshot. Please try again.");
      }
    } catch {
      setFormError("Network error during headshot upload.");
    } finally {
      setHeadshotUploading(false);
    }
  }

  // Handle logo file change & auto upload
  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Logo file exceeds 5 MB limit.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "logo");

      const res = await fetch("/api/awards/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
      }
    } catch {
      console.warn("Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  function handleGuestChange(index: number, field: "name" | "relationship", val: string) {
    setGuests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!nominationRef.trim()) {
      setFormError("Please enter your Nomination Reference ID.");
      return;
    }
    if (!awardCategory) {
      setFormError("Please select or confirm your Award Category.");
      return;
    }
    if (!fullNameEngraving.trim()) {
      setFormError("Please enter your Full Name as it should appear on your trophy.");
      return;
    }
    if (!designation.trim() || !organization.trim()) {
      setFormError("Please enter your Job Title / Designation and Organization.");
      return;
    }
    if (!country.trim() || !city.trim()) {
      setFormError("Please specify your Country and City of Residence.");
      return;
    }
    if (!email.trim() || !phoneWhatsApp.trim()) {
      setFormError("Please provide your Primary Email and WhatsApp / Mobile Number.");
      return;
    }

    // Media
    if (!headshotUrl && !headshotFile) {
      setFormError("Please upload a high-resolution professional headshot for the ceremony backdrop and press features.");
      return;
    }

    // Attendance mode checks
    if (attendanceMode === "proxy") {
      if (!proxyName.trim() || !proxyRelationship.trim() || !proxyEmail.trim() || !proxyPhone.trim()) {
        setFormError("Please complete all representative / proxy details in Section C.");
        return;
      }
    }

    if (attendanceMode === "virtual") {
      if (!courierStreet.trim() || !courierCity.trim() || !courierPostal.trim() || !courierCountry.trim() || !courierPhone.trim()) {
        setFormError("Please provide complete physical courier shipping address details for international trophy delivery.");
        return;
      }
    }

    // Guests check
    if (accompanyingCount > 0) {
      for (let i = 0; i < guests.length; i++) {
        if (!guests[i].name.trim() || !guests[i].relationship.trim()) {
          setFormError(`Please enter the full name and relationship for Guest #${i + 1}.`);
          return;
        }
      }
    }

    // Billing
    if (!billingName.trim() || !billingAddress.trim()) {
      setFormError("Please complete billing name and address in Section D.");
      return;
    }

    // Consents
    if (!mediaConsent || !noRefundConsent) {
      setFormError("You must accept both mandatory policy checkboxes (Media & Publicity Consent and No-Refund Policy) to complete registration.");
      return;
    }

    setSubmitting(true);

    try {
      // Ensure headshot is uploaded if user picked a file but upload hadn't finished
      let activeHeadshotUrl = headshotUrl;
      if (!activeHeadshotUrl && headshotFile) {
        const formData = new FormData();
        formData.set("file", headshotFile);
        formData.set("kind", "headshot");
        const uploadRes = await fetch("/api/awards/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          activeHeadshotUrl = uploadData.url;
        } else {
          throw new Error(uploadData.error || "Failed to upload headshot photo.");
        }
      }

      let activeLogoUrl = logoUrl;
      if (!activeLogoUrl && logoFile) {
        const formData = new FormData();
        formData.set("file", logoFile);
        formData.set("kind", "logo");
        const uploadRes = await fetch("/api/awards/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          activeLogoUrl = uploadData.url;
        }
      }

      const payload = {
        nomination_ref: nominationRef.trim(),
        award_category: awardCategory.trim(),
        full_name_engraving: fullNameEngraving.trim(),
        designation: designation.trim(),
        organization: organization.trim(),
        department: department.trim() || null,
        country: country.trim(),
        city: city.trim(),
        email: email.trim().toLowerCase(),
        phone_whatsapp: phoneWhatsApp.trim(),
        headshot_url: activeHeadshotUrl,
        logo_url: activeLogoUrl || null,
        linkedin_url: linkedinUrl.trim() || null,
        website_orcid_url: websiteOrcidUrl.trim() || null,
        name_pronunciation: namePronunciation.trim() || null,
        attendance_mode: attendanceMode,
        proxy_name: attendanceMode === "proxy" ? proxyName.trim() : null,
        proxy_relationship: attendanceMode === "proxy" ? proxyRelationship.trim() : null,
        proxy_email: attendanceMode === "proxy" ? proxyEmail.trim() : null,
        proxy_phone: attendanceMode === "proxy" ? proxyPhone.trim() : null,
        accompanying_guests_count: accompanyingCount,
        guests_details: accompanyingCount > 0 ? guests : [],
        shipping_address:
          attendanceMode === "virtual" || courierStreet.trim()
            ? {
                street: courierStreet.trim(),
                city: courierCity.trim(),
                state: courierState.trim(),
                postalCode: courierPostal.trim(),
                country: courierCountry.trim(),
                deliveryPhone: courierPhone.trim() || phoneWhatsApp.trim(),
              }
            : null,
        billing_entity_type: billingEntityType,
        billing_name: billingName.trim(),
        billing_address: billingAddress.trim(),
        vat_tax_number: vatTaxNumber.trim() || null,
        media_consent: true,
        no_refund_consent: true,
      };

      const checkoutRes = await fetch("/api/awards/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || "Could not initialize Stripe checkout.");
      }

      // Redirect immediately to Stripe Checkout URL
      window.location.href = checkoutData.url;
    } catch (err: any) {
      console.error("Submission failed:", err);
      setFormError(err.message || "An error occurred during submission. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {formError && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Please correct the following:</p>
              <p className="mt-1">{formError}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION A: NOMINATION REFERENCE & OFFICIAL DETAILS
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold">Section A</span>
            <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">
              Nomination Reference &amp; Official Award Details
            </h2>
          </div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Selection Dossier
            </span>
          ) : (
            <span className="text-xs text-slate-500">All fields required unless marked optional</span>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {/* Reference ID & Verify Button */}
          <div>
            <label htmlFor="nomination-ref" className="block text-sm font-semibold text-navy">
              Nomination Reference ID <span className="text-gold">*</span>
            </label>
            <div className="mt-1.5 flex gap-3">
              <input
                type="text"
                id="nomination-ref"
                required
                value={nominationRef}
                readOnly={isVerified}
                onChange={(e) => setNominationRef(e.target.value.toUpperCase())}
                placeholder="e.g. GIRSD-AWD-2026-XXXX"
                className={`input font-mono font-bold tracking-wider ${isVerified ? "bg-slate-100 text-slate-700 cursor-not-allowed" : ""}`}
              />
              {!isVerified && (
                <button
                  type="button"
                  onClick={() => verifyReferenceCode(nominationRef)}
                  disabled={verifying || !nominationRef.trim()}
                  className="btn-gold whitespace-nowrap text-xs px-4"
                >
                  {verifying ? "Checking..." : "Verify Code"}
                </button>
              )}
            </div>
            {verifyError && <p className="mt-1.5 text-xs text-amber-700">{verifyError}</p>}
            <p className="mt-1 text-xs text-muted">
              Unique reference code provided in your nomination receipt or official selection invitation email.
            </p>
          </div>

          {/* Award Category */}
          <div>
            <label htmlFor="award-category" className="block text-sm font-semibold text-navy">
              Award Category <span className="text-gold">*</span>
            </label>
            {isVerified && awardCategory ? (
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-navy">
                <span>{awardCategory}</span>
                <span className="text-xs text-slate-400 font-normal">Locked from approved dossier</span>
              </div>
            ) : (
              <select
                id="award-category"
                required
                value={awardCategory}
                onChange={(e) => setAwardCategory(e.target.value)}
                className="input mt-1.5"
              >
                <option value="">Select Award Category...</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Full Name for Engraving */}
          <div>
            <label htmlFor="full-name-engraving" className="block text-sm font-semibold text-navy">
              Full Name (Exact Spelling for Certificate &amp; Trophy Engraving) <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              id="full-name-engraving"
              required
              value={fullNameEngraving}
              onChange={(e) => setFullNameEngraving(e.target.value)}
              placeholder="e.g. Dr. Arthur Pendelton, PhD, FHEA"
              className="input mt-1.5 font-medium"
            />
            <p className="mt-1.5 text-xs text-slate-500 italic">
              Include academic/professional titles such as Dr., Prof., Eng. exactly as they should appear on your trophy and certificate.
            </p>
          </div>

          {/* Designation & Organization */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="designation" className="block text-sm font-semibold text-navy">
                Designation / Job Title <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                id="designation"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Dean of Engineering / Associate Professor"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="organization" className="block text-sm font-semibold text-navy">
                Organization / Institution / University <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                id="organization"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. University of Manchester"
                className="input mt-1.5"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-navy">
              Department / Faculty <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Department of Computer Science & Artificial Intelligence"
              className="input mt-1.5"
            />
          </div>

          {/* Country & City */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-navy">
                City of Residence <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. London"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-navy">
                Country of Residence <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                id="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="input mt-1.5"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="primary-email" className="block text-sm font-semibold text-navy">
                Primary Email Address <span className="text-gold">*</span>
              </label>
              <input
                type="email"
                id="primary-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. a.pendelton@university.ac.uk"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="phone-whatsapp" className="block text-sm font-semibold text-navy">
                WhatsApp / Mobile Number (with Country Code) <span className="text-gold">*</span>
              </label>
              <input
                type="tel"
                id="phone-whatsapp"
                required
                value={phoneWhatsApp}
                onChange={(e) => setPhoneWhatsApp(e.target.value)}
                placeholder="e.g. +44 7911 123456"
                className="input mt-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION B: MEDIA & DIGITAL PROFILE ASSETS
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">Section B</span>
          <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">
            Media &amp; Digital Profile Assets
          </h2>
          <p className="mt-1 text-sm text-muted">
            Used for official awardee banners, stage announcement backdrops, and the GlobalRSD Hall of Fame.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* Headshot Upload */}
          <div>
            <label className="block text-sm font-semibold text-navy">
              High-Resolution Professional Headshot <span className="text-gold">*</span>
            </label>
            <p className="text-xs text-muted mt-0.5">
              JPG or PNG format, minimum 1000x1000px, max 5MB.
            </p>
            <div className="mt-2 flex items-center gap-5">
              {headshotPreview ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-sm">
                  <img src={headshotPreview} alt="Headshot preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  id="headshot"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleHeadshotChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-gold hover:file:opacity-90 text-xs text-slate-500 cursor-pointer"
                />
                {headshotUploading && <p className="mt-1 text-xs text-gold font-semibold">Uploading to secure media vault...</p>}
                {headshotUrl && !headshotUploading && (
                  <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    ✓ Headshot successfully uploaded and ready
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logo Upload (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-navy">
              Organization / Institution Logo <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-muted mt-0.5">
              PNG, SVG, or JPG format, transparent background preferred, max 5MB.
            </p>
            <div className="mt-2 flex items-center gap-5">
              {logoPreview ? (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded border border-slate-200 bg-white p-1">
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <div className="flex-1">
                <input
                  type="file"
                  id="logo"
                  accept="image/png,image/svg+xml,image/jpeg"
                  onChange={handleLogoChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-navy hover:file:bg-slate-200 text-xs text-slate-500 cursor-pointer"
                />
                {logoUploading && <p className="mt-1 text-xs text-slate-500">Uploading logo...</p>}
              </div>
            </div>
          </div>

          {/* Links & Pronunciation */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="linkedin-url" className="block text-sm font-semibold text-navy">
                LinkedIn Profile URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                id="linkedin-url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="website-url" className="block text-sm font-semibold text-navy">
                Website / ORCID / Google Scholar URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                id="website-url"
                value={websiteOrcidUrl}
                onChange={(e) => setWebsiteOrcidUrl(e.target.value)}
                placeholder="https://orcid.org/0000-..."
                className="input mt-1.5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pronunciation" className="block text-sm font-semibold text-navy">
              Name Pronunciation Guide <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="pronunciation"
              value={namePronunciation}
              onChange={(e) => setNamePronunciation(e.target.value)}
              placeholder="e.g. AR-thur PEN-del-ton (for accurate stage announcement)"
              className="input mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION C: ATTENDANCE MODE & SHIPPING / COURIER DETAILS
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">Section C</span>
          <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">
            Attendance Mode &amp; Shipping / Courier Details
          </h2>
        </div>

        <div className="mt-6 space-y-6">
          {/* Attendance Mode Radio Group */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">
              Attendance Mode <span className="text-gold">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  id: "in_person",
                  label: "In-Person Attendance",
                  desc: "Awards Ceremony & Gala Presentation",
                },
                {
                  id: "virtual",
                  label: "Virtual Attendance",
                  desc: "Live Stream + International Courier of Trophy & Certificate",
                },
                {
                  id: "proxy",
                  label: "Proxy / Representative",
                  desc: "Colleague Attending on Your Behalf",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all ${
                    attendanceMode === opt.id
                      ? "border-gold bg-amber-50/40 ring-2 ring-gold/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="attendance_mode"
                      value={opt.id}
                      checked={attendanceMode === opt.id}
                      onChange={() => setAttendanceMode(opt.id as any)}
                      className="text-gold focus:ring-gold"
                    />
                    <span className="text-sm font-bold text-navy">{opt.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional: Proxy Details */}
          {attendanceMode === "proxy" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-navy flex items-center gap-2">
                <span className="text-gold">★</span> Proxy / Representative Details
              </h3>
              <p className="text-xs text-muted">
                Your representative will receive ceremony admittance credentials and may collect your physical trophy on stage.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="proxy-name" className="block text-xs font-semibold text-navy">
                    Representative Full Name <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="proxy-name"
                    required={attendanceMode === "proxy"}
                    value={proxyName}
                    onChange={(e) => setProxyName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="input mt-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="proxy-rel" className="block text-xs font-semibold text-navy">
                    Relationship / Title <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="proxy-rel"
                    required={attendanceMode === "proxy"}
                    value={proxyRelationship}
                    onChange={(e) => setProxyRelationship(e.target.value)}
                    placeholder="e.g. Co-Author / Department Vice Chair"
                    className="input mt-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="proxy-email" className="block text-xs font-semibold text-navy">
                    Representative Email <span className="text-gold">*</span>
                  </label>
                  <input
                    type="email"
                    id="proxy-email"
                    required={attendanceMode === "proxy"}
                    value={proxyEmail}
                    onChange={(e) => setProxyEmail(e.target.value)}
                    placeholder="representative@institution.ac.uk"
                    className="input mt-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="proxy-phone" className="block text-xs font-semibold text-navy">
                    Representative Phone Number <span className="text-gold">*</span>
                  </label>
                  <input
                    type="tel"
                    id="proxy-phone"
                    required={attendanceMode === "proxy"}
                    value={proxyPhone}
                    onChange={(e) => setProxyPhone(e.target.value)}
                    placeholder="+44 7911 000000"
                    className="input mt-1 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Accompanying Guests */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="guests-count" className="block text-sm font-semibold text-navy">
                Accompanying Guests (Ceremony &amp; Banquet)
              </label>
              <select
                id="guests-count"
                value={accompanyingCount}
                onChange={(e) => setAccompanyingCount(Number(e.target.value))}
                className="input py-1 text-xs w-28 text-center"
              >
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num === 0 ? "0 guests" : `${num} ${num === 1 ? "guest" : "guests"}`}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-muted">
              Select if family members or colleagues will accompany you to the ceremony.
            </p>

            {accompanyingCount > 0 && (
              <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-navy uppercase tracking-wider">
                  Guest Identification Details ({accompanyingCount})
                </p>
                {guests.map((g, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-200 first:border-0 first:pt-0">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Guest #{idx + 1} Full Name <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={g.name}
                        onChange={(e) => handleGuestChange(idx, "name", e.target.value)}
                        placeholder="Full Legal Name"
                        className="input mt-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Relationship to Awardee <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={g.relationship}
                        onChange={(e) => handleGuestChange(idx, "relationship", e.target.value)}
                        placeholder="e.g. Spouse / Research Partner"
                        className="input mt-1 text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical Courier Shipping Address */}
          <div>
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-sm font-semibold text-navy">
                Physical Shipping / Courier Address
                {attendanceMode === "virtual" ? (
                  <span className="text-gold ml-1">* (Mandatory for International Courier Delivery)</span>
                ) : (
                  <span className="text-slate-400 font-normal ml-1">(Optional for in-person attendees)</span>
                )}
              </label>
              <p className="text-xs text-muted mt-0.5">
                Ensure exact street address where heavy parcel delivery can be signed for.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="courier-street" className="block text-xs font-medium text-slate-700">
                  Street Address &amp; Suite / Office Number {attendanceMode === "virtual" && <span className="text-gold">*</span>}
                </label>
                <input
                  type="text"
                  id="courier-street"
                  required={attendanceMode === "virtual"}
                  value={courierStreet}
                  onChange={(e) => setCourierStreet(e.target.value)}
                  placeholder="e.g. 100 University Avenue, Faculty of Science, Room 402"
                  className="input mt-1 text-sm"
                />
              </div>
              <div>
                <label htmlFor="courier-city" className="block text-xs font-medium text-slate-700">
                  City {attendanceMode === "virtual" && <span className="text-gold">*</span>}
                </label>
                <input
                  type="text"
                  id="courier-city"
                  required={attendanceMode === "virtual"}
                  value={courierCity}
                  onChange={(e) => setCourierCity(e.target.value)}
                  placeholder="e.g. Manchester"
                  className="input mt-1 text-sm"
                />
              </div>
              <div>
                <label htmlFor="courier-state" className="block text-xs font-medium text-slate-700">
                  State / Province / County
                </label>
                <input
                  type="text"
                  id="courier-state"
                  value={courierState}
                  onChange={(e) => setCourierState(e.target.value)}
                  placeholder="e.g. Greater Manchester"
                  className="input mt-1 text-sm"
                />
              </div>
              <div>
                <label htmlFor="courier-postal" className="block text-xs font-medium text-slate-700">
                  Postal / ZIP Code {attendanceMode === "virtual" && <span className="text-gold">*</span>}
                </label>
                <input
                  type="text"
                  id="courier-postal"
                  required={attendanceMode === "virtual"}
                  value={courierPostal}
                  onChange={(e) => setCourierPostal(e.target.value)}
                  placeholder="e.g. M13 9PL"
                  className="input mt-1 text-sm"
                />
              </div>
              <div>
                <label htmlFor="courier-country" className="block text-xs font-medium text-slate-700">
                  Country {attendanceMode === "virtual" && <span className="text-gold">*</span>}
                </label>
                <input
                  type="text"
                  id="courier-country"
                  required={attendanceMode === "virtual"}
                  value={courierCountry}
                  onChange={(e) => setCourierCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="input mt-1 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="courier-phone" className="block text-xs font-medium text-slate-700">
                  Local Delivery Contact Phone {attendanceMode === "virtual" && <span className="text-gold">*</span>}
                </label>
                <input
                  type="tel"
                  id="courier-phone"
                  required={attendanceMode === "virtual"}
                  value={courierPhone}
                  onChange={(e) => setCourierPhone(e.target.value)}
                  placeholder="Local mobile number for courier SMS delivery notification"
                  className="input mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION D: PACKAGE SUMMARY, BILLING & MANDATORY POLICIES
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="card p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">Section D</span>
          <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">
            Package Summary, Billing &amp; Mandatory Policies
          </h2>
        </div>

        <div className="mt-6 space-y-6">
          {/* Registration Fee Display Box */}
          <div className="rounded-xl border-2 border-gold/40 bg-navy p-6 text-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold">Official Docket Fee</span>
                <h3 className="font-display text-2xl font-bold text-white">Award Registration Fee</h3>
                <p className="mt-1 text-xs text-slate-300">
                  Fixed fee covering master laser-engraving, crystal plaque production, and credentials.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium">Total Payable</span>
                <span className="font-display text-3xl font-extrabold text-gold sm:text-4xl">£{AWARDS_REGISTRATION_FEE_GBP}.00 GBP</span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-700 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Inclusive Comprehensive Package:</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Heavyweight laser-engraved crystal / brass trophy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Gold-embossed parchment certificate &amp; digital credential
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Ceremony stage presentation / live stream recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Official GlobalRSD press feature &amp; Hall of Fame entry
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> International priority courier packaging &amp; dispatch
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> CPD-Accredited Provider #788000 institutional endorsement
                </li>
              </ul>
            </div>
          </div>

          {/* Billing Details */}
          <div className="rounded-lg border border-slate-200 p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-navy">
              Billing Information (for Official VAT / Tax Receipt)
            </h3>

            {/* Entity Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Billing Entity Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-navy">
                  <input
                    type="radio"
                    name="billing_entity"
                    value="individual"
                    checked={billingEntityType === "individual"}
                    onChange={() => setBillingEntityType("individual")}
                    className="text-gold focus:ring-gold"
                  />
                  Individual Awardee
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-navy">
                  <input
                    type="radio"
                    name="billing_entity"
                    value="organization"
                    checked={billingEntityType === "organization"}
                    onChange={() => setBillingEntityType("organization")}
                    className="text-gold focus:ring-gold"
                  />
                  Organization / University / Sponsor
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="billing-name" className="block text-xs font-semibold text-slate-700">
                  Billing Name (Recipient or Organization) <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  id="billing-name"
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder={billingEntityType === "organization" ? "University or Department Name" : "Your Legal Name"}
                  className="input mt-1 text-sm"
                />
              </div>

              {billingEntityType === "organization" && (
                <div>
                  <label htmlFor="vat-number" className="block text-xs font-semibold text-slate-700">
                    VAT / Tax Registration Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="vat-number"
                    value={vatTaxNumber}
                    onChange={(e) => setVatTaxNumber(e.target.value)}
                    placeholder="e.g. GB 123 4567 89 / Tax ID"
                    className="input mt-1 text-sm"
                  />
                </div>
              )}

              <div className={billingEntityType === "organization" ? "sm:col-span-2" : "sm:col-span-1"}>
                <label htmlFor="billing-address" className="block text-xs font-semibold text-slate-700">
                  Billing Address <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  id="billing-address"
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Street, City, Postal Code, Country"
                  className="input mt-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Checkboxes */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-navy uppercase tracking-wider">
              Mandatory Policies &amp; Authorisation
            </h3>

            {/* Checkbox 1: Media Consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={mediaConsent}
                onChange={(e) => setMediaConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Media &amp; Publicity Consent:</strong> I authorize Global Institute of Research and Skills Development (GIRSD) to publish my name, photograph, award category, and event media on www.globalrsd.co.uk and official press/social channels.
              </span>
            </label>

            {/* Checkbox 2: No-Refund Policy */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={noRefundConsent}
                onChange={(e) => setNoRefundConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>No-Refund &amp; Engraving Finality Policy:</strong> I acknowledge and agree that the £255 GBP Award Registration Fee is strictly non-refundable once paid, and that my submitted name and title cannot be altered after trophy engraving production begins.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || !mediaConsent || !noRefundConsent}
              className="btn-gold w-full py-4 text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-navy" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing Secured Stripe Checkout (£255 GBP)...
                </span>
              ) : (
                `Complete Registration & Pay £${AWARDS_REGISTRATION_FEE_GBP}.00 GBP →`
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Encrypted 256-bit SSL Checkout via Stripe · UK Registered Provider #788000
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function AwardRegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="GIRSD Global Awards 2026"
        title="Final Award Registration & Trophy Confirmation"
        intro="Please confirm your exact trophy engraving details, media assets, attendance arrangements, and finalize your registration fee (£255 GBP)."
      />

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <Suspense
              fallback={
                <div className="card p-12 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-gold"></div>
                  <p className="mt-4 text-sm font-medium">Loading registration dossier...</p>
                </div>
              }
            >
              <RegisterForm />
            </Suspense>
          </Reveal>
        </div>
      </section>
    </>
  );
}

