import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EventDirectory from "@/components/EventDirectory";

export const metadata: Metadata = {
  title: "Workshops",
  description: "Practical GIRSD workshops led by experienced practitioners, with focused learning, certificates and follow-up support.",
  alternates: { canonical: "/events/workshops" },
};

const SHORT_WORKSHOPS = [
  {
    track: "Digital Marketing Sprint",
    domain: "SEO, GA4 Analytics, & Campaign Audits",
    standardFee: "£75",
    memberFee: "£65",
    deliverables: [
      "Live interactive 60-min session",
      "Access to sandbox tools & templates",
      "Standard Certificate of Attendance",
    ],
  },
  {
    track: "Effective Managerial Sprint",
    domain: "Delegation, Motivation, & Performance",
    standardFee: "£95",
    memberFee: "£85",
    deliverables: [
      "Live peer cohort scenario labs",
      "Professional management workbook",
      "Standard Certificate of Attendance",
    ],
  },
  {
    track: "Academic Writing & Publishing",
    domain: "Manuscript Structure & Submission Strategy",
    standardFee: "£95",
    memberFee: "£85",
    deliverables: [
      "Journal editor diagnostic framework",
      "Desk-rejection prevention checklist",
      "Standard Certificate of Attendance",
    ],
  },
  {
    track: "Advanced Research Methodologies",
    domain: "Quantitative & Qualitative Frameworks",
    standardFee: "£95",
    memberFee: "£85",
    deliverables: [
      "Empirical data analysis templates",
      "Methodological validation mapping",
      "Standard Certificate of Attendance",
    ],
  },
];

export default function WorkshopsPage() {
  return (
    <>
      <PageHero
        eyebrow="Events / Workshops"
        title="Practical skills workshops"
        intro="Build capability through focused, small-group workshops led by practitioners who understand the work you need to do."
      />
      <EventDirectory
        title="Upcoming workshops"
        intro="Choose a practical session, review the learning focus and reserve your place."
        category="Skills Development Workshops"
      />

      <section className="mx-auto max-w-7xl px-4 pb-4" aria-labelledby="resume-workshop-heading">
        <div className="rounded-2xl bg-navy p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">New digital workshop</p>
          <h2 id="resume-workshop-heading" className="mt-2 font-display text-2xl font-bold">
            Optimise LinkedIn and your AI-assisted resume
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-200">
            Learn how to present your experience like an international expert, create a practical plan for using AI to draft a tailored resume, and leave with a free digital certificate of attendance.
          </p>
        </div>
      </section>

      {/* 1-HOUR SHORT WORKSHOPS PRICING */}
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="short-workshops-heading">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-gold/15 border border-gold/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-dark mb-4">Official Price List</span>
          <h2 id="short-workshops-heading" className="font-display text-3xl font-bold">Future 1-Hour Short Workshops</h2>
          <p className="mt-3 text-slate-500 max-w-2xl mx-auto text-sm">Focused, high-impact 60-minute live sessions. <strong>No CPD Certificate</strong> — Standard Certificate of Attendance included with every session.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {SHORT_WORKSHOPS.map((w) => (
            <article key={w.track} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-navy">{w.track}</h3>
                  <p className="mt-1 text-sm text-slate-500">{w.domain}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">From</p>
                  <p className="font-display text-2xl font-bold text-navy">{w.standardFee}</p>
                  <p className="text-xs text-gold-dark">Members {w.memberFee}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {w.deliverables.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden="true" className="text-gold-dark">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            <span className="font-bold text-navy">Member pricing</span> applies to all active GIRSD members and verified corporate delegates. All sessions are delivered live online and are not recorded.
          </p>
          <a href="/membership" className="btn-gold shrink-0 text-sm">Become a Member</a>
        </div>
      </section>
    </>
  );
}
