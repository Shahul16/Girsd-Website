import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for the use of globalrsd.co.uk and GIRSD's events, courses, memberships and awards.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="1 July 2026">
      <h2>1. Who we are</h2>
      <p>
        This website, globalrsd.co.uk (the &ldquo;Site&rdquo;), is operated by Q TECH
        PRIVATE LTD, a company registered in England and Wales under company
        number 15754767, trading as the Global Institute of Research &amp;
        Skills Development (&ldquo;GIRSD&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). Our registered office is
        23 Kinnaird Avenue, Bromley BR1 4HG, England. You can contact us at
        info@globalrsd.co.uk.
      </p>

      <h2>2. Acceptance of these terms</h2>
      <p>
        By using the Site, registering an account, purchasing a membership,
        booking event tickets or enrolling on a course, you agree to be bound
        by these Terms &amp; Conditions. If you do not agree, please do not use
        the Site. Separate policies govern privacy, data protection and
        refunds, and form part of these terms.
      </p>

      <h2>3. Accounts and registration</h2>
      <p>
        You must provide accurate, current information when creating an
        account and keep your credentials confidential. You are responsible
        for all activity under your account. We may suspend or terminate
        accounts that breach these terms, provide false information, or are
        used in a way that harms GIRSD, its members or other users.
      </p>

      <h2>4. Events and tickets</h2>
      <p>
        Event tickets are personal to the named delegate and may not be
        resold. Ticket categories, prices and inclusions are described on each
        event page. We may alter an event programme, speakers or venue where
        reasonably necessary; where we make a material change or cancel an
        event, the remedies in our Refund &amp; Cancellation Policy apply.
        Delegates are responsible for their own travel and, unless expressly
        stated, accommodation and visas. We can issue letters to support visa
        applications for registered delegates but cannot guarantee visa
        outcomes, and visa refusal is addressed in the Refund &amp;
        Cancellation Policy.
      </p>

      <h2>5. Courses and enrolment</h2>
      <p>
        Course enrolment requires a registered account and payment of the
        applicable fee. Course access is personal and non-transferable.
        Certification is conditional on meeting the assessment criteria
        published on the course page. We may update course content to keep it
        current; where a course is withdrawn before completion, affected
        learners will be offered a transfer or a pro-rata refund.
      </p>

      <h2>6. Membership</h2>
      <p>
        Membership is an annual subscription at the tier prices displayed on
        the membership page. Benefits, including the 10% conference ticket
        discount and 5% course discount, apply while the membership remains
        active and are not retrospective. Membership renews automatically each
        year unless cancelled before the renewal date; cancellation takes
        effect at the end of the current membership year. Student membership
        requires evidence of current enrolment on request.
      </p>

      <h2>7. Awards</h2>
      <p>
        Award nominations are free of charge and are assessed by an
        independent judging panel against published criteria. The panel's
        decisions are final. Nominees consent to the reasonable use of their
        name, likeness and citation in connection with the awards programme.
      </p>

      <h2>8. Payments</h2>
      <p>
        Payments are processed by our payment provider (Stripe). Prices are in
        pounds sterling. You confirm that you are authorised to use the
        payment method provided. We reserve the right to correct pricing
        errors; where an error is material, you will be offered the choice of
        paying the correct price or receiving a full refund.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        The Site and its content — including the GIRSD name, crest, course
        materials and event proceedings — are protected by intellectual
        property rights owned by or licensed to us. Authors presenting at our
        events retain copyright in their own work, granting GIRSD a
        non-exclusive licence to publish accepted contributions in conference
        proceedings. You may not copy, distribute or commercially exploit Site
        content without our written permission.
      </p>

      <h2>10. Acceptable use</h2>
      <p>
        You must not misuse the Site, attempt unauthorised access, upload
        malicious code, harvest data about other users, or use the Site in
        breach of applicable law. Community spaces must be used respectfully;
        we may remove content and restrict access at our discretion.
      </p>

      <h2>11. Liability</h2>
      <p>
        Nothing in these terms limits liability for death or personal injury
        caused by negligence, fraud, or any liability that cannot be limited
        under English law. Subject to that, our total liability arising from
        any purchase is limited to the amount you paid for the relevant
        ticket, course or membership, and we are not liable for indirect or
        consequential loss, loss of profit or loss of opportunity. The Site is
        provided &ldquo;as is&rdquo; and we do not warrant uninterrupted availability.
      </p>

      <h2>12. Consumer rights</h2>
      <p>
        If you are a consumer in the United Kingdom, you have statutory rights
        under the Consumer Rights Act 2015 and the Consumer Contracts
        Regulations 2013, including cooling-off rights described in our Refund
        &amp; Cancellation Policy. Nothing in these terms affects your
        statutory rights.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The version in force at
        the time of your purchase applies to that purchase. Material changes
        will be notified on the Site or by email.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales, and the
        courts of England and Wales have exclusive jurisdiction, except that
        consumers resident elsewhere in the UK may bring proceedings in their
        home nation's courts.
      </p>
    </LegalPage>
  );
}
