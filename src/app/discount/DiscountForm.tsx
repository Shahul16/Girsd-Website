"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const GRANT_CODE = "PAAVAI90";

const SOCIAL_LINKS = [
  {
    id: "website",
    label: "www.globalrsd.co.uk",
    href: "https://www.globalrsd.co.uk/",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    color: "bg-navy hover:bg-navy-light",
    textColor: "text-white",
  },
  {
    id: "linkedin",
    label: "LinkedIn — GIRSD",
    href: "https://www.linkedin.com/company/girsd",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "bg-[#0A66C2] hover:bg-[#004182]",
    textColor: "text-white",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Community",
    href: "https://chat.whatsapp.com/Hzz8bB36if83vGNL9PFoRE",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: "bg-[#25D366] hover:bg-[#128C7E]",
    textColor: "text-white",
  },
];

export default function DiscountForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    data.set("_form", "PAAVAI90 Grant Claim");

    try {
      const res = await fetch("/api/discount-lead", {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong — please try again or email us at info@globalrsd.co.uk.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Network problem — please check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return <ThankYouScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy to-slate-900">
      {/* Decorative background orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12">
        {/* Header badge */}
        <div className="mb-8 text-center">
          <a href="https://www.globalrsd.co.uk/" target="_blank" rel="noopener noreferrer"
            className="inline-block mb-6 transition-opacity hover:opacity-80">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold">PAAVAI90 Campaign — 14 Days Only</span>
            </div>
          </a>

          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl leading-tight">
            Claim Your{" "}
            <span className="relative">
              <span className="text-gold">90% Off</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold/40 rounded-full" />
            </span>{" "}
            Academic Research Grant
          </h1>

          <p className="mt-4 mx-auto max-w-xl text-base text-slate-300 leading-relaxed">
            Complete this form to receive your exclusive{" "}
            <span className="font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">{GRANT_CODE}</span>{" "}
            grant code — valid for 14 days across GIRSD Memberships, CPD Courses, and Masterclasses.
          </p>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { icon: "🎓", text: "UK GDPR Compliant" },
              { icon: "⚡", text: "Instant Voucher Delivery" },
              { icon: "🏛️", text: "CPD Approved Provider" },
            ].map((b) => (
              <span key={b.text} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <span>{b.icon}</span> {b.text}
              </span>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          {/* Gradient top bar */}
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-gold via-yellow-400 to-gold" />

          <div className="p-6 sm:p-8 lg:p-10">
            {error && (
              <div role="alert" className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} aria-label="PAAVAI90 Grant Claim Form" className="space-y-5">
              {/* Row 1: Name + Email */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="fullName"
                  name="fullName"
                  label="Full Name (with Prefix)"
                  placeholder="e.g., Dr. Jane Doe / John Smith"
                  required
                />
                <FormFieldWithHint
                  id="email"
                  name="email"
                  label="Email Address (Academic or Personal)"
                  type="email"
                  placeholder="name@institution.ac.uk or gmail/yahoo"
                  hint="We accept both official/academic and personal email addresses."
                  required
                />
              </div>

              {/* Row 2: Phone + Institution */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="phone"
                  name="phone"
                  label="WhatsApp / Phone (with Country Code)"
                  type="tel"
                  placeholder="+44 7000 000000"
                  required
                />
                <FormField
                  id="institution"
                  name="institution"
                  label="University / Company Name"
                  placeholder="e.g., Paavai Engineering College"
                  required
                />
              </div>

              {/* Row 3: Role + Interest */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label text-slate-200" htmlFor="role">
                    Current Professional Role <span aria-hidden="true" className="text-red-400">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    defaultValue=""
                    className="input mt-1 bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-gold focus:ring-gold/25 [&>option]:bg-navy [&>option]:text-white"
                  >
                    <option value="" disabled>Select your current role</option>
                    <option value="Student">Undergraduate / Postgraduate Student (£4.90 / yr)</option>
                    <option value="Academic">Faculty / Assistant Professor / PhD Scholar (£9.90 / yr)</option>
                    <option value="Leadership">Head of Department / Dean / Principal</option>
                    <option value="Industry">Industry Professional / Consultant (£24.90 / yr)</option>
                  </select>
                </div>
                <div>
                  <label className="label text-slate-200" htmlFor="interest">
                    Primary Area of Interest <span aria-hidden="true" className="text-red-400">*</span>
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    required
                    defaultValue=""
                    className="input mt-1 bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-gold focus:ring-gold/25 [&>option]:bg-navy [&>option]:text-white"
                  >
                    <option value="" disabled>Select primary area of interest</option>
                    <option value="Membership">GIRSD Membership Credentials (MGIRSD / FGIRSD)</option>
                    <option value="Courses">CPD Certified Online Courses (Data Science / AI)</option>
                    <option value="Masterclass">Academic Writing &amp; Publishing Masterclass (AWPM)</option>
                    <option value="Conferences">Research Conference Paper Presentation</option>
                    <option value="Awards">GIRSD Annual Global Awards Nomination (Free)</option>
                  </select>
                </div>
              </div>

              {/* Grant code (pre-filled, readonly) */}
              <div>
                <label className="label text-slate-200" htmlFor="grantCode">Grant Code Applied</label>
                <div className="relative mt-1">
                  <input
                    id="grantCode"
                    name="grantCode"
                    type="text"
                    value={GRANT_CODE}
                    readOnly
                    className="input bg-gold/10 border-gold/40 text-gold font-bold tracking-widest cursor-default focus:ring-gold/25"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* GDPR Consent */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label className="flex items-start gap-3 cursor-pointer group" htmlFor="gdpr">
                  <input
                    id="gdpr"
                    name="gdpr"
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/30 bg-white/10 text-gold focus:ring-gold/25 cursor-pointer"
                  />
                  <span className="text-xs leading-relaxed text-slate-300 group-hover:text-slate-200 transition-colors">
                    I agree to receive my grant voucher and event communications from GIRSD under the{" "}
                    <a href="/legal/privacy" target="_blank" className="text-gold underline hover:no-underline">
                      UK GDPR Privacy Policy
                    </a>
                    . I understand I can unsubscribe at any time.
                  </span>
                </label>
              </div>

              {/* Honeypot */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="discount-submit-btn"
                disabled={status === "sending"}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gold to-yellow-400 px-6 py-4 text-base font-bold text-navy shadow-lg transition-all duration-300 hover:shadow-gold/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {status === "sending" ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Claim 90% Grant &amp; Generate Voucher
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-xs text-slate-500">
                By submitting you agree to our{" "}
                <a href="/legal/privacy" className="underline hover:text-slate-400">Privacy Policy</a>.
                Your information is never shared with third parties.
              </p>
            </form>
          </div>
        </div>

        {/* Pricing tier reminder */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { tier: "Student", price: "£4.90", original: "£49", label: "Undergraduate / PG" },
            { tier: "Academic", price: "£9.90", original: "£99", label: "Faculty / PhD Scholar" },
            { tier: "Industry", price: "£24.90", original: "£249", label: "Professional / Consultant" },
          ].map((t) => (
            <div key={t.tier} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">{t.tier}</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{t.price}<span className="text-xs font-normal text-slate-400">/yr</span></p>
              <p className="text-xs text-slate-500 line-through">{t.original}</p>
              <p className="text-xs text-slate-400">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label text-slate-200" htmlFor={id}>
        {label}{required && <span aria-hidden="true" className="text-red-400"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="input mt-1 bg-white/10 border-white/20 text-white placeholder-slate-500 focus:border-gold focus:ring-gold/25"
      />
    </div>
  );
}

function FormFieldWithHint({
  id,
  name,
  label,
  type = "text",
  placeholder,
  hint,
  required,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label text-slate-200" htmlFor={id}>
        {label}{required && <span aria-hidden="true" className="text-red-400"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="input mt-1 bg-white/10 border-white/20 text-white placeholder-slate-500 focus:border-gold focus:ring-gold/25"
      />
      {hint && (
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
          <svg className="h-3 w-3 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hint}
        </p>
      )}
    </div>
  );
}

function ThankYouScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy to-slate-900 flex items-center justify-center px-4">
      {/* decorative orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl w-full">
        {/* Big success card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400" />
          <div className="p-8 sm:p-12 text-center">
            {/* Checkmark circle */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/20">
              <svg className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gold">Grant Code: PAAVAI90</span>
            </div>

            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Thank You for Submitting!
            </h1>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Your application has been received successfully. Our team will review your details and{" "}
              <strong className="text-white">contact you within 7 working days</strong> with your exclusive grant voucher and next steps.
            </p>

            {/* What to expect */}
            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-4">What happens next?</p>
              {[
                { step: "1", text: "You will receive a confirmation email from info@globalrsd.co.uk shortly." },
                { step: "2", text: "Our team will verify your details within 7 working days." },
                { step: "3", text: "Your PAAVAI90 voucher code will be delivered via email and WhatsApp." },
                { step: "4", text: "Apply the code at checkout for 90% off memberships, courses & masterclasses." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                    {item.step}
                  </span>
                  <p className="text-sm text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Social / community links */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-300 mb-4">
                While you wait — explore GIRSD &amp; join our community:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`thankyou-${link.id}-link`}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${link.color} ${link.textColor}`}
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs text-slate-500">
                Questions? Email us at{" "}
                <a href="mailto:info@globalrsd.co.uk" className="text-gold underline hover:no-underline">
                  info@globalrsd.co.uk
                </a>
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Return to GIRSD homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
