// src/constants/pro.js
// Contenu de la facette "Jour" (corporate). Tout le texte de la page /pro vit ici.

import { alten, cnes, ltu, enseeiht, paulsab } from "../assets";

const proHero = {
  badge: "Ingénieur d'Affaires / Business Manager — ALTEN · Toulouse",
  title: "Le pont entre la technique et le business.",
  intro:
    "Ingénieur en informatique et en intelligence artificielle de formation, je suis aujourd'hui Business Manager chez ALTEN : développement commercial, recrutement d'ingénieurs et pilotage des prestations, toujours avec un pied dans la technique.",
  ctaPrimary: "Discutons de vos projets",
  ctaSecondary: "Voir mon LinkedIn",
  linkedin: "https://www.linkedin.com/in/jeremy-angulo/",
};

const proPillars = [
  {
    icon: "trending",
    title: "Développement commercial",
    text: "Identifier les besoins, construire les propositions et faire grandir des comptes dans la durée.",
    points: [
      "Prospection et avant-vente",
      "Construction d'offres sur mesure",
      "Négociation et contractualisation",
    ],
  },
  {
    icon: "users",
    title: "Recrutement & carrières",
    text: "Détecter les bons profils d'ingénieurs, les convaincre, puis les faire progresser mission après mission.",
    points: [
      "Sourcing et entretiens techniques",
      "Suivi de carrière des consultants",
      "Management de proximité",
    ],
  },
  {
    icon: "compass",
    title: "Pilotage de prestations",
    text: "Suivre les prestations dans la durée : cadrage, qualité et satisfaction client.",
    points: [
      "Cadrage et suivi de projets",
      "Relation client au long cours",
      "Culture agile et exigence qualité",
    ],
  },
];

// Rangée de chiffres clés (stat tiles) : valeur courte + libellé en toutes lettres.
const proStats = [
  { value: "80 k€", label: "de chiffre d'affaires généré en Junior-Entreprise" },
  { value: "150+", label: "ingénieurs juniors formés à l'IA en congrès nationaux" },
  { value: "20+", label: "séjours et équipes dirigés sur le terrain" },
  { value: "3", label: "prix et distinctions (Toulouse INP, Saint-Gobain, Vinci)" },
];

const proTimeline = [
  {
    date: "2026 — Aujourd'hui",
    title: "Business Manager (Ingénieur d'Affaires)",
    company: "ALTEN · Toulouse",
    icon: alten,
    text: "Développement commercial, recrutement d'ingénieurs et pilotage d'une équipe de consultants sur des projets d'ingénierie et IT.",
  },
  {
    date: "2025 — 2026",
    title: "Business Analyst",
    company: "ALTEN, pour NAVBLUE (groupe Airbus)",
    icon: alten,
    text: "Interface entre le Product Owner et des équipes techniques internationales : priorisation du backlog, agilité, qualité logicielle dans le monde aéronautique.",
  },
  {
    date: "2022 — 2025",
    title: "Consultant IT",
    company: "N7 Consulting (Junior-Entreprise)",
    icon: cnes,
    text: "Missions pour le CNES, des startups et des PME : cadrage, développement, relation client. Contribution à 80 k€ de chiffre d'affaires.",
  },
];

const proEducations = [
  {
    school: "INP-ENSEEIHT — Toulouse",
    degree: "Diplôme d'ingénieur, informatique & IA",
    year: "2022 — 2025",
    image: enseeiht,
  },
  {
    school: "Luleå University of Technology — Suède",
    degree: "Magister en Data Science",
    year: "2024 — 2025",
    image: ltu,
  },
  {
    school: "Université Paul Sabatier — Toulouse",
    degree: "Licence informatique · 1st/180",
    year: "2020 — 2022",
    image: paulsab,
  },
];

// Bandeau de cartes défilantes : des expériences variées, posées là sans discours.
const proTicker = [
  { icon: "smile", title: "Animateur BAFA depuis 7 ans" },
  { icon: "award", title: "Lauréat du prix Saint-Gobain", detail: "Congrès national des Junior-Entreprises" },
  { icon: "activity", title: "Moniteur d'escalade", detail: "en France et en Suède" },
  { icon: "cpu", title: "Formateur IA" },
  { icon: "map", title: "Directeur de séjours de vacances" },
  { icon: "globe", title: "Lauréat du prix Toulouse INP", detail: "relations internationales" },
  { icon: "book", title: "Formateur BAFA" },
  {
    icon: "heart",
    title: "Vie associative active",
    detail:
      "président du club d'escalade, trésorier du club d'échecs, secrétaire du club de randonnée, membre de la Junior-Entreprise de l'ENSEEIHT",
  },
  { icon: "clipboard", title: "Juge de compétitions d'escalade", detail: "FFME · régional et national" },
  { icon: "zap", title: "Lauréat du challenge Vinci Energies", detail: "projet d'innovation IA" },
];

const proContact = {
  title: "Travaillons ensemble.",
  text: "Un besoin d'ingénierie à staffer, une carrière d'ingénieur à construire, ou simplement envie d'échanger ? Écrivez-moi, je réponds vite.",
  email: "jeremy.angulo@alten.com",
  whatsapp: "https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=fr",
  phoneLabel: "+33 7 82 21 77 88",
  linkedin: "https://www.linkedin.com/in/jeremy-angulo/",
};

// Libellés d'interface de la facette jour (même forme dans proEn.js).
const proUi = {
  nav: { expertises: "Expertises", parcours: "Parcours", contact: "Contact", cta: "Me contacter" },
  heroTitle: { pre: "Le pont entre la technique et ", em: "le business", post: "." },
  heroAlt: "Jérémy Angulo, Business Manager chez ALTEN",
  chipTop: "ALTEN · Toulouse",
  chipBottom: "Ingénieur ENSEEIHT & Data Scientist",
  expertise: {
    eyebrow: "Ce que je fais",
    title: "Trois métiers, un seul interlocuteur.",
    sub: "Le rôle d'un Ingénieur d'Affaires : faire réussir en même temps ses clients, ses consultants et ses projets.",
  },
  statsLabel: "Chiffres clés",
  journey: {
    eyebrow: "Parcours",
    title: "D'ingénieur à ingénieur d'affaires.",
    sub: "Un parcours commencé côté code, avant de glisser naturellement vers le business.",
    eduLabel: "Formation",
  },
  tickerLabel: "En dehors du bureau",
  contactUi: {
    eyebrow: "Contact",
    nameLabel: "Votre nom",
    namePlaceholder: "Prénom Nom",
    emailLabel: "Votre email",
    emailPlaceholder: "vous@entreprise.fr",
    messageLabel: "Votre message",
    messagePlaceholder: "Un projet, un poste, une question ?",
    send: "Envoyer",
    sending: "Envoi en cours...",
    fillAll: "Merci de remplir tous les champs.",
    success: "Merci ! Je vous réponds au plus vite.",
    error: "Une erreur est survenue. Merci de réessayer.",
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
