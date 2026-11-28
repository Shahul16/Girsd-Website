import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/server/supabase-admin";

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export const RATE_LIMIT_PROFILES: Record<string, RateLimitConfig> = {
  auth: { windowSeconds: 15 * 60, maxRequests: 5 },          // 5 attempts / 15 mins
  membership_apply: { windowSeconds: 60 * 60, maxRequests: 8 }, // 8 applications / hr
  award_nomination: { windowSeconds: 60 * 60, maxRequests: 10 }, // 10 nominations / hr
  document_upload: { windowSeconds: 60 * 60, maxRequests: 10 }, // 10 uploads / hr
  verify_lookup: { windowSeconds: 60, maxRequests: 30 },        // 30 lookups / min
  checkout: { windowSeconds: 60, maxRequests: 15 },             // 15 checkouts / min
  lead: { windowSeconds: 60 * 60, maxRequests: 10 },
  admin_login: { windowSeconds: 15 * 60, maxRequests: 5 },
};

/**
 * Extracts the real client IP address from proxy headers.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    if (parts[0]) return parts[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * Checks whether an incoming request exceeds the configured rate limit profile.
 * Returns null if allowed, or a 429 NextResponse if rate limit is exceeded.
 */
export async function enforceRateLimit(
  req: NextRequest | Request,
  profileKey: keyof typeof RATE_LIMIT_PROFILES
): Promise<NextResponse | null> {
  const config = RATE_LIMIT_PROFILES[profileKey] || { windowSeconds: 60, maxRequests: 30 };
  const admin = getAdminClient();
  if (!admin) {
    console.error("Could not enforce rate limit: Supabase service role is not configured.");
    return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  }

  const ipHash = createHash("sha256").update(getClientIp(req)).digest("hex");
  const { data, error } = await admin.rpc("consume_api_rate_limit", {
    p_key: `${profileKey}:${ipHash}`,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
  });
  if (error) {
    console.error("Could not enforce distributed rate limit:", error);
    return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result.allowed !== "boolean") {
    console.error("Rate limit service returned an invalid response.");
    return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  }
  if (!result.allowed) {
    const retryAfter = Math.max(1, Number(result.retry_after) || config.windowSeconds);
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(Math.max(0, Number(result.remaining) || 0)),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfter),
        },
      }
    );
  }

  return null;
}

/**
 * HTML sanitizer to prevent XSS attacks in user-submitted content
 * Used for sanitizing form submissions and email content
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (match) => htmlEntities[match as keyof typeof htmlEntities]);
}

/**
 * Email content sanitizer specifically for email templates
 * Preserves basic line breaks while sanitizing unsafe HTML
 */
export function sanitizeEmailContent(content: string): string {
  if (typeof content !== "string") return "";
  const sanitized = sanitizeHtml(content);
  // Allow basic formatting that's safe
  return sanitized.replace(/\n/g, "<br>").replace(/\r/g, "");
}

/**
 * Validates if a value is empty (null, undefined, empty string, or whitespace-only)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format (basic)
 * Accepts international formats with + prefix
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const digitsOnly = phone.replace(/\D/g, "");
  // Basic validation: at least 10 digits and at most 15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}
