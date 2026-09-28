import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PartnersGrid from "@/components/PartnersGrid";
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

      <PartnersGrid />

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
