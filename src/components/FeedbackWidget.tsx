"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState("Website Experience");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useAuth();

  const categories = [
    "Website Experience",
    "Candidate Dashboard",
    "Events & Conferences",
    "Online Courses",
    "Careers & Internship",
    "General Suggestion",
  ];

  async function handleQuickSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage("Please enter a short comment.");
      return;
    }
    setErrorMessage("");
    setStatus("sending");

    const formData = new FormData();
    formData.append("_form", "Quick Website Feedback");
    formData.append("Rating (out of 5)", `${rating} Stars`);
    formData.append("Category", category);
    formData.append("Feedback Message", message.trim());
    formData.append("Visitor Email", email.trim() || user?.email || "Anonymous");
    formData.append("Visitor Name", user?.name || "Website Visitor");
    formData.append("Page URL", typeof window !== "undefined" ? window.location.href : "");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Unable to submit feedback.");
      }

      setStatus("sent");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch {
      setErrorMessage("Network issue. Please try again or open the full form.");
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating Vertical Tab - fixed on right edge */}
      <aside aria-label="Feedback widget" className="fixed right-0 top-1/2 -translate-y-1/2 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Give Website Feedback"
          className="group flex items-center gap-1.5 rounded-l-md bg-navy px-2 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-200 hover:bg-gold hover:text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span className="flex items-center gap-1.5 rotate-180">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-gold group-hover:text-navy transition-colors"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span>Feedback</span>
          </span>
        </button>
      </aside>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:border-l sm:border-slate-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Website Feedback Drawer"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-navy px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-white">Website Feedback</h2>
                <p className="text-xs text-slate-300">Help us refine our academic portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              aria-label="Close feedback panel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {status === "sent" ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-navy">Thank You!</h3>
                <p className="mt-2 text-sm text-slate-600 max-w-xs">
                  Your feedback has been received and shared with our quality engineering team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setIsOpen(false);
                  }}
                  className="mt-6 rounded-lg bg-navy px-5 py-2 text-xs font-semibold text-white hover:bg-navy-light"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Rating Stars */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="rounded p-1 text-slate-300 transition hover:scale-110 focus:outline-none"
                        aria-label={`Rate ${star} star`}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill={(hoverRating ?? rating) >= star ? "#EAB308" : "none"}
                          stroke={(hoverRating ?? rating) >= star ? "#EAB308" : "currentColor"}
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-slate-600">
                      {(hoverRating ?? rating) === 5
                        ? "Excellent"
                        : (hoverRating ?? rating) === 4
                        ? "Good"
                        : (hoverRating ?? rating) === 3
                        ? "Average"
                        : (hoverRating ?? rating) === 2
                        ? "Poor"
                        : "Very poor"}
                    </span>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Topic / Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          category === cat
                            ? "bg-navy text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input */}
                <div>
                  <label htmlFor="quick-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Your comments or suggestions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="quick-comment"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you like, what was difficult, or what could be improved..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label htmlFor="quick-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your email <span className="font-normal text-slate-400">(Optional for replies)</span>
                  </label>
                  <input
                    id="quick-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email || "scholar@example.com"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-light transition disabled:opacity-60"
                >
                  {status === "sending" ? "Submitting…" : "Send Quick Feedback"}
                </button>
              </form>
            )}

            {/* Link to Full Form */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500">Need to submit a formal evaluation or detailed feedback?</p>
              <Link
                href="/feedback"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold-dark"
              >
                <span>Open Full Website Feedback Form</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
