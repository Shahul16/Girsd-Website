import Link from "next/link";
import Reveal from "@/components/Reveal";
import { events, type Event } from "@/lib/data/events";
import { eventImage } from "@/lib/images";
import { getSiteContent } from "@/lib/server/site-content";

type EventDirectoryProps = {
  title: string;
  intro: string;
  category?: Event["category"];
};

export default async function EventDirectory({ title, intro, category }: EventDirectoryProps) {
  const content = await getSiteContent("events");
  const currentEvents = Array.isArray(content) ? content as Event[] : events;
  const visibleEvents = category ? currentEvents.filter((event) => event.category === category) : currentEvents;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="event-directory-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="event-directory-heading" className="flourish font-display text-3xl font-bold">{title}</h2>
          <p className="mt-4 max-w-2xl text-slate-600">{intro}</p>
        </div>
        <p className="text-sm font-semibold text-slate-500">{visibleEvents.length} {visibleEvents.length === 1 ? "event" : "events"}</p>
      </div>
      {visibleEvents.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {visibleEvents.map((event, index) => <EventCard key={event.slug} event={event} delay={(index % 2) * 90} />)}
        </div>
      ) : (
        <p className="mt-8 rounded-md border border-line bg-cream p-6 text-slate-600">New events in this category will be announced soon.</p>
      )}
    </section>
  );
}

function EventCard({ event, delay }: { event: Event; delay: number }) {
  const start = new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const end = new Date(event.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dateLabel = start === end ? start : `${start} to ${end}`;

  return (
    <Reveal delay={delay}>
      <Link href={`/events/${event.slug}`} className="card card-lift group flex h-full flex-col overflow-hidden">
        <div className="img-zoom h-48">
          <img src={event.image ?? eventImage(event.category)} alt="" loading="lazy" width={600} height={380} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-navy px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gold">{event.acronym}</span>
            <span className="text-sm font-medium text-slate-500">{dateLabel}</span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gold-dark">{event.category}</p>
          <h3 className="mt-2 font-display text-xl font-bold group-hover:text-gold-dark">{event.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{event.summary}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">{event.city}</span>
            <span className="font-semibold text-navy">From £{Math.min(...event.tickets.map((ticket) => ticket.price))}</span>
          </div>
          <span className="btn-outline mt-5 w-full group-hover:bg-navy group-hover:text-white">View event</span>
        </div>
      </Link>
    </Reveal>
  );
}
