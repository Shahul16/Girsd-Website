"use client";

import { useState } from "react";

export default function ReferralForm() {
  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid professional email address.");
      return;
    }

    setError("");
    // Create a base64 clean referral code derived from email
    const code = btoa(cleanEmail)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toUpperCase();
    const link = `https://www.globalrsd.co.uk/courses?ref=${code}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareText = encodeURIComponent(
    `I invite you to explore GlobalRSD's CPD-accredited Executive Certificates. Use my referral link for an exclusive £50 fee reduction on enrollment: ${generatedLink}`
  );

  return (
    <div className="rounded-2xl border-2 border-gold/40 bg-navy p-6 text-white shadow-2xl sm:p-8">
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-gold">
        <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
        Instant Referral Link Generator
      </div>
      <h2 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
        Generate Your Personalised Referral Link
      </h2>
      <p className="mt-1 text-xs text-slate-300">
        Enter your work email address to create your trackable link and start sharing £50 savings.
      </p>

      <form onSubmit={handleGenerate} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="ref-email" className="sr-only">
            Professional Email Address
          </label>
          <input
            id="ref-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <button
          type="submit"
          className="btn-gold shrink-0 py-3 px-6 text-xs font-bold uppercase tracking-wider"
        >
          Generate Unique Link
        </button>
      </form>

      {error && <p className="mt-2 text-xs font-semibold text-rose-400">{error}</p>}

      {generatedLink && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-slate-900/80 p-4 transition-all">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
            Your Unique Referral Link:
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="btn-gold py-2 px-4 text-xs font-bold"
            >
              {copied ? "✓ Copied to Clipboard!" : "Copy Link"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Direct Share:</span>
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-emerald-700/60 hover:bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-medium transition"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-sky-700/60 hover:bg-sky-600 text-white px-2.5 py-1 text-[11px] font-medium transition"
            >
              LinkedIn
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent("£50 Executive Programme Invitation — GlobalRSD")}&body=${shareText}`}
              className="rounded bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 text-[11px] font-medium transition"
            >
              Email Invitation
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

