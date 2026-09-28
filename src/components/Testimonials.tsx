import Reveal from "@/components/Reveal";

const TESTIMONIALS = [
  {
    quote:
      "Presenting at ICRIET was a turning point for my doctorate. The reviewer feedback was rigorous but supportive, and the publication pathway delivered exactly what was promised.",
    name: "Aisha Rahman",
    role: "Doctoral Researcher, University of Birmingham",
  },
  {
    quote:
      "The AI in Cybersecurity course paid for itself within a month — I applied the anomaly-detection lab directly to our SOC workflows. Tutors replied to every question within a day.",
    name: "Thomas Whitfield",
    role: "Security Operations Lead, fintech sector",
  },
  {
    quote:
      "As an international delegate, everything from the visa letter to the venue was handled impeccably. GIRSD events feel personal in a way large conferences rarely do.",
    name: "Mei-Ling Chen",
    role: "Associate Professor, National Taipei University",
  },
];

/** Social proof: member and delegate testimonials. */
export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20" aria-labelledby="testimonials-heading">
      <Reveal className="text-center">
        <h2 id="testimonials-heading" className="flourish font-display text-3xl font-bold sm:text-4xl">
          What Our Community Says
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 100}>
            <figure className="card card-lift flex h-full flex-col p-7">
              <svg width="32" height="24" viewBox="0 0 32 24" aria-hidden="true" className="text-gold">
                <path d="M0 24V14.4C0 6.4 4.8 1.2 12.8 0l1.6 3.6c-4.4 1.6-6.8 4.4-7.2 8H12v12.4H0zm18.4 0V14.4c0-8 4.8-13.2 12.8-14.4l1.6 3.6c-4.4 1.6-6.8 4.4-7.2 8h4.8v12.4H18.4z" fill="currentColor"/>
              </svg>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                {t.quote}
              </blockquote>
              <figcaption className="mt-5 border-t border-slate-100 pt-4">
                <p className="font-display font-bold text-navy">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
