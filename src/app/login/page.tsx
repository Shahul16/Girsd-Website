"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

import PasswordInput from "@/components/PasswordInput";

import Turnstile from "@/components/Turnstile";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (captchaRequired && !captchaToken) {
      setError("Please complete the security verification.");
      return;
    }
    const res = await login(email, password, captchaToken);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      setCaptchaToken("");
      setCaptchaResetKey((key) => key + 1);
      return;
    }
    router.push(next);
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="font-display text-3xl font-bold">Member Login</h1>
      <p className="mt-2 text-sm text-slate-500">
        Access your dashboard, tickets, courses and membership.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-5" aria-label="Login form">
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-navy underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>
        <Turnstile
          key={captchaResetKey}
          action="login"
          onToken={setCaptchaToken}
          onError={() => setError("Security verification failed. Please try the verification again.")}
          onExpire={() => {
            setCaptchaToken("");
            setError("Security verification expired. Please complete it again.");
          }}
        />
        <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? "Signing in…" : "Log in"}</button>
        <p className="text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-navy underline">Register free</Link>
        </p>
      </form>

    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
