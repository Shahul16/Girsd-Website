import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { courses } from "@/lib/data/courses";
import { courseImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Certified, tutor-supported online courses from GIRSD: research methods, data analysis, academic writing, project management, cybersecurity and leadership.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Online Courses"
        title="Certified Courses, Real Tutors"
        intro="Every GIRSD course is tutor-supported, assessed, and certified. Enrol online — members save 5% on all course fees."
      />
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 3) * 90}>
              <Link href={`/courses/${c.slug}`} className="card card-lift group flex h-full flex-col overflow-hidden">
                <div className="img-zoom h-44">
                  <img src={c.image ?? courseImage(c.category)} alt="" loading="lazy" width={500} height={300} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-navy px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gold">
                    {c.level}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {c.category}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-xl font-bold group-hover:text-gold-dark">
                  {c.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.summary}</p>
                <dl className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <div className="flex justify-between">
                    <dt>Duration</dt>
                    <dd className="font-medium text-navy">{c.duration}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Weekly effort</dt>
                    <dd className="font-medium text-navy">{c.effort}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Fee</dt>
                    <dd className="font-display text-lg font-bold text-navy">£{c.price}</dd>
                  </div>
                </dl>
                <span className="btn-outline mt-5 w-full group-hover:bg-navy group-hover:text-white">
                  View course
                </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center">
          <span className="inline-block rounded-full bg-gold/20 border border-gold/40 px-4 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-4">Complete course pathway</span>
          <h3 className="font-display text-2xl font-bold">Complete 4-Course Bundle</h3>
          <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-sm text-slate-400">Individual total</p>
              <p className="font-mono text-2xl font-bold text-slate-300">£1,585</p>
            </div>
            <div className="text-gold text-3xl font-bold">→</div>
            <div className="text-center">
              <p className="text-sm text-gold">Combined Bundle Rate</p>
              <p className="font-display text-4xl font-bold text-gold">£1,595</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">Choose any course above to view its current premium international fee. The complete pathway brings all four core tracks together.</p>
        </div>
      </section>
    </>
  );
}
