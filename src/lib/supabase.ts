"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const normalizedUrl =
  rawUrl && !rawUrl.includes("your-project.supabase.co")
    ? rawUrl.startsWith("http")
      ? rawUrl.replace(/\/+$/, "")
      : `https://${rawUrl.replace(/\/+$/, "")}`
    : undefined;

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const normalizedKey = rawKey && !rawKey.includes("xxxx") ? rawKey : undefined;

/** True when Supabase env vars are present and not template placeholders. */
export const isSupabaseConfigured = Boolean(normalizedUrl && normalizedKey);

let client: SupabaseClient | null = null;

/** Browser Supabase client (singleton). Returns null when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !normalizedUrl || !normalizedKey) return null;
  if (!client) {
    client = createClient(normalizedUrl, normalizedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}

/** Current access token (JWT) for calling protected API routes. */
export async function getAccessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
