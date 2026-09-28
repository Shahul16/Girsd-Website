export type MembershipTier = {
  id: string;
  name: string;
  price: number; // GBP per year
  audience: string;
  benefits: string[];
  featured?: boolean;
};

export const membershipTiers: MembershipTier[] = [
  {
    id: "member-student",
    name: "Student",
    price: 49,
    audience: "Undergraduate and postgraduate students with valid enrolment",
    benefits: [
      "20% discount on all conference tickets",
      "10% discount on online courses",
      "Digital membership certificate",
      "Members-only quarterly briefings",
      "Access to member community forum",
    ],
  },
  {
    id: "member-academic",
    name: "Academic",
    price: 99,
    audience: "Lecturers, researchers and academic professionals",
    featured: true,
    benefits: [
      "20% discount on all conference tickets",
      "10% discount on online courses",
      "Priority paper review scheduling",
      "Cross-sector mentoring scheme",
      "Eligibility for committee service",
      "Members-only quarterly briefings",
      "Digital membership certificate",
    ],
  },
  {
    id: "member-industry",
    name: "Industry",
    price: 249,
    audience: "Industry professionals, consultants and organisational representatives",
    benefits: [
      "20% discount on all conference tickets",
      "10% discount on online courses",
      "Two delegate passes to one workshop per year",
      "Cross-sector mentoring scheme (mentor or mentee)",
      "Industry panel speaking opportunities",
      "Company profile in GIRSD directory",
      "Members-only quarterly briefings",
    ],
  },
];

export function getTier(id: string) {
  return membershipTiers.find((t) => t.id === id);
}

export const awardCategories = {
  individual: [
    { name: "Emerging Researcher of the Year", track: "Academia", description: "For a researcher within seven years of their doctorate showing exceptional promise and output." },
    { name: "Research Excellence Award", track: "Academia", description: "For a sustained body of internationally recognised research." },
    { name: "Outstanding Educator Award", track: "Academia", description: "For transformative teaching, mentorship or curriculum innovation." },
    { name: "Industry Innovation Leader", track: "Industry", description: "For an individual driving research-informed innovation within their organisation." },
    { name: "Skills Champion of the Year", track: "Industry", description: "For exceptional contribution to workforce skills development." },
  ],
  institutional: [
    { name: "Institutional Excellence in Research", track: "Academia", description: "For a department or institution demonstrating outstanding research culture and output." },
    { name: "Excellence in Skills Development", track: "Industry", description: "For an organisation with exemplary training and development programmes." },
    { name: "Research Impact Award", track: "Academia & Industry", description: "For a project with demonstrable social, economic or environmental benefit beyond academia. New for 2026." },
  ],
};
