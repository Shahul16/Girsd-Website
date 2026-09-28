import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "GIRSD's refund and cancellation terms for event tickets, courses and memberships.",
  alternates: { canonical: "/legal/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="25 July 2026">
      <h2>1. Overview</h2>
      <p>
        This policy explains when refunds are available for GIRSD event
        tickets, online courses and memberships. It sits alongside your
        statutory rights as a UK consumer, which are unaffected. To request a
        refund or cancellation, email finance@globalrsd.co.uk from the address on
        your account, quoting your order reference.
      </p>

      <h2>2. Event tickets — cancellation by you</h2>
      <ul>
        <li>More than 60 days before the event: full refund, less a £15 administration fee per ticket.</li>
        <li>30–60 days before the event: 50% refund, or a free transfer of the full amount to a future GIRSD event within 12 months.</li>
        <li>Fewer than 30 days before the event: no refund, but you may substitute a named colleague as the delegate at no charge up to 14 days before the event.</li>
        <li>Visa refusal: delegates who are refused a visa and notify us at least 14 days before the event, with evidence of the refusal, receive a full refund less the administration fee.</li>
      </ul>

      <h2>3. Event changes or cancellation by us</h2>
      <p>
        If we cancel an event, you will be offered a full refund or a transfer
        to another event. If we materially change the date or city of an
        in-person event, you may choose a full refund. Changes to programme,
        speakers or room allocations do not qualify as material changes. Our
        liability is limited to the ticket price; we recommend delegates hold
        travel insurance for flights and accommodation.
      </p>

      <h2>4. Online courses</h2>
      <ul>
        <li><strong>10-day cooling-off:</strong> you may cancel within 10 days of enrolment for a full refund, provided you have not accessed more than the first module. If you have accessed the course, we may deduct a proportionate amount for the content consumed.</li>
        <li>After 10 days, course fees are non-refundable, but you may defer once to the next course intake free of charge if you notify us before the halfway point of the course.</li>
        <li>If we withdraw a course before completion, affected learners receive a pro-rata refund or free transfer.</li>
      </ul>

      <h2>5. Memberships</h2>
      <ul>
        <li>New memberships may be cancelled within 7 days of purchase for a full refund, provided membership discounts have not been used. If a discount has been used, the discount amount is deducted from the refund.</li>
        <li>After 7 days, membership fees are non-refundable for the current year. You may cancel auto-renewal at any time from your dashboard, and membership remains active until the end of the paid year.</li>
        <li>Renewal payments may be refunded in full if you contact us within 7 days of the renewal date and no benefits have been used since renewal.</li>
      </ul>

      <h2>6. Awards</h2>
      <p>
        Award nominations are free of charge, so no refunds apply. Ceremony
        guest tickets follow the event ticket terms in section 2.
      </p>

      <h2>7. How refunds are paid</h2>
      <p>
        Approved refunds are made to the original payment method within 10-14
        working days of approval. Where a payment provider charges
        non-recoverable fees, these are absorbed by us except for the stated
        administration fee.
      </p>

      <h2>8. Exceptional circumstances</h2>
      <p>
        Where events beyond our reasonable control (including public health
        restrictions, natural disasters or venue failure) force cancellation,
        we will always offer a transfer or credit, and refunds where required
        by law. Nothing in this policy limits your statutory rights under the
        Consumer Rights Act 2015 or the Consumer Contracts Regulations 2013.
      </p>
    </LegalPage>
  );
}
