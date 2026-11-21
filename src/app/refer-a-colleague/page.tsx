import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ReferralForm from "./ReferralForm";
import { courses } from "@/lib/data/courses";

export const metadata: Metadata = {
  title: "Refer a Colleague | Executive Referral Programme | GlobalRSD",
  description:
    "Refer a colleague to the GlobalRSD Executive Experience. Share world-class, CPD-accredited learning with your network and receive £50 for every successful enrollment.",
  alternates: { canonical: "/refer-a-colleague" },
};

export default function ReferAColleaguePage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy via-navy to-[#0F243E] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DDA853_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="flex flex-col items-center text-center">
            {/* CPD Trust Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              CPD Accredited | Provider No. 788000
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
              Refer a Colleague to the <span className="text-gold">GlobalRSD</span> Executive Experience
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Share world-class, CPD-accredited learning with your network and receive a reward. Receive <strong className="text-gold font-bold">£50</strong> for every successful enrollment.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-200">
              <span>🎁 <strong>Colleague Receives:</strong> £50 Tuition Discount</span>
              <span className="text-gold">·</span>
              <span>💰 <strong>You Receive:</strong> £50 Cash Rebate</span>
            </div>
          </div>

          {/* ACTION BOX: EMAIL GENERATOR */}
          <div className="mt-12 max-w-2xl mx-auto">
            <ReferralForm />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 STEPS) */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              How the Executive Referral Programme Works
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Rewarding knowledge-sharing and professional development across global enterprise networks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1: Invite */}
            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 font-display text-7xl font-black text-slate-100 select-none pointer-events-none">
                01
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6 font-bold text-lg">
                ✉️
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                1. Invite
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Share your personalised referral link with colleagues, industry peers, or corporate teams seeking verified UK CPD credentials.
              </p>
            </div>

            {/* Step 2: Save */}
            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 font-display text-7xl font-black text-slate-100 select-none pointer-events-none">
                02
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6 font-bold text-lg">
                🎟️
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                2. Save
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Each colleague who enrolls receives an immediate <strong>£50 discount</strong> off their programme fee automatically applied at checkout.
              </p>
            </div>

            {/* Step 3: Receive */}
            <div className="card p-8 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 font-display text-7xl font-black text-slate-100 select-none pointer-events-none">
                03
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold mb-6 font-bold text-lg">
                💷
              </div>
              <h3 className="font-display text-lg font-bold text-navy">
                3. Receive
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                For every colleague who successfully enrolls and completes the commitment period, you receive a <strong>£50 rebate</strong> paid directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBLE PROGRAMMES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
            Accredited Qualifications
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl">
            Eligible Executive Programmes
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Refer colleagues to any of our 5 CPD-accredited Executive Certificates. All courses qualify for the £50 colleague discount and £50 referral reward.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 sm:grid-cols-2">
          {courses.map((course, idx) => {
            const colleaguePrice = Math.max(0, course.price - 50);
            return (
              <Reveal key={course.slug} delay={(idx % 3) * 90}>
                <div className="card card-lift group flex h-full flex-col overflow-hidden border border-slate-200/80 hover:border-gold/60 transition-all duration-300 shadow-sm hover:shadow-xl bg-white">
                  {/* Image / Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-navy">
                    <img
                      src={course.image || "/co-generic.png"}
                      alt={course.title}
                      loading="lazy"
                      width={600}
                      height={340}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="rounded bg-gold px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-navy">
                        {course.code}
                      </span>
                      <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                        £50 Reward Eligible
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="font-semibold text-gold-light">
                        20 CPD Credits
                      </span>
                      <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                        Provider #788000
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold text-navy group-hover:text-gold-dark transition-colors">
                      {course.title}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-slate-500 italic">
                      {course.subtitle}
                    </p>

                    <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 line-clamp-3">
                      {course.summary}
                    </p>

                    {/* Pricing Breakdown */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Retail Fee:</span>
                        <span className="font-display text-xl font-bold text-navy">£{course.price}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded">
                        <span>Colleague Pays with Referral:</span>
                        <span className="font-bold">£{colleaguePrice}</span>
                      </div>
                    </div>

                    {/* Action CTAs */}
                    <div className="mt-6 grid grid-cols-2 gap-2 pt-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="btn-outline text-center text-xs py-2.5 px-3 font-semibold group-hover:border-navy group-hover:bg-navy group-hover:text-white transition"
                      >
                        Programme Details
                      </Link>
                      <Link
                        href={`/checkout?type=course&course=${course.slug}`}
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

      {/* REFERRAL FAQS */}
      <section className="bg-slate-50 border-t border-slate-200/80 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="border-l-4 border-gold pl-4 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Programme Details
            </span>
            <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              Frequently Asked Questions About Referrals
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">
                Who can participate and refer a colleague?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Any professional, alumnus, current participant, or industry peer can refer a colleague. You do not need to be currently enrolled on a programme to share your link and earn rewards.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">
                How do I refer a colleague?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Simply enter your work or personal email address in the generator at the top of this page. Your unique referral link will be generated immediately. Share this link directly via email, LinkedIn, or messaging with colleagues.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">
                When and how is the £50 reward received?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Once your referred colleague enrolls and completes the standard 14-day statutory commitment period, your £50 rebate will be transferred directly via UK BACS bank transfer or secure international electronic transfer. Our finance team will contact your email to confirm payment details.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">
                Is there any limit on the number of colleagues I can refer?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                No. You enjoy <strong>unlimited referral capacity</strong>. You receive £50 for every individual colleague who successfully enrolls (e.g. 10 successful colleague enrollments = £500 reward).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">
                Can corporate teams utilize the referral programme?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Yes. If an entire team or department is enrolling together, each participant receives the £50 discount, or the organisation can request customized corporate cohort billing by speaking directly to a Programme Advisor.
              </p>
            </div>
          </div>

          {/* BOTTOM ADVISORY BANNER */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-navy via-navy to-[#0F2847] p-8 text-white shadow-xl border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold">
                Questions Regarding Enterprise Referrals?
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-white">
                Speak to a Programme Advisor
              </h3>
              <p className="mt-1 text-xs text-slate-300 max-w-md">
                Our executive advisory team can assist with team cohorts, invoicing, and corporate development arrangements.
              </p>
            </div>
            <Link
              href={`/contact?subject=${encodeURIComponent("Executive Referral Enquiry")}&enquiry=advisor`}
              className="btn-gold shrink-0 py-3 px-6 text-xs font-bold"
            >
              Speak to a Programme Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER TRUST SIGNAL */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-navy">
            CPD Accredited | Provider No. 788000
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Global Institute of Research &amp; Skills Development (GIRSD) · All certificates verified on the UK national register.
          </p>
        </div>
      </footer>
    </>
  );
}

