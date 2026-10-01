import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { membershipTiers } from "@/lib/data/memberships";
import { committees } from "@/lib/data/people";
import { DemoForm, Field } from "@/components/forms";
import MembershipTiersSection from "@/components/MembershipTiersSection";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join GIRSD from £49 per year. Choose a Student, Academic or Industry membership with event discounts, professional development and committee opportunities.",
  alternates: { canonical: "/membership" },
};

const committeeOptions = committees.map((committee) => committee.name);

const comparisonRows = [
  ["10% discount on all conference tickets", true, true, true],
  ["5% discount on online courses", true, true, true],
  ["Members-only quarterly briefings", true, true, true],
  ["Member community forum", true, true, true],
  ["Digital membership certificate", true, true, true],
  ["Priority paper review scheduling", false, true, false],
  ["Cross-sector mentoring scheme", false, true, true],
  ["Eligibility for committee service", false, true, false],
  ["Two workshop delegate passes per year", false, false, true],
  ["Industry panel speaking opportunities", false, false, true],
  ["Company profile in GIRSD directory", false, false, true],
] as [string, boolean, boolean, boolean][];

const membershipBenefits = [
  ["Professional development", "Access courses, workshops, conferences and briefings designed for research and skills development."],
  ["A connected community", "Build relationships with researchers, educators, students and industry professionals across sectors."],
  ["Recognition and opportunity", "Develop your profile through committee service, speaking opportunities and community participation."],
  ["Practical member value", "Receive member pricing on events and courses, plus access to selected resources and programmes."],
];

export default function MembershipPage() {
  return (
    <>
      <PageHero
        eyebrow="GIRSD Membership"
        title="Choose the membership that fits your goals"
        intro="Join a growing international community of researchers, educators, students and industry professionals. Start with the tier that matches your current role and make more of every GIRSD opportunity."
      />

      <MembershipTiersSection />

      <section className="bg-cream py-16" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 id="benefits-heading" className="flourish font-display text-3xl font-bold">More than a discount</h2>
            <p className="mt-4 text-slate-600">Membership is designed to support your learning, professional network and contribution to the wider community.</p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {membershipBenefits.map(([title, body], i) => (
              <Reveal key={title} delay={i * 80}>
                <article className="card h-full p-6">
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="compare-heading">
        <Reveal>
          <h2 id="compare-heading" className="flourish text-center font-display text-3xl font-bold">Compare membership tiers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">Use the comparison below to choose the level of access and participation that suits your goals.</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <caption className="sr-only">Comparison of membership tier benefits</caption>
              <thead>
                <tr className="bg-navy text-white">
                  <th scope="col" className="p-4 text-left font-display">Benefit</th>
                  <th scope="col" className="p-4 text-center font-display">Student<br /><span className="text-gold">£49/year</span></th>
                  <th scope="col" className="border-x-2 border-gold bg-navy-light p-4 text-center font-display">Academic<br /><span className="text-gold">£99/year</span></th>
                  <th scope="col" className="p-4 text-center font-display">Industry<br /><span className="text-gold">£249/year</span></th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, student, academic, industry], i) => (
                  <tr key={label} className={i % 2 ? "bg-cream" : "bg-white"}>
                    <th scope="row" className="p-4 text-left font-medium text-slate-700">{label}</th>
                    {[student, academic, industry].map((included, column) => (
                      <td key={column} className={`p-4 text-center ${column === 1 ? "border-x-2 border-gold/60" : ""}`}>
                        {included ? <span aria-label="Included" className="font-bold text-emerald-600">✓</span> : <span aria-label="Not included" className="text-slate-300">Not included</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-white">
                  <td className="p-4" />
                  {membershipTiers.map((tier) => (
                    <td key={tier.id} className={`p-4 text-center ${tier.featured ? "border-x-2 border-gold/60" : ""}`}>
                      <Link href={`/checkout?type=membership&tier=${tier.id}`} className={`${tier.featured ? "btn-gold" : "btn-navy"} text-sm`}>Choose {tier.name}</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className="bg-cream py-16" aria-labelledby="committee-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 id="committee-heading" className="flourish font-display text-3xl font-bold">Join our committees</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Committee participation is a separate professional pathway for researchers, educators, practitioners and sector leaders who want to contribute their expertise to GIRSD programmes.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {committees.map((committee, i) => (
              <Reveal key={committee.name} delay={i * 80}>
                <article className="card h-full border-t-4 border-t-gold p-7">
                  <h3 className="font-display text-xl font-bold">{committee.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{committee.description}</p>
                  <a href="#committee-application" className="mt-5 inline-block text-sm font-semibold text-navy hover:text-gold-dark">Apply for this committee</a>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-2">
            <Reveal>
              <div className="card h-full p-8">
                <h3 className="font-display text-xl font-bold">Committee member benefits</h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
                  {[
                    "Recognition across the GIRSD professional network",
                    "A voice in shaping events, programmes and committee priorities",
                    "Official committee membership certificate",
                    "Opportunities for meaningful international collaboration",
                  ].map((benefit) => <li key={benefit} className="flex gap-2"><span aria-hidden="true" className="text-gold-dark">✓</span><span>{benefit}</span></li>)}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div id="committee-application" className="card p-8">
                <h3 className="font-display text-xl font-bold">Committee application</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">Applications are reviewed by the relevant committee and membership team. Shortlisted applicants are contacted by email.</p>
                <div className="mt-5">
                  <DemoForm
                    name="Committee membership application"
                    submitLabel="Submit application"
                    successMessage="Your application has been received and sent to the membership team. We will review it and respond by email."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Prefix (Dr, Prof, Mr, Ms)" id="committee-prefix" />
                      <Field label="First name" id="committee-first" autoComplete="given-name" />
                      <Field label="Last name" id="committee-last" autoComplete="family-name" />
                      <Field label="Email" id="committee-email" type="email" autoComplete="email" />
                      <Field label="Phone" id="committee-phone" type="tel" autoComplete="tel" />
                      <Field label="Country" id="committee-country" autoComplete="country-name" />
                    </div>
                    <Field label="Organisation or institution" id="committee-organisation" />
                    <Field label="Committee" id="committee" as="select" options={committeeOptions} />
                    <Field label="Area of expertise" id="committee-expertise" as="textarea" rows={4} hint="Briefly describe your professional or academic expertise." />
                    <Field label="Why would you like to join this committee?" id="committee-interest" as="textarea" rows={5} />
                    <Field label="CV or supporting document" id="committee-attachment" as="file" required={false} accept=".pdf,.doc,.docx" hint="Optional. PDF or Word document, maximum 10 MB." />
                  </DemoForm>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-navy py-16 text-white" aria-labelledby="sponsors-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold">For organisations</p>
              <h2 id="sponsors-heading" className="mt-3 font-display text-3xl font-bold text-white">Partner with GIRSD</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">
                Organisations can support the community through conference sponsorship, exhibition, programme collaboration or a tailored year-round partnership.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">◆</span> Conference and summit exhibition</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">◆</span> Session and keynote sponsorship</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">◆</span> Awards category sponsorship</li>
                <li className="flex gap-2"><span aria-hidden="true" className="text-gold">◆</span> Digital and event visibility</li>
              </ul>
            </div>
            <div className="rounded-md border border-gold/40 bg-white/5 p-8 text-center">
              <p className="font-display text-2xl font-bold text-gold">Start a conversation</p>
              <p className="mt-3 text-sm text-slate-300">Request the sponsorship prospectus or discuss a tailored partnership.</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/contact" className="btn-gold">Request the prospectus</Link>
                <Link href="/partner" className="rounded-md border-2 border-white/50 px-5 py-2.5 font-semibold text-white transition hover:border-gold hover:text-gold">Explore partnerships</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
