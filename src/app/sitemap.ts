import type { MetadataRoute } from "next";
import { events } from "@/lib/data/events";
import { courses } from "@/lib/data/courses";
import { posts } from "@/lib/data/news";
import { SITE } from "@/lib/site";
import { getSiteContent } from "@/lib/server/site-content";
import type { Event } from "@/lib/data/events";
import type { Course } from "@/lib/data/courses";
import type { Post } from "@/lib/data/news";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventContent, courseContent, newsContent] = await Promise.all([
    getSiteContent("events"),
    getSiteContent("courses"),
    getSiteContent("news"),
  ]);
  const currentEvents = Array.isArray(eventContent) ? eventContent as Event[] : events;
  const currentCourses = Array.isArray(courseContent) ? courseContent as Course[] : courses;
  const currentPosts = Array.isArray(newsContent) ? newsContent as Post[] : posts;
  const staticPages = [
    "",
    "/about",
    "/events",
    "/events/conferences",
    "/events/workshops",
    "/courses",
    "/refer-a-colleague",
    "/internship",
    "/awards",
    "/awards/register",
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

  const eventPages = currentEvents.map((e) => ({
    url: `${SITE.domain}/events/${e.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const coursePages = currentCourses.map((c) => ({
    url: `${SITE.domain}/courses/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const newsPages = currentPosts.map((p) => ({
    url: `${SITE.domain}/news/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...coursePages, ...newsPages];
}
