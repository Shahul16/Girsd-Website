import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding rate limit store
const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipStore.entries()) {
      if (value.resetAt < now) {
        ipStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export const RATE_LIMIT_PROFILES: Record<string, RateLimitConfig> = {
  auth: { windowSeconds: 15 * 60, maxRequests: 5 },          // 5 attempts / 15 mins
  membership_apply: { windowSeconds: 60 * 60, maxRequests: 8 }, // 8 applications / hr
  document_upload: { windowSeconds: 60 * 60, maxRequests: 10 }, // 10 uploads / hr
  verify_lookup: { windowSeconds: 60, maxRequests: 30 },        // 30 lookups / min
  checkout: { windowSeconds: 60, maxRequests: 15 },             // 15 checkouts / min
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
export function enforceRateLimit(
  req: NextRequest | Request,
  profileKey: keyof typeof RATE_LIMIT_PROFILES
): NextResponse | null {
  const config = RATE_LIMIT_PROFILES[profileKey] || { windowSeconds: 60, maxRequests: 30 };
  const clientIp = getClientIp(req);
  const cacheKey = `${profileKey}:${clientIp}`;
  const now = Date.now();

  const record = ipStore.get(cacheKey);

  if (!record || record.resetAt < now) {
    ipStore.set(cacheKey, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return null;
  }

  record.count += 1;

  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
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
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
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
