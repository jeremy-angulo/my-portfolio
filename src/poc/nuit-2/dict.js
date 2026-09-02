// src/poc/nuit-2/dict.js
// Seul libellé d'interface qui n'existe nulle part dans les `constants` :
// l'indice de défilement du hero. Tout le reste du texte de la page vient de
// useNightContent() (règle 2 du brief).

const dict = {
  scrollHint: { fr: "Faire défiler", en: "Scroll" },
};

export const t = (cle, lang) => (dict[cle] && dict[cle][lang]) ?? dict[cle]?.fr ?? "";

export default dict;
