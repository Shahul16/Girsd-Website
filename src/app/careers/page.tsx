import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { DemoForm, Field } from "@/components/forms";
import { openings, type JobOpening } from "@/lib/data/careers";
import { SITE } from "@/lib/site";
import { getSiteContent } from "@/lib/server/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Careers | ${SITE.shortName}`,
  description:
    "Join the Global Innovation for Research and Skills Development. Current openings across events, marketing, academic programmes and teaching — plus speculative applications.",
};

const values = [
  {
    title: "Purpose you can measure",
    body: "Every conference delivered, paper presented and learner certified is a tangible outcome. You will see the impact of your work at each event.",
  },
  {
    title: "Flexible & modern",
    body: "Hybrid and remote-first roles, sensible hours around event peaks, and the tooling to work properly from anywhere in the UK.",
  },
  {
    title: "Grow with the institute",
    body: "Free access to our CPD courses and conferences, plus a personal development budget as the institute scales.",
  },
  {
    title: "Small team, real ownership",
    body: "No layers of bureaucracy — you own your area end-to-end and work directly with the leadership team.",
  },
];

export default async function CareersPage() {
  const content = await getSiteContent("careers");
  const currentOpenings = Array.isArray(content) ? content as JobOpening[] : openings;
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build the future of research & skills with us"
        intro="GIRSD is a growing UK institute delivering international conferences, certified CPD courses and professional awards. We hire people who care about academic quality and flawless delivery."
      />

      {/* Why join */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-label="Why work at GIRSD">
        <Reveal>
          <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">Why work at {SITE.shortName}</h2>
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className="card h-full p-6">
                <h3 className="font-display text-lg font-bold text-navy">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="bg-cream" aria-label="Open positions">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">Open positions</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {currentOpenings.length} current opening{currentOpenings.length === 1 ? "" : "s"}. Don&apos;t see your role?
              Speculative applications are welcome via the form below.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              Salary ranges are stated in pounds sterling and reflect role scope, experience and working pattern. Final offers are confirmed during the recruitment process and comply with applicable UK employment requirements.
            </p>
          </Reveal>
          <div className="mt-8 space-y-5">
            {currentOpenings.map((job, i) => (
              <Reveal key={job.id} delay={i * 80}>
                <article className="card p-6 sm:p-8" aria-labelledby={`job-${job.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 id={`job-${job.id}`} className="font-display text-xl font-bold text-navy">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{job.summary}</p>
                      <p className="mt-2 text-sm font-semibold text-navy">{job.salary}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600"><span className="font-semibold text-navy">Package:</span> {job.package}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {job.highlight && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          {job.highlight}
                        </span>
                      )}
                      {[job.department, job.type, job.location].map((tag) => (
                        <span key={tag} className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What you&apos;ll do</h4>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {job.responsibilities.map((r) => (
                          <li key={r} className="flex gap-2.5">
                            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What we&apos;re looking for</h4>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {job.requirements.map((r) => (
                          <li key={r} className="flex gap-2.5">
                            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <a href="#apply" className="btn-navy mt-6 inline-block text-sm">
                    Apply for this role
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16" aria-label="Application form">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div>
              <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">Apply now</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Complete the form and attach your CV — your application goes
                straight to our hiring team, and we reply to every applicant.
                For questions, email{" "}
                <a href={`mailto:${SITE.hrEmail}`} className="font-semibold text-navy underline">{SITE.hrEmail}</a>.
              </p>
              <p className="mt-4 rounded-lg border border-slate-200 bg-cream p-4 text-xs leading-relaxed text-slate-500">
                {SITE.shortName} is an equal-opportunity employer. We assess
                applications on merit and welcome candidates of all backgrounds.
                Application data is processed under our{" "}
                <a href="/legal/privacy" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card p-6 sm:p-8">
              <DemoForm
                name="Job application"
                submitLabel="Submit application"
                successMessage="Thank you for applying. Our hiring team will review your CV and respond within 5 working days."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" id="name" autoComplete="name" />
                  <Field label="Email address" id="email" type="email" autoComplete="email" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone / WhatsApp" id="phone" type="tel" autoComplete="tel" />
                  <Field
                    label="Position"
                    id="position"
                    as="select"
                    options={[
                      ...openings.map((j) => j.title),
                      "Other / General Application",
                      "Speculative / Future Roles",
                    ]}
                  />
                </div>
                <Field label="LinkedIn profile (optional)" id="linkedin" type="url" required={false} />
                <Field
                  label="Why you? (short cover note)"
                  id="cover-note"
                  as="textarea"
                  rows={5}
                />
                <Field
                  label="CV / Resume"
                  id="cv"
                  as="file"
                  accept=".pdf,.doc,.docx"
                  hint="PDF or Word, max 10 MB."
                />
              </DemoForm>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
