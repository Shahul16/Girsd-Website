"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type OrderSummary = {
  paid: boolean;
  title: string;
  quantity: number;
  total: number;
  currency: string;
  reference: string;
  email: string | null;
};

function ConfirmationInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { refresh } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!sessionId) {
      setState("missing");
      return;
    }
    let cancelled = false;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.paid) {
          setOrder(data);
          setState("ok");
          void refresh(); // pull the new order onto the dashboard
        } else {
          setState("missing");
        }
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [sessionId, refresh]);

  return (
    <div className="card w-full max-w-lg p-8 text-center">
      {state === "loading" ? (
        <p className="text-slate-500" role="status">Confirming your payment…</p>
      ) : state === "ok" && order ? (
        <>
          <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold">Payment Confirmed</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you — Stripe has emailed a receipt
            {order.email ? <> to <strong>{order.email}</strong></> : null}.
          </p>
          <dl className="mt-6 space-y-2 rounded-lg bg-cream p-5 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Order reference</dt>
              <dd className="font-mono font-semibold text-navy">{order.reference}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Item</dt>
              <dd className="max-w-[60%] text-right font-medium text-navy">{order.title}</dd>
            </div>
            {order.quantity > 1 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-medium text-navy">{order.quantity}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-display text-base font-bold text-navy">
              <dt>Total paid</dt>
              <dd>£{order.total}</dd>
            </div>
          </dl>
          {order.title.toLowerCase().includes("membership") && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 text-left text-xs leading-relaxed text-amber-950">
              <p className="font-bold text-navy flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Verification Gate Notice:</span>
              </p>
              <p className="mt-1 text-slate-700">
                Payment confirmation received. In accordance with GIRSD Academic Governance regulations, payment does <strong>not</strong> automatically activate membership perks. Your eligibility credentials are under review by the Academic Board (2–3 working days). Member discounts and digital credentials unlock upon administrative approval.
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Your transaction record will appear on your dashboard within a minute.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn-gold">Go to my dashboard</Link>
            <Link href="/events" className="btn-outline">Browse more events</Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold">No order found</h1>
          <p className="mt-3 text-sm text-slate-500">
            We couldn&apos;t verify a payment for this link. If you were charged,
            please contact us with your Stripe receipt.
          </p>
          <Link href="/events" className="btn-navy mt-6 inline-block">Browse events</Link>
        </>
      )}
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16">
      <Suspense fallback={<p className="text-slate-500" role="status">Loading…</p>}>
        <ConfirmationInner />
      </Suspense>
    </section>
  );
}
