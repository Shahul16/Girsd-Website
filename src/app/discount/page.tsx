import type { Metadata } from "next";
import DiscountForm from "./DiscountForm";

export const metadata: Metadata = {
  title: "Claim 100% Academic Research Grant — PAAVAI100",
  description:
    "Claim your exclusive 100% Keynote Academic Research Grant (PAAVAI100) valid for 10 days across GIRSD Memberships, CPD Courses, and Masterclasses.",
  alternates: { canonical: "/discount" },
};

export default function DiscountPage() {
  return <DiscountForm />;
}
