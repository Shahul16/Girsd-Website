"use client";

import Script from "next/script";

declare global {
  interface Window {
    __turnstileLoaded?: boolean;
  }
}

/**
 * Loads Cloudflare Turnstile script sitewide with explicit rendering mode.
 * Dispatches a 'turnstile:ready' event on load without calling turnstile.ready(),
 * preventing 'Remove async/defer' browser console exceptions.
 */
export default function TurnstileLoader() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  if (!siteKey) return null;

  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onLoad={() => {
        window.__turnstileLoaded = true;
        window.dispatchEvent(new Event("turnstile:ready"));
      }}
    />
  );
}
