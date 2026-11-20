export type CourseSyllabusModule = {
  module: string;
  subtitle?: string;
  topics: string[];
  caseStudy?: string;
};

export type CourseBusinessStat = {
  stat: string;
  label: string;
  detail: string;
};

export type CourseFAQ = {
  question: string;
  answer: string;
};

export type Course = {
  slug: string;
  code?: string;
  title: string;
  subtitle?: string;
  level: "Executive" | "Advanced" | "Intermediate" | "Foundation" | string;
  duration: string;
  effort: string;
  format?: string;
  price: number; // GBP
  category: string;
  cpdCredits?: number;
  cpdProviderNumber?: string;
  summary: string;
  description: string;
  businessCaseIntro?: string;
  businessCase?: CourseBusinessStat[];
  whoIsThisFor?: string[];
  keyTakeaways?: string[];
  syllabus: CourseSyllabusModule[];
  learningExperience?: {
    harvardCaseMethod: string;
    handsOnLabs: string;
    tutorSupport: string;
  };
  assessmentBreakdown?: {
    passRequirement: string;
    theoryMcq: string;
    practicalCapstone: string;
    description: string;
  };
  support: string[];
  assessment: string[];
  certification: string;
  faqs?: CourseFAQ[];
  image?: string;
};

import coursesJson from "@/content/courses.json";

export const courses = coursesJson as Course[];

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug);
}
