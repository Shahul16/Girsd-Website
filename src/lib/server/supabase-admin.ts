import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * Bypasses RLS — never import from client components.
 * Env (Railway → Variables): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies a bearer JWT from the request and returns the Supabase user. */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const admin = getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * True ONLY when the user holds an explicitly APPROVED / ACTIVE membership.
 * Core rule: Merely registering or paying does NOT grant active member benefits.
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;

  const nowIso = new Date().toISOString();

  // 1. Check membership_applications for approved / active status
  const { data: appData, error: appError } = await admin
    .from("membership_applications")
    .select("id, status, valid_until")
    .eq("user_id", userId)
    .in("status", ["APPROVED", "ACTIVE_MEMBER", "Active"])
    .limit(1);

  if (!appError && appData && appData.length > 0) {
    const app = appData[0];
    if (!app.valid_until || new Date(app.valid_until) > new Date()) {
      return true;
    }
  }

  return false;
}
