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
    price: 55,
    audience: "Undergraduate and postgraduate students with valid enrolment",
    benefits: [
      "25% discount on all conference registrations",
      "1 free academic writing webinar per year",
      "Digital membership certificate & member badge",
      "Members-only quarterly briefings",
      "Access to member community forum",
    ],
  },
  {
    id: "member-academic",
    name: "Academic Member (MGIRSD)",
    price: 185,
    audience: "Lecturers, researchers and academic professionals",
    featured: true,
    benefits: [
      "1 free virtual conference paper presentation ticket (worth £245–£275)",
      "Priority double-blind peer-review queue",
      "Formal post-nominal designation (MGIRSD)",
      "20% discount on all certified CPD courses",
      "Cross-sector mentoring scheme",
      "Eligibility for committee & editorial board service",
      "Members-only quarterly briefings",
      "Digital membership certificate & member badge",
    ],
  },
  {
    id: "member-industry",
    name: "Industry Fellow (FGIRSD)",
    price: 395,
    audience: "Industry professionals, consultants and organisational representatives",
    benefits: [
      "2 delegate passes to any in-person UK or Dubai event per year",
      "Corporate profile in the GIRSD Global Scholar Directory",
      "Automatic eligibility to join the Editorial / Scientific Advisory Board",
      "20% discount on all certified CPD courses",
      "Cross-sector mentoring scheme (mentor or mentee)",
      "Industry panel speaking opportunities",
      "Members-only quarterly briefings",
      "Formal post-nominal designation (FGIRSD)",
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
