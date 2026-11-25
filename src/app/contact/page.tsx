import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { DemoForm, Field } from "@/components/forms";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Global Innovation for Research and Skills Development. Enquiries about conferences, courses, membership, awards and partnerships.",
  alternates: { canonical: "/contact" },
};

const departments = [
  {
    name: "General Enquiries & Support",
    email: SITE.email,
    desc: "General queries, student help, course certificates & verification",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Research & Conferences",
    email: SITE.researchEmail,
    desc: "Call for papers, conference presentations, reviews & academic events",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: "Awards & Honours",
    email: SITE.awardsEmail,
    desc: "Annual GIRSD awards nominations, portfolio submissions & jury queries",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    name: "Memberships & Committee",
    email: SITE.membershipEmail,
    desc: "Institutional memberships, advisory committee applications & fellowships",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: "Careers & HR",
    email: SITE.hrEmail,
    desc: "Job openings, internship applications, CV submissions & talent inquiries",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Finance & Accounts",
    email: SITE.financeEmail,
    desc: "Stripe billing queries, invoice requests, fee payments & refunds",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    name: "Data Protection & Legal",
    email: SITE.privacyEmail,
    desc: "UK GDPR compliance, data subject requests, ICO notices & terms",
    icon: (
      <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd Be Delighted to Hear From You"
        intro="Questions about an event, a course, membership or partnership? Direct your enquiry to the relevant department below or submit a message."
      />

      {/* Department Directory Grid */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy">Direct Department Directory</h2>
          <p className="mt-2 text-sm text-slate-600">Reach the specific team directly or use our unified enquiry form below.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept.name} className="card p-5 border border-slate-200/80 hover:border-gold transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-navy/5">{dept.icon}</div>
                  <h3 className="font-display text-base font-bold text-navy">{dept.name}</h3>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{dept.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={`mailto:${dept.email}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <span>{dept.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-[1fr_380px]">
        <Reveal>
          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold">Send an Enquiry</h2>
            <div className="mt-6">
              <DemoForm
                name="Contact enquiry form"
                submitLabel="Send enquiry"
                successMessage="Your enquiry has been received. A member of the team will reply within two working days."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" id="name" autoComplete="name" />
                  <Field label="Email address" id="email" type="email" autoComplete="email" />
                </div>
                <Field
                  label="Subject"
                  id="subject"
                  as="select"
                  options={[
                    "Conference / event enquiry",
                    "Course enquiry",
                    "Membership",
                    "Awards & nominations",
                    "Sponsorship & exhibiting",
                    "Partnership / agents",
                    "Other",
                  ]}
                />
                <Field label="Your message" id="message" as="textarea" />
              </DemoForm>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <aside aria-label="Company details">
            <div className="rounded-md bg-navy p-8 text-white shadow-card">
              <h2 className="font-display text-xl font-bold text-gold">Company Details</h2>
              <dl className="mt-5 space-y-4 text-sm leading-relaxed text-slate-200">
                <div>
                  <dt className="font-semibold text-white">Legal entity</dt>
                  <dd>{SITE.company.legalName} (trading as {SITE.company.tradingAs})</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Company number</dt>
                  <dd>{SITE.company.number} (England &amp; Wales)</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Registered office</dt>
                  <dd>{SITE.company.address}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">General Inquiries</dt>
                  <dd>
                    <a href={`mailto:${SITE.email}`} className="text-gold-light underline">{SITE.email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">WhatsApp</dt>
                  <dd>
                    <a href={SITE.whatsapp} className="text-gold-light underline">{SITE.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Office hours</dt>
                  <dd>Monday–Friday, 10:00–18:00 (UK time)</dd>
                </div>
              </dl>
            </div>
          </aside>
        </Reveal>
      </section>
    </>
  );
}
