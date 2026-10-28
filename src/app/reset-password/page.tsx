"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";
import PasswordInput from "@/components/PasswordInput";

/**
 * Landing page for the Supabase email password-recovery link.
 *
 * Supabase appends the recovery tokens to the URL hash, e.g.
 *   /reset-password#access_token=…&refresh_token=…&type=recovery
 *
 * We parse those tokens, set the session via setSession(), and then
 * let the user set a new password with updateUser().
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setHasSession(false);
      return;
    }

    let cancelled = false;

    async function initSession() {
      if (!sb) return;

      // 1. Try to read tokens from the URL hash (set by Supabase redirect)
      const hash = window.location.hash.slice(1); // remove leading '#'
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (accessToken && refreshToken && type === "recovery") {
        // Exchange the recovery tokens for a live session
        const { error: sessionError } = await sb.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!cancelled) {
          setHasSession(!sessionError);
          if (sessionError) setError("Your reset link is invalid or has expired. Please request a new one.");
        }
        // Clean up the hash from the URL so the tokens aren't visible
        history.replaceState(null, "", window.location.pathname);
        return;
      }

      // 2. Fallback: check for an existing session (e.g. user refreshed the page)
      const { data } = await sb.auth.getSession();
      if (!cancelled) setHasSession(Boolean(data.session));
    }

    void initSession();

    // Also listen for the PASSWORD_RECOVERY event emitted by Supabase
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasSession(true);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return setError("Password reset is not available yet.");
    if (password.length < 8) return setError("Choose a password of at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setError("");
    setBusy(true);
    const { error: err } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16">
      <div className="card w-full max-w-md p-8">
        {hasSession === null ? (
          /* Loading state while we verify the token */
          <div className="text-center space-y-3">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-navy"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-slate-500" role="status">
              Verifying your reset link…
            </p>
          </div>
        ) : !hasSession ? (
          /* Invalid / expired link */
          <div className="text-center">
            <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-500">
              ✕
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">Link expired or invalid</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Reset links are valid for 1 hour and can only be used once.
              Please request a fresh one.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <Link href="/forgot-password" className="btn-gold mt-6 inline-block">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          /* Success state */
          <div role="status" className="text-center">
            <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">Password updated!</h1>
            <p className="mt-2 text-sm text-slate-500">
              You&apos;re signed in — taking you to your dashboard…
            </p>
          </div>
        ) : (
          /* Password form */
          <>
            <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Make it at least 8 characters — a mix of words and numbers works well.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-5" aria-label="New password">
              {error && (
                <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              <div>
                <label htmlFor="password" className="label">New password</label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">Repeat new password</label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={setConfirm}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="btn-gold w-full disabled:opacity-60"
              >
                {busy ? "Updating…" : "Set new password"}
              </button>
              <p className="text-center text-sm text-slate-500">
                Changed your mind?{" "}
                <Link href="/login" className="font-semibold text-navy underline">
                  Back to login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
