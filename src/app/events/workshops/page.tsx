import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EventDirectory from "@/components/EventDirectory";

export const metadata: Metadata = {
  title: "Workshops",
  description: "Practical GIRSD workshops led by experienced practitioners, with focused learning, certificates and follow-up support.",
  alternates: { canonical: "/events/workshops" },
};

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
    </>
  );
}
