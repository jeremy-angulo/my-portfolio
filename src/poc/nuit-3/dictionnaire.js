// src/poc/nuit-3/dictionnaire.js
// Les seuls libellés d'interface propres au POC : rien de marketing, rien qui
// double le contenu de `nightUi`. Tout le reste vient des constants.

const dictionnaire = {
  fr: {
    decor: "Décor animé",
    constellation: "Parcours professionnel",
    clairiere: "Champ d'étoiles rassemblé en globe",
  },
  en: {
    decor: "Animated backdrop",
    constellation: "Professional timeline",
    clairiere: "Star field gathered into a globe",
  },
};

export const dicoNuit3 = (lang) => dictionnaire[lang] ?? dictionnaire.fr;

export default dictionnaire;
