import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { courses } from "@/lib/data/courses";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Executive Certificates & CPD-Accredited Programmes",
  description:
    "CPD-accredited executive certificates in Strategic Business Analysis (CIBA), AI Governance (CAIG), Cybersecurity Risk (CCRM), Strategic Leadership (CSL), and ESG Sustainability (CESG). Provider No. 788000.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  const discountPercent = Math.round(SITE.courseMemberDiscount * 100);

  return (
    <>
      {/* Executive Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy via-navy to-[#0F2744] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DDA853_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:py-24">
          <div className="flex flex-col items-center text-center">
            {/* Prominent CPD Accreditation Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              CPD Accredited | Provider No. 788000
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Executive Certificates for <span className="text-gold">Senior Leaders</span> &amp; Specialists
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Rigorous, 20-CPD-credit executive programmes designed for strategists, corporate directors, and senior practitioners. Master modern disciplines through the Harvard Case-Method, hands-on technical labs, and 1-on-1 faculty feedback.
            </p>

            {/* Trust Metrics Bar */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-y border-white/10 py-5 sm:grid-cols-4 max-w-4xl w-full text-center">
              <div>
                <p className="font-display text-2xl font-bold text-gold">20 Credits</p>
                <p className="text-xs uppercase tracking-wider text-slate-400">UK CPD Certified</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">70% Pass</p>
                <p className="text-xs uppercase tracking-wider text-slate-400">MCQ &amp; Capstone Rigour</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-gold">1-on-1</p>
                <p className="text-xs uppercase tracking-wider text-slate-400">Senior Faculty Review</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">Provider #788000</p>
                <p className="text-xs uppercase tracking-wider text-slate-400">The CPD Group (UK)</p>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a href="#portfolio" className="btn-gold px-8 py-3.5 text-sm font-bold shadow-lg shadow-gold/20">
                Explore Executive Portfolio
              </a>
              <Link
                href={`/contact?subject=${encodeURIComponent("Executive Education Advisory Enquiry")}&enquiry=advisor`}
                className="btn-outline border-white/30 text-white hover:border-gold hover:text-gold px-7 py-3.5 text-sm font-semibold backdrop-blur-sm"
              >
                Speak to a Programme Advisor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Portfolio Grid */}
      <section id="portfolio" className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              CPD-Accredited Executive Portfolio
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              Five Critical Disciplines for 2026
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Each executive certificate delivers 20 verifiable UK CPD credits under Provider #788000. Assessment requires achieving 70% across a 30% Theory MCQ exam and a 70% practical capstone deliverable.
            </p>
          </div>
          <div className="rounded-lg bg-navy/5 border border-slate-200 px-4 py-2.5 text-xs text-slate-600">
            GIRSD Members receive an automatic <strong className="text-navy">{discountPercent}% fee reduction</strong> at checkout.
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 sm:grid-cols-2">
          {courses.map((c, i) => {
            const memberPrice = Math.round(c.price * (1 - SITE.courseMemberDiscount));
            return (
              <Reveal key={c.slug} delay={(i % 3) * 90}>
                <div className="card card-lift group flex h-full flex-col overflow-hidden border border-slate-200/80 hover:border-gold/60 transition-all duration-300 shadow-sm hover:shadow-xl bg-white">
                  {/* Card Banner Image / Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-navy">
                    <img
                      src={c.image || "/co-generic.png"}
                      alt={c.title}
                      loading="lazy"
                      width={600}
                      height={340}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="rounded bg-gold px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-navy shadow-sm">
                        {c.code || "CPD"}
                      </span>
                      <span className="rounded bg-navy/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/20">
                        {c.duration}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="font-semibold text-gold-light">
                        CPD Provider #788000
                      </span>
                      <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                        70% Pass Standard
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-bold text-navy group-hover:text-gold-dark transition-colors">
                      {c.title}
                    </h3>
                    
                    <p className="mt-1 text-xs font-semibold text-slate-500 italic">
                      {c.subtitle}
                    </p>

                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {c.summary}
                    </p>

                    {/* Key Specifications */}
                    <dl className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Accreditation</dt>
                        <dd className="font-semibold text-navy">20 CPD Credits (UK)</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Methodology</dt>
                        <dd className="font-semibold text-navy">Harvard Case &amp; Tech Labs</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-slate-500">Executive Fee</dt>
                        <dd className="font-display text-lg font-bold text-navy">
                          £{c.price}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            (Members £{memberPrice})
                          </span>
                        </dd>
                      </div>
                    </dl>

                    {/* Dual Action CTAs */}
                    <div className="mt-6 grid grid-cols-2 gap-2 pt-2">
                      <Link
                        href={`/courses/${c.slug}`}
                        className="btn-outline text-center text-xs py-2.5 px-3 font-semibold group-hover:border-navy group-hover:bg-navy group-hover:text-white transition"
                      >
                        Explore Programme
                      </Link>
                      <Link
                        href={`/checkout?type=course&course=${c.slug}`}
                        className="btn-gold text-center text-xs py-2.5 px-3 font-bold shadow-sm"
                      >
                        Enrol Now
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* The GlobalRSD Learning Experience Section */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Pedagogical Architecture
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              The GlobalRSD Executive Learning Experience
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Executive development must transcend passive video lectures. Our programmes fuse academic rigour with hands-on enterprise application to build verifiable capabilities.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                1. Harvard Case-Method
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Immerse yourself in complex, multi-stakeholder corporate dilemmas. Dissect landmark boardroom turnarounds, regulatory compliance enforcement actions, and catastrophic failure post-mortems.
              </p>
            </div>

            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                2. Hands-on AI &amp; Tech Labs
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Step into interactive digital sandboxes. Build quantitative FAIR cyber risk financial spreadsheets, model BPMN 2.0 workflows, audit algorithmic bias, and calculate Scope 1–3 emissions.
              </p>
            </div>

            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                3. 1-on-1 Faculty Mentorship
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Receive direct, bespoke critique on your Capstone deliverables from doctoral academics, former C-suite officers, and certified management practitioners with decades of industry experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CPD Accreditation & Rigour Benchmark Section */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-navy via-[#0A1A2F] to-[#0E2849] p-8 sm:p-12 text-white shadow-2xl border border-gold/30">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 border border-gold/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-4">
                CPD Accredited | Provider No. 788000
              </span>
              <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                Uncompromising Assessment Standards
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                To protect the integrity of our credentials and guarantee immediate workplace value, every GlobalRSD Executive Certificate enforces a rigorous <strong>70% combined pass mark</strong>.
              </p>

              <div className="mt-6 space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 p-3.5">
                  <span className="rounded bg-gold/20 px-2 py-1 font-mono font-bold text-gold text-xs">
                    30%
                  </span>
                  <div>
                    <strong className="text-white">Theoretical MCQ Examination</strong>
                    <p className="mt-0.5 text-slate-300 text-xs">
                      Timed online evaluation testing regulatory frameworks, governance standards, and methodology mechanics.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 p-3.5">
                  <span className="rounded bg-gold/20 px-2 py-1 font-mono font-bold text-gold text-xs">
                    70%
                  </span>
                  <div>
                    <strong className="text-white">Applied Practical Capstone Dossier</strong>
                    <p className="mt-0.5 text-slate-300 text-xs">
                      Boardroom-ready deliverable pack formulated for your target enterprise, reviewed and graded personally by faculty.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/15 p-6 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-gold">
                Corporate Cohorts &amp; Enterprise Up-skilling
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Equip your risk committees, digital transformation units, and executive management teams with accredited, cohesive capabilities.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Corporate volume pricing for cohorts of 3+
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Tailored enterprise case studies and confidential capstone reviews
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Consolidated invoice billing and dedicated account advisor
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold font-bold">✓</span> Real-time progress dashboards for L&amp;D directors
                </li>
              </ul>

              <div className="mt-6 pt-5 border-t border-white/10">
                <Link
                  href={`/contact?subject=${encodeURIComponent("Corporate Cohort Consultation")}&enquiry=corporate`}
                  className="btn-gold w-full text-center py-3 text-xs font-bold block"
                >
                  Speak to a Programme Advisor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Footer Trust Signal */}
      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Official UK Accreditation Status
          </p>
          <p className="mt-1 font-display text-lg font-bold text-navy">
            The CPD Group Approved Provider — Provider No. 788000
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl mx-auto">
            All executive certificates are registered on the UK national CPD Register and verifiable worldwide via <Link href="/verify" className="underline font-semibold text-navy">globalrsd.co.uk/verify</Link>. Global Institute of Research &amp; Skills Development is a trading name of Q Tech Private Ltd (Company No. 15754767).
          </p>
        </div>
      </section>
    </>
  );
}
