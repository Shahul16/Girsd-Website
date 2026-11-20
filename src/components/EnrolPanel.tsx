"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";

export default function EnrolPanel({
  courseSlug,
  price,
  courseTitle,
}: {
  courseSlug: string;
  price: number;
  courseTitle?: string;
}) {
  const { user, ready } = useAuth();
  const isMember = Boolean(user?.membership);
  const discountPercent = Math.round(SITE.courseMemberDiscount * 100);
  const memberPrice = Math.round(price * (1 - SITE.courseMemberDiscount));
  const pathname = usePathname();
  const enrolled = user?.enrolments.some((e) => e.courseSlug === courseSlug);

  const advisorSubject = encodeURIComponent(
    `Advisory Enquiry: ${courseTitle || "Executive Certificate"}`
  );
  const advisorWhatsAppMessage = encodeURIComponent(
    `Hello, I would like to speak to a Programme Advisor regarding the ${courseTitle || "Executive Certificate"} (Provider #788000).`
  );

  return (
    <div className="card sticky top-28 p-6 shadow-xl border-t-4 border-t-gold">
      {/* CPD Accreditation Trust Header */}
      <div className="rounded-lg bg-navy/5 border border-gold/30 p-3 mb-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-navy">
          CPD Accredited | Provider No. 788000
        </p>
        <p className="text-xs font-semibold text-gold-dark mt-0.5">
          20 Hours / 20 CPD Credits
        </p>
      </div>

      <div className="border-b border-slate-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Executive Programme Fee
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-4xl font-bold text-navy">
            £{isMember ? memberPrice : price}
          </p>
          {isMember ? (
            <span className="text-lg font-normal text-slate-400 line-through">
              £{price}
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              UK CPD Accredited
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {isMember
            ? `${discountPercent}% Member discount applied automatically`
            : `GIRSD Members pay £${memberPrice} (${discountPercent}% savings)`}
        </p>
      </div>

      {/* Main CTAs */}
      <div className="mt-5 space-y-3">
        {!ready ? null : enrolled ? (
          <div
            className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 text-center"
            role="status"
          >
            You are enrolled on this programme.{" "}
            <Link href="/dashboard" className="underline font-semibold block mt-1">
              Access your executive dashboard →
            </Link>
          </div>
        ) : user ? (
          <Link
            href={`/checkout?type=course&course=${courseSlug}`}
            className="btn-gold w-full text-center py-3 text-base font-bold shadow-md hover:shadow-lg transition block"
          >
            Enrol Now
          </Link>
        ) : (
          <div>
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="btn-gold w-full text-center py-3 text-base font-bold shadow-md hover:shadow-lg transition block"
            >
              Enrol Now
            </Link>
            <p className="mt-2 text-center text-xs text-slate-500">
              New to GlobalRSD?{" "}
              <Link href="/register" className="font-semibold text-navy underline">
                Create an executive account
              </Link>
            </p>
          </div>
        )}

        {/* Speak to a Programme Advisor CTA */}
        <div className="pt-1">
          <Link
            href={`/contact?subject=${advisorSubject}&enquiry=advisor`}
            className="btn-outline w-full text-center py-2.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4 text-gold-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Speak to a Programme Advisor
          </Link>
        </div>
      </div>

      {/* Trust & Methodology Inclusions */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
          Programme Specifications
        </p>
        <ul className="space-y-2.5 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>Harvard Case-Method:</strong> Real-world boardroom scenario analysis
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>Hands-on Labs:</strong> Practical simulations &amp; enterprise toolkits
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>1-on-1 Senior Tutor Review:</strong> Individual faculty feedback
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>70% Pass Standard:</strong> 30% Theory MCQ + 70% Practical Capstone
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>Verifiable Digital Credential:</strong> With QR validation on the national register
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-dark font-bold">✓</span>
            <span>
              <strong>14-Day Guarantee:</strong> Full cooling-off refund protection
            </span>
          </li>
        </ul>
      </div>

      {/* Cohort / Enterprise Note */}
      <div className="mt-6 rounded-md bg-slate-50 p-3 border border-slate-200/60 text-center">
        <p className="text-[11px] text-slate-600">
          Enrolling a corporate team of 3+?{" "}
          <Link
            href={`/contact?subject=${encodeURIComponent("Corporate Cohort Enquiry")}&enquiry=corporate`}
            className="font-semibold text-navy underline hover:text-gold-dark"
          >
            Request corporate terms
          </Link>
        </p>
      </div>
    </div>
  );
}
