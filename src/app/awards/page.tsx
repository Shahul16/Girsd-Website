import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { awardCategories, awards } from "@/lib/data/awards";
import { DemoForm, Field } from "@/components/forms";

export const metadata: Metadata = {
  title: "Global Awards",
  description:
    "The GIRSD Global Awards recognise outstanding individuals and institutions across academia and industry. Nominate online at no cost.",
  alternates: { canonical: "/awards" },
};

const allCategories = awards.map((a) => a.name);

export default function AwardsPage() {
  return (
    <>
      <PageHero
        eyebrow="GIRSD Global Awards 2026"
        title="Recognising Excellence in Research & Skills"
          intro="Celebrating outstanding researchers, educators, institutions and industry leaders from around the world. Nominations are submitted online at no cost."
      />

      {/* Intro + quick actions */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
          <div className="img-zoom mb-12 h-72 rounded-md shadow-card">
            <img
              src="/awards.png"
              alt="Awards ceremony trophies"
              loading="lazy"
              width={1200}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <h2 className="flourish font-display text-3xl font-bold">About the Awards</h2>
            <p className="mt-6 leading-relaxed text-muted">
              The GIRSD Global Awards honour excellence, innovation and impact across
              the research and skills-development community, recognising people and
              organisations advancing knowledge and building capability worldwide.
              Winners join a distinguished international network and are profiled across
              GIRSD channels.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Anyone may submit a nomination, on their own behalf or for a colleague,
              student, mentor or institution. Every entry is assessed against published
              criteria by an independent panel of academics and industry leaders.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="card p-7">
              <h3 className="font-display text-xl font-bold">At a glance</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex justify-between gap-4"><span>Award categories</span><span className="font-semibold text-navy">{awards.length}</span></li>
                <li className="flex justify-between gap-4"><span>Nomination fee</span><span className="font-semibold text-navy">Free</span></li>
              </ul>
              <a href="#nominate" className="btn-gold mt-6 w-full">Nominate now</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Nomination guidance */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <h2 className="flourish font-display text-3xl font-bold">What a Strong Nomination Includes</h2>
            <p className="mt-4 max-w-2xl text-muted">
              The clearest nominations connect a specific achievement to evidence of meaningful impact.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["A clear achievement", "Describe what the nominee did, their role, and why the work is outstanding in its field."],
              ["Evidence of impact", "Explain the measurable difference made for learners, research, an organisation or the wider community."],
              ["The right category", "Choose the category that most closely matches the nominee's contribution and professional context."],
              ["Complete supporting files", "Include a CV or relevant supporting document, plus public links where they strengthen the nomination."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="card h-full p-6">
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
          <h2 className="flourish font-display text-3xl font-bold">Award Categories</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Choose the category that best fits the nominee. Not sure which fits best?
            Our team will help place your nomination correctly.
          </p>
        </Reveal>

        <div className="mt-10 space-y-12">
          {awardCategories.map((group) => (
            <div key={group.category}>
              <h3 className="font-display text-xl font-bold text-navy">{group.category}</h3>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.awards.map((award, i) => (
                  <Reveal key={award.id} delay={(i % 3) * 90}>
                    <div className="card h-full border-t-4 border-t-gold p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">{award.track}</p>
                      <h4 className="mt-2 font-display text-lg font-bold">{award.name}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{award.description}</p>
                      <a href="#nominate" className="mt-4 inline-block text-sm font-semibold text-navy hover:text-gold-dark">Nominate for this category</a>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eligibility + Judging */}
      <section className="bg-cream py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <h2 className="flourish font-display text-3xl font-bold">Who Can Enter</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
              {[
                "Researchers, academics, educators and doctoral candidates at any career stage.",
                "Industry professionals whose work is informed by research or drives skills development.",
                "Departments, universities, colleges and organisations worldwide.",
                "Self-nominations and third-party nominations are equally welcome.",
                "There is no fee to nominate, and nominees need not be GIRSD members.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="mt-0.5 font-bold text-gold">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="flourish font-display text-3xl font-bold">How Entries Are Judged</h2>
            <ol className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
              {[
                ["Significance & impact", "The demonstrable difference the work has made to its field, organisation or community."],
                ["Excellence & rigour", "Quality, originality and methodological soundness of the work."],
                ["Innovation", "Novelty of approach and contribution to advancing practice."],
                ["Evidence", "Strength of the supporting evidence provided in the nomination."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{i + 1}</span>
                  <span><span className="font-semibold text-navy">{t}.</span> {b}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* How to nominate */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white">How to Nominate</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Choose a category", "Pick the award that best matches the nominee's achievements."],
              ["Complete the form", "Tell us about the nominee, provide an evidence statement, and attach a CV or other supporting document."],
              ["Submit online", "Send your nomination online. The awards team will review the submission and confirm receipt by email."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="h-full rounded-md border border-white/10 bg-white/5 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-display text-lg font-bold text-navy">{i + 1}</span>
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{t}</h3>
                  <p className="mt-2 text-sm text-slate-300">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nomination form */}
      <section id="nominate" className="mx-auto max-w-3xl px-4 py-16" aria-labelledby="nominate-heading">
        <Reveal>
          <h2 id="nominate-heading" className="flourish font-display text-3xl font-bold">
            Submit a Nomination
          </h2>
          <p className="mt-4 text-muted">
            Nominations may be made on your own behalf or for a colleague or
            institution. Select the category that best fits the nominee, then include
            the required supporting document. There is no fee to nominate.
          </p>
        </Reveal>
        <div className="card mt-8 p-8">
          <DemoForm
            name="Award nomination"
            submitLabel="Submit nomination"
            successMessage="Your nomination has been received. The awards committee will confirm receipt by email within two working days."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your full name" id="nominator-name" autoComplete="name" />
              <Field label="Your email" id="nominator-email" type="email" autoComplete="email" />
            </div>
            <Field label="Nomination type" id="nomination-type" as="select" options={["Self-nomination", "Nominating someone else"]} />
            <Field label="Award category" id="category" as="select" options={allCategories} />
            <Field label="Nominee name (individual or institution)" id="nominee" />
            <Field label="Nominee affiliation / organisation" id="affiliation" />
            <Field label="Nominee country" id="country" required={false} />
            <Field
              label="Evidence statement — why does this nominee deserve the award? (max 500 words)"
              id="statement"
              as="textarea"
              rows={7}
            />
            <Field label="Supporting links (publications, profiles, portfolio, social media links)" id="links" required={false} hint="Optional. Separate multiple links with commas." />
            <Field label="Supporting document (mandatory: CV or other supporting document)" id="attachment" as="file" accept=".pdf,.doc,.docx" hint="Required. PDF or Word document, max 10 MB." />
          </DemoForm>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 className="flourish font-display text-3xl font-bold">Frequently Asked Questions</h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {[
              ["Is there a fee to nominate?", "No. Nominating is free, whether you nominate yourself or someone else."],
              ["When can I submit a nomination?", "Nominations can be submitted online whenever you are ready with the required information and supporting document."],
              ["Do nominees have to be GIRSD members?", "No. Membership is not required to nominate or to receive an award."],
              ["Can I nominate myself?", "Yes. Self-nominations are welcome and assessed on the same basis as third-party nominations."],
              ["What supporting document is required?", "Every nomination must include a CV or another relevant supporting document in PDF or Word format, up to 10 MB."],
              ["Can I include online supporting evidence?", "Yes. You can include publication, profile, portfolio and social media links in the supporting links field."],
              ["How are winners chosen?", "An independent panel of academics and industry leaders assesses each entry against significance, excellence, innovation and evidence."],
              ["What happens after I submit?", "You will receive confirmation by email. The awards team then checks the submission for completeness before it goes to the independent judging panel."],
              ["Where are award enquiries handled?", "For questions about nominations, contact awards@globalrsd.co.uk."],
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="card group p-5">
                  <summary className="cursor-pointer list-none font-semibold text-navy [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {q}
                      <span aria-hidden="true" className="text-gold transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-8 text-center text-sm text-muted">
              Awards enquiries:{" "}
              <a href="mailto:awards@globalrsd.co.uk" className="font-semibold text-navy underline">awards@globalrsd.co.uk</a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
