import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GIRSD (Q TECH PRIVATE LTD) collects, uses and protects your personal data under UK GDPR.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="1 July 2026">
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how Q TECH PRIVATE LTD, trading as GIRSD
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;), collects and processes your personal data when you use
        globalrsd.co.uk, attend our events, take our courses, or hold a
        membership. We are the data controller for this processing, registered
        in England and Wales (Company No. 15754767), 23 Kinnaird Avenue,
        Bromley BR1 4HG, England. We process personal data in accordance with the UK
        General Data Protection Regulation (UK GDPR) and the Data Protection
        Act 2018.
      </p>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Identity and contact data</strong> — name, email address, telephone number, organisation and role, provided when you register, book, enrol, join or contact us.</li>
        <li><strong>Transaction data</strong> — details of purchases and payments. Card details are processed by our payment provider (Stripe) and are not stored on our systems.</li>
        <li><strong>Academic and professional data</strong> — affiliations, biographies, submitted papers and nomination statements, where you provide them.</li>
        <li><strong>Technical data</strong> — IP address, browser type and usage data collected through server logs and any cookies described in section 8.</li>
      </ul>

      <h2>3. How and why we use your data</h2>
      <ul>
        <li><strong>To perform our contract with you</strong> — administering event registrations, course enrolments, memberships, certificates and payments.</li>
        <li><strong>Legitimate interests</strong> — running peer review, publishing proceedings, improving our services, preventing fraud, and sending service communications about bookings you hold.</li>
        <li><strong>Consent</strong> — sending marketing emails about future events and courses. You can withdraw consent at any time using the unsubscribe link or by emailing us.</li>
        <li><strong>Legal obligation</strong> — retaining accounting records and responding to lawful requests from authorities.</li>
      </ul>

      <h2>4. Sharing your data</h2>
      <p>
        We share personal data only where necessary: with payment processors
        (Stripe), email and hosting providers, event venues (delegate lists for
        security and catering), publication partners (author details for
        accepted papers), and professional advisers. All processors act under
        contracts requiring appropriate safeguards. We do not sell personal
        data.
      </p>

      <h2>5. International transfers</h2>
      <p>
        Where data is transferred outside the UK — for example to service
        providers operating in the EEA or United States — we rely on UK
        adequacy regulations or the International Data Transfer Agreement /
        Addendum with appropriate supplementary measures.
      </p>

      <h2>6. Retention</h2>
      <p>
        We keep account data while your account is active and for up to two
        years after closure; transaction records for six years to meet tax
        obligations; conference proceedings and author records indefinitely as
        part of the scholarly record; and marketing preferences until you
        withdraw consent.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Under UK GDPR you have the right to access your personal data, to
        rectification, to erasure, to restriction of processing, to data
        portability, to object to processing based on legitimate interests or
        for direct marketing, and rights relating to automated
        decision-making. To exercise any right, email privacy@globalrsd.co.uk. We
        respond within one month. You also have the right to complain to the
        Information Commissioner&apos;s Office (ico.org.uk).
      </p>

      <h2>8. Cookies</h2>
      <p>
        The Site uses strictly necessary storage to keep you signed in and to
        process checkout. Optional analytics cookies are only set with your
        consent, given via the cookie banner shown on your first visit. Full
        details are in our <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2>9. Security</h2>
      <p>
        We apply appropriate technical and organisational measures, including
        encryption in transit (TLS), access controls, and least-privilege
        administration. No system is perfectly secure; we will notify you and
        the ICO of any personal data breach where legally required.
      </p>

      <h2>10. Changes and contact</h2>
      <p>
        We may update this policy from time to time; material changes will be
        highlighted on the Site. Questions and requests: privacy@globalrsd.co.uk
        or by post to our registered office.
      </p>
    </LegalPage>
  );
}
