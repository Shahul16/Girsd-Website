/**
-- Global Institute of Research & Skills Development (GIRSD)
-- Awards Workflow Types & Utilities
*/

export interface AwardNomination {
  id?: string;
  nomination_ref: string;
  nominator_name: string;
  nominator_email: string;
  nomination_type: "Self-nomination" | "Nominating someone else" | string;
  category: string;
  nominee_name: string;
  nominee_email: string;
  nominee_affiliation?: string;
  nominee_country?: string;
  statement?: string;
  supporting_links?: string;
  attachment_url?: string;
  attachment_filename?: string;
  status: "pending_review" | "selected" | "rejected" | "registered";
  selected_at?: string;
  registered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GuestDetail {
  name: string;
  relationship: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  deliveryPhone: string;
}

export interface AwardRegistration {
  id?: string;
  nomination_ref: string;
  award_category: string;
  full_name_engraving: string;
  designation: string;
  organization: string;
  department?: string;
  country: string;
  city: string;
  email: string;
  phone_whatsapp: string;
  headshot_url: string;
  logo_url?: string;
  linkedin_url?: string;
  website_orcid_url?: string;
  name_pronunciation?: string;
  attendance_mode: "in_person" | "virtual" | "proxy";
  proxy_name?: string;
  proxy_relationship?: string;
  proxy_email?: string;
  proxy_phone?: string;
  accompanying_guests_count: number;
  guests_details: GuestDetail[];
  shipping_address?: ShippingAddress;
  amount_gbp: number; // 255
  payment_status: "pending" | "paid" | "failed" | "refunded";
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  billing_entity_type: "individual" | "organization";
  billing_name: string;
  billing_address: string;
  vat_tax_number?: string;
  media_consent: boolean;
  media_consent_at?: string;
  no_refund_consent: boolean;
  no_refund_consent_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generates an official unique nomination reference in the format:
 * GIRSD-AWD-2026-XXXX (4 uppercase alphanumeric chars excluding ambiguous ones)
 */
export function generateNominationRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GIRSD-AWD-2026-${randomPart}`;
}

export const AWARDS_REGISTRATION_FEE_GBP = 255;
export const AWARDS_REGISTRATION_FEE_PENCE = 25500;

