import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Feedback Form",
  description:
    "Provide your feedback to help GlobalRSD continuously improve our academic portal, conference registrations, and learning resources.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
