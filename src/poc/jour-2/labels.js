// src/poc/jour-2/labels.js
// Dictionnaire local au POC « Le Pont ». Aucun texte de contenu n'est réécrit :
// on n'ajoute que les deux libellés d'interface indispensables (« Faire
// défiler ») et les mots de découpage du titre, qui servent à retrouver les
// morceaux DANS la chaîne des constants — jamais à la remplacer.

const LABELS = {
  fr: {
    hint: "Faire défiler",
    head: "Le pont entre",
    link: "et",
  },
  en: {
    hint: "Scroll",
    head: "The bridge between",
    link: "and",
  },
};

/**
 * Découpe `proUi.heroTitle` en cinq morceaux sans jamais modifier le texte :
 *   pre = "Le pont entre la technique et " → head "Le pont entre",
 *   mid "la technique", link "et" ; em "le business" ; post "."
 *
 * @param {{pre:string, em:string, post:string}} heroTitle
 * @param {"fr"|"en"} lang
 * @returns {{head:string, mid:string, link:string, em:string, post:string}|null}
 *          null = repli (titre entier non découpé, pas de pont)
 */
export const splitHeroTitle = (heroTitle, lang) => {
  const dict = LABELS[lang] ?? LABELS.fr;
  const pre = heroTitle && typeof heroTitle.pre === "string" ? heroTitle.pre : "";
  const debut = `${dict.head} `;
  const fin = ` ${dict.link} `;

  // Contrat strict : si la chaîne des constants change de forme, on ne
  // bricole pas — on rend le titre entier, tel qu'il est aujourd'hui.
  if (!pre.startsWith(debut) || !pre.endsWith(fin)) return null;

  const mid = pre.slice(debut.length, pre.length - fin.length).trim();
  if (!mid) return null;

  return {
    head: dict.head,
    mid,
    link: dict.link,
    em: heroTitle.em,
    post: heroTitle.post,
  };
};

export const useLabels = (lang) => LABELS[lang] ?? LABELS.fr;

export default LABELS;
