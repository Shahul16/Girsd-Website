"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "flexible" | "compact";
          action?: string;
          cData?: string;
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
          execution?: "render" | "execute";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      isExpired: (widgetId?: string) => boolean;
      ready: (callback: () => void) => void;
      execute: (container?: string | HTMLElement, options?: any) => void;
    };
  }
}

interface TurnstileProps {
  siteKey?: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  onSuccess?: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  onToken?: (token: string) => void;
  className?: string;
}

/**
 * Cloudflare Turnstile React Component
 * Supports both explicit programmatic rendering and automatic form field integration.
 * Automatically injects hidden "cf-turnstile-response" input.
 */
export default function Turnstile({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  action,
  theme = "auto",
  size = "normal",
  onSuccess,
  onError,
  onExpire,
  onToken,
  className = "my-3",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onSuccess, onError, onExpire, onToken });
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onExpire, onToken };
  }, [onSuccess, onError, onExpire, onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let mounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || !mounted) return;
      if (widgetIdRef.current) return; // already rendered

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          action,
          callback: (resToken: string) => {
            if (!mounted) return;
            setToken(resToken);
            callbacksRef.current.onSuccess?.(resToken);
            callbacksRef.current.onToken?.(resToken);
          },
          "error-callback": (err?: string) => {
            if (!mounted) return;
            setToken("");
            callbacksRef.current.onError?.(err);
            callbacksRef.current.onToken?.("");
          },
          "expired-callback": () => {
            if (!mounted) return;
            setToken("");
            callbacksRef.current.onExpire?.();
            callbacksRef.current.onToken?.("");
          },
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.warn("Turnstile render error:", e);
      }
    };

    if (window.turnstile && typeof window.turnstile.render === "function") {
      renderWidget();
    } else {
      window.addEventListener("turnstile:ready", renderWidget);
      // Poll fallback
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.turnstile && typeof window.turnstile.render === "function") {
          if (checkInterval) clearInterval(checkInterval);
          renderWidget();
        } else if (attempts > 60) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      mounted = false;
      window.removeEventListener("turnstile:ready", renderWidget);
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.turnstile && typeof window.turnstile.remove === "function") {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action, theme, size]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </div>
  );
}
