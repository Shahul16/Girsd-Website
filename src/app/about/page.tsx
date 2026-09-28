import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { founder, committees } from "@/lib/data/people";
import { posts } from "@/lib/data/news";
import { SITE } from "@/lib/site";
import { IMAGES } from "@/lib/images";
import pagesData from "@/content/pages.json";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about the Global Institute of Research & Skills Development — our vision, mission, founder, committees and commitment to responsible practice.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const about = pagesData?.about || {
    eyebrow: "About GIRSD",
    title: "Where Scholarship Meets Capability",
    intro: "GIRSD is a UK-based institute connecting research excellence with practical skills development for a worldwide community of academics, students and professionals.",
  };

  return (
    <>
      <PageHero
        eyebrow={about.eyebrow || "About GIRSD"}
        title={about.title || "Where Scholarship Meets Capability"}
        intro={about.intro || "GIRSD is a UK-based institute connecting research excellence with practical skills development for a worldwide community of academics, students and professionals."}
      />

      {/* Overview */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Reveal>
          <h2 className="flourish font-display text-3xl font-bold">Who We Are</h2>
          <div className="img-zoom mt-8 h-64 rounded-xl shadow-md">
            <img src={IMAGES.aboutCampus} alt="Graduates celebrating at an academic ceremony" loading="lazy" width={800} height={400} className="w-full h-full object-cover" />
          </div>
          <p className="mt-6 leading-relaxed">
            At the Global Institute of Research and Skills Development, we
            bring the global academic community together. Based in London,
            United Kingdom, and backed by nearly a decade of experience in
            academia, we specialise in organising high-quality scientific
            conferences, workshops, exhibitions and award functions around the
            world.
          </p>
          <p className="mt-4 leading-relaxed">
            We are passionate about creating spaces where innovative thinkers,
            rising researchers and seasoned academics can meet, share ideas and
            spark meaningful collaborations. Our events are thoughtfully
            planned in close partnership with faculty deans, university
            leaders, journal editors and experts from every corner of academia
            — across Management, Economics, Accounting, Social Sciences,
            Humanities, Engineering and the Technological Sciences. GIRSD is
            the trading name of {SITE.company.legalName} (Company No.{" "}
            {SITE.company.number}), registered in England and Wales.
          </p>
        </Reveal>

        <Reveal>
          <h2 className="mt-14 font-display text-2xl font-bold">
            Why Choose GIRSD?
          </h2>
          <ul className="mt-6 space-y-4">
            {[
              ["A global platform for connection", "Our conferences unite researchers from across the globe, creating a rich exchange of ideas, cultures and perspectives."],
              ["Top-tier academic partnerships", "We collaborate with leading universities and scholars to ensure high-quality, credible and engaging academic experiences."],
              ["Exciting publishing opportunities", "Looking to publish your research? We work with respected academic journals to help make that happen."],
              ["Affordability for our global community", "We offer fair and competitive pricing — plus exclusive discounts for our loyal participants."],
              ["More than just a conference", "Each event includes added value: expert-led workshops, skill-building seminars and guided city tours, always with extra personal care."],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 text-gold-dark">◆</span>
                <p className="leading-relaxed">
                  <strong className="text-navy">{title}.</strong> {body}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Vision & Mission */}
      <section className="bg-cream py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-2">
          <Reveal>
            <div className="card h-full border-t-4 border-t-gold p-8">
              <h2 className="font-display text-2xl font-bold">Our Goal</h2>
              <p className="mt-4 leading-relaxed">
                To inspire and empower scholars from all walks of life to
                explore meaningful research across a wide range of disciplines.
                Whether you are deep into your academic journey or just
                starting out, we support your curiosity, your growth and your
                impact — and all accepted papers are published through
                respected academic presses and journals, giving your work the
                visibility and recognition it deserves.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card h-full border-t-4 border-t-navy p-8">
              <h2 className="font-display text-2xl font-bold">Our Methods &amp; Results</h2>
              <ul className="mt-4 space-y-3 leading-relaxed">
                <li>Quality, accessible educational experiences that connect and empower the global academic community.</li>
                <li>Bridging countries and institutions to create meaningful opportunities for collaboration, learning and growth.</li>
                <li>International academic events and tours, carefully crafted for quality, satisfaction and efficiency.</li>
                <li>Investment in relevant institutes and partnerships that support higher education.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Leadership / Founder Spotlight */}
      {about.founder && (
        <section className="mx-auto max-w-5xl px-4 py-16">
          <Reveal>
            <div className="card overflow-hidden md:flex items-center">
              <div className="md:w-1/3 bg-slate-100 flex items-center justify-center p-6 shrink-0">
                <img 
                  src={about.founder.image || "/about-feature.jpg"} 
                  alt={about.founder.name || "Founder"} 
                  className="w-48 h-48 md:w-full md:h-64 rounded-xl object-cover shadow-sm" 
                  loading="lazy"
                  width={300}
                  height={300}
                />
              </div>
              <div className="p-8 md:w-2/3 flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">Leadership</span>
                <h3 className="font-display text-2xl font-bold text-navy mt-1">{about.founder.name}</h3>
                <p className="text-sm font-medium text-slate-500">{about.founder.role} · {about.founder.affiliation}</p>
                <p className="mt-4 leading-relaxed text-slate-700">{about.founder.bio}</p>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Committees — hidden for now (kept for future use) */}
      {false && (
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-white">Our Committees</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              GIRSD's programmes are governed by independent committees of senior
              academics and industry leaders.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {committees.map((committee, i) => (
              <Reveal key={committee.name} delay={i * 100}>
                <div className="h-full rounded-lg border border-white/10 bg-white/5 p-6">
                  <h3 className="font-display text-xl font-bold text-gold">{committee.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">{committee.description}</p>
                  <ul className="mt-5 space-y-4">
                    {committee.members.map((m) => (
                      <li key={m.name} className="border-t border-white/10 pt-4">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-xs uppercase tracking-wide text-gold-light">{m.role} · {m.affiliation}</p>
                        <p className="mt-1.5 text-sm text-slate-300">{m.bio}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      )}

      {/* Accreditation */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Reveal>
          <div className="card flex flex-wrap items-center gap-6 border-l-4 border-l-gold p-8">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-gold"
            >
              CPD
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold">Our Accreditation</h2>
              <p className="mt-2 leading-relaxed">
                We are proud to be an approved CPD (Continuing Professional Development)
                Provider, delivering events and training programs that meet the highest standards
                of professional education. We are also registered with the UK Register of Learning
                Providers (UKRLP) and are ICO (Information Commissioner's Office) registered,
                demonstrating our commitment to quality, compliance, and data protection.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CSR */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <Reveal>
          <h2 className="flourish font-display text-3xl font-bold">Corporate Social Responsibility</h2>
          <p className="mt-6 leading-relaxed">
            We believe access to research and skills development should not
            depend on geography or means. GIRSD reserves fee-waived conference
            places at every event for delegates from lower-income countries,
            offers hardship discounts on all courses, and donates a proportion
            of annual surplus to educational charities working on literacy and
            STEM access in under-served communities.
          </p>
          <p className="mt-4 leading-relaxed">
            We are equally committed to sustainable delivery: hybrid access at
            all conferences to reduce travel emissions, digital-first
            proceedings and certificates, and venue partners with recognised
            environmental accreditation wherever possible.
          </p>
        </Reveal>
      </section>

      {/* Publications teaser */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Publications &amp; News</h2>
              <p className="mt-2 text-slate-600">
                Conference proceedings, journal partnerships and institute announcements.
              </p>
            </div>
            <Link href="/news" className="btn-navy">Visit the newsroom</Link>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.slug} delay={i * 100}>
                <Link href={`/news/${p.slug}`} className="card group block h-full p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
                    {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold group-hover:text-gold-dark">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
