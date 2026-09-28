"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";

export default function EnrolPanel({
  courseSlug,
  price,
}: {
  courseSlug: string;
  price: number;
}) {
  const { user, ready } = useAuth();
  const isMember = Boolean(user?.membership);
  const memberPrice = Math.round(price * (1 - SITE.courseMemberDiscount));
  const pathname = usePathname();
  const enrolled = user?.enrolments.some((e) => e.courseSlug === courseSlug);

  return (
    <div className="card sticky top-28 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Course fee</p>
      <p className="mt-1 font-display text-4xl font-bold text-navy">
        £{isMember ? memberPrice : price}
        {isMember && (
          <span className="ml-2 text-lg font-normal text-slate-400 line-through">£{price}</span>
        )}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {isMember ? "10% member discount applied" : `Members pay £${memberPrice} (10% off)`}
      </p>

      {!ready ? null : enrolled ? (
        <div className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          You are enrolled on this course.{" "}
          <Link href="/dashboard" className="underline">Go to your dashboard</Link>
        </div>
      ) : user ? (
        <Link href={`/checkout?type=course&course=${courseSlug}`} className="btn-gold mt-6 w-full">
          Enrol now
        </Link>
      ) : (
        <>
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="btn-gold mt-6 w-full"
          >
            Log in to enrol
          </Link>
          <p className="mt-3 text-center text-sm text-slate-500">
            New to GIRSD?{" "}
            <Link href="/register" className="font-semibold text-navy underline">
              Create an account
            </Link>
          </p>
        </>
      )}

      <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
        <li className="flex gap-2"><span aria-hidden="true" className="text-gold-dark">✓</span> Tutor-supported throughout</li>
        <li className="flex gap-2"><span aria-hidden="true" className="text-gold-dark">✓</span> Flexible online study</li>
        <li className="flex gap-2"><span aria-hidden="true" className="text-gold-dark">✓</span> Assessed with certification</li>
        <li className="flex gap-2"><span aria-hidden="true" className="text-gold-dark">✓</span> 14-day cooling-off refund</li>
      </ul>
    </div>
  );
}
