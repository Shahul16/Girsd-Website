"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Turnstile from "@/components/Turnstile";
import { SITE } from "@/lib/site";

export default function FeedbackPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  // Form Fields
  const [isAccountRelated, setIsAccountRelated] = useState<"Yes" | "No" | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [expectsResponse, setExpectsResponse] = useState<"Yes" | "No" | "">("");
  const [visitReason, setVisitReason] = useState("");
  const [taskCompleted, setTaskCompleted] = useState<"Yes" | "No" | "">("");
  const [experienceRating, setExperienceRating] = useState<string>("");
  const [comments, setComments] = useState("");
  const [isMember, setIsMember] = useState<"Yes" | "No" | "I don't know" | "">("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!isAccountRelated) {
      setErrorMessage("Please indicate whether your feedback is related to an Account or Membership inquiry.");
      return;
    }
    if (!expectsResponse) {
      setErrorMessage("Please indicate whether you expect a response to your inquiry.");
      return;
    }
    if (!visitReason.trim()) {
      setErrorMessage("Please specify why you came to GlobalRSD.co.uk today.");
      return;
    }
    if (!taskCompleted) {
      setErrorMessage("Please indicate whether you were able to complete your task.");
      return;
    }
    if (!experienceRating) {
      setErrorMessage("Please select an overall rating for your website experience.");
      return;
    }
    if (!isMember) {
      setErrorMessage("Please indicate your membership status.");
      return;
    }
    if (!privacyAgreed) {
      setErrorMessage("You must agree to the GlobalRSD Privacy Policy to submit feedback.");
      return;
    }

    setStatus("submitting");

    const generatedTicket = "GRSD-FB-" + Math.floor(100000 + Math.random() * 900000);
    const formData = new FormData();
    formData.append("_form", "Website Feedback Form");
    formData.append("Reference Ticket ID", generatedTicket);
    formData.append("Is Account or Membership Related", isAccountRelated);
    formData.append("Name", `${firstName.trim()} ${lastName.trim()}`);
    formData.append("First Name", firstName.trim());
    formData.append("Last Name", lastName.trim());
    formData.append("Email", email.trim());
    formData.append("Membership / Candidate Number", membershipNumber.trim() || "N/A");
    formData.append("Expects Response", expectsResponse);
    formData.append("Reason for Visit", visitReason.trim());
    formData.append("Task Completed Successfully", taskCompleted);
    formData.append("Experience Rating", experienceRating);
    formData.append("Comments & Suggestions", comments.trim() || "No additional comments provided.");
    formData.append("Is GlobalRSD Member", isMember);
    formData.append("Privacy Policy Agreed", "Yes");
    formData.append("Submission Timestamp", new Date().toISOString());

    if (turnstileToken) {
      formData.append("cf-turnstile-response", turnstileToken);
      formData.append("turnstileToken", turnstileToken);
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "We could not submit your feedback right now. Please try again.");
      }

      setTicketId(generatedTicket);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred. Please try again.");
      setStatus("error");
    }
  }

  const ratingOptions = [
    { label: "Very poor", value: "Very poor", score: 1 },
    { label: "Poor", value: "Poor", score: 2 },
    { label: "Average", value: "Average", score: 3 },
    { label: "Good", value: "Good", score: 4 },
    { label: "Very good", value: "Very good", score: 5 },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
          <Link href="/" className="flex items-center gap-1.5 hover:text-navy transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-navy">GlobalRSD Website Feedback Form</span>
        </nav>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 md:p-12">
          {/* Header Title Section */}
          <div className="border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">Quality & Excellence</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              GlobalRSD Website Feedback Form
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              How was your experience on this website (<strong>www.globalrsd.co.uk</strong>)? Please provide your
              feedback below to help GlobalRSD create the best experience for all researchers, authors, delegates, and
              students worldwide.
            </p>
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 sm:text-sm">
              <p>
                <strong>Need immediate assistance?</strong> For questions, troubleshooting, ticket registrations, paper
                submissions, or other concerns not related directly to website feedback, please visit our{" "}
                <Link href="/contact" className="font-semibold underline hover:text-blue-700">
                  Contact & Support Center
                </Link>{" "}
                or email our Secretariat directly at{" "}
                <a href={`mailto:${SITE.email}`} className="font-semibold underline hover:text-blue-700">
                  {SITE.email}
                </a>
                .
              </p>
            </div>
          </div>

          {status === "success" ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold text-navy sm:text-3xl">
                Thank You for Your Feedback!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Reference Ticket ID: <span className="font-mono font-bold text-navy">{ticketId}</span>
              </p>
              <p className="mx-auto mt-4 max-w-lg text-sm text-slate-600 leading-relaxed">
                Your comments have been securely recorded and dispatched to our Digital Infrastructure & Quality
                Assurance Team. Your observations directly guide our ongoing interface improvements and academic
                services.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setIsAccountRelated("");
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setMembershipNumber("");
                    setExpectsResponse("");
                    setVisitReason("");
                    setTaskCompleted("");
                    setExperienceRating("");
                    setComments("");
                    setIsMember("");
                    setPrivacyAgreed(false);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50 transition"
                >
                  Submit Another Feedback
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light transition"
                >
                  Go to Candidate Dashboard
                </Link>
                <Link
                  href="/"
                  className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gold-light transition"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {errorMessage && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                  {errorMessage}
                </div>
              )}

              {/* Question 1: Account / Membership inquiry */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy">
                  Is your feedback related to an Account, joining GlobalRSD, renewing a membership, login or password issues,
                  email preferences, subscriptions, conference submissions, or changing your membership status?{" "}
                  <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isAccountRelated"
                      value="Yes"
                      checked={isAccountRelated === "Yes"}
                      onChange={() => setIsAccountRelated("Yes")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isAccountRelated"
                      value="No"
                      checked={isAccountRelated === "No"}
                      onChange={() => setIsAccountRelated("No")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
                {isAccountRelated === "Yes" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed">
                    Note: If you have an urgent account, login, or payment issue, please also reach out to our dedicated
                    teams at <a href={`mailto:${SITE.email}`} className="font-semibold underline">{SITE.email}</a> or{" "}
                    <a href={`mailto:${SITE.membershipEmail}`} className="font-semibold underline">{SITE.membershipEmail}</a>{" "}
                    for expedited resolution.
                  </div>
                )}
              </fieldset>

              {/* Identity Details */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-navy">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-navy">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Smith"
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-navy">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. scholar@university.ac.uk"
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                <div>
                  <label htmlFor="membershipNumber" className="block text-sm font-semibold text-navy">
                    Membership Number <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    id="membershipNumber"
                    type="text"
                    value={membershipNumber}
                    onChange={(e) => setMembershipNumber(e.target.value)}
                    placeholder="e.g. GRSD-2026-M89"
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
              </div>

              {/* Question 2: Expect response */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy">
                  I expect a response to my inquiry <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="expectsResponse"
                      value="Yes"
                      checked={expectsResponse === "Yes"}
                      onChange={() => setExpectsResponse("Yes")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="expectsResponse"
                      value="No"
                      checked={expectsResponse === "No"}
                      onChange={() => setExpectsResponse("No")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </fieldset>

              {/* Question 3: Visit reason */}
              <div>
                <label htmlFor="visitReason" className="block text-sm font-semibold text-navy">
                  Why did you come to GlobalRSD.co.uk today? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="visitReason"
                  rows={3}
                  required
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Registering for the ICMDR conference, checking online courses, uploading my candidate CV, exploring multidisciplinary internship..."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              {/* Question 4: Were you able to complete your task */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy">
                  Were you able to complete your task? <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="taskCompleted"
                      value="Yes"
                      checked={taskCompleted === "Yes"}
                      onChange={() => setTaskCompleted("Yes")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="taskCompleted"
                      value="No"
                      checked={taskCompleted === "No"}
                      onChange={() => setTaskCompleted("No")}
                      className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </fieldset>

              {/* Question 5: Experience rating */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy">
                  How would you rate your experience on this website today in comparison to other websites you typically
                  visit? <span className="text-red-500">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 pt-1">
                  {ratingOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center cursor-pointer transition ${
                        experienceRating === opt.value
                          ? "border-navy bg-navy/5 text-navy font-bold ring-2 ring-navy/20"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="experienceRating"
                        value={opt.value}
                        checked={experienceRating === opt.value}
                        onChange={() => setExperienceRating(opt.value)}
                        className="sr-only"
                      />
                      <div className="flex gap-0.5 text-amber-400 mb-1">
                        {Array.from({ length: opt.score }).map((_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Question 6: Comments & suggestions */}
              <div>
                <label htmlFor="comments" className="block text-sm font-semibold text-navy">
                  Your comments: <span className="text-xs font-normal text-slate-500">(What did you like or dislike during your visit, suggestions for improvement, and so on.)</span>
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share any detailed feedback, features you would like added, or areas we could polish..."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              {/* Question 7: Member status */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-navy">
                  Are you a GlobalRSD member? <span className="text-red-500">*</span>
                </legend>
                <div className="flex flex-wrap gap-6 pt-1">
                  {["Yes", "No", "I don't know"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="isMember"
                        value={opt}
                        checked={isMember === opt}
                        onChange={() => setIsMember(opt as any)}
                        className="h-4 w-4 border-slate-300 text-navy focus:ring-navy"
                        required
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Question 8: Privacy Policy */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy"
                  />
                  <span className="text-xs text-slate-600 sm:text-sm">
                    View{" "}
                    <Link href="/legal/privacy" target="_blank" className="font-semibold text-navy underline hover:text-gold-dark">
                      GlobalRSD Privacy Policy
                    </Link>
                    . <span className="text-red-500">*</span>
                    <br />
                    <span className="text-slate-700">I have read and agree to the GlobalRSD Privacy Policy and Data Protection Terms.</span>
                  </span>
                </label>
              </div>

              {/* Turnstile bot check */}
              <Turnstile
                action="website_feedback"
                onSuccess={(tok) => setTurnstileToken(tok)}
                onExpire={() => setTurnstileToken("")}
              />

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting feedback…
                    </span>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
                <p className="mt-3 text-xs text-slate-400">
                  This form is protected by Cloudflare Turnstile &amp; UK Data Protection standards.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
