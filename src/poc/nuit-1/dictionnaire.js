// src/poc/nuit-1/dictionnaire.js
// Les SEULS libellés d'interface absents des `constants` : des intitulés
// d'accessibilité, jamais du texte marketing. Le reste vient de
// `useNightContent()` et n'est pas réécrit.

import { useLang } from "../../i18n/LanguageContext";

const DICT = {
  fr: {
    demo: "Ouvrir le projet",
    code: "Voir le code source",
    dock: "Navigation de la page",
    parcours: "Parcours professionnel",
    onglets: "Catégories de projets",
    distinctions: "Distinctions",
    formations: "Formations",
    projets: "Projets",
    canaux: "Me joindre",
  },
  en: {
    demo: "Open the project",
    code: "View the source code",
    dock: "Page navigation",
    parcours: "Work experience",
    onglets: "Project categories",
    distinctions: "Achievements",
    formations: "Education",
    projets: "Projects",
    canaux: "Reach me",
  },
};

export const useDict = () => {
  const { lang } = useLang();
  return DICT[lang] ?? DICT.fr;
};

export default DICT;
