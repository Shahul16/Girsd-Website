import type { MetadataRoute } from "next";
import { events } from "@/lib/data/events";
import { courses } from "@/lib/data/courses";
import { posts } from "@/lib/data/news";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/about",
    "/events",
    "/events/conferences",
    "/events/workshops",
    "/courses",
    "/internship",
    "/awards",
    "/membership",
    "/contact",
    "/careers",
    "/partner",
    "/verify",
    "/news",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refunds",
    "/legal/data-protection",
    "/legal/cookies",
    "/feedback",
  ].map((path) => ({
    url: `${SITE.domain}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const eventPages = events.map((e) => ({
    url: `${SITE.domain}/events/${e.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const coursePages = courses.map((c) => ({
    url: `${SITE.domain}/courses/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const newsPages = posts.map((p) => ({
    url: `${SITE.domain}/news/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...coursePages, ...newsPages];
}
