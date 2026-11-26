"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAccessToken } from "@/lib/supabase";
import { events as defaultEvents, getRegistrationPhase, phasePrice, type Event } from "@/lib/data/events";
import { courses as defaultCourses, type Course } from "@/lib/data/courses";
import { membershipTiers as defaultTiers, type MembershipTier } from "@/lib/data/memberships";
import { SITE } from "@/lib/site";

type LineItem = {
  kind: "ticket" | "course" | "membership";
  title: string;
  detail: string;
  unitPrice: number;
  discountRate: number; // 0, 0.1 (courses) or 0.2 (tickets)
};

/** Display-only pricing. The authoritative price is recomputed server-side in /api/checkout. */
function buildItem(
  params: URLSearchParams,
  isMember: boolean,
  events: Event[],
  courses: Course[],
  tiers: MembershipTier[]
): LineItem | null {
  const type = params.get("type");
  if (type === "ticket") {
    const event = events.find((item) => item.slug === params.get("event"));
    const tier = event?.tickets.find((t) => t.id === params.get("tier"));
    if (!event || !tier) return null;
    const phase = getRegistrationPhase(event);
    return {
      kind: "ticket",
      title: `${event.acronym} — ${tier.name}`,
      detail: `${event.title}, ${new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${phase.label}`,
      unitPrice: phasePrice(tier.price, phase.multiplier),
      discountRate: isMember ? SITE.memberDiscount : 0,
    };
  }
  if (type === "course") {
    const course = courses.find((item) => item.slug === params.get("course"));
    if (!course) return null;
    return {
      kind: "course",
      title: course.title,
      detail: `${course.duration} online course · ${course.certification.split(".")[0]}`,
      unitPrice: course.price,
      discountRate: isMember ? SITE.courseMemberDiscount : 0,
    };
  }
  if (type === "membership") {
    const tier = tiers.find((item) => item.id === params.get("tier"));
    if (!tier) return null;
    return {
      kind: "membership",
      title: `GIRSD ${tier.name} Membership`,
      detail: "Annual membership · 12 months from purchase",
      unitPrice: tier.price,
      discountRate: 0,
    };
  }
  return null;
}

function CheckoutInner() {
  const params = useSearchParams();
  const { user, ready } = useAuth();
  const isMember = Boolean(user?.membership);
  const [qty, setQty] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [contentReady, setContentReady] = useState(false);
  const [currentEvents, setCurrentEvents] = useState<Event[]>(defaultEvents);
  const [currentCourses, setCurrentCourses] = useState<Course[]>(defaultCourses);
  const [currentTiers, setCurrentTiers] = useState<MembershipTier[]>(defaultTiers);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["events", "courses", "membership_tiers"].map(async (collection) => {
      const response = await fetch(`/api/site-content?collection=${collection}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Could not load ${collection} for checkout.`);
      return response.json();
    }))
      .then(([eventData, courseData, tierData]) => {
        if (Array.isArray(eventData.data)) setCurrentEvents(eventData.data);
        if (Array.isArray(courseData.data)) setCurrentCourses(courseData.data);
        if (Array.isArray(tierData.data)) setCurrentTiers(tierData.data);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) console.error("Could not load checkout content:", loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setContentReady(true);
      });
    return () => controller.abort();
  }, []);

  const item = useMemo(
    () => buildItem(new URLSearchParams(params.toString()), isMember, currentEvents, currentCourses, currentTiers),
    [params, isMember, currentEvents, currentCourses, currentTiers]
  );

  if (!contentReady) {
    return <p className="card mx-auto max-w-lg p-8 text-center text-slate-600">Loading current checkout details…</p>;
  }

  if (!item) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-3 text-sm text-slate-500">
          Your basket is empty or the link has expired.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/events" className="btn-navy">Browse events</Link>
          <Link href="/membership" className="btn-gold">View membership</Link>
        </div>
      </div>
    );
  }

  if (ready && !user) {
    const next = `/checkout?${params.toString()}`;
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Please log in first</h1>
        <p className="mt-3 text-sm text-slate-500">
          You need an account so we can attach your{" "}
          {item.kind === "membership" ? "membership" : item.kind === "course" ? "enrolment" : "tickets"} to it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-gold">Log in</Link>
          <Link href="/register" className="btn-outline">Register</Link>
        </div>
      </div>
    );
  }

  const quantity = item.kind === "ticket" ? qty : 1;
  const subtotal = item.unitPrice * quantity;
  const discount = Math.round(subtotal * item.discountRate);
  const total = subtotal - discount;

  async function onPay() {
    setError("");
    setPaying(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Your session has expired — please log in again.");
        setPaying(false);
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: params.get("type"),
          event: params.get("event"),
          course: params.get("course"),
          tier: params.get("tier"),
          application_id: params.get("application_id"),
          quantity,
          returnTo: `/checkout?${params.toString()}`,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) {
        setError(body?.error ?? "Could not start the payment. Please try again.");
        setPaying(false);
        return;
      }
      window.location.href = body.url; // Stripe-hosted secure payment page
    } catch {
      setError("Network problem — please try again.");
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_380px]">
      {/* Payment panel */}
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold">Secure Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;ll be taken to Stripe&apos;s secure payment page to complete your order.
        </p>
        <div className="mt-6 space-y-5">
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}
          {item.kind === "ticket" && (
            <div>
              <label htmlFor="qty" className="label">Number of delegates</label>
              <select
                id="qty"
                className="input max-w-[120px]"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-lg bg-cream p-4 text-sm text-slate-600">
            <p>
              Paying as <strong className="text-navy">{user?.name}</strong>{" "}
              ({user?.email}). Your{" "}
              {item.kind === "membership" ? "membership" : item.kind === "course" ? "enrolment" : "tickets"}{" "}
              will be attached to this account and appear on your dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="btn-gold w-full disabled:opacity-60"
          >
            {paying ? "Redirecting to Stripe…" : `Pay £${total} securely`}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 116 0v3z"/></svg>
            256-bit TLS · Card details are handled by Stripe, never by our servers
          </p>
        </div>
      </div>

      {/* Order summary */}
      <aside aria-label="Order summary">
        <div className="card bg-navy p-8 text-white">
          <h2 className="font-display text-xl font-bold text-gold">Order Summary</h2>
          <p className="mt-4 font-semibold">{item.title}</p>
          <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
          <dl className="mt-6 space-y-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-300">
                {quantity > 1 ? `${quantity} × £${item.unitPrice}` : "Subtotal"}
              </dt>
              <dd>£{subtotal}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <dt>Member discount ({Math.round(item.discountRate * 100)}%)</dt>
                <dd>−£{discount}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-white/15 pt-3 font-display text-lg font-bold">
              <dt>Total</dt>
              <dd>£{total}</dd>
            </div>
          </dl>
          {item.kind === "ticket" && !isMember && (
            <p className="mt-5 rounded-md bg-gold/15 px-3 py-2.5 text-xs text-gold-light">
              Members would pay £{Math.round(subtotal * (1 - SITE.memberDiscount))} for this order.{" "}
              <Link href="/membership" className="underline">Join from £49/year</Link>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <section className="bg-cream px-4 py-16">
      <Suspense
        fallback={<p className="text-center text-slate-500" role="status">Loading checkout…</p>}
      >
        <CheckoutInner />
      </Suspense>
    </section>
  );
}
