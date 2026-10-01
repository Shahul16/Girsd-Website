import Link from "next/link";
import CountUp from "@/components/CountUp";
import TrustBadges from "@/components/TrustBadges";
import EventsCarousel from "@/components/EventsCarousel";
import Testimonials from "@/components/Testimonials";
import HomeHeroCarousel from "@/components/HomeHeroCarousel";
import Reveal from "@/components/Reveal";
import { events, nextEvent } from "@/lib/data/events";
import { courses } from "@/lib/data/courses";
import { SITE } from "@/lib/site";
import { courseImage } from "@/lib/images";
import type { HeroSlide } from "@/lib/hero";

import heroJson from "@/content/hero.json";

const services: HeroSlide[] = heroJson as HeroSlide[];

export default function HomePage() {
  const upcoming = events.find((e) => e.slug === "icmdr-2026") ?? nextEvent();
  const featuredEvents = events.slice(0, 3);
  const featuredCourses = courses.slice(0, 3);

  const parseStat = (val: any, fallbackNum: number, fallbackSuffix = "") => {
    if (typeof val === "number") return { num: val, suffix: fallbackSuffix };
    if (typeof val === "string") {
      const cleaned = val.replace(/,/g, "").trim();
      const match = cleaned.match(/^(\d+)(.*)$/);
      if (match) {
        return { num: parseInt(match[1], 10), suffix: match[2] || fallbackSuffix };
      }
    }
    return { num: fallbackNum, suffix: fallbackSuffix };
  };

  return (
    <>
      <HomeHeroCarousel slides={services} upcomingEvent={upcoming} />

      {/* STATS */}
      <section className="border-b border-slate-200 bg-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
          {[
            { ...parseStat(SITE.stats.members, 2500, "+"), label: "Members worldwide" },
            { ...parseStat(SITE.stats.conferences, 18, ""), label: "Conferences delivered" },
            { ...parseStat(SITE.stats.countries, 50, "+"), label: "Countries represented" },
            { ...parseStat(SITE.stats.papers, 1200, "+"), label: "Papers presented" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-bold text-navy">
                <CountUp end={s.num} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACCREDITATIONS */}
      <section className="border-b border-slate-200 bg-white" aria-label="Accreditations and registrations">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <TrustBadges variant="light" heading="Accredited & Registered" />
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal className="text-center">
          <h2 className="flourish font-display text-3xl font-bold sm:text-4xl">What We Do</h2>
          <p className="mx-auto mt-4 max-w-2xl text-justify text-slate-600">
            Seven programmes, one purpose: connecting rigorous research with
            practical capability for academics, students and industry.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <Link href={s.href} className="card card-lift group block h-full p-6">
                <span className="inline-flex rounded-lg bg-navy p-3 text-gold transition group-hover:bg-gold group-hover:text-navy">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-gold-dark group-hover:underline">
                  Learn more
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Upcoming Events</h2>
              <p className="mt-2 text-slate-300">Choose your next opportunity to present, learn and connect.</p>
            </div>
            <Link href="/events" className="btn-gold">View all events</Link>
          </Reveal>
          <div className="mt-10">
            <EventsCarousel events={events} />
          </div>
        </div>
      </section>

      {/* COURSES TEASER */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Featured Courses</h2>
            <p className="mt-2 text-slate-600">Certified, tutor-supported online learning.</p>
          </div>
          <Link href="/courses" className="btn-navy">Browse all courses</Link>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featuredCourses.map((c, i) => (
            <Reveal key={c.slug} delay={i * 100}>
              <Link href={`/courses/${c.slug}`} className="card card-lift group block h-full overflow-hidden">
                <div className="img-zoom h-40">
                  <img src={c.image ?? courseImage(c.category)} alt="" loading="lazy" width={500} height={300} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">{c.category} · {c.level}</p>
                <h3 className="mt-3 font-display text-xl font-bold group-hover:text-gold-dark">{c.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.summary}</p>
                <p className="mt-4 text-sm text-slate-500">{c.duration} · {c.effort}</p>
                <p className="mt-1 font-display text-lg font-bold text-navy">£{c.price}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* PRIMARY CTA */}
      <section className="bg-gradient-to-br from-navy to-navy-light py-20 text-center text-white">
        <Reveal className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Join a Global Community of Researchers & Professionals
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Members enjoy a 10% discount on every conference ticket, 5% on online
            courses, mentoring and more — from just £49 a year.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/membership" className="btn-gold">Explore Membership</Link>
            <Link href="/contact" className="inline-flex items-center rounded-md border-2 border-white/60 px-5 py-2.5 font-semibold text-white transition hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              Talk to Us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
