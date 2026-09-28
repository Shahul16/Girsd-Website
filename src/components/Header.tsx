"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  {
    href: "/events",
    label: "Events",
    children: [
      { href: "/events", label: "All Events" },
      { href: "/events/conferences", label: "Conferences" },
      { href: "/events/workshops", label: "Workshops" },
      { href: "/courses", label: "Courses" },
    ],
  },
  { href: "/internship", label: "Internship" },
  { href: "/awards", label: "Awards" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <div className="h-[104px] lg:h-[124px]" aria-hidden="true">
      <header className="fixed inset-x-0 top-0 z-50 shadow-md">
      {/* Utility bar */}
      <div className="bg-navy-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-sm">
          <Link
            href="/events"
            className="rounded bg-gold px-3 py-1 font-semibold text-navy transition hover:bg-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Book tickets or join
          </Link>
          <nav aria-label="Account" className="flex items-center gap-4">
            {ready && user ? (
              <>
                <Link href="/dashboard" className="hover:text-gold-light">
                  My Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-gold-light"
                  aria-label="Log out"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-gold-light">
                  Login
                </Link>
                <Link href="/register" className="hover:text-gold-light">
                  Register
                </Link>
                <Link href="/dashboard" className="hidden sm:inline hover:text-gold-light">
                  My Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-3" aria-label="GIRSD home">
            <Image src={SITE.logoHeader} alt="GIRSD — Global Institute of Research & Skills Development" width={220} height={80} priority unoptimized className="h-16 w-auto max-w-[220px] object-contain sm:h-20" />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => {
                const childActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
                const active =
                  (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) || childActive;

                if (item.children) {
                  return (
                    <li
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.href)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={openDropdown === item.href}
                        onClick={() => setOpenDropdown((v) => (v === item.href ? null : item.href))}
                        className={`nav-underline flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition hover:text-gold-dark ${
                          active ? "text-gold-dark" : "text-navy"
                        }`}
                      >
                        {item.label}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {openDropdown === item.href && (
                        <ul className="absolute left-0 top-full min-w-[180px] rounded-md border border-line bg-white py-1.5 shadow-lg">
                          <li>
                            <Link
                              href={item.href}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2 text-sm font-medium text-navy hover:bg-cream hover:text-gold-dark"
                            >
                              {item.label} Home
                            </Link>
                          </li>
                          {item.children.map((c) => (
                            <li key={c.href}>
                              <Link
                                href={c.href}
                                onClick={() => setOpenDropdown(null)}
                                className={`block px-4 py-2 text-sm font-medium hover:bg-cream hover:text-gold-dark ${
                                  pathname.startsWith(c.href) ? "text-gold-dark" : "text-navy"
                                }`}
                              >
                                {c.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`nav-underline rounded px-3 py-2 text-sm font-medium transition hover:text-gold-dark ${
                        active ? "text-gold-dark" : "text-navy"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            className="rounded p-2 text-navy lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
            <ul className="mx-auto max-w-7xl px-4 py-2">
              {NAV.map((item) =>
                item.children ? (
                  <li key={item.href}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block flex-1 rounded px-3 py-2.5 font-medium text-navy hover:bg-cream hover:text-gold-dark"
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Toggle ${item.label} submenu`}
                        aria-expanded={mobileExpanded === item.href}
                        onClick={() => setMobileExpanded((v) => (v === item.href ? null : item.href))}
                        className="rounded p-2.5 text-navy hover:text-gold-dark"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: mobileExpanded === item.href ? "rotate(180deg)" : undefined }}>
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    {mobileExpanded === item.href && (
                      <ul className="ml-3 border-l border-line pl-3">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              onClick={() => setOpen(false)}
                              className="block rounded px-3 py-2 text-sm font-medium text-navy hover:bg-cream hover:text-gold-dark"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded px-3 py-2.5 font-medium text-navy hover:bg-cream hover:text-gold-dark"
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        )}
      </div>
      </header>
    </div>
  );
}
