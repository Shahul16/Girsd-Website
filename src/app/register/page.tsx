"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import SocialAuth from "@/components/SocialAuth";
import PasswordInput from "@/components/PasswordInput";
import Turnstile from "@/components/Turnstile";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      return setError("Please complete the security verification.");
    }
    setError("");
    setBusy(true);
    const res = await register(name.trim(), email, password, captchaToken);
    setBusy(false);
    if (res.error) {
      setCaptchaToken("");
      setCaptchaResetKey((key) => key + 1);
      return setError(res.error);
    }
    if (res.needsConfirmation) return setConfirmSent(true);
    router.push("/dashboard");
  }

  if (confirmSent) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16">
        <div className="card w-full max-w-md p-8 text-center" role="status">
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then log in.
          </p>
          <Link href="/login" className="btn-navy mt-6 inline-block">Go to login</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-bold">Create Your Account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Registration is free. Membership subscriptions and event tickets can
          be added any time.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-5" aria-label="Registration form">
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" required autoComplete="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="label">Choose a password</label>
            <PasswordInput id="password" autoComplete="new-password" value={password} onChange={setPassword} />
          </div>
          <Turnstile
            key={captchaResetKey}
            action="register"
            onToken={setCaptchaToken}
            onError={() => setError("Security verification failed. Please try the verification again.")}
            onExpire={() => {
              setCaptchaToken("");
              setError("Security verification expired. Please complete it again.");
            }}
          />
          <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? "Creating account…" : "Create account"}</button>
          <p className="text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-navy underline">Log in</Link>
          </p>
          <p className="text-center text-xs text-slate-400">
            By registering you agree to our{" "}
            <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
            <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </form>
        <SocialAuth />
      </div>
    </section>
  );
}
