"use client";

import Image from "next/image";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import { SITE } from "@/lib/site";
import type { HeroSlide } from "@/lib/hero";

type HeroCardProps = {
  slide: HeroSlide;
  upcomingEvent?: {
    date: string;
    acronym: string;
    title: string;
    slug: string;
  };
};

export default function HeroCard({ slide, upcomingEvent }: HeroCardProps) {
  const cardType = slide.cardType;
  const eventTarget = upcomingEvent?.date || "2026-11-28";
  const eventLabel = upcomingEvent?.acronym || "ICMDR 2026";
  const eventSlug = upcomingEvent?.slug || "icmdr-2026";

  if (cardType === "conference") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col items-start gap-4">
          <Image
            src={SITE.logoWhite}
            alt="GIRSD heraldic crest"
            width={260}
            height={62}
            priority
            unoptimized
            className="h-11 w-auto animate-shimmer"
          />
          <div className="mt-1">
            <Countdown target={eventTarget} label={eventLabel} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3 text-xs text-slate-300 w-full">
            <span className="flex items-center gap-1.5 font-medium text-gold-light">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Registration Open
            </span>
            <Link
              href={`/events/${eventSlug}`}
              className="font-semibold text-white underline-offset-4 hover:text-gold hover:underline"
            >
              Conference details →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === "course") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">UK CPD Standards Office</p>
            <p className="text-sm font-bold text-white">Accredited Professional Learning</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Data Science with Python</span>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">8 Weeks</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">Tutor-supported hands-on data analytics & modelling</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">AI in Cybersecurity</span>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">6 Weeks</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">Threat intelligence, neural models & defense systems</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-slate-300">
          <span className="text-gold-light">✓ Verifiable Certificate</span>
          <Link href="/courses" className="font-semibold text-white hover:text-gold hover:underline">
            All 6 courses →
          </Link>
        </div>
      </div>
    );
  }

  if (cardType === "award") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Annual Honours</p>
            <p className="text-sm font-bold text-white">GIRSD Global Awards 2026</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <span className="mt-0.5 text-gold font-bold">★</span>
            <div className="text-xs">
              <p className="font-semibold text-white">12 Prestigious Categories</p>
              <p className="mt-0.5 text-slate-300">Honouring individual researchers, educators, and institutions worldwide.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <span className="mt-0.5 text-gold font-bold">✓</span>
            <div className="text-xs">
              <p className="font-semibold text-white">No Nomination Fee</p>
              <p className="mt-0.5 text-slate-300">Nominations are 100% free and open for self-nomination or peer recognition.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-slate-300">
          <span className="text-gold-light">Assessed by independent academic panel</span>
          <Link href="/awards#nominate" className="font-semibold text-white hover:text-gold hover:underline">
            Nominate now →
          </Link>
        </div>
      </div>
    );
  }

  if (cardType === "membership") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Scholar Network</p>
            <p className="text-sm font-bold text-white">GIRSD Membership</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold/10 p-3">
            <span className="text-xs font-bold text-white">Exclusive Member Discount</span>
            <span className="rounded bg-gold px-2 py-0.5 text-xs font-bold text-navy">20% OFF</span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300 space-y-1.5">
            <p className="flex items-center gap-2 text-white font-medium">
              <span className="text-gold">✓</span> Global Research Mentorship
            </p>
            <p className="flex items-center gap-2 text-white font-medium">
              <span className="text-gold">✓</span> Post-nominal letters (FGIRSD / MGIRSD)
            </p>
            <p className="flex items-center gap-2 text-white font-medium">
              <span className="text-gold">✓</span> Quarterly Policy & Research Briefings
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-slate-300">
          <span className="text-gold-light">Scholars across 50+ countries</span>
          <Link href="/membership" className="font-semibold text-white hover:text-gold hover:underline">
            View tiers →
          </Link>
        </div>
      </div>
    );
  }

  if (cardType === "workshop") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Practitioner-Led Training</p>
            <p className="text-sm font-bold text-white">Intensive Skills Workshops</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">Academic Writing & Publishing Masterclass</p>
            <p className="mt-1 text-[11px] text-slate-300">Structure high-impact papers for indexed journal publication.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">Advanced Research Methodologies</p>
            <p className="mt-1 text-[11px] text-slate-300">Quantitative, qualitative & mixed methods research frameworks.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-slate-300">
          <span className="text-gold-light">Small cohorts · Live Q&A</span>
          <Link href="/events" className="font-semibold text-white hover:text-gold hover:underline">
            Browse schedule →
          </Link>
        </div>
      </div>
    );
  }

  // default: partnership / internship
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-navy/85 p-6 shadow-2xl backdrop-blur-md sm:p-7">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl pointer-events-none" />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
          </svg>
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">Institutional Alliances</p>
          <p className="text-sm font-bold text-white">Partnerships & Internships</p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold text-white">University Collaborations & MOUs</p>
          <p className="mt-1 text-[11px] text-slate-300">Joint international conferences, faculty mobility & curriculum accreditation.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold text-white">Global Graduate Internships</p>
          <p className="mt-1 text-[11px] text-slate-300">Real-world research projects, hands-on mentorship & CPD certification.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-slate-300">
        <span className="text-gold-light">Connecting 50+ countries</span>
        <Link href="/partner" className="font-semibold text-white hover:text-gold hover:underline">
          Partner with us →
        </Link>
      </div>
    </div>
  );
}
