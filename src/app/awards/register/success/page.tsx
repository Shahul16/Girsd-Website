"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/site";
import { AWARDS_REGISTRATION_FEE_GBP } from "@/lib/awards";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const [paymentStatus, setPaymentStatus] = useState<"checking" | "processing" | "confirmed" | "unpaid" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    async function checkPayment() {
      if (!sessionId) {
        setPaymentStatus("unpaid");
        return;
      }
      try {
        const response = await fetch(`/api/awards/registration-status?session_id=${encodeURIComponent(sessionId)}`);
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setPaymentStatus("error");
          return;
        }
        if (body.status === "confirmed") {
          setPaymentStatus("confirmed");
          return;
        }
        if (body.status === "processing" && attempts < 5) {
          attempts += 1;
          setPaymentStatus("processing");
          timer = setTimeout(checkPayment, 2000);
          return;
        }
        setPaymentStatus(body.status === "unpaid" ? "unpaid" : "processing");
      } catch {
        if (!cancelled) setPaymentStatus("error");
      }
    }

    void checkPayment();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <div className="card mx-auto max-w-2xl p-8 sm:p-12 text-center shadow-card">
      <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 ${
        paymentStatus === "confirmed"
          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
          : "border-amber-500 bg-amber-50 text-amber-700"
      }`}>
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {paymentStatus === "confirmed"
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" />}
        </svg>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-gold block">
        {paymentStatus === "confirmed" ? "Payment & Registration Confirmed" : "Payment Status"}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
        {paymentStatus === "confirmed"
          ? "Congratulations!"
          : paymentStatus === "processing"
            ? "Confirming your registration"
            : paymentStatus === "checking"
              ? "Checking your payment"
              : "We could not confirm payment"}
      </h1>
      <p className="mt-3 text-base text-muted leading-relaxed">
        {paymentStatus === "confirmed"
          ? <>Your registration fee of <strong>£{AWARDS_REGISTRATION_FEE_GBP}.00 GBP</strong> has been confirmed. Your registration is recorded.</>
          : paymentStatus === "processing"
            ? "Stripe has returned you to the site, but our registration record is still updating. This page checks again automatically; please do not pay again."
            : paymentStatus === "checking"
              ? "We are verifying the checkout session with Stripe and the award registration record."
              : "No completed award payment is recorded for this session. If you completed checkout, contact the Awards Committee before trying again."}
      </p>

      {sessionId && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-600 break-all">
          <span className="text-slate-400 block text-[11px] font-sans font-semibold uppercase tracking-wider mb-1">
            Transaction Identifier
          </span>
          {sessionId}
        </div>
      )}

      {paymentStatus === "confirmed" && (
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
      )}

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
        title="Award Registration Status"
        intro="Your payment and award registration are verified before confirmation is shown."
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

