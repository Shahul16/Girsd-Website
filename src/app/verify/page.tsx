"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import PageHero from "@/components/PageHero";

type Result =
  | { status: "valid"; name: string; award: string; date: string; code: string }
  | { status: "invalid"; code: string };

/** Demo verification register. Replace with a database lookup (see README) for production. */
const DEMO_REGISTER: Record<string, { name: string; award: string; date: string }> = {
  "GIRSD-2026-0417": { name: "Aisha Rahman", award: "Certificate in Data Science with Python", date: "12 June 2026" },
  "GIRSD-2026-0338": { name: "Thomas Whitfield", award: "Certificate in AI in Cybersecurity", date: "28 May 2026" },
  "GIRSD-2025-1204": { name: "Mei-Ling Chen", award: "ICRIET 2025 — Certificate of Presentation", date: "16 October 2025" },
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [checking, setChecking] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setChecking(true);
    setResult(null);
    setTimeout(() => {
      const hit = DEMO_REGISTER[clean];
      setResult(hit ? { status: "valid", code: clean, ...hit } : { status: "invalid", code: clean });
      setChecking(false);
    }, 700);
  }

  return (
    <>
      <PageHero
        eyebrow="Trust & Credibility"
        title="Certificate Verification"
        intro="Every GIRSD certificate carries a unique verification code. Enter it below to confirm the credential's authenticity instantly."
      />
      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="card p-8">
          <form onSubmit={onSubmit} aria-label="Certificate verification form">
            <label htmlFor="cert-code" className="label">
              Verification code
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="cert-code"
                className="input font-mono uppercase tracking-widest"
                placeholder="GIRSD-2026-0417"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button type="submit" disabled={checking} className="btn-gold shrink-0 disabled:opacity-60">
                {checking ? "Checking…" : "Verify"}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              The code is printed at the foot of your certificate. Demo codes:
              GIRSD-2026-0417 · GIRSD-2026-0338 · GIRSD-2025-1204
            </p>
          </form>

          {result && (
            <div
              role="status"
              className={`mt-8 rounded-lg border p-6 animate-fadeUp ${
                result.status === "valid"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {result.status === "valid" ? (
                <>
                  <p className="flex items-center gap-2 font-display text-xl font-bold text-emerald-800">
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
                    Certificate verified
                  </p>
                  <dl className="mt-4 space-y-2 text-sm text-emerald-900">
                    <div className="flex justify-between gap-4"><dt className="text-emerald-700">Holder</dt><dd className="font-semibold">{result.name}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-emerald-700">Credential</dt><dd className="text-right font-semibold">{result.award}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-emerald-700">Issued</dt><dd className="font-semibold">{result.date}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-emerald-700">Code</dt><dd className="font-mono">{result.code}</dd></div>
                  </dl>
                  <p className="mt-4 text-xs text-emerald-700">
                    This credential was issued by the Global Institute of Research &amp; Skills Development and is genuine.
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 font-display text-xl font-bold text-red-800">
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">✕</span>
                    No record found
                  </p>
                  <p className="mt-3 text-sm text-red-800">
                    The code <span className="font-mono">{result.code}</span> does not match any certificate in
                    our register. Check for typing errors, or{" "}
                    <Link href="/contact" className="font-semibold underline">contact us</Link>{" "}
                    if you believe this is a mistake. Certificates that cannot be
                    verified should not be relied upon.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Unique codes", "Every certificate and delegate credential carries a one-of-a-kind code."],
            ["Instant check", "Verification is free, immediate and available to anyone — employers included."],
            ["Fraud protection", "Suspected forgeries are investigated and reported."],
          ].map(([t, b]) => (
            <div key={t} className="card p-5 text-center">
              <p className="font-display font-bold text-navy">{t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
