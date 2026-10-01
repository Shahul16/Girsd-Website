/**
 * GIRSD Membership Lifecycle, Verification & Eligibility Hardening
 *
 * Core rule:
 * A user can register, submit an application, and pay,
 * but NEVER receives active membership benefits until eligibility
 * verification and administrative approval are completed.
 */

export type MembershipStatus =
  | "REGISTERED"
  | "APPLICATION_SUBMITTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "VERIFICATION_REQUIRED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE_MEMBER"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export type EmailType = "corporate_institutional" | "personal_public";

export type ProofType =
  | "student_id"
  | "faculty_staff_id"
  | "employment_confirmation"
  | "enrolment_letter"
  | "academic_transcript"
  | "official_appointment"
  | "professional_license"
  | "other";

export interface MembershipApplicationRecord {
  id: string; // e.g. GIRSD-MEM-2026-000123
  userId: string;
  applicantName: string;
  email: string;
  emailType: EmailType;
  emailVerified: boolean;
  phone?: string;
  institution: string;
  department?: string;
  roleTitle: string;
  tierId: string;
  tierName: string;
  annualFee: number;
  proofType?: ProofType;
  documentFileName?: string;
  documentFileUrl?: string;
  documentMimeType?: string;
  documentSizeBytes?: number;
  paymentStatus: "unpaid" | "paid" | "waived";
  stripeSessionId?: string;
  status: MembershipStatus;
  reviewerNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  membershipId?: string;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditLogEntry[];
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string; // e.g. "system", "applicant", "admin@globalrsd.co.uk"
  action: string;
  reason?: string;
  fromStatus?: MembershipStatus;
  toStatus?: MembershipStatus;
}

/** Known public / free webmail providers that require document-based verification */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "yahoo.co.in",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "rediffmail.com",
]);

/**
 * Classifies an applicant's email address.
 * Academic, university (.edu, .ac.uk, .edu.*), research institutes, government (.gov),
 * and corporate/company domains qualify for institutional fast-path verification.
 */
export function classifyEmailDomain(email: string): {
  type: EmailType;
  domain: string;
  isInstitutional: boolean;
  requiresDocumentProof: boolean;
} {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) {
    return {
      type: "personal_public",
      domain: "",
      isInstitutional: false,
      requiresDocumentProof: true,
    };
  }

  const domain = parts[1];

  // Explicit check against personal / freemail providers
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return {
      type: "personal_public",
      domain,
      isInstitutional: false,
      requiresDocumentProof: true,
    };
  }

  // Institutional domain heuristics:
  // .edu, .ac.uk, .edu.in, .gov, .org (when institutional), or private corporate domain
  const isEdu =
    domain.endsWith(".edu") ||
    domain.includes(".edu.") ||
    domain.endsWith(".ac.uk") ||
    domain.includes(".ac.") ||
    domain.endsWith(".gov") ||
    domain.includes(".gov.");

  return {
    type: "corporate_institutional",
    domain,
    isInstitutional: isEdu,
    requiresDocumentProof: !isEdu, // Corporate domains may still have secondary check if configured
  };
}

/**
 * Generates an official GIRSD Application Reference Number
 * Format: GIRSD-MEM-YYYY-XXXXXX
 */
export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `GIRSD-MEM-${year}-${randomPart}`;
}

/**
 * Generates an official GIRSD Membership ID upon approval
 * Format: GIRSD-M-YYYY-XXXX
 */
export function generateMembershipId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GIRSD-M-${year}-${randomPart}`;
}

/**
 * Permitted verification document types and limits
 */
export const DOCUMENT_UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
};

/**
 * Proof type labels for user interface
 */
export const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  student_id: "Student Identification Card (Current Date)",
  faculty_staff_id: "Academic Faculty / Staff Identification",
  employment_confirmation: "Official Employment Confirmation Letter",
  enrolment_letter: "Official Academic Enrolment Letter",
  academic_transcript: "Current Academic Transcript",
  official_appointment: "Official Institutional Appointment Letter",
  professional_license: "Professional Body / Statutory License",
  other: "Other Supporting Affiliation Evidence",
};

/**
 * Determines whether a membership status allows access to active member benefits.
 * CRITICAL RULE: Only APPROVED / ACTIVE_MEMBER grants benefits.
 */
export function hasActiveMemberBenefits(status: MembershipStatus | string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toUpperCase().replace(/\s+/g, "_");
  return s === "ACTIVE_MEMBER" || s === "APPROVED" || s === "ACTIVE";
}
