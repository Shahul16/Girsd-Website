import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/data/news";
import { getSiteContent } from "@/lib/server/site-content";
import type { Post } from "@/lib/data/news";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getSiteContent("news");
  const currentPosts = Array.isArray(content) ? content as Post[] : posts;
  const post = currentPosts.find((item) => item.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/news/${post.slug}` },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getSiteContent("news");
  const currentPosts = Array.isArray(content) ? content as Post[] : posts;
  const post = currentPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {post.author}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-14">
        {post.body.map((para, i) => (
          <p key={i} className="mb-5 leading-relaxed text-slate-700">{para}</p>
        ))}
        <Link href="/news" className="mt-4 inline-block font-semibold text-navy underline hover:text-gold-dark">
          ← Back to all news
        </Link>
      </article>
    </>
  );
}
