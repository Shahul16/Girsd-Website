import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { courses } from "@/lib/data/courses";
import { courseImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Certified, tutor-supported online courses from GIRSD: research methods, data analysis, academic writing, project management, AI skills and leadership.",
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
    </>
  );
}
