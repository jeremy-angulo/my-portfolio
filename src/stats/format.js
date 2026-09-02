// src/stats/format.js — formateurs, libellés et petites fonctions pures
// partagés par la page /statistiques. Aucune dépendance React : tout est
// testable en Node (voir les JSDoc de niceScale et peakDay).

export const nf = new Intl.NumberFormat("fr-FR");

export const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
export const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
// Ticks de l'axe X de la courbe (« 27 août »).
export const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
// Sous-ligne « Meilleur jour » et tooltip de la courbe (« jeu. 27 août »).
export const weekdayShort = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
// Heure de chargement dans la barre d'outils (« 23:12 »).
export const timeHM = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 31, label: "31 jours" },
  { days: 90, label: "90 jours" },
  { days: 365, label: "1 an" },
];

// Texte de la plage pendant qu'une période se charge.
export const loadingLabel = (days) =>
  days === 365 ? "Chargement de l'année…" : `Chargement des ${days} jours…`;

// Note sous le KPI « Pages vues » : la période de comparaison a la même durée.
export const comparisonLabel = (days) => `vs ${days} jours précédents`;

// Catégories d'écran GoatCounter (/stats/sizes) : les ids sont stables,
// les noms anglais non — on francise sur l'id.
export const DEVICE_LABELS = {
  phone: "Téléphone",
  tablet: "Tablette",
  desktop: "Ordinateur",
  desktophd: "Grand écran",
  unknown: "Inconnu",
};

// "FR" → "France" en français. Peut manquer sur de vieux navigateurs : dans ce
// cas on garde le nom anglais renvoyé par GoatCounter.
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["fr"], { type: "region" });
} catch {
  /* Intl.DisplayNames absent : repli sur le libellé serveur */
}

export const countryRow = (row) => {
  const id = typeof row.id === "string" ? row.id.toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(id)) return { ...row, label: "Inconnu" };
  const flag = String.fromCodePoint(...[...id].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  let name = row.label;
  try {
    name = regionNames?.of(id) ?? row.label;
  } catch {
    /* code hors ISO : nom serveur */
  }
  return { ...row, label: `${flag} ${name}`, title: id };
};

// Provenance : GoatCounter renvoie « (non renseigné) » pour les accès directs,
// et des hôtes parfois préfixés de « www. ».
export const cleanReferrer = (row) => {
  if (row.label === "(non renseigné)") return { ...row, label: "Accès direct ou inconnu" };
  return { ...row, label: row.label.replace(/^www\./, "") };
};

export const formatRange = (range) => {
  if (!range?.start || !range?.end) return null;
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return `${range.start} → ${range.end}`;
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(start)} → ${dayMonthYear.format(end)}`;
};

export const messageForError = (payload, status) => {
  if (status === 401) return "Phrase incorrecte.";
  if (payload?.error === "not_configured")
    return "La variable STATS_PASSPHRASE n'est pas définie côté Vercel.";
  if (payload?.error === "token_missing")
    return "GOATCOUNTER_CODE ou GOATCOUNTER_API_TOKEN n'est pas défini côté Vercel.";
  if (payload?.error === "upstream")
    return `L'API GoatCounter a refusé la requête — ${payload.detail ?? "sans détail"}`;
  return "Erreur inattendue.";
};

// Nature d'un échec de /api/stats, pour choisir l'icône et le conseil de
// l'écran d'erreur (le message, lui, reste celui de messageForError).
export const kindForError = (payload, status) => {
  if (status === 0) return "network";
  if (status === 401) return "auth";
  if (payload?.error === "not_configured" || payload?.error === "token_missing") return "config";
  if (payload?.error === "upstream") return "upstream";
  return "unknown";
};

// Titre et conseil de l'écran d'erreur, par nature d'échec. Ton factuel.
export const ERROR_COPY = {
  network: {
    title: "Pas de connexion",
    hint: "Vérifiez le réseau, puis réessayez.",
  },
  upstream: {
    title: "GoatCounter ne répond pas",
    hint: "L'API limite les appels : un nouvel essai dans quelques secondes suffit souvent.",
  },
  config: {
    title: "Configuration incomplète",
    hint: "Une variable d'environnement manque côté Vercel.",
  },
  auth: {
    title: "Phrase refusée",
    hint: "",
  },
  unknown: {
    title: "Chargement impossible",
    hint: "Réessayez ; si l'erreur persiste, voir les journaux Vercel.",
  },
};

/**
 * Jour du pic de la période.
 *
 * Règle documentée : en cas d'égalité, c'est le PREMIER point dont
 * `pageviews === peak` qui gagne. Si aucun point n'égale le pic (arrondi
 * serveur, série vide), on renvoie null : pas de sous-ligne ni d'anneau.
 *
 * @param {Array<{day: string, pageviews: number}>} series
 * @param {number} peak
 * @returns {{day: string, pageviews: number} | null}
 */
export const peakDay = (series, peak) => {
  if (!Array.isArray(series) || typeof peak !== "number") return null;
  return series.find((point) => point?.pageviews === peak) ?? null;
};

/**
 * Échelle « nice » pour l'axe Y de la courbe.
 *
 * Le pas est de la forme {1, 2, 2.5, 5} × 10^k, choisi pour découper `max`
 * en ≈ `target` intervalles ; le sommet est le premier multiple du pas ≥ max
 * (l'échelle verticale utilise ce sommet, pas le max brut). Les ticks vont
 * de `step` à `top` (le zéro est la ligne de base, jamais étiqueté).
 *
 * niceScale(33)  → { step: 10, top: 40, ticks: [10, 20, 30, 40] }
 * niceScale(4)   → { step: 1,  top: 4,  ticks: [1, 2, 3, 4] }
 * niceScale(0)   → { step: 1,  top: 1,  ticks: [1] }
 *
 * @param {number} max
 * @param {number} [target=3]
 * @returns {{step: number, top: number, ticks: number[]}}
 */
export const niceScale = (max, target = 3) => {
  if (!(max > 0)) return { step: 1, top: 1, ticks: [1] };
  const rough = max / Math.max(1, target);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  // Des comptes entiers (pages vues) n'ont jamais de tick fractionnaire :
  // le facteur 2.5 n'est admis qu'à partir de la dizaine (25, 250…).
  const integer = Number.isInteger(max);
  const candidates = integer && magnitude < 10 ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  // Facteur « nice » le plus proche du pas brut (distance logarithmique) :
  // 33 → pas 10 (4 intervalles) plutôt que 20 (2 intervalles trop grossiers).
  const factor = candidates.reduce((best, candidate) =>
    Math.abs(Math.log(candidate / residual)) < Math.abs(Math.log(best / residual)) ? candidate : best
  );
  // Arrondi défensif : 0.1 × 3 = 0.30000000000000004 en flottant.
  const round = (value) => Number(value.toPrecision(12));
  let step = round(factor * magnitude);
  if (integer) step = Math.max(step, 1);
  const top = round(Math.ceil(round(max / step)) * step);
  const ticks = [];
  for (let value = step; value <= top + step / 1e6; value += step) ticks.push(round(value));
  return { step, top, ticks };
};
