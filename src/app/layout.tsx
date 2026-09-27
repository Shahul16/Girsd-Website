import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollProgress from "@/components/ScrollProgress";
import CookieConsent from "@/components/CookieConsent";
import RecaptchaLoader from "@/components/RecaptchaLoader";
import TurnstileLoader from "@/components/TurnstileLoader";
import FeedbackWidget from "@/components/FeedbackWidget";
import { AuthProvider } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: "Globalrsd — Global Institute of Research & Skills Development",
    template: "%s | Globalrsd",
  },
  description:
    "The Global Institute of Research & Skills Development (Globalrsd) delivers international research conferences, skills workshops, online courses, awards and professional membership. Based in London, serving a growing international community.",
  keywords: [
    "research conference UK",
    "academic conference London",
    "skills development",
    "online courses",
    "academic awards",
    "professional membership",
    "Globalrsd",
  ],
  openGraph: {
    type: "website",
    siteName: "Globalrsd",
    title: "Global Institute of Research & Skills Development",
    description:
      "International research conferences, skills workshops, online courses, awards and professional membership.",
    url: SITE.domain,
    images: [{ url: "/og-banner.jpg", width: 1200, height: 630, alt: "Globalrsd research, skills and professional development" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Globalrsd — Global Institute of Research & Skills Development",
    description: "Research conferences, practical workshops, certified courses, awards and professional membership.",
    images: ["/og-banner.jpg"],
  },
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: SITE.name,
                alternateName: SITE.shortName,
                url: SITE.domain,
                logo: `${SITE.domain}/logo-header.png`,
                email: SITE.email,
                telephone: SITE.phone,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: SITE.company.address,
                  addressCountry: "GB",
                },
                sameAs: [SITE.social.linkedin, SITE.social.instagram, SITE.social.youtube],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE.name,
                url: SITE.domain,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${SITE.domain}/news?query={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <RecaptchaLoader />
        <TurnstileLoader />
        <AuthProvider>
          <LoadingScreen />
          <ScrollProgress />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-navy"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <FeedbackWidget />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
