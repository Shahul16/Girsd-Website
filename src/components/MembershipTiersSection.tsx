"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { membershipTiers, type MembershipTier } from "@/lib/data/memberships";
import { useAuth } from "@/lib/auth";
import MembershipVerificationModal from "@/components/MembershipVerificationModal";

export default function MembershipTiersSection() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="tiers-heading">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 id="tiers-heading" className="flourish font-display text-3xl font-bold">
            Membership Options &amp; Verification Tiers
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Every tier includes a digital membership certificate, accredited credentials, and member pricing across conferences and courses. Applications undergo mandatory eligibility verification.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {membershipTiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 100}>
              <article
                className={`card relative flex h-full flex-col p-8 ${
                  tier.featured ? "border-2 border-gold shadow-lg" : ""
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-navy">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{tier.audience}</p>
                <p className="mt-5 font-display text-5xl font-bold text-navy">
                  £{tier.price}
                  <span className="text-base font-normal text-slate-500"> /year</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-600">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 text-gold-dark">
                        ✓
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`${tier.featured ? "btn-gold" : "btn-navy"} mt-8 w-full py-3`}
                >
                  Apply &amp; Verify for {tier.name}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Subject to institutional / academic review
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gold/40 bg-gold/5 p-5 text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
            Verification &amp; Governance Policy
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Per GIRSD Charter requirements, all membership applications require verified academic/institutional affiliation or document-based evidence. Payment alone does not bypass the approval gate; active credentials and member benefits are activated once verified by the Academic Board.
          </p>
        </div>
      </section>

      {/* Verification Modal Dialog */}
      {selectedTier && (
        <MembershipVerificationModal
          tier={selectedTier}
          isOpen={Boolean(selectedTier)}
          onClose={() => setSelectedTier(null)}
          userEmail={user?.email || ""}
          userName={user?.name || ""}
        />
      )}
    </>
  );
}
