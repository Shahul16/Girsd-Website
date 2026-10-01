import Link from "next/link";
import Reveal from "./Reveal";
import { membershipTiers } from "@/lib/data/memberships";

/** Check / cross marks as inline SVG — no icon library dependency. */
function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="Included" className="mx-auto text-emerald-600">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="Not included" className="mx-auto text-slate-300">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const ROWS: [string, boolean, boolean, boolean][] = [
  ["10% discount on all conference tickets", true, true, true],
  ["5% discount on online courses", true, true, true],
  ["Members-only quarterly briefings", true, true, true],
  ["Member community forum", true, true, true],
  ["Digital membership certificate", true, true, true],
  ["Priority paper review scheduling", false, true, false],
  ["Cross-sector mentoring scheme", false, true, true],
  ["Eligibility for committee service", false, true, false],
  ["Two workshop delegate passes per year", false, false, true],
  ["Industry panel speaking opportunities", false, false, true],
  ["Company profile in GIRSD directory", false, false, true],
];

/**
 * Standalone tier-comparison table (dependency-free).
 * The membership page currently renders its own inline table with identical
 * data; this component is kept for reuse elsewhere (e.g. landing pages).
 */
export default function MembershipTiersTable() {
  return (
    <Reveal>
      <h2 className="flourish mt-20 text-center font-display text-3xl font-bold">
        Compare Tiers at a Glance
      </h2>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">Comparison of membership tier benefits</caption>
          <thead>
            <tr className="bg-navy text-white">
              <th scope="col" className="rounded-tl-lg p-4 text-left font-display">Benefit</th>
              <th scope="col" className="p-4 text-center font-display">Student<br /><span className="text-gold">£49/yr</span></th>
              <th scope="col" className="border-x-2 border-gold bg-navy-light p-4 text-center font-display">Academic<br /><span className="text-gold">£99/yr</span></th>
              <th scope="col" className="rounded-tr-lg p-4 text-center font-display">Industry<br /><span className="text-gold">£249/yr</span></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, s, a, ind], i) => (
              <tr key={label} className={i % 2 ? "bg-cream" : "bg-white"}>
                <th scope="row" className="p-4 text-left font-medium text-slate-700">{label}</th>
                {[s, a, ind].map((v, col) => (
                  <td key={col} className={`p-4 text-center ${col === 1 ? "border-x-2 border-gold/60" : ""}`}>
                    {v ? <Check /> : <Cross />}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {membershipTiers.map((t) => (
                <td key={t.id} className={`p-4 text-center ${t.featured ? "border-x-2 border-b-2 border-gold/60" : ""}`}>
                  <Link href={`/checkout?type=membership&tier=${t.id}`} className={`${t.featured ? "btn-gold" : "btn-navy"} text-sm`}>
                    Join {t.name}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}
