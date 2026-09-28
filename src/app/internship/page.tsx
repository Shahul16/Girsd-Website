import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import { DemoForm, Field } from "@/components/forms";
import { SITE } from "@/lib/site";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Internships",
  description:
    "International internships with GIRSD — real project experience, CPD certification and multi-domain, multi-industry placements for students and recent graduates.",
  alternates: { canonical: "/internship" },
};

const stats = [
  { value: 500, suffix: "+", label: "Interns placed" },
  { value: 20, suffix: "+", label: "Countries represented" },
  { value: 8, suffix: "", label: "Domains to choose from" },
  { value: 100, suffix: "%", label: "CPD-certified on completion" },
];

const domains = [
  {
    title: "Business & Management",
    body: "Strategy, operations and project support on live institute initiatives.",
    icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
  },
  {
    title: "Data & Technology",
    body: "Analytics, dashboards and digital tooling for events and research teams.",
    icon: "M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z",
  },
  {
    title: "Marketing & Communications",
    body: "Campaigns, content and social media for conferences and courses.",
    icon: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535",
  },
  {
    title: "Human Resources",
    body: "Talent coordination, onboarding and people operations support.",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    title: "Finance & Accounting",
    body: "Budgeting, reporting and financial analysis on real institute projects.",
    icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z",
  },
  {
    title: "Research & Academia",
    body: "Literature reviews, data collection and support for our research review committee.",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342",
  },
  {
    title: "Events & Operations",
    body: "Hands-on delivery of international conferences, from planning to on-site logistics.",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  },
  {
    title: "Education & Training",
    body: "Course design support, tutoring assistance and learner success initiatives.",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  },
];

const highlights = [
  {
    title: "Real work, not busywork",
    body: "Every intern is placed on an active project — conference delivery, research, courses or marketing — with real deliverables and a named supervisor.",
  },
  {
    title: "International & remote-friendly",
    body: "Open to students and graduates worldwide. Most placements run remotely or hybrid, with select on-site roles at our UK events.",
  },
  {
    title: "CPD-certified on completion",
    body: `Every completed internship earns a CPD-certified GIRSD certificate — ${SITE.registrations.cpd.body}.`,
  },
  {
    title: "Multi-domain, multi-industry",
    body: "Choose from research, events, marketing, HR, finance, data and education tracks — placed against real industry and academic partners.",
  },
];

const steps = [
  { step: "1", title: "Apply online", body: "Tell us your domain of interest, availability and CV — takes five minutes." },
  { step: "2", title: "Get matched", body: "We match you to a live project and team based on your interests and skills." },
  { step: "3", title: "Do the work", body: "4–12 weeks of real project work with regular check-ins and mentor support." },
  { step: "4", title: "Get certified", body: "Receive your CPD-certified certificate of completion and a reference." },
];

const faqs = [
  {
    q: "Is the internship paid?",
    a: "Placements are unpaid but flexible and remote-friendly, and every intern completes with a CPD-certified certificate, a portfolio of real project work and a reference — built to make you more employable, not to replace a paid role.",
  },
  {
    q: "Can I intern remotely?",
    a: "Yes — most placements run fully remote or hybrid, so you can intern from anywhere with a laptop and a reliable internet connection. A small number of on-site roles are available around our UK conferences.",
  },
  {
    q: "Who can apply?",
    a: "Current students and recent graduates (within two years of graduating) from any country and any discipline. No prior internship experience is required — we place people by potential, not just CV history.",
  },
  {
    q: "How much time does it take?",
    a: "Most interns commit 10–15 hours a week for 4–12 weeks, fitted around study or other work. Your preferred duration is confirmed with your supervisor before you start.",
  },
  {
    q: "How long until I hear back?",
    a: "Applications are reviewed on a rolling basis. Shortlisted candidates are typically contacted for a short call within two weeks of applying.",
  },
];

export default function InternshipPage() {
  return (
    <>
      {/* Photographic hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <img
          src={IMAGES.heroConference}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/80 to-navy/60"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <p className="animate-fadeUp text-sm font-semibold uppercase tracking-widest text-gold">
            Internships
          </p>
          <h1 className="mt-3 max-w-3xl animate-fadeUp font-display text-3xl font-bold text-white sm:text-5xl" style={{ animationDelay: "120ms" }}>
            International Internships, Real Experience
          </h1>
          <p className="mt-5 max-w-2xl animate-fadeUp text-lg text-slate-300" style={{ animationDelay: "240ms" }}>
            Multi-domain, multi-industry internships with real project work and a CPD-certified certificate on completion — open to students and recent graduates worldwide.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 animate-fadeUp" style={{ animationDelay: "360ms" }}>
            <a href="#apply" className="btn-gold">Apply Now</a>
            <a href="#domains" className="rounded-md border-2 border-white/50 px-5 py-2.5 font-semibold text-white transition hover:border-gold hover:text-gold">
              Explore Domains
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-line bg-white py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-navy sm:text-4xl">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why intern with us — feature image + narrative */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="img-zoom h-72 overflow-hidden rounded-xl shadow-md sm:h-96">
              <img src={IMAGES.aboutTeam} alt="Interns and graduates collaborating on a real project" loading="lazy" width={800} height={500} className="w-full h-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Why Intern With GIRSD</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-navy">
              Built for real experience, not a certificate mill
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              GIRSD interns work alongside the same team that delivers our
              international conferences, certified courses and global awards —
              not on simulated exercises. You get a named mentor, a real
              project brief, and a CPD-certified certificate that reflects
              work you actually did.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {highlights.map((h) => (
                <div key={h.title} className="border-l-2 border-gold pl-4">
                  <h3 className="font-display text-base font-bold text-navy">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{h.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Domains */}
      <section id="domains" className="scroll-mt-24 bg-cream py-16" aria-labelledby="domains-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <h2 id="domains-heading" className="flourish font-display text-3xl font-bold">
              Choose Your Domain
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Placements run across every part of the institute, so you can intern in the area closest to your studies or career goals.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {domains.map((d, i) => (
              <Reveal key={d.title} delay={(i % 4) * 80}>
                <div className="card card-lift h-full p-6">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d={d.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-navy">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="how-heading">
        <Reveal>
          <h2 id="how-heading" className="flourish font-display text-3xl font-bold">
            How It Works
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 90}>
              <div className="card h-full p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-gold">
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="bg-navy py-16 text-white" aria-labelledby="what-you-get-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <h2 id="what-you-get-heading" className="font-display text-3xl font-bold text-white">
              What You Get
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Reveal>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> CPD-certified certificate of completion</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> Real project work you can put in a portfolio</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> A named mentor and regular feedback</li>
              </ul>
            </Reveal>
            <Reveal delay={90}>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> Reference letter on request after completion</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> Flexible remote, hybrid or on-site placements</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span> 20% membership discount for interns who join GIRSD</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Community photo band */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <img
          src={IMAGES.membershipNetwork}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-navy/85" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <p aria-hidden="true" className="font-display text-5xl leading-none text-gold">&ldquo;</p>
            <p className="mt-2 font-display text-xl font-medium leading-relaxed text-white sm:text-2xl">
              Interning with GIRSD put me on real conference and research
              projects from week one — the mentorship and the CPD certificate
              opened doors a classroom project never could.
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-gold-light">
              Former GIRSD Intern
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 id="faq-heading" className="flourish font-display text-3xl font-bold">
              Frequently Asked Questions
            </h2>
          </Reveal>
          <div className="mt-8 space-y-5">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <div className="card p-6">
                  <h3 className="font-display text-base font-bold text-navy">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="scroll-mt-24 py-16" aria-labelledby="apply-heading">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 id="apply-heading" className="flourish font-display text-3xl font-bold">
              Apply for an Internship
            </h2>
            <p className="mt-4 text-slate-600">
              Complete the form and attach your CV. Applications are reviewed on a
              rolling basis; shortlisted candidates are invited to a short call.
              For questions, email{" "}
              <a href={`mailto:${SITE.hrEmail}`} className="font-semibold text-navy underline">{SITE.hrEmail}</a>.
            </p>
          </Reveal>
          <div className="card mt-8 p-8">
            <DemoForm
              name="Internship application"
              submitLabel="Submit application"
              successMessage="Thank you for applying. Our internship team reviews applications on a rolling basis and will be in touch."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" id="intern-name" autoComplete="name" />
                <Field label="Email address" id="intern-email" type="email" autoComplete="email" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone / WhatsApp" id="intern-phone" type="tel" autoComplete="tel" />
                <Field label="Country" id="intern-country" autoComplete="country-name" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Domain of interest" id="intern-domain" as="select" options={domains.map((d) => d.title)} />
                <Field
                  label="Preferred duration"
                  id="intern-duration"
                  as="select"
                  options={["4 weeks", "6 weeks", "8 weeks", "12 weeks"]}
                />
              </div>
              <Field label="University / current status" id="intern-status" hint="e.g. final-year student, recent graduate" />
              <Field
                label="Why do you want to intern with GIRSD?"
                id="intern-note"
                as="textarea"
                rows={5}
              />
              <Field
                label="CV / Resume"
                id="intern-cv"
                as="file"
                accept=".pdf,.doc,.docx"
                hint="PDF or Word, max 10 MB."
              />
            </DemoForm>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 text-center">
        <Reveal>
          <p className="text-sm text-slate-500">
            Looking for a paid or full-time role instead?{" "}
            <Link href="/careers" className="font-semibold text-navy underline">View careers at GIRSD</Link>.
          </p>
        </Reveal>
      </section>
    </>
  );
}
