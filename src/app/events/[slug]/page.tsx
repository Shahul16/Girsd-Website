import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Countdown from "@/components/Countdown";
import TicketSelector from "@/components/TicketSelector";
import { events, getEvent } from "@/lib/data/events";
import { eventImage } from "@/lib/images";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};
  return {
    title: `${event.acronym} — ${event.title}`,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const dateRange =
    new Date(event.date).toDateString() === new Date(event.endDate).toDateString()
      ? new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : `${new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} – ${new Date(event.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_360px] lg:py-16">
          <div>
            <p className="animate-fadeUp text-sm font-semibold uppercase tracking-widest text-gold">
              {event.category}
            </p>
            <h1 className="mt-3 max-w-3xl animate-fadeUp font-display text-3xl font-bold text-white sm:text-4xl" style={{ animationDelay: "100ms" }}>
              {event.acronym}: {event.title}
            </h1>
            <p className="mt-4 animate-fadeUp text-lg text-slate-300" style={{ animationDelay: "200ms" }}>
              {dateRange} · {event.venue}, {event.city}
            </p>
            <a href="#tickets" className="btn-gold mt-6 animate-fadeUp" style={{ animationDelay: "300ms" }}>
              View registration options
            </a>
          </div>
          <div className="space-y-6">
            <div className="overflow-hidden rounded-md border border-white/10 shadow-card">
              <img src={event.image ?? eventImage(event.category)} alt="" width={800} height={350} className="h-52 w-full object-cover" />
            </div>
            <Countdown target={event.date} label={event.acronym} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <Reveal>
          <h2 className="flourish font-display text-3xl font-bold">About the Event</h2>
          <p className="mt-6 leading-relaxed">{event.description}</p>
          <h3 className="mt-8 font-display text-xl font-bold">Themes &amp; Tracks</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {(event.themes ?? []).map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-relaxed">
                <span aria-hidden="true" className="mt-0.5 text-gold-dark">◆</span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="bg-cream py-14" aria-labelledby="participation-heading">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <h2 id="participation-heading" className="flourish font-display text-3xl font-bold">Why take part?</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Present your work", "Share ideas, findings and practical experience with an international audience."],
              ["Learn from peers", "Hear current thinking from invited speakers and contributors across the field."],
              ["Build useful connections", "Meet researchers, professionals and organisations working on related challenges."],
            ].map(([title, body], index) => (
              <Reveal key={title} delay={index * 80}>
                <article className="card h-full p-6">
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="card mt-8 p-6">
              <h3 className="font-display text-xl font-bold">Event information</h3>
              <dl className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="font-semibold text-navy">Format</dt><dd className="mt-1">{event.tickets.some((ticket) => ticket.name.toLowerCase().includes("virtual")) ? "In-person and virtual" : "In-person"}</dd></div>
                <div><dt className="font-semibold text-navy">Location</dt><dd className="mt-1">{event.city}</dd></div>
                <div><dt className="font-semibold text-navy">Sessions</dt><dd className="mt-1">{event.agenda.reduce((total, day) => total + day.items.length, 0)}</dd></div>
                <div><dt className="font-semibold text-navy">Starting price</dt><dd className="mt-1">£{Math.min(...event.tickets.map((ticket) => ticket.price))}</dd></div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {event.category === "Research Conferences" && (
        <section className="bg-cream py-14" aria-labelledby="submission-heading">
          <div className="mx-auto max-w-4xl px-4">
            <Reveal>
              <h2 id="submission-heading" className="flourish font-display text-3xl font-bold">
                Submission Guidelines
              </h2>
              <p className="mt-6 leading-relaxed">
                {event.acronym} welcomes original, previously unpublished research across
                the themes listed above. All submissions are assessed by our international
                research review committee before a decision is issued.
              </p>

              <h3 className="mt-8 font-display text-lg font-bold">What you can submit</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed">
                <li className="flex gap-2"><span aria-hidden="true" className="mt-0.5 text-gold-dark">◆</span> Full research paper — 4,000–8,000 words, for oral presentation and publication consideration.</li>
                <li className="flex gap-2"><span aria-hidden="true" className="mt-0.5 text-gold-dark">◆</span> Short paper / work-in-progress — up to 3,000 words, for oral presentation.</li>
                <li className="flex gap-2"><span aria-hidden="true" className="mt-0.5 text-gold-dark">◆</span> Extended abstract / poster — 250–300 words, for the poster exhibition.</li>
              </ul>

              <h3 className="mt-8 font-display text-lg font-bold">Format &amp; review</h3>
              <p className="mt-3 leading-relaxed">
                Submit in the standard GIRSD conference template (request the template
                from the address below). Submissions are double-blind peer reviewed;
                accepted full papers are recommended to our partner journals, subject to the
                journal's own editorial process. Selected papers are eligible for the Best
                Paper Award at the conference.
              </p>

              <h3 className="mt-8 font-display text-lg font-bold">How to submit</h3>
              <p className="mt-3 leading-relaxed">
                Email your manuscript or abstract (PDF or Word), a short author bio and your
                preferred presentation format to{" "}
                <a href="mailto:research@globalrsd.co.uk" className="font-semibold text-navy underline">research@globalrsd.co.uk</a>{" "}
                with the subject line &ldquo;{event.acronym} Submission — [Paper Title]&rdquo;.
              </p>

              {event.registrationDeadlines && (
                <div className="mt-6 rounded-md border border-gold/40 bg-white p-5">
                  <p className="text-sm font-semibold text-navy">Key submission dates</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Submit by (early bird consideration)</dt>
                      <dd className="font-medium text-navy">
                        {new Date(event.registrationDeadlines.earlyBirdEnds).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Final submission &amp; camera-ready deadline</dt>
                      <dd className="font-medium text-navy">
                        {new Date(event.registrationDeadlines.normalEnds).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-slate-500">
                    Submitting ahead of the early bird deadline gives the committee the most
                    time for review and gives you the early bird registration rate if accepted.
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

      <section className="bg-cream py-14" aria-labelledby="agenda-heading">
        <div className="mx-auto max-w-4xl px-4">
          <Reveal>
            <h2 id="agenda-heading" className="flourish font-display text-3xl font-bold">Agenda</h2>
          </Reveal>
          {(event.agenda ?? []).map((day) => (
            <Reveal key={day.day}>
              <h3 className="mt-8 font-display text-xl font-bold">{day.day}</h3>
              <ol className="mt-4 space-y-0 border-l-2 border-gold/50">
                {(day.items ?? []).map((item, idx) => (
                  <li key={`${item.time}-${idx}`} className="relative pb-5 pl-6">
                    <span aria-hidden="true" className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-gold bg-white" />
                    <p className="text-sm font-bold text-gold-dark">{item.time}</p>
                    <p className="font-medium text-navy">{item.title}</p>
                    {item.speaker && <p className="text-sm text-slate-500">{item.speaker}</p>}
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="speakers-heading">
        <Reveal>
          <h2 id="speakers-heading" className="flourish font-display text-3xl font-bold">Keynote Speakers</h2>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(event.speakers ?? []).map((s, i) => (
            <Reveal key={s.name} delay={i * 100}>
              <div className="card flex h-full gap-5 p-6">
                <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xl font-bold text-gold">
                  {s.name.split(" ").slice(-1)[0][0]}
                  {s.name.split(" ")[0][0]}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{s.name}</h3>
                  <p className="text-sm font-semibold text-gold-dark">{s.title}, {s.affiliation}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.bio}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="tickets" className="bg-navy/[0.03] py-14 scroll-mt-24" aria-labelledby="tickets-heading">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <h2 id="tickets-heading" className="flourish font-display text-3xl font-bold">
              Delegate Registration &amp; Tickets
            </h2>
          </Reveal>
          <div className="mt-8">
            <TicketSelector event={event} tiers={event.tickets ?? []} />
          </div>
        </div>
      </section>
    </>
  );
}
