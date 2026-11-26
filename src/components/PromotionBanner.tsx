"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Promotion = {
  id: string;
  title: string;
  body?: string;
  image?: string;
  href: string;
  placement: "home" | "events" | "all";
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

function isSafeHref(value: string): boolean {
  return (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value);
}

export default function PromotionBanner({ placement }: { placement: "home" | "events" }) {
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/site-content?collection=promotions")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load promotions.");
        return response.json();
      })
      .then((body) => {
        if (!active || !Array.isArray(body.data)) return;
        const now = Date.now();
        const current = (body.data as Promotion[]).find((item) => {
          if (!item.active || (item.placement !== placement && item.placement !== "all")) return false;
          if (!item.title || !item.href || !isSafeHref(item.href)) return false;
          if (item.startsAt && Date.parse(item.startsAt) > now) return false;
          if (item.endsAt && Date.parse(item.endsAt) < now) return false;
          return true;
        });
        setPromotion(current ?? null);
      })
      .catch((error) => console.error("Could not load site promotion:", error));
    return () => {
      active = false;
    };
  }, [placement]);

  if (!promotion) return null;
  const external = /^https:\/\//i.test(promotion.href);
  const imageIsSafe = promotion.image && isSafeHref(promotion.image);

  return (
    <aside className="bg-navy px-4 py-4 text-white" aria-label="Featured promotion">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row">
        {imageIsSafe && (
          <img
            src={promotion.image}
            alt=""
            width={160}
            height={96}
            loading="lazy"
            className="h-20 w-32 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="font-display text-lg font-bold text-gold">{promotion.title}</h2>
          {promotion.body && <p className="mt-1 text-sm text-slate-200">{promotion.body}</p>}
        </div>
        <Link
          href={promotion.href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="shrink-0 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          Learn More
        </Link>
      </div>
    </aside>
  );
}
