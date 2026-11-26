import "server-only";
import site from "@/content/site.json";
import hero from "@/content/hero.json";
import events from "@/content/events.json";
import courses from "@/content/courses.json";
import awards from "@/content/awards.json";
import news from "@/content/news.json";
import pages from "@/content/pages.json";
import promotions from "@/content/promotions.json";
import { openings as careers } from "@/lib/data/careers";
import { membershipTiers } from "@/lib/data/memberships";
import { getAdminClient } from "@/lib/server/supabase-admin";

export const SITE_CONTENT_COLLECTIONS = [
  "site",
  "hero",
  "events",
  "courses",
  "awards",
  "news",
  "pages",
  "promotions",
  "careers",
  "membership_tiers",
] as const;

export type SiteContentCollection = (typeof SITE_CONTENT_COLLECTIONS)[number];

const defaults: Record<SiteContentCollection, unknown> = {
  site,
  hero,
  events,
  courses,
  awards,
  news,
  pages,
  promotions,
  careers,
  membership_tiers: membershipTiers,
};

export function isSiteContentCollection(value: string): value is SiteContentCollection {
  return SITE_CONTENT_COLLECTIONS.includes(value as SiteContentCollection);
}

export function getDefaultSiteContent(collection: SiteContentCollection): unknown {
  return defaults[collection];
}

export async function getAllSiteContent(): Promise<Record<SiteContentCollection, unknown>> {
  const admin = getAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const { data, error } = await admin
    .from("site_content")
    .select("collection, data")
    .eq("published", true);
  if (error) throw new Error(`Could not load content collections: ${error.message}`);

  const content = { ...defaults } as Record<SiteContentCollection, unknown>;
  for (const row of data ?? []) {
    if (isSiteContentCollection(row.collection)) content[row.collection] = row.data;
  }
  return content;
}

export async function getSiteContent(collection: SiteContentCollection): Promise<unknown> {
  const admin = getAdminClient();
  if (!admin) return getDefaultSiteContent(collection);

  const { data, error } = await admin
    .from("site_content")
    .select("data")
    .eq("collection", collection)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error(`Could not load "${collection}" from site_content:`, error);
    return getDefaultSiteContent(collection);
  }
  return data?.data ?? getDefaultSiteContent(collection);
}

export async function saveSiteContent(
  collection: SiteContentCollection,
  data: unknown,
  updatedBy: string
): Promise<void> {
  const admin = getAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const { data: current, error: readError } = await admin
    .from("site_content")
    .select("version")
    .eq("collection", collection)
    .maybeSingle();
  if (readError) throw new Error(`Could not read content version: ${readError.message}`);

  const { error } = await admin.from("site_content").upsert(
    {
      collection,
      data,
      published: true,
      version: (current?.version ?? 0) + 1,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "collection" }
  );
  if (error) throw new Error(`Could not save "${collection}": ${error.message}`);
}
