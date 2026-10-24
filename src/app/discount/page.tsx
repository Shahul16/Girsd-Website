import type { Metadata } from "next";
import DiscountForm from "./DiscountForm";

export const metadata: Metadata = {
  title: "Claim 90% Academic Research Grant — PAAVAI90",
  description:
    "Claim your exclusive 90% Keynote Academic Research Grant (PAAVAI90) valid for 14 days across GIRSD Memberships, CPD Courses, and Masterclasses.",
  alternates: { canonical: "/discount" },
};

export default function DiscountPage() {
  return <DiscountForm />;
}
