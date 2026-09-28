export type Person = {
  name: string;
  role: string;
  affiliation: string;
  bio: string;
};

export const founder: Person = {
  name: "Dr Chandrakumar",
  role: "Founder & Executive Director",
  affiliation: "Q TECH PRIVATE LTD, trading as GIRSD",
  bio: "Dr Chandrakumar founded GIRSD with a conviction that rigorous research and practical skills development belong together. With a doctorate in engineering management and fifteen years spanning academia and industry consultancy, he has organised international conferences across three continents and advised universities on research commercialisation. Under his direction, GIRSD has grown into a community of over 4,800 members in 47 countries, delivering conferences, workshops and accredited online courses that bridge the gap between scholarship and employability.",
};

export const committees: { name: string; description: string; members: Person[] }[] = [
  {
    name: "Research & Academic Committee",
    description:
      "Oversees research quality, conference programmes and publication partnerships across GIRSD research events.",
    members: [
      { name: "Prof. David Okonkwo", role: "Committee Chair", affiliation: "University of Manchester, UK", bio: "Professor of Intelligent Systems with over 180 publications and advisory roles with UKRI." },
      { name: "Prof. Ingrid Svensson", role: "Member", affiliation: "KTH Royal Institute of Technology, Sweden", bio: "Chair in Materials Science and coordinator of two Horizon Europe consortia." },
      { name: "Dr Amelia Hartwell", role: "Member", affiliation: "GIRSD, UK", bio: "Chartered engineer and research strategist; chairs the ICRIET conference series." },
      { name: "Dr Rajan Mehta", role: "Member", affiliation: "King's College London, UK", bio: "Reader in Health Economics specialising in preventative healthcare policy." },
    ],
  },
  {
    name: "Skills & Education Committee",
    description:
      "Designs course curricula, appoints tutors and maintains assessment standards for GIRSD's online courses and workshops.",
    members: [
      { name: "Prof. Sarah McAllister", role: "Committee Chair", affiliation: "University of Edinburgh, UK", bio: "Professor of Education Policy advising national curriculum bodies across the UK and Ireland." },
      { name: "Dr Helen Ford", role: "Member", affiliation: "Journal of Applied Research Practice, UK", bio: "Journal editor and doctoral training facilitator with 1,200+ manuscripts handled." },
      { name: "Marcus Oyelaran", role: "Member", affiliation: "Skills Futures Consultancy, UK", bio: "Workforce development specialist working with employers on graduate skills pipelines." },
    ],
  },
  {
    name: "International Advisory Board",
    description:
      "Guides GIRSD's global strategy, regional partnerships and international education programmes.",
    members: [
      { name: "Prof. Elena Vasquez", role: "Board Chair", affiliation: "Aston University, UK", bio: "Pro Vice-Chancellor (International) with TNE partnerships across four continents." },
      { name: "Dr Chen Wei", role: "Member", affiliation: "Nanyang Institute of Management, Singapore", bio: "Specialist in transnational education quality assurance in South-East Asia." },
      { name: "Prof. Fatima Al-Rashidi", role: "Member", affiliation: "Gulf University for Science & Technology, Kuwait", bio: "Leads regional research capacity-building programmes across the GCC." },
    ],
  },
];

export const partners = [
  "CMS College of Engineering",
  "Vision Pacific Institute",
];
