import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Data Protection",
  description: "GIRSD's data protection statement: governance, security measures, data subject requests and breach procedures under UK GDPR.",
  alternates: { canonical: "/legal/data-protection" },
};

export default function DataProtectionPage() {
  return (
    <LegalPage title="Data Protection Statement" updated="1 July 2026">
      <h2>1. Our commitment</h2>
      <p>
        Q TECH PRIVATE LTD, trading as GIRSD, is committed to protecting the
        personal data of members, delegates, learners, authors, nominees and
        website visitors. This statement describes the governance and security
        arrangements that support our Privacy Policy, in line with the UK GDPR
        and the Data Protection Act 2018.
      </p>

      <h2>2. Governance and accountability</h2>
      <p>
        Overall accountability for data protection rests with the Executive
        Director. We maintain a record of processing activities, conduct data
        protection impact assessments for new processing that is likely to
        result in high risk, and review this statement annually. Staff and
        contractors with access to personal data receive data protection
        training and are bound by confidentiality obligations.
      </p>

      <h2>3. Data protection principles</h2>
      <p>
        We apply the UK GDPR principles in all processing: lawfulness,
        fairness and transparency; purpose limitation; data minimisation;
        accuracy; storage limitation; integrity and confidentiality; and
        accountability. Personal data is collected for specified purposes
        described in our Privacy Policy and is not further processed in ways
        incompatible with those purposes.
      </p>

      <h2>4. Technical and organisational measures</h2>
      <ul>
        <li>Encryption in transit (TLS 1.2+) across the Site and administrative systems.</li>
        <li>Role-based access control and least-privilege administration, with multi-factor authentication on administrative accounts.</li>
        <li>Payment card data handled exclusively by our PCI DSS–compliant payment provider; card numbers never touch our servers.</li>
        <li>Regular backups with tested restoration procedures.</li>
        <li>Vendor due diligence and data processing agreements with all processors.</li>
        <li>Secure disposal of records at the end of their retention period.</li>
      </ul>

      <h2>5. Data subject requests</h2>
      <p>
        Requests to access, rectify, erase, restrict, port or object to
        processing can be made to privacy@globalrsd.co.uk. We verify the identity
        of requesters, respond within one calendar month, and keep a log of
        requests and outcomes. There is normally no fee; where a request is
        manifestly unfounded or excessive we may charge a reasonable fee or
        decline, giving reasons.
      </p>

      <h2>6. Personal data breaches</h2>
      <p>
        We operate a breach response procedure covering identification,
        containment, assessment and notification. Where a breach is likely to
        result in a risk to individuals' rights and freedoms, we will notify
        the Information Commissioner&apos;s Office within 72 hours of becoming
        aware, and affected individuals without undue delay where the risk is
        high.
      </p>

      <h2>7. Children</h2>
      <p>
        Our services are directed at adults in academia and industry. We do
        not knowingly process the data of children under 16. Where a
        student member is under 18, we process only the data necessary for
        membership administration.
      </p>

      <h2>8. Contact</h2>
      <p>
        Data protection queries: privacy@globalrsd.co.uk, or Q TECH PRIVATE LTD,
        23 Kinnaird Avenue, Bromley BR1 4HG, England. You may also contact the
        Information Commissioner&apos;s Office at ico.org.uk or 0303 123 1113.
      </p>
    </LegalPage>
  );
}
