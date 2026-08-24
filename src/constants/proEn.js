// src/constants/proEn.js
// English version of the "Day" facet content. Same shape as pro.js:
// any structural change there must be mirrored here.

import { alten, cnes, ltu, enseeiht, paulsab } from "../assets";

const proHero = {
  badge: "Ingénieur d'Affaires / Business Manager — ALTEN · Toulouse",
  title: "The bridge between engineering and business.",
  intro:
    "Trained as a software and AI engineer, I am now a Business Manager at ALTEN: business development, engineer recruitment and delivery oversight, always with one foot in the technical side.",
  ctaPrimary: "Let's talk about your projects",
  ctaSecondary: "See my LinkedIn",
  linkedin: "https://www.linkedin.com/in/jeremy-angulo/",
};

const proPillars = [
  {
    icon: "trending",
    title: "Business development",
    text: "Identifying needs, building proposals and growing accounts over the long run.",
    points: [
      "Prospecting and pre-sales",
      "Tailor-made proposals",
      "Negotiation and contracting",
    ],
  },
  {
    icon: "users",
    title: "Recruitment & careers",
    text: "Spotting the right engineers, convincing them, then helping them grow assignment after assignment.",
    points: [
      "Sourcing and technical interviews",
      "Consultant career development",
      "Close, hands-on management",
    ],
  },
  {
    icon: "compass",
    title: "Delivery oversight",
    text: "Following engagements over time: scoping, quality and client satisfaction.",
    points: [
      "Project scoping and follow-up",
      "Long-term client relationships",
      "Agile culture and quality standards",
    ],
  },
];

// Key figures row (stat tiles): short value + spelled-out label.
const proStats = [
  { value: "€80k", label: "in revenue generated as a Junior-Enterprise consultant" },
  { value: "150+", label: "junior engineers trained in AI at national congresses" },
  { value: "20+", label: "camps and teams led in the field" },
  { value: "3", label: "awards and distinctions (Toulouse INP, Saint-Gobain, Vinci)" },
];

const proTimeline = [
  {
    date: "2026 — Today",
    title: "Business Manager (Ingénieur d'Affaires)",
    company: "ALTEN · Toulouse",
    icon: alten,
    text: "Business development, engineer recruitment and management of a team of consultants on engineering and IT projects.",
  },
  {
    date: "2025 — 2026",
    title: "Business Analyst",
    company: "ALTEN, for NAVBLUE (an Airbus company)",
    icon: alten,
    text: "Interface between the Product Owner and international technical teams: backlog prioritization, agile delivery and software quality in the aerospace world.",
  },
  {
    date: "2022 — 2025",
    title: "IT Consultant",
    company: "N7 Consulting (Junior-Enterprise)",
    icon: cnes,
    text: "Assignments for CNES, startups and SMEs: scoping, development, client relationship. Contributed to €80k in revenue.",
  },
];

const proEducations = [
  {
    school: "INP-ENSEEIHT — Toulouse",
    degree: "Master of Engineering, Computer Science & AI",
    year: "2022 — 2025",
    image: enseeiht,
  },
  {
    school: "Luleå University of Technology — Sweden",
    degree: "Magister in Data Science",
    year: "2024 — 2025",
    image: ltu,
  },
  {
    school: "Université Paul Sabatier — Toulouse",
    degree: "Bachelor in Computer Science · 1st/180",
    year: "2020 — 2022",
    image: paulsab,
  },
];

// Scrolling cards band: varied experiences, no headline.
const proTicker = [
  { icon: "smile", title: "Youth activity leader (BAFA) for 7 years" },
  { icon: "award", title: "Saint-Gobain award winner", detail: "National Junior-Enterprise Congress" },
  { icon: "activity", title: "Climbing instructor", detail: "in France and Sweden" },
  { icon: "cpu", title: "AI trainer" },
  { icon: "map", title: "Summer camp director" },
  { icon: "globe", title: "Toulouse INP award winner", detail: "international relations" },
  { icon: "book", title: "BAFA trainer" },
  {
    icon: "heart",
    title: "Active community life",
    detail:
      "climbing club president, chess club treasurer, hiking club secretary, member of the ENSEEIHT Junior-Enterprise",
  },
  { icon: "clipboard", title: "Climbing competition judge", detail: "FFME · regional and national" },
  { icon: "zap", title: "Vinci Energies challenge winner", detail: "AI innovation project" },
];

const proContact = {
  title: "Let's work together.",
  text: "An engineering need to staff, an engineering career to build, or simply keen to chat? Write to me, I answer fast.",
  email: "jeremy.angulo@alten.com",
  whatsapp: "https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=en",
  phoneLabel: "+33 7 82 21 77 88",
  linkedin: "https://www.linkedin.com/in/jeremy-angulo/",
};

// Day facet UI labels (same shape as in pro.js).
const proUi = {
  nav: { expertises: "Expertise", parcours: "Journey", contact: "Contact", cta: "Get in touch" },
  heroTitle: { pre: "The bridge between engineering and ", em: "business", post: "." },
  heroAlt: "Jérémy Angulo, Business Manager at ALTEN",
  cta3d: "Discover me in 3D",
  chipTop: "ALTEN · Toulouse",
  chipBottom: "ENSEEIHT Engineer & Data Scientist",
  expertise: {
    eyebrow: "What I do",
    title: "Three jobs, one single point of contact.",
    sub: "The role of a Business Manager: making clients, consultants and projects succeed at the same time.",
  },
  statsLabel: "Key figures",
  journey: {
    eyebrow: "Journey",
    title: "From engineer to business engineer.",
    sub: "A path that started on the code side, before drifting naturally towards business.",
    eduLabel: "Education",
  },
  tickerLabel: "Outside the office",
  contactUi: {
    eyebrow: "Contact",
    nameLabel: "Your name",
    namePlaceholder: "First and last name",
    emailLabel: "Your email",
    emailPlaceholder: "you@company.com",
    messageLabel: "Your message",
    messagePlaceholder: "A project, a position, a question?",
    send: "Send",
    sending: "Sending...",
    fillAll: "Please fill out all fields.",
    success: "Thank you! I will get back to you as soon as possible.",
    error: "Something went wrong. Please try again.",
  },
};

export {
  proHero,
  proPillars,
  proStats,
  proTimeline,
  proEducations,
  proTicker,
  proContact,
  proUi,
};
