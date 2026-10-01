"use client";

import { useState } from "react";
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [role, setRole] = useState(tier.name === "Student" ? "Student" : "Academic / Researcher");
  const [institution, setInstitution] = useState("");
  const [proofType, setProofType] = useState<ProofType>("student_id");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");

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
    if (!name || !email || !institution) {
      setError("Please complete all required fields.");
      return;
    }
    setError("");
    // If personal email, move to step 2 (document proof upload)
    if (classification.requiresDocumentProof) {
      setStep(2);
    } else {
      await submitApplication();
    }
  }

  async function submitApplication() {
    setSubmitting(true);
    setError("");
    try {
      // 1. Submit initial application record
      const res = await fetch("/api/membership/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          institution,
          roleTitle: role,
          tierId: tier.id,
          proofType: classification.requiresDocumentProof ? proofType : undefined,
          documentFileName: fileName || undefined,
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

      setStep(3);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden">
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
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* STEP 1: Institutional & Role Details */}
          {step === 1 && (
            <form onSubmit={handleProceedStep1} className="space-y-4 text-xs">
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
                  Select your role *
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
                  What is the name of your university, school, or organization? *
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University College London, Imperial College, Q Tech"
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Your email address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.ac.uk or name@gmail.com"
                  className="input w-full bg-slate-950 border-slate-700 text-white text-xs"
                />

                {classification.requiresDocumentProof && email && (
                  <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-[11px] text-amber-200 leading-relaxed">
                    <p className="font-semibold text-amber-400">Personal email provider detected ({classification.domain})</p>
                    <p className="mt-0.5 text-slate-300">
                      If you have an official school, university (.ac.uk, .edu) or institutional address, using it will streamline eligibility. Otherwise, you can proceed by uploading academic/employment proof in the next step.
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
                  disabled={submitting}
                  className="btn-gold text-xs py-2 px-5"
                >
                  {classification.requiresDocumentProof ? "Continue to Verification Proof →" : "Submit for Verification →"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Document Proof Upload (Matching Screenshot 2!) */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Please select the type of academic / institutional enrollment proof you would like to provide *
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

              {/* Explanatory callout from screenshot */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-[11px] text-slate-300 leading-relaxed">
                <p className="font-bold text-gold">What helps with verification?</p>
                <p className="mt-1 text-slate-400">
                  We can verify your application most easily when your proof includes your complete name, school/institution name, and a current date. Dated school IDs, current transcripts, and enrollment letters on official letterhead tend to work best. Clear, readable images help our Academic Board process your application quickly.
                </p>
              </div>

              {/* Upload Zone */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Upload Document or Take Photo *
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
                  onClick={submitApplication}
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
                  Your application reference code is:
                </p>
                <p className="mt-1 font-mono text-base font-bold text-gold">
                  {applicationId}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs space-y-2 text-slate-300">
                <p className="font-bold text-white">Important Institutional Policy:</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Per GIRSD Academic Governance regulations, payment does <strong>not</strong> automatically grant membership perks. Once submitted, your credentials and institutional affiliation will be reviewed by the board within 2–3 working days.
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
