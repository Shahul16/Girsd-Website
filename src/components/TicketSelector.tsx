"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { getRegistrationPhase, phasePrice, type Event, type TicketTier } from "@/lib/data/events";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function RegistrationFeeBreakdown({ event, tiers }: { event: Event; tiers: TicketTier[] }) {
  const rd = event.registrationDeadlines;
  if (!rd) return null;

  const current = getRegistrationPhase(event);
  const rows: { key: "early" | "normal" | "late"; label: string; window: string; multiplier: number }[] = [
    {
      key: "early",
      label: "Early Bird Registration",
      window: `Until ${dateFmt(rd.earlyBirdEnds)}`,
      multiplier: 1 - SITE.registrationPricing.earlyBirdDiscount,
    },
    {
      key: "normal",
      label: "Normal Registration",
      window: rd.lateFee
        ? `${dateFmt(rd.earlyBirdEnds)} – ${dateFmt(rd.normalEnds)}`
        : `From ${dateFmt(rd.earlyBirdEnds)}`,
      multiplier: 1,
    },
  ];
  if (rd.lateFee) {
    rows.push({
      key: "late",
      label: "Late Registration",
      window: `From ${dateFmt(rd.normalEnds)}`,
      multiplier: 1 + SITE.registrationPricing.lateFeeSurcharge,
    });
  }

  return (
    <div className="mb-8 overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="sr-only">Registration fee breakup by deadline</caption>
        <thead>
          <tr className="bg-navy text-white">
            <th scope="col" className="p-3 text-left font-display">Registration fee</th>
            <th scope="col" className="p-3 text-left font-display">Window</th>
            {tiers.map((t) => (
              <th key={t.id} scope="col" className="p-3 text-right font-display">{t.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const active = r.key === current.phase;
            return (
              <tr
                key={r.key}
                className={active ? "bg-gold/10" : "bg-white"}
              >
                <th scope="row" className="p-3 text-left font-medium text-slate-700">
                  {r.label}
                  {active && (
                    <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                      Now open
                    </span>
                  )}
                </th>
                <td className="p-3 text-left text-slate-500">{r.window}</td>
                {tiers.map((t) => (
                  <td key={t.id} className="p-3 text-right font-semibold text-navy">
                    £{phasePrice(t.price, r.multiplier)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rd.lateFee && (
        <p className="border-t border-slate-200 bg-cream px-3 py-2 text-xs text-slate-500">
          This event has rolling registration — no late fee applies.
        </p>
      )}
    </div>
  );
}

export default function TicketSelector({
  event,
  tiers,
}: {
  event: Event;
  tiers: TicketTier[];
}) {
  const { user, ready } = useAuth();
  const isMember = Boolean(user?.membership);
  const phase = getRegistrationPhase(event);

  return (
    <div>
      <RegistrationFeeBreakdown event={event} tiers={tiers} />
      {ready && (
        <p
          className={`mb-5 rounded-md px-4 py-3 text-sm font-medium ${
            isMember
              ? "bg-emerald-50 text-emerald-800"
              : "bg-gold/10 text-navy"
          }`}
          role="status"
        >
          {isMember
            ? `Your ${user!.membership!.tierName} membership discount of 20% will be applied at checkout.`
            : (
              <>
                GIRSD members save 20% on every ticket.{" "}
                <Link href="/membership" className="font-semibold underline hover:text-gold-dark">
                  Join from £49/year
                </Link>
              </>
            )}
        </p>
      )}
      <ul className="grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => {
          const currentPrice = phasePrice(t.price, phase.multiplier);
          const discounted = Math.round(currentPrice * (1 - SITE.memberDiscount));
          return (
            <li key={t.id} className="card flex h-full flex-col p-6">
              <h3 className="font-display text-lg font-bold">{t.name}</h3>
              {event.registrationDeadlines && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">{phase.label}</p>
              )}
              <p className="mt-2 font-display text-3xl font-bold text-navy">
                £{isMember ? discounted : currentPrice}
                {(isMember || currentPrice !== t.price) && (
                  <span className="ml-2 text-base font-normal text-slate-400 line-through">
                    £{t.price}
                  </span>
                )}
              </p>
              {!isMember && (
                <p className="mt-1 text-xs text-slate-500">£{discounted} for members</p>
              )}
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                {(t.includes ?? []).map((inc) => (
                  <li key={inc} className="flex gap-2">
                    <span aria-hidden="true" className="text-gold-dark">✓</span>
                    {inc}
                  </li>
                ))}
              </ul>
              <Link
                href={`/checkout?type=ticket&event=${event.slug}&tier=${t.id}`}
                className="btn-navy mt-6 w-full"
              >
                Book — {t.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
