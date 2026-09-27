import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import TrustBadges from "@/components/TrustBadges";

const institute = [
  { href: "/about", label: "About Us" },
  { href: "/news", label: "News" },
  { href: "/careers", label: "Careers" },
  { href: "/partner", label: "Partner With Us" },
  { href: "/feedback", label: "Website Feedback" },
  { href: "/contact", label: "Contact" },
];
const programmes = [
  { href: "/events", label: "Events & Conferences" },
  { href: "/courses", label: "Online Courses" },
  { href: "/awards", label: "Awards" },
  { href: "/membership", label: "Membership" },
  { href: "/verify", label: "Verify a Certificate" },
];
const legal = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refunds", label: "Refunds" },
  { href: "/legal/data-protection", label: "Data Protection" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/feedback", label: "Feedback" },
];

function Social() {
  return (
    <div className="mt-5 flex gap-3" aria-label="Social media">
      <a href={SITE.social.linkedin} aria-label="LinkedIn" className="rounded-full border border-slate-600 p-2 transition hover:border-gold hover:text-gold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.2 8h4.6v14H.2V8zm7.6 0h4.4v1.9h.1c.6-1.1 2.1-2.3 4.3-2.3 4.6 0 5.4 3 5.4 6.9V22h-4.6v-6.6c0-1.6 0-3.6-2.2-3.6s-2.5 1.7-2.5 3.5V22H7.8V8z"/></svg>
      </a>
      <a href={SITE.social.instagram} aria-label="Instagram" className="rounded-full border border-slate-600 p-2 transition hover:border-gold hover:text-gold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.4a6.4 6.4 0 100 12.8 6.4 6.4 0 000-12.8zm0 10.6a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm6.6-10.9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>
      </a>
      <a href={SITE.social.youtube} aria-label="YouTube" className="rounded-full border border-slate-600 p-2 transition hover:border-gold hover:text-gold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.2C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.2c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.2A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z"/></svg>
      </a>
    </div>
  );
}

function Col({ heading, links }: { heading: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={heading}>
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold">{heading}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-slate-300 transition hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-dark text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
        <div>
          <Image src={SITE.logoWhite} alt={SITE.name} width={230} height={85} unoptimized className="h-16 w-auto sm:h-[76px]" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
            Advancing research excellence and practical skills through international
            conferences, certified courses, awards and a worldwide professional community.
          </p>
          <Social />
        </div>

        <Col heading="Institute" links={institute} />
        <Col heading="Programmes" links={programmes} />

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li><a href={`mailto:${SITE.email}`} className="transition hover:text-white">{SITE.email}</a></li>
            <li><a href={SITE.whatsapp} className="transition hover:text-white">{SITE.phone}</a></li>
            <li className="text-slate-400">{SITE.company.address}</li>
            <li><a href={SITE.domain} className="font-semibold text-gold-light transition hover:text-gold">{SITE.domainDisplay}</a></li>
          </ul>
        </div>
      </div>

      {/* Accreditation band */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <TrustBadges variant="dark" heading="Accredited & Registered" />
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="text-center text-xs leading-relaxed text-slate-500">{SITE.companyLine}</p>
          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs text-slate-400 sm:flex-row">
            <p>© {year} {SITE.company.legalName}. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {legal.map((l) => (
                <Link key={l.href} href={l.href} className="transition hover:text-white">{l.label}</Link>
              ))}
            </nav>
            <p>
              Designed &amp; Built by{" "}
              <a href={SITE.credit.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:text-gold-light">{SITE.credit.name}</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
