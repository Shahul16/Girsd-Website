"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  email: string;
}

export default function EmailVerificationModal({ 
  isOpen, 
  onClose, 
  applicationId, 
  email 
}: EmailVerificationModalProps) {
  const { user } = useAuth();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Helper to set refs
  const setRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/membership/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fullCode,
          email,
          applicationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid verification code.");
        // Reset code inputs
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      
      // Refresh auth state if available
      if (user && typeof user === "object" && "refresh" in user && typeof user.refresh === "function") {
        await (user as any).refresh();
      }
    } catch (err) {
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/membership/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          applicationId,
          name: user?.name || "Applicant",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend verification code.");
        return;
      }

      // Start 60-second cooldown
      setTimer(60);
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-blue px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Email Verification</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-blue-100">
            Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Verification Successful!</h4>
              <p className="mt-2 text-gray-600">
                Your email has been verified. Your application will now proceed to the Academic Board review.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full rounded-lg bg-navy px-4 py-2.5 text-white hover:bg-blue focus:outline-none focus:ring-2 focus:ring-navy/50"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                {/* Code Inputs */}
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={setRef(index)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-14 w-11 rounded-lg border-2 border-gray-200 text-center text-xl font-bold text-gray-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:bg-gray-50"
                      disabled={isLoading}
                      aria-label={`Digit ${index + 1} of verification code`}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || code.some((d) => !d)}
                  className="w-full rounded-lg bg-navy px-4 py-3 text-white transition-colors hover:bg-blue focus:outline-none focus:ring-2 focus:ring-navy/50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth={4}
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </form>

              {/* Resend Code */}
              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={isResending || timer > 0}
                  className="text-sm text-navy hover:text-blue focus:outline-none disabled:text-gray-400"
                >
                  {isResending ? "Sending..." : timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
                </button>
              </div>

              {/* Info Note */}
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                <p>
                  <strong>Note:</strong> Verification confirms ownership of your email address and enables your application to proceed to the Academic Board eligibility review. Benefits are activated only after board approval.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
