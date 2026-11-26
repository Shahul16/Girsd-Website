import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { posts } from "@/lib/data/news";
import { getSiteContent } from "@/lib/server/site-content";
import type { Post } from "@/lib/data/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "News and announcements from the Global Innovation for Research and Skills Development.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const content = await getSiteContent("news");
  const currentPosts = Array.isArray(content) ? content as Post[] : posts;
  return (
    <>
      <PageHero
        eyebrow="Newsroom"
        title="News & Announcements"
        intro="Calls for papers, membership updates, award nominations and institute news."
      />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="space-y-8">
          {currentPosts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <article className="card p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
                  {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {p.author}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold">
                  <Link href={`/news/${p.slug}`} className="hover:text-gold-dark">{p.title}</Link>
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">{p.excerpt}</p>
                <Link href={`/news/${p.slug}`} className="mt-4 inline-block font-semibold text-navy underline hover:text-gold-dark">
                  Read the full story
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
