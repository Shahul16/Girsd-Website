"use client";

import { useState } from "react";

export type Promotion = {
  id: string;
  title: string;
  body: string;
  image: string;
  href: string;
  placement: "home" | "events" | "all";
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

const EMPTY_PROMOTION: Promotion = {
  id: "",
  title: "",
  body: "",
  image: "",
  href: "",
  placement: "home",
  active: true,
};

export default function PromotionManager({
  promotions,
  onSave,
  saving,
}: {
  promotions: Promotion[];
  onSave: (items: Promotion[]) => Promise<boolean>;
  saving: boolean;
}) {
  const [form, setForm] = useState<Promotion>(EMPTY_PROMOTION);
  const [error, setError] = useState("");

  function set<K extends keyof Promotion>(key: K, value: Promotion[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function savePromotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.href.trim()) {
      setError("Enter a title and destination link.");
      return;
    }
    const isSafeDestination = (value: string) =>
      (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value);
    if (!isSafeDestination(form.href.trim())) {
      setError("Destination must be a site path or an HTTPS URL.");
      return;
    }
    if (form.image && !isSafeDestination(form.image.trim())) {
      setError("Choose an image URL from the media library or enter a site path.");
      return;
    }

    const saved = form.id
      ? promotions.map((item) => item.id === form.id ? form : item)
      : [{ ...form, id: crypto.randomUUID() }, ...promotions];
    setError("");
    if (await onSave(saved)) setForm(EMPTY_PROMOTION);
  }

  async function removePromotion(id: string) {
    if (!window.confirm("Remove this promotion from the website?")) return;
    await onSave(promotions.filter((item) => item.id !== id));
    if (form.id === id) setForm(EMPTY_PROMOTION);
  }

  return (
    <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]" aria-labelledby="promotions-heading">
      <div className="space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Campaigns</p>
          <h2 id="promotions-heading" className="mt-1 font-display text-2xl font-bold text-white">Ads &amp; Banners</h2>
          <p className="mt-1 text-sm text-slate-400">Create a homepage or events banner. Upload images in Media Library, then paste the public URL here.</p>
        </header>

        {promotions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No promotions yet. Create the first one using the form.</div>
        ) : (
          <div className="space-y-3">
            {promotions.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
                {item.image && <img src={item.image} alt="" width={112} height={72} className="h-20 w-28 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                      {item.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.body}</p>
                  <p className="mt-1 truncate text-[10px] text-gold">{item.placement} · {item.href}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => { setError(""); setForm(item); }} className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">Edit</button>
                  <button type="button" onClick={() => void removePromotion(item.id)} className="rounded-md border border-rose-400/25 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={savePromotion} className="h-fit space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
        <h3 className="font-display text-lg font-bold text-white">{form.id ? "Edit promotion" : "New promotion"}</h3>
        {error && <p role="alert" className="rounded-lg bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}
        <div>
          <label htmlFor="promo-title" className="label text-slate-200">Title</label>
          <input id="promo-title" value={form.title} onChange={(event) => set("title", event.target.value)} className="input" required maxLength={120} />
        </div>
        <div>
          <label htmlFor="promo-body" className="label text-slate-200">Supporting text</label>
          <textarea id="promo-body" value={form.body} onChange={(event) => set("body", event.target.value)} className="input min-h-24" maxLength={500} />
        </div>
        <div>
          <label htmlFor="promo-image" className="label text-slate-200">Image URL</label>
          <input id="promo-image" value={form.image} onChange={(event) => set("image", event.target.value)} className="input" placeholder="https://… or /image.jpg" />
        </div>
        <div>
          <label htmlFor="promo-href" className="label text-slate-200">Destination link</label>
          <input id="promo-href" value={form.href} onChange={(event) => set("href", event.target.value)} className="input" placeholder="/events or https://…" required />
        </div>
        <div>
          <label htmlFor="promo-placement" className="label text-slate-200">Placement</label>
          <select id="promo-placement" value={form.placement} onChange={(event) => set("placement", event.target.value as Promotion["placement"])} className="input">
            <option value="home">Home page</option>
            <option value="events">Events page</option>
            <option value="all">Home &amp; events</option>
          </select>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" checked={form.active} onChange={(event) => set("active", event.target.checked)} className="h-4 w-4 accent-amber-400" />
          Show promotion on the website
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-gold flex-1 disabled:opacity-50">{saving ? "Saving…" : form.id ? "Save promotion" : "Add promotion"}</button>
          {form.id && <button type="button" onClick={() => setForm(EMPTY_PROMOTION)} className="rounded-lg border border-white/15 px-4 text-sm text-white hover:bg-white/10">Cancel</button>}
        </div>
      </form>
    </section>
  );
}
