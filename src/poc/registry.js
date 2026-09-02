// src/poc/registry.js
// Les six POC, dans l'ordre de la page de comparaison /poc.
// PocRouter et PocIndex ne lisent que ce fichier : ajouter un POC = ajouter une
// entrée. `load` est un import dynamique, donc un chunk par POC.

const registry = [
  {
    slug: "jour-1",
    facet: "day",
    slot: 1,
    name: "Trait d'union",
    tagline: {
      fr: "La structure de l'accueil, chaque détail relevé : titre composé mot à mot, trait ambre tracé sous « le business », chiffres qui comptent, timeline qui se dessine.",
      en: "The current home page with every detail raised: a word-by-word title, an amber stroke drawn under \"business\", counting figures, a timeline that draws itself.",
    },
    load: () => import("./jour-1/Page.jsx"),
  },
  {
    slug: "jour-2",
    facet: "day",
    slot: 2,
    name: "Le Pont",
    tagline: {
      fr: "Le défilement construit la page : le titre se démonte en pont, les chiffres passent en scène, le parcours se traverse latéralement.",
      en: "Scrolling builds the page: the title turns into a bridge, the key figures take the stage, the journey is crossed sideways.",
    },
    load: () => import("./jour-2/Page.jsx"),
  },
  {
    slug: "jour-3",
    facet: "day",
    slot: 3,
    name: "Plein soleil",
    tagline: {
      fr: "Un ciel WebGL derrière la page : le soleil suit le pointeur et éclaire les cartes, puis avance avec le défilement.",
      en: "A WebGL sky behind the page: the sun follows the pointer and lights the cards, then moves on as you scroll.",
    },
    load: () => import("./jour-3/Page.jsx"),
  },
  {
    slug: "nuit-1",
    facet: "night",
    slot: 1,
    name: "Veilleuse",
    tagline: {
      fr: "La même page, réglée de près : prénom qui s'écrit, lampe au pointeur, parcours et projets redessinés, sans WebGL.",
      en: "The same page, finely tuned: a hand-written name, a pointer-held lamp, redrawn timeline and projects, no WebGL.",
    },
    load: () => import("./nuit-1/Page.jsx"),
  },
  {
    slug: "nuit-2",
    facet: "night",
    slot: 2,
    name: "Clair de lune",
    tagline: {
      fr: "La lune quitte le portrait au premier défilement et tient lieu de barre de progression jusqu'au contact ; projets en rail épinglé, expérience qui s'allume au passage.",
      en: "The moon leaves the portrait on the first scroll and serves as the progress bar down to the contact form; pinned project rail, experience timeline lighting up as you pass.",
    },
    load: () => import("./nuit-2/Page.jsx"),
  },
  {
    slug: "nuit-3",
    facet: "night",
    slot: 3,
    name: "Poussière d'étoiles",
    tagline: {
      fr: "Un seul champ d'étoiles WebGL : il compose le portrait, devient le ciel de la page, puis le globe du contact.",
      en: "One WebGL star field: it forms the portrait, becomes the page's sky, then the contact globe.",
    },
    load: () => import("./nuit-3/Page.jsx"),
  },
];

export const bySlug = (slug) => registry.find((poc) => poc.slug === slug) ?? null;

export default registry;
