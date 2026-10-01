"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import PageHero from "@/components/PageHero";

type VerificationResult = {
  found: boolean;
  status: "VALID" | "NOT_VALID" | "NOT_FOUND";
  membershipId?: string;
  tier?: string;
  institution?: string;
  validUntil?: string;
  issuedBy?: string;
  message?: string;
};

export default function VerifyMembershipPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    setChecking(true);
    setResult(null);

    try {
      const res = await fetch(`/api/verify-membership?id=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        found: false,
        status: "NOT_FOUND",
        message: "Unable to verify at this time. Please check the network connection and try again.",
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Credentials & Trust"
        title="Membership Verification Registry"
        intro="Confirm the authenticity and current standing of GIRSD academic fellows, scholars, and institutional members."
      />

      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="card p-8 shadow-sm">
          <form onSubmit={handleVerify} aria-label="Membership verification form">
            <label htmlFor="membership-id-input" className="label text-sm font-semibold text-navy">
              Membership ID or Reference Code
            </label>
            <p className="mb-3 text-xs text-slate-500">
              Enter the official identifier (e.g. GIRSD-M-2026-1042 or GIRSD-MEM-2026-000123)
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="membership-id-input"
                className="input font-mono uppercase tracking-widest text-base"
                placeholder="GIRSD-M-2026-1042"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={checking}
                className="btn-gold shrink-0 px-6 py-2.5 disabled:opacity-60"
              >
                {checking ? "Verifying…" : "Verify Status"}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              {result.status === "VALID" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-xs">
                      ✓
                    </span>
                    <div>
                      <span className="inline-block rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                        STATUS: VALID &amp; ACTIVE
                      </span>
                      <h3 className="font-display text-lg font-bold text-navy mt-1">
                        Official GIRSD Credential Confirmed
                      </h3>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between border-b border-emerald-200/50 pb-2">
                      <dt className="text-slate-500">Credential ID</dt>
                      <dd className="font-mono font-bold text-navy">{result.membershipId}</dd>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200/50 pb-2">
                      <dt className="text-slate-500">Membership Category</dt>
                      <dd className="font-semibold text-navy">{result.tier}</dd>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200/50 pb-2">
                      <dt className="text-slate-500">Affiliation</dt>
                      <dd className="font-medium text-slate-700">{result.institution}</dd>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200/50 pb-2">
                      <dt className="text-slate-500">Valid Until</dt>
                      <dd className="font-semibold text-emerald-800">{result.validUntil}</dd>
                    </div>
                    <div className="flex justify-between pt-1">
                      <dt className="text-slate-500">Accrediting Registry</dt>
                      <dd className="text-xs text-slate-600">{result.issuedBy}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700">
                    !
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-navy">
                    Credential Not Verified
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {result.message || "This membership identifier is either inactive, pending verification, or not registered in the system."}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    If you believe this is an error, please contact{" "}
                    <a href="mailto:membership@globalrsd.co.uk" className="font-semibold text-navy underline">
                      membership@globalrsd.co.uk
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>
            Looking to verify a course or conference paper certificate instead?{" "}
            <Link href="/verify" className="font-semibold text-navy underline hover:text-gold-dark">
              Go to Certificate Verification
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
