"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/site";
import { AWARDS_REGISTRATION_FEE_GBP } from "@/lib/awards";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  return (
    <div className="card mx-auto max-w-2xl p-8 sm:p-12 text-center shadow-card">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 mb-6">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-gold block">
        Payment &amp; Registration Successful
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
        Congratulations!
      </h1>
      <p className="mt-3 text-base text-muted leading-relaxed">
        Your registration fee of <strong>£{AWARDS_REGISTRATION_FEE_GBP}.00 GBP</strong> has been processed via Stripe. Your trophy production docket and official certificate have been queued for master engraving.
      </p>

      {sessionId && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-600 break-all">
          <span className="text-slate-400 block text-[11px] font-sans font-semibold uppercase tracking-wider mb-1">
            Transaction Identifier
          </span>
          {sessionId}
        </div>
      )}

      <div className="mt-8 border-t border-slate-100 pt-8 text-left">
        <h2 className="font-display text-lg font-bold text-navy mb-4">
          What Happens Next in Your Recognition Journey:
        </h2>
        <ul className="space-y-4 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">1</span>
            <div>
              <strong>Email Confirmation &amp; Receipt:</strong> An official payment receipt and registration confirmation docket have been dispatched to your email address from <code className="text-xs font-mono">{SITE.awardsEmail}</code>.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">2</span>
            <div>
              <strong>Trophy Engraving &amp; Quality Check:</strong> Our master craftsmen are preparing your heavyweight crystal &amp; brass trophy with your verified name and institutional title.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">3</span>
            <div>
              <strong>Ceremony Credentials &amp; Media Banner:</strong> Our media team will generate your personalized awardee press release graphics and deliver your ceremony pass or live streaming link.
            </div>
          </li>
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href="/awards" className="btn-gold px-6 py-3 text-sm">
          Return to Awards Overview
        </Link>
        <Link href="/" className="btn-secondary px-6 py-3 text-sm">
          Return to Homepage
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Need assistance or have ceremony questions? Reach our secretariat at{" "}
        <a href={`mailto:${SITE.awardsEmail}`} className="font-semibold text-navy underline">
          {SITE.awardsEmail}
        </a>
      </p>
    </div>
  );
}

export default function AwardRegisterSuccessPage() {
  return (
    <>
      <PageHero
        eyebrow="GIRSD Global Awards 2026"
        title="Award Registration Confirmed"
        intro="Your official registration and trophy engraving order have been confirmed."
      />

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <Suspense
              fallback={
                <div className="card p-12 text-center text-slate-500">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-gold"></div>
                  <p className="mt-4 text-sm font-medium">Loading confirmation details...</p>
                </div>
              }
            >
              <SuccessContent />
            </Suspense>
          </Reveal>
        </div>
      </section>
    </>
  );
}

