import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { DemoForm, Field } from "@/components/forms";

export const metadata: Metadata = {
  title: "Partner With Us",
  description:
    "Become a GIRSD partner or authorised agent — promote our conferences, courses and membership in your region with commission and marketing support.",
  alternates: { canonical: "/partner" },
};

const models = [
  {
    title: "Authorised Agents",
    description:
      "Represent GIRSD in your country or region. Agents promote conferences, courses and membership to their networks and earn commission on every confirmed registration, with marketing materials and a named account manager provided.",
  },
  {
    title: "Academic Partners",
    description:
      "Universities and colleges co-host conferences, contribute to research review committees and offer member benefits to their staff and students. Partners receive co-branding on event materials and reserved committee places.",
  },
  {
    title: "Industry Partners",
    description:
      "Employers sponsor awards, host site visits, contribute case studies to courses and access our talent community. Industry partners shape skills content so it reflects real workplace demand.",
  },
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner With Us"
        title="Grow With GIRSD"
        intro="From regional agents to institutional partners, we collaborate with organisations that share our commitment to research and skills."
      />

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {models.map((m, i) => (
            <Reveal key={m.title} delay={i * 90}>
              <div className="card h-full border-t-4 border-t-gold p-6">
                <h2 className="font-display text-xl font-bold">{m.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Partnership Investment section */}
      <section className="bg-navy py-16 text-white" aria-labelledby="investment-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Investment</p>
            <h2 id="investment-heading" className="mt-3 font-display text-3xl font-bold text-white">
              Partnership Investment
            </h2>
            <p className="mt-4 mx-auto max-w-2xl leading-relaxed text-slate-300">
              Transparent pricing for our two flagship institutional programmes. Tailored and multi-year packages are available on request.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Reveal>
              <div className="flex h-full flex-col rounded-xl border border-gold/30 bg-white/5 p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">Universities &amp; Colleges</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">University Department Affiliation (MOU)</h3>
                <p className="mt-4 font-display text-5xl font-black text-gold">£2,850<span className="text-lg font-normal text-slate-400">/year</span></p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                  {[
                    "10 conference paper submissions included",
                    "3 faculty memberships (MGIRSD post-nominal)",
                    "Co-branded conference proceedings",
                    "Student mobility advisory sessions",
                    "Institutional listing in GIRSD Global Directory",
                  ].map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 text-gold">◆</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <a href="/contact" className="btn-gold mt-8 w-full text-center">Enquire About MOU</a>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="flex h-full flex-col rounded-xl border border-gold/30 bg-white/5 p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">Corporate Sponsors</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">Corporate Event Sponsor — Gold Tier</h3>
                <p className="mt-4 font-display text-5xl font-black text-gold">£3,500<span className="text-lg font-normal text-slate-400 ml-1">per event</span></p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                  {[
                    "Keynote speaking address at London or Dubai event",
                    "Exhibition space at chosen conference",
                    "Primary branding on all conference marketing",
                    "Logo on proceedings, website & email campaigns",
                    "4 complimentary delegate passes",
                  ].map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 text-gold">◆</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <a href="/contact" className="btn-gold mt-8 w-full text-center">Become a Sponsor</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16" aria-labelledby="agent-form-heading">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 id="agent-form-heading" className="flourish font-display text-3xl font-bold">
              Agent Application
            </h2>
            <p className="mt-4 text-slate-600">
              Tell us about yourself and your network. Applications are reviewed
              within five working days; successful applicants receive an agent
              agreement, commission schedule and onboarding call.
            </p>
          </Reveal>
          <div className="card mt-8 p-8">
            <DemoForm
              name="Agent application form"
              submitLabel="Apply to become an agent"
              successMessage="Your application has been received. The partnerships team will review it and respond within five working days."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" id="agent-name" autoComplete="name" />
                <Field label="Email address" id="agent-email" type="email" autoComplete="email" />
                <Field label="Organisation (if any)" id="agent-org" required={false} />
                <Field label="Country / region you would cover" id="agent-region" />
              </div>
              <Field
                label="Relevant experience"
                id="agent-experience"
                as="select"
                options={[
                  "Education agency / student recruitment",
                  "Training or events industry",
                  "Academic network / university role",
                  "Marketing and business development",
                  "Other",
                ]}
              />
              <Field
                label="Tell us about your network and how you would promote GIRSD"
                id="agent-pitch"
                as="textarea"
              />
            </DemoForm>
          </div>
        </div>
      </section>
    </>
  );
}
