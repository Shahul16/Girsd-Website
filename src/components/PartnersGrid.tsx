import Image from "next/image";
import Reveal from "@/components/Reveal";
import { partnerInstitutions } from "@/lib/data/people";

/** Prominent, static display of academic partners and accreditation — trust section. */
export default function PartnersGrid() {
  return (
    <section className="bg-cream py-20" aria-labelledby="partners-heading">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="text-center">
          <h2 id="partners-heading" className="flourish font-display text-3xl font-bold sm:text-4xl">
            Partners &amp; Accreditation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            GIRSD collaborates with leading academic institutions and global education partners —
            delivering internationally recognised conferences, research programmes, and CPD-accredited credentials.
          </p>
        </Reveal>

        {/* 3 Partner Cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {partnerInstitutions.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <div className="card card-lift group flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:border-gold hover:shadow-lg">
                <div>
                  {/* Logo Display Box */}
                  <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-50/80 p-4 transition-colors group-hover:bg-amber-50/30">
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={300}
                      height={90}
                      unoptimized
                      className="max-h-16 w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Badge & Info */}
                  <div className="mt-5">
                    <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-dark">
                      {p.category}
                    </span>
                    <h3 className="mt-2.5 font-display text-lg font-bold text-navy transition group-hover:text-gold-dark">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {p.location}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {p.description}
                    </p>
                  </div>
                </div>

                {/* External Link */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold-dark transition"
                  >
                    <span>Visit Partner Portal</span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Accreditation Trust Banner */}
        <Reveal>
          <div className="mx-auto mt-12 flex max-w-2xl flex-col sm:flex-row items-center gap-5 rounded-2xl border-2 border-gold/50 bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy font-display text-base font-bold text-gold shadow-sm">
              CPD
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-display text-base font-bold text-navy">
                CPD Group Approved Provider (#788000)
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                GIRSD programmes and conferences adhere strictly to international continuing professional development criteria.
                Every credential and certificate is verifiable via our{" "}
                <a href="/verify" className="font-semibold text-navy underline hover:text-gold-dark">
                  online verification portal
                </a>.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

