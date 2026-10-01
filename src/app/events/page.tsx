import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import EventDirectory from "@/components/EventDirectory";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Explore GIRSD conferences, workshops and education events. Present your work, develop practical skills or join as a delegate.",
  alternates: { canonical: "/events" },
};

const eventViews = [
  ["All events", "/events", "Browse the complete GIRSD programme."],
  ["Conferences", "/events/conferences", "Peer-reviewed research conferences and international academic programmes."],
  ["Workshops", "/events/workshops", "Practical, tutor-led sessions for focused skills development."],
  ["Courses", "/courses", "Tutor-supported online learning with assessment and certification."],
];

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="GIRSD Events"
        title="Learn, present and connect"
        intro="Choose the experience that fits your goals: attend a conference, build practical skills in a workshop, or study online through a certified course."
      />
      <section className="border-b border-line bg-cream" aria-label="Event sections">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-5">
          {eventViews.map(([label, href, description]) => (
            <a key={href} href={href} title={description} className="rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10">
              {label}
            </a>
          ))}
        </div>
      </section>
      <EventDirectory
        title="All events"
        intro="Explore upcoming conferences, workshops and education programmes. Select an event to view its programme, speakers, venue and registration options."
      />
      <section className="bg-navy py-16 text-white" aria-labelledby="event-support-heading">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 id="event-support-heading" className="font-display text-3xl font-bold text-white">Planning your participation?</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">Members receive 10% off conference tickets. Presenters can review submission guidance on the relevant conference page, while organisations can explore partnership and exhibition opportunities.</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-wrap gap-3 lg:justify-end">
            <a href="/membership" className="btn-gold">Explore membership</a>
            <a href="/partner" className="rounded-md border-2 border-white/50 px-5 py-2.5 font-semibold text-white transition hover:border-gold hover:text-gold">Partner with us</a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
