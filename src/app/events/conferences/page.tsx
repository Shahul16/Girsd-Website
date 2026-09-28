import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EventDirectory from "@/components/EventDirectory";

export const metadata: Metadata = {
  title: "Conferences",
  description: "Peer-reviewed GIRSD research conferences with international speakers, publication pathways and research presentations.",
  alternates: { canonical: "/events/conferences" },
};

export default function ConferencesPage() {
  return (
    <>
      <PageHero
        eyebrow="Events / Conferences"
        title="Research conferences"
        intro="Present original work, exchange ideas with international peers and take part in carefully curated academic programmes."
      />
      <EventDirectory
        title="Upcoming conferences"
        intro="Browse conference dates, themes, submission formats, speakers and registration options."
        category="Research Conferences"
      />
    </>
  );
}
