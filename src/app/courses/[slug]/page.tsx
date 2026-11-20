import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import EnrolPanel from "@/components/EnrolPanel";
import { courses, getCourse } from "@/lib/data/courses";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return {
    title: `${course.title} | GlobalRSD Executive Education`,
    description: course.summary,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const advisorSubject = encodeURIComponent(`Advisory Enquiry: ${course.title}`);

  return (
    <>
      {/* SECTION 1: HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy via-navy to-[#0D233C] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DDA853_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px] items-center">
            <div>
              {/* Trust Signal: Prominent CPD Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                CPD Accredited | Provider No. 788000
              </div>

              {/* Course Code & Level */}
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded bg-navy-light border border-gold/30 px-3 py-1 font-mono text-xs font-extrabold uppercase text-gold">
                  {course.code || "EXECUTIVE"}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {course.level} Level · 20 CPD Credits
                </span>
              </div>

              {/* Course Title & Subtitle */}
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                {course.title}
              </h1>
              <p className="mt-3 max-w-2xl font-serif text-lg font-medium text-gold-light/90 sm:text-xl">
                {course.subtitle}
              </p>

              {/* Summary Description */}
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                {course.summary}
              </p>

              {/* Format & Duration Meta */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-gold font-bold">⏱</span>
                  <span><strong>Duration:</strong> {course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold font-bold">📚</span>
                  <span><strong>Format:</strong> {course.format || "100% Online · Self-Paced & Masterclasses"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold font-bold">🎯</span>
                  <span><strong>Pace:</strong> {course.effort}</span>
                </div>
              </div>

              {/* Dual Hero CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/checkout?type=course&course=${course.slug}`}
                  className="btn-gold px-8 py-3.5 text-sm font-bold shadow-lg shadow-gold/20"
                >
                  Enrol Now
                </Link>
                <Link
                  href={`/contact?subject=${advisorSubject}&enquiry=advisor`}
                  className="btn-outline border-white/30 text-white hover:border-gold hover:text-gold px-6 py-3.5 text-sm font-semibold backdrop-blur-sm"
                >
                  Speak to a Programme Advisor
                </Link>
              </div>
            </div>

            {/* Hero Right: Course Card Highlight */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-gold/30 bg-white/5 p-6 backdrop-blur-md shadow-2xl">
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={course.image || "/co-generic.png"}
                    alt={course.title}
                    width={600}
                    height={340}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400">Awarding Body</span>
                    <span className="font-semibold text-white">The CPD Group (#788000)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400">CPD Hours</span>
                    <span className="font-semibold text-gold">20 Verifiable Credits</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400">Assessment</span>
                    <span className="font-semibold text-white">70% Pass (MCQ + Capstone)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Credential</span>
                    <span className="font-semibold text-white">Verifiable Digital Certificate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN BODY (Content + Sticky EnrolPanel) */}
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1fr_360px]">
        <div className="space-y-16">
          
          {/* SECTION 2: THE BUSINESS CASE */}
          <section id="business-case" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Market Imperative
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  The Business Case: Why This Skill Is Urgent in 2026
                </h2>
              </div>

              <p className="mt-4 text-base leading-relaxed text-slate-700">
                {course.businessCaseIntro ||
                  "In 2026, enterprise transformation demands rigorous analytical acumen, robust governance, and verifiable executive leadership."}
              </p>

              {course.businessCase && course.businessCase.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {course.businessCase.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-gold/50 transition"
                    >
                      <p className="font-display text-3xl font-extrabold text-navy">
                        {item.stat}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gold-dark">
                        {item.label}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>
          </section>

          {/* SECTION 3: WHO THIS PROGRAMME IS FOR */}
          <section id="target-audience" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Target Candidate Profile
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  Who This Programme Is For
                </h2>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                This executive certificate is curated specifically for professionals with existing industry experience seeking to certify specialised strategic competence:
              </p>

              <div className="mt-6 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
                <ul className="grid gap-3 sm:grid-cols-1">
                  {(course.whoIsThisFor || []).map((role, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-dark font-bold text-xs mt-0.5">
                        ✓
                      </span>
                      <span className="font-medium">{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </section>

          {/* SECTION 4: KEY TAKEAWAYS */}
          <section id="key-takeaways" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Executive Competencies
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  Key Takeaways &amp; Strategic Capabilities
                </h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(course.keyTakeaways || []).map((outcome, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy text-gold font-bold text-xs">
                      0{idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-slate-800">
                      {outcome}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* SECTION 5: CURRICULUM SNAPSHOT */}
          <section id="curriculum" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Academic Structure
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  Curriculum Snapshot (4 Modules + Practical Capstone)
                </h2>
              </div>

              <p className="mt-3 text-sm text-slate-600">
                Engineered across 20 CPD-accredited hours of rigorous instruction, interactive case studies, and hands-on laboratory application:
              </p>

              <div className="mt-6 space-y-4">
                {course.syllabus.map((m, idx) => (
                  <details
                    key={idx}
                    open={idx === 0 || idx === 4}
                    className="group rounded-xl border border-slate-200 bg-white shadow-sm transition overflow-hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between p-5 font-display text-base font-bold text-navy group-open:bg-slate-50/80 transition">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold-dark text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-base text-navy">{m.module}</p>
                          {m.subtitle && (
                            <p className="text-xs font-normal text-slate-500">{m.subtitle}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-gold-dark transition-transform group-open:rotate-180">
                        ▼
                      </span>
                    </summary>

                    <div className="border-t border-slate-100 px-6 py-5 bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Module Coverage &amp; Case Study Focus:
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        {m.topics.map((t, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2.5">
                            <span className="text-gold font-bold">◆</span>
                            <span className="leading-relaxed">{t}</span>
                          </li>
                        ))}
                      </ul>

                      {m.caseStudy && (
                        <div className="mt-4 rounded-lg bg-navy/5 border border-navy/10 p-3 text-xs text-navy font-semibold flex items-center gap-2">
                          <span className="text-gold-dark">★</span>
                          <span><strong>Anchor Case:</strong> {m.caseStudy}</span>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </Reveal>
          </section>

          {/* SECTION 6: THE GLOBALRSD LEARNING EXPERIENCE */}
          <section id="experience" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Pedagogical Methodology
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  The GlobalRSD Learning Experience
                </h2>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div className="card p-6 border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-gold mb-4 font-bold">
                    🏛
                  </div>
                  <h3 className="font-display text-base font-bold text-navy">
                    Harvard Case-Method
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {course.learningExperience?.harvardCaseMethod ||
                      "Analyze actual corporate turnarounds, compliance enforcement cases, and boardroom dilemmas."}
                  </p>
                </div>

                <div className="card p-6 border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-gold mb-4 font-bold">
                    🔬
                  </div>
                  <h3 className="font-display text-base font-bold text-navy">
                    Hands-On AI &amp; Tech Labs
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {course.learningExperience?.handsOnLabs ||
                      "Practical simulations, calculation toolkits, and digital architecture sandboxes."}
                  </p>
                </div>

                <div className="card p-6 border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-gold mb-4 font-bold">
                    👤
                  </div>
                  <h3 className="font-display text-base font-bold text-navy">
                    1-on-1 Tutor Guidance
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {course.learningExperience?.tutorSupport ||
                      "Direct evaluation and assessment feedback from senior academic faculty and industry leaders."}
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* SECTION 7: CPD CERTIFICATION & ASSESSMENT */}
          <section id="certification" className="scroll-mt-28">
            <Reveal>
              <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-navy to-[#0F2847] p-8 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      Academic Rigour &amp; Standards
                    </span>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                      CPD Certification &amp; Assessment Architecture
                    </h2>
                  </div>
                  <div className="rounded-lg bg-gold/20 border border-gold/40 px-3.5 py-1 text-xs font-bold text-gold">
                    CPD Provider No. 788000
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-200">
                  {course.assessmentBreakdown?.description ||
                    "To ensure our executive certificates maintain the highest international recognition, candidates must achieve a minimum 70% overall pass mark."}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-extrabold text-gold">30%</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                        Theoretical Evaluation
                      </span>
                    </div>
                    <p className="mt-2 font-display text-sm font-bold text-white">
                      Online Theory MCQ Examination
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Rigorous timed examination testing regulatory frameworks, compliance requirements, and fundamental mechanics.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-extrabold text-gold">70%</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                        Applied Capstone
                      </span>
                    </div>
                    <p className="mt-2 font-display text-sm font-bold text-white">
                      Practical Capstone Deliverable Pack
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Boardroom-ready strategic deliverable constructed for your actual enterprise, reviewed personally by faculty.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-bold">✓</span>
                    <span>Verifiable on <strong>globalrsd.co.uk/verify</strong> &amp; The CPD Register</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-bold">✓</span>
                    <span>Includes 20 Verifiable UK CPD Credits</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* SECTION 8: FREQUENTLY ASKED QUESTIONS (FAQs) */}
          <section id="faqs" className="scroll-mt-28">
            <Reveal>
              <div className="border-l-4 border-gold pl-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
                  Executive Inquiries
                </span>
                <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {(course.faqs || []).map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-display text-base font-bold text-navy">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* BOTTOM CONVERSION CTA BANNER */}
          <section className="rounded-2xl bg-gradient-to-r from-navy via-navy to-[#0F2847] p-8 text-white shadow-xl border border-gold/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  Enrollment Open
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">
                  Advance Your Career with {course.code}
                </h3>
                <p className="mt-1 text-xs text-slate-300 max-w-lg">
                  20 CPD Credits · 70% Rigour Pass Mark · 1-on-1 Faculty Mentorship. Enrol today or consult with our advisory team.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href={`/checkout?type=course&course=${course.slug}`}
                  className="btn-gold px-6 py-3 text-xs font-bold shadow-md"
                >
                  Enrol Now
                </Link>
                <Link
                  href={`/contact?subject=${advisorSubject}&enquiry=advisor`}
                  className="btn-outline border-white/30 text-white hover:border-gold hover:text-gold px-5 py-3 text-xs font-semibold"
                >
                  Speak to a Programme Advisor
                </Link>
              </div>
            </div>
          </section>

        </div>

        {/* SIDEBAR ASIDE: STICKY ENROL PANEL */}
        <aside aria-label="Executive Enrolment" className="lg:block">
          <EnrolPanel
            courseSlug={course.slug}
            price={course.price}
            courseTitle={course.title}
          />
        </aside>
      </div>

      {/* PROMINENT COURSE PAGE FOOTER TRUST SIGNAL */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-navy">
            CPD Accredited | Provider No. 788000
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Official certification delivered by Global Institute of Research &amp; Skills Development in accordance with UK Continuing Professional Development standards.
          </p>
        </div>
      </footer>
    </>
  );
}
