import siteJson from "@/content/site.json";

export const formatAddress = (addr: any) => {
  if (typeof addr === "string") return addr;
  if (addr && typeof addr === "object") {
    const locality = [addr.city, addr.postcode].filter(Boolean).join(" ");
    return [addr.line1, locality, addr.country].filter(Boolean).join(", ");
  }
  return "23 Kinnaird Avenue, Bromley BR1 4HG, England";
};

export const SITE = {
  name: siteJson.name || "Global Institute of Research & Skills Development",
  shortName: siteJson.shortName || "GIRSD",
  domain: "https://www.globalrsd.co.uk",
  domainDisplay: "www.globalrsd.co.uk",
  tagline: siteJson.tagline || "Advancing Research. Developing Skills.",
  logoHeader: siteJson.logoHeader || "/logo-header.png",
  logoWhite: siteJson.logoWhite || "/logo-white.png",
  crest: (siteJson as any).crest || "/girsd-crest.png",
  favicon: siteJson.favicon || "/favicon.ico",
  email: (siteJson as any).email || (siteJson as any).emails?.info || "info@globalrsd.co.uk",
  researchEmail: (siteJson as any).researchEmail || (siteJson as any).emails?.research || "research@globalrsd.co.uk",
  awardsEmail: (siteJson as any).awardsEmail || (siteJson as any).emails?.awards || "awards@globalrsd.co.uk",
  membershipEmail: (siteJson as any).membershipEmail || (siteJson as any).emails?.membership || "membership@globalrsd.co.uk",
  hrEmail: (siteJson as any).hrEmail || (siteJson as any).emails?.hr || "hr@globalrsd.co.uk",
  financeEmail: (siteJson as any).financeEmail || (siteJson as any).emails?.finance || "finance@globalrsd.co.uk",
  privacyEmail: (siteJson as any).privacyEmail || (siteJson as any).emails?.privacy || "privacy@globalrsd.co.uk",
  leadsEmail: (siteJson as any).leadsEmail || (siteJson as any).emails?.leads || "leads@globalrsd.co.uk",
  noreplyEmail: (siteJson as any).noreplyEmail || (siteJson as any).emails?.noreply || "noreply@globalrsd.co.uk",
  phone: (siteJson as any).phone || (siteJson as any).phones?.main || "+44 7586 261118",
  whatsapp: (siteJson as any).whatsapp || (siteJson as any).phones?.whatsapp || "https://wa.me/447586261118",
  accreditation: "Approved CPD (Continuing Professional Development) provider",
  /**
   * Accreditation & statutory registrations shown as trust badges.
   */
  registrations: {
    cpd: {
      name: "CPD Approved Provider",
      body: "The CPD Group — Provider #788000",
      number: "788000",
      verifyUrl: "https://thecpdregister.com/providers/cpd-group-providers--788000",
    },
    ico: { name: "ICO Registered", body: "Information Commissioner's Office (UK GDPR)", number: "", verifyUrl: "" },
    ukrlp: { name: "UKRLP Registered", body: "UK Register of Learning Providers", number: "", verifyUrl: "" },
  },
  credit: { name: "Shahul Hameed", url: "https://www.linkedin.com/in/shahul-hameed16/" },
  companyLine:
    (siteJson as any).companyLine ||
    "Global Institute of Research & Skills Development (GIRSD) is a trading name of Q TECH PRIVATE LTD, registered in England & Wales (Company No. 15754767).",
  company: {
    legalName: "Q TECH PRIVATE LTD",
    number: "15754767",
    tradingAs: "Global Institute of Research & Skills Development (GIRSD)",
    address: formatAddress(siteJson.address),
  },
  social: {
    linkedin: (siteJson.social as any)?.linkedin || "https://www.linkedin.com/company/globalrsd",
    instagram: (siteJson.social as any)?.instagram || "https://www.instagram.com/globalrsd",
    youtube: (siteJson.social as any)?.youtube || "https://www.youtube.com/globalrsd",
  },
  stats: (siteJson as any).stats || {
    members: "2,500+",
    conferences: "18",
    countries: "50+",
    papers: "1,200+",
  },
  memberDiscount: 0.1,
  courseMemberDiscount: 0.05,
  registrationPricing: {
    earlyBirdDiscount: 0.15,
    lateFeeSurcharge: 0.15,
  },
};
