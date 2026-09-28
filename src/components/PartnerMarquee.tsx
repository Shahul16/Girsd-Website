import Image from "next/image";
import { partnerInstitutions } from "@/lib/data/people";

export default function PartnerMarquee() {
  const row = [...partnerInstitutions, ...partnerInstitutions, ...partnerInstitutions]; // duplicated for seamless loop
  return (
    <div className="overflow-hidden border-y border-slate-200/80 bg-cream py-5" aria-label="Partner institutions">
      <div className="flex w-max animate-marquee items-center gap-14 whitespace-nowrap px-6">
        {row.map((p, i) => (
          <a
            key={`${p.name}-${i}`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={i >= partnerInstitutions.length}
            className="group flex items-center gap-3.5 transition-all opacity-75 hover:opacity-100"
          >
            <div className="flex h-10 w-24 items-center justify-center rounded-lg bg-white/80 p-1 shadow-2xs border border-slate-200/60">
              <Image
                src={p.logo}
                alt={p.name}
                width={120}
                height={36}
                unoptimized
                className="max-h-7 w-auto object-contain"
              />
            </div>
            <span className="font-display text-sm font-semibold tracking-wide text-navy group-hover:text-gold-dark transition">
              {p.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

