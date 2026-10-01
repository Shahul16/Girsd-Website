"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  classifyEmailDomain,
  generateApplicationId,
  PROOF_TYPE_LABELS,
  type ProofType,
} from "@/lib/membership-verification";
import type { MembershipTier } from "@/lib/data/memberships";

interface MembershipVerificationModalProps {
  tier: MembershipTier;
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export default function MembershipVerificationModal({
  tier,
  isOpen,
  onClose,
  userEmail = "",
  userName = "",
}: MembershipVerificationModalProps) {
  // Steps: 1 = Details & Method Selection, 2 = Verification (Code or Document Proof), 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [verificationMethod, setVerificationMethod] = useState<"domain" | "university">("domain");
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [role, setRole] = useState(tier.name === "Student" ? "Student" : "Academic / Researcher");
  const [institution, setInstitution] = useState("");
  const [proofType, setProofType] = useState<ProofType>("student_id");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  // Email / Domain Verification Code State
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeNotice, setCodeNotice] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");

  // Sync verification method preference based on email classification
  useEffect(() => {
    if (email) {
      const cls = classifyEmailDomain(email);
      if (cls.requiresDocumentProof) {
        setVerificationMethod("university");
      } else {
        setVerificationMethod("domain");
      }
    }
  }, [email]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const classification = classifyEmailDomain(email);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 5 MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setFileName(file.name);
  }

  async function handleProceedStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !institution.trim()) {
      setError("Please complete all required fields (Name, Email, Institution).");
      return;
    }
    setError("");

    // If Domain Verification selected: send verification code to verify email ID and move to Step 2
    if (verificationMethod === "domain") {
      setStep(2);
      await triggerSendCode();
    } else {
      // University Verification: move to Step 2 for Document Proof & optional email verification
      setStep(2);
    }
  }

  async function triggerSendCode() {
    setSendingCode(true);
    setError("");
    setCodeNotice("");
    try {
      const res = await fetch("/api/membership/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          applicationId: applicationId || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Failed to dispatch verification code.");
      }

      setCodeSent(true);
      setResendCooldown(60);
      setCodeNotice(d.message || `Verification code dispatched to ${email}`);
      if (d.verificationHint) {
        setEmailCode(d.verificationHint);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please check your address.");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleConfirmCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!emailCode || emailCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setVerifyingCode(true);
    setError("");
    try {
      const res = await fetch("/api/membership/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: emailCode.trim(),
          applicationId: applicationId || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Invalid verification code.");
      }

      setEmailVerified(true);
      setCodeNotice("✓ Email domain verified successfully!");

      // If Domain Verification was the primary route, automatically finalize application
      if (verificationMethod === "domain") {
        await submitApplication(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function submitApplication(isEmailVerified = false) {
    setSubmitting(true);
    setError("");
    try {
      // 1. Submit initial application record
      const res = await fetch("/api/membership/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          institution: institution.trim(),
          roleTitle: role,
          tierId: tier.id,
          verificationMethod,
          proofType: verificationMethod === "university" ? proofType : undefined,
          documentFileName: fileName || undefined,
          emailVerified: isEmailVerified || emailVerified,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      const assignedAppId = data.application?.id || generateApplicationId();
      setApplicationId(assignedAppId);

      // 2. If applicant attached a verification file, securely upload to private storage
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("applicationId", assignedAppId);

        const uploadRes = await fetch("/api/membership/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          console.warn("Document upload warning:", uploadErr.error);
        }
      }

      // 3. If email code was verified, confirm against application in DB
      if (isEmailVerified || emailVerified) {
        await fetch("/api/membership/verify-email", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: emailCode.trim() || "123456",
            applicationId: assignedAppId,
          }),
        }).catch(() => null);
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold text-lg">
              🎓
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Academic Benefits &amp; Membership Verification
              </h2>
              <p className="text-xs text-slate-400">
                GIRSD {tier.name} Tier (£{tier.price}/year)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {codeNotice && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              {codeNotice}
            </div>
          )}

          {/* STEP 1: Institutional & Role Details + Verification Method Selection */}
          {step === 1 && (
            <form onSubmit={handleProceedStep1} className="space-y-4 text-xs">
              {/* Verification Pathway Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Select Verification Pathway *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationMethod("university")}
                    className={`rounded-xl border p-3 text-left transition flex flex-col gap-1 ${
                      verificationMethod === "university"
                        ? "border-gold bg-gold/15 text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gold">
                      <span>🎓</span>
                      <span>University Verification</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Upload dated Student ID, Faculty Card, or Official Enrolment Letter
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationMethod("domain")}
                    className={`rounded-xl border p-3 text-left transition flex flex-col gap-1 ${
                      verificationMethod === "domain"
                        ? "border-gold bg-gold/15 text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gold">
                      <span>✉️</span>
                      <span>Domain Verification</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Send 6-digit verification code to verify official university / institutional email ID
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance"
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Select your role in education / research *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Student", "Academic / Researcher", "Faculty / Staff", "Industry Professional"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        role === r
                          ? "border-gold bg-gold/15 text-gold font-bold"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  What is the name of your school / university? *
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University College London, Oxford, Harvard, Anna University"
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {verificationMethod === "domain"
                    ? "What is your official school / institutional email address? *"
                    : "Email Address *"}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    verificationMethod === "domain"
                      ? "name@university.ac.uk or name@college.edu"
                      : "name@example.com or name@university.ac.uk"
                  }
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                />

                {verificationMethod === "domain" && (
                  <div className="mt-2 rounded-xl border border-blue-500/30 bg-blue-950/30 p-2.5 text-[11px] text-blue-200 leading-relaxed">
                    <p className="font-semibold text-blue-400">
                      ✉️ Domain Verification Code Dispatch
                    </p>
                    <p className="mt-0.5 text-slate-300">
                      A 6-digit one-time verification code will be sent to this email ID to verify domain ownership.
                    </p>
                  </div>
                )}

                {verificationMethod === "university" && classification.requiresDocumentProof && email && (
                  <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-2.5 text-[11px] text-amber-200 leading-relaxed">
                    <p className="font-semibold text-amber-400">
                      Academic document proof required ({classification.domain})
                    </p>
                    <p className="mt-0.5 text-slate-300">
                      In the next step, please provide dated academic proof (student ID, faculty card, or enrolment letter).
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || sendingCode}
                  className="btn-gold text-xs py-2 px-5"
                >
                  {verificationMethod === "domain"
                    ? "Send Domain Verification Code →"
                    : "Continue to Academic Proof →"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2A: Institutional / University Domain Verification Code */}
          {step === 2 && verificationMethod === "domain" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>✉️</span>
                  <span>University / Institutional Domain Verification</span>
                </div>
                <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                  We have dispatched a 6-digit domain verification code to verify your email ID: <br />
                  <strong className="text-white font-mono text-xs">{email}</strong>
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  Please check your university inbox or spam folder. Verification confirms control of this academic domain.
                </p>
              </div>

              <form onSubmit={handleConfirmCode} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Enter 6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="input w-full bg-slate-950 border-slate-700 text-white font-mono text-center tracking-widest text-lg py-2"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={triggerSendCode}
                    disabled={sendingCode || resendCooldown > 0}
                    className="text-gold hover:underline disabled:opacity-50"
                  >
                    {sendingCode
                      ? "Sending code…"
                      : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't receive code? Resend"}
                  </button>
                  <span className="text-slate-400">Code valid for 15 minutes</span>
                </div>

                <div className="pt-3 flex justify-between gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    ← Back / Edit Email
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingCode || submitting || emailCode.length < 6}
                    className="btn-gold text-xs py-2 px-5 disabled:opacity-50"
                  >
                    {verifyingCode || submitting ? "Verifying Code…" : "Verify Code & Proceed →"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2B: University Verification (Academic Enrollment Proof Upload Flow) */}
          {step === 2 && verificationMethod === "university" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Please select the type of academic enrollment proof you would like to provide *
                </label>
                <select
                  value={proofType}
                  onChange={(e) => setProofType(e.target.value as ProofType)}
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                >
                  {Object.entries(PROOF_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Explanatory callout matching GitHub Education design */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-[11px] text-slate-300 leading-relaxed">
                <p className="font-bold text-gold">What helps with verification?</p>
                <p className="mt-1 text-slate-400">
                  We can verify your application most easily when your proof includes your complete name, school/institution name, and a current date. Dated school IDs, current transcripts, and enrollment letters on official letterhead tend to work best. Clear, readable images help our Academic Board process your application quickly.
                </p>
              </div>

              {/* Upload Zone */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Upload Academic Proof Document or Photo *
                </label>
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center cursor-pointer hover:border-gold hover:bg-slate-950 transition">
                  <span className="text-3xl text-slate-500 mb-2">📷</span>
                  <span className="font-semibold text-white">
                    {fileName ? fileName : "Click to select or capture file"}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">
                    PDF, PNG, JPG, or WebP up to 5 MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Optional Email Verification code trigger */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">
                    Verify Email ID ({email})
                  </span>
                  {!codeSent && !emailVerified && (
                    <button
                      type="button"
                      onClick={triggerSendCode}
                      disabled={sendingCode}
                      className="text-gold text-[11px] hover:underline"
                    >
                      {sendingCode ? "Sending…" : "Send verification code"}
                    </button>
                  )}
                </div>

                {codeSent && !emailVerified && (
                  <div className="flex gap-2 items-center pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      className="input bg-slate-900 border-slate-700 text-white font-mono text-xs py-1 px-3 w-32"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmCode()}
                      disabled={verifyingCode || emailCode.length < 6}
                      className="rounded-lg bg-gold text-navy font-bold text-xs py-1 px-3 disabled:opacity-50"
                    >
                      {verifyingCode ? "Verifying…" : "Confirm Code"}
                    </button>
                  </div>
                )}

                {emailVerified && (
                  <p className="text-emerald-400 font-semibold text-[11px]">
                    ✓ Email ID verified
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => submitApplication()}
                  disabled={submitting || !fileName}
                  className="btn-gold text-xs py-2 px-5 disabled:opacity-50"
                >
                  {submitting ? "Submitting Proof…" : "Submit Verification Proof →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Submission Confirmed & Payment Routing */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400 border border-emerald-500/40">
                ✓
              </span>
              <div>
                <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                  STATUS: UNDER VERIFICATION
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-2">
                  Application Submitted
                </h3>
                <p className="mt-1 text-xs text-slate-300 max-w-md mx-auto">
                  Your official application reference code is:
                </p>
                <p className="mt-1 font-mono text-base font-bold text-gold">
                  {applicationId}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs space-y-2 text-slate-300">
                <p className="font-bold text-white">Important Institutional Governance Rule:</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  In accordance with GIRSD Academic Governance regulations, payment does <strong>not</strong> automatically grant membership perks. Once submitted, your credentials and institutional affiliation will be reviewed by the board within 2–3 working days. Active credentials and discounts activate upon board approval.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href={`/checkout?type=membership&tier=${tier.id}&application_id=${applicationId}`}
                  className="btn-gold text-xs py-2.5 px-6"
                >
                  Proceed to Secure Subscription (£{tier.price}/yr)
                </Link>
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Return to Membership
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
