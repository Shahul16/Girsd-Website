/**
 * Cloudflare Turnstile Server-Side Validation Helper
 * Validates Turnstile response tokens with Cloudflare Siteverify API.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export async function verifyTurnstile(
  token: string,
  remoteip: string | null = null,
  expectedAction?: string
): Promise<{ ok: boolean; reason?: string }> {
  // Support both standard Cloudflare env variable names
  const secret = process.env.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY;

  // CAPTCHA is optional until configured, but once a public key is enabled,
  // missing server credentials must fail closed.
  if (!secret) {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      ? { ok: false, reason: "Turnstile server verification is not configured" }
      : { ok: true };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, reason: "Invalid Turnstile verification token" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: formData.toString(),
    });

    if (!res.ok) {
      console.error(`Turnstile siteverify HTTP error: ${res.status}`);
      // Fail open on Cloudflare server errors to prevent legitimate visitors from being blocked
      return { ok: true };
    }

    const outcome = await res.json();

    if (!outcome.success) {
      const errors = Array.isArray(outcome["error-codes"])
        ? outcome["error-codes"].join(", ")
        : "verification failed";
      return { ok: false, reason: errors };
    }

    if (expectedAction && outcome.action && outcome.action !== expectedAction) {
      return { ok: false, reason: `Action mismatch: expected ${expectedAction}, got ${outcome.action}` };
    }

    // Optional hostname allowlist check (if TURNSTILE_HOSTNAMES is configured)
    if (process.env.TURNSTILE_HOSTNAMES && outcome.hostname) {
      const allowed = new Set(
        process.env.TURNSTILE_HOSTNAMES.split(",")
          .map((h) => h.trim())
          .filter(Boolean)
      );
      if (allowed.size > 0 && !allowed.has(outcome.hostname)) {
        return { ok: false, reason: `Hostname mismatch: ${outcome.hostname} not in allowed hostnames` };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("Turnstile verification network error:", err);
    return { ok: false, reason: "Turnstile verification unavailable" };
  }
}
