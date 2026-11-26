/**
 * Status normalization utilities for consistent UI display and status handling
 */

/**
 * Standardized status values for membership applications
 */
export const MEMBERSHIP_STATUSES = {
  REGISTERED: "REGISTERED",
  APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
  VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
  UNDER_REVIEW: "UNDER_REVIEW",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  APPROVED: "APPROVED",
  ACTIVE_MEMBER: "ACTIVE_MEMBER",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export type MembershipStatus = typeof MEMBERSHIP_STATUSES[keyof typeof MEMBERSHIP_STATUSES];

/**
 * Gets the human-readable label for a membership status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    [MEMBERSHIP_STATUSES.REGISTERED]: "Registered",
    [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED]: "Application Submitted",
    [MEMBERSHIP_STATUSES.VERIFICATION_REQUIRED]: "Verification Required",
    [MEMBERSHIP_STATUSES.UNDER_REVIEW]: "Under Review",
    [MEMBERSHIP_STATUSES.PAYMENT_PENDING]: "Payment Pending",
    [MEMBERSHIP_STATUSES.PAYMENT_COMPLETED]: "Payment Completed",
    [MEMBERSHIP_STATUSES.APPROVED]: "Approved",
    [MEMBERSHIP_STATUSES.ACTIVE_MEMBER]: "Active Member",
    [MEMBERSHIP_STATUSES.REJECTED]: "Rejected",
    [MEMBERSHIP_STATUSES.SUSPENDED]: "Suspended",
    [MEMBERSHIP_STATUSES.EXPIRED]: "Expired",
    [MEMBERSHIP_STATUSES.CANCELLED]: "Cancelled",
  };

  return labels[status] || status;
}

/**
 * Normalizes status to standardized values
 * This ensures consistent UI display and prevents status mismatches
 */
export function normalizeStatus(status: string): string {
  if (!status) return status;
  
  const normalized = status.trim().toUpperCase();
  
  // Map various status representations to standardized values
  const statusMap: Record<string, string> = {
    "ACTIVE": "ACTIVE_MEMBER",
    "ACTIVE MEMBER": "ACTIVE_MEMBER",
    "ACTIVE_MEMBER": "ACTIVE_MEMBER",
    "APPROVED": "APPROVED",
    "UNDER REVIEW": "UNDER_REVIEW",
    "UNDER_REVIEW": "UNDER_REVIEW",
    "PAYMENT COMPLETED": "PAYMENT_COMPLETED",
    "PAYMENT_COMPLETED": "PAYMENT_COMPLETED",
    "PAYMENT PENDING": "PAYMENT_PENDING",
    "VERIFICATION REQUIRED": "VERIFICATION_REQUIRED",
    "VERIFICATION_REQUIRED": "VERIFICATION_REQUIRED",
    "APPLICATION SUBMITTED": "APPLICATION_SUBMITTED",
    "APPLICATION_SUBMITTED": "APPLICATION_SUBMITTED",
    "REGISTERED": "REGISTERED",
    "REJECTED": "REJECTED",
    "CANCELLED": "CANCELLED",
    "SUSPENDED": "SUSPENDED",
    "EXPIRED": "EXPIRED",
  };

  return statusMap[normalized] || normalized;
}

/**
 * Checks if a status allows member benefits
 */
export function allowsMemberBenefits(status: string): boolean {
  const activeStatuses = [MEMBERSHIP_STATUSES.ACTIVE_MEMBER, MEMBERSHIP_STATUSES.APPROVED];
  const normalized = normalizeStatus(status) as typeof activeStatuses[number];
  return activeStatuses.includes(normalized);
}

/**
 * Validates status transitions for membership applications
 */
export function isValidStatusTransition(fromStatus: string, toStatus: string): boolean {
  const normalizedFrom = normalizeStatus(fromStatus);
  const normalizedTo = normalizeStatus(toStatus);
  
  const validTransitions: Record<string, string[]> = {
    [MEMBERSHIP_STATUSES.REGISTERED]: [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED],
    [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED]: [MEMBERSHIP_STATUSES.VERIFICATION_REQUIRED, MEMBERSHIP_STATUSES.UNDER_REVIEW],
    [MEMBERSHIP_STATUSES.VERIFICATION_REQUIRED]: [MEMBERSHIP_STATUSES.UNDER_REVIEW],
    [MEMBERSHIP_STATUSES.UNDER_REVIEW]: [MEMBERSHIP_STATUSES.APPROVED, MEMBERSHIP_STATUSES.ACTIVE_MEMBER, MEMBERSHIP_STATUSES.REJECTED],
    [MEMBERSHIP_STATUSES.PAYMENT_PENDING]: [MEMBERSHIP_STATUSES.PAYMENT_COMPLETED],
    [MEMBERSHIP_STATUSES.PAYMENT_COMPLETED]: [MEMBERSHIP_STATUSES.UNDER_REVIEW, MEMBERSHIP_STATUSES.REJECTED],
    [MEMBERSHIP_STATUSES.APPROVED]: [MEMBERSHIP_STATUSES.ACTIVE_MEMBER],
    [MEMBERSHIP_STATUSES.ACTIVE_MEMBER]: [MEMBERSHIP_STATUSES.SUSPENDED, MEMBERSHIP_STATUSES.EXPIRED, MEMBERSHIP_STATUSES.CANCELLED],
    [MEMBERSHIP_STATUSES.REJECTED]: [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED],
    [MEMBERSHIP_STATUSES.SUSPENDED]: [MEMBERSHIP_STATUSES.ACTIVE_MEMBER],
    [MEMBERSHIP_STATUSES.EXPIRED]: [MEMBERSHIP_STATUSES.ACTIVE_MEMBER],
    [MEMBERSHIP_STATUSES.CANCELLED]: [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED],
  };

  return validTransitions[normalizedFrom]?.includes(normalizedTo) || false;
}

/**
 * Gets the member discount rate based on membership status
 */
export function getMemberDiscountRate(status: string): number {
  const activeStatuses = [MEMBERSHIP_STATUSES.ACTIVE_MEMBER, MEMBERSHIP_STATUSES.APPROVED];
  const normalized = normalizeStatus(status) as typeof activeStatuses[number];
  return activeStatuses.includes(normalized) ? 0.25 : 0;
}

/**
 * Checks if a membership is valid (not expired and not cancelled)
 */
export function isMembershipValid(membership: {
  status: string;
  valid_until?: string | null;
}): boolean {
  const activeStatuses = [MEMBERSHIP_STATUSES.ACTIVE_MEMBER, MEMBERSHIP_STATUSES.APPROVED];
  const normalized = normalizeStatus(membership.status) as typeof activeStatuses[number];
  if (!activeStatuses.includes(normalized)) return false;

  if (!membership.valid_until) return false;
  return new Date(membership.valid_until) > new Date();
}

/**
 * Gets the display color class for a membership status
 */
export function getStatusColorClass(status: string): string {
  const normalizedStatus = normalizeStatus(status);
  
  const colorMap: Record<string, string> = {
    [MEMBERSHIP_STATUSES.ACTIVE_MEMBER]: "bg-emerald-100 text-emerald-800",
    [MEMBERSHIP_STATUSES.APPROVED]: "bg-green-100 text-green-800",
    [MEMBERSHIP_STATUSES.PAYMENT_COMPLETED]: "bg-amber-100 text-amber-800",
    [MEMBERSHIP_STATUSES.UNDER_REVIEW]: "bg-blue-100 text-blue-800",
    [MEMBERSHIP_STATUSES.VERIFICATION_REQUIRED]: "bg-orange-100 text-orange-800",
    [MEMBERSHIP_STATUSES.PAYMENT_PENDING]: "bg-purple-100 text-purple-800",
    [MEMBERSHIP_STATUSES.REJECTED]: "bg-red-100 text-red-800",
    [MEMBERSHIP_STATUSES.SUSPENDED]: "bg-gray-100 text-gray-800",
    [MEMBERSHIP_STATUSES.EXPIRED]: "bg-gray-100 text-gray-800",
    [MEMBERSHIP_STATUSES.CANCELLED]: "bg-gray-100 text-gray-800",
    [MEMBERSHIP_STATUSES.REGISTERED]: "bg-slate-100 text-slate-800",
    [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED]: "bg-slate-100 text-slate-800",
  };

  return colorMap[normalizedStatus] || "bg-gray-100 text-gray-800";
}

/**
 * Gets the icon class for a membership status
 */
export function getStatusIcon(status: string): string {
  const normalizedStatus = normalizeStatus(status);
  
  const iconMap: Record<string, string> = {
    [MEMBERSHIP_STATUSES.ACTIVE_MEMBER]: "✓",
    [MEMBERSHIP_STATUSES.APPROVED]: "✓",
    [MEMBERSHIP_STATUSES.PAYMENT_COMPLETED]: "💰",
    [MEMBERSHIP_STATUSES.UNDER_REVIEW]: "⏳",
    [MEMBERSHIP_STATUSES.VERIFICATION_REQUIRED]: "🛡️",
    [MEMBERSHIP_STATUSES.PAYMENT_PENDING]: "💳",
    [MEMBERSHIP_STATUSES.REJECTED]: "✖️",
    [MEMBERSHIP_STATUSES.SUSPENDED]: "⏸️",
    [MEMBERSHIP_STATUSES.EXPIRED]: "📅",
    [MEMBERSHIP_STATUSES.CANCELLED]: "❌",
    [MEMBERSHIP_STATUSES.REGISTERED]: "📝",
    [MEMBERSHIP_STATUSES.APPLICATION_SUBMITTED]: "📝",
  };

  return iconMap[normalizedStatus] || "❓";
}
