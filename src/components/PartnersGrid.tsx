import Reveal from "@/components/Reveal";
import { partners } from "@/lib/data/people";

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
            GIRSD works with leading universities, journals and industry bodies —
            and is an approved CPD (Continuing Professional Development) provider.
          </p>
        </Reveal>
        <div className="mt-12 flex flex-wrap items-stretch justify-center gap-5">
          {partners.map((p, i) => (
            <Reveal key={p} delay={(i % 4) * 70}>
              <div className="card card-lift flex h-28 w-full max-w-xs items-center justify-center px-6 text-center sm:w-72">
                <span className="font-display text-base font-semibold leading-snug text-navy/70">
                  {p}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-4 rounded-lg border-2 border-gold/60 bg-white p-5">
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-gold">
              CPD
            </span>
            <p className="text-sm leading-relaxed text-slate-700">
              <strong className="text-navy">CPD Group Approved Provider.</strong>{" "}
              Our events and courses meet recognised standards of professional
              education, and every certificate can be checked on our{" "}
              <a href="/verify" className="font-semibold text-navy underline">verification page</a>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
