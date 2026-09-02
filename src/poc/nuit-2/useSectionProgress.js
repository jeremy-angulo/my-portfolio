// src/poc/nuit-2/useSectionProgress.js
// Enveloppe locale de `useScrollRatio` (partagé) : c'est le SEUL point d'entrée
// du défilement dans ce POC — aucun `useScroll` de framer-motion n'est utilisé,
// ses offsets étant faux sous `body { zoom: 0.85 }`.
//
// Ce que l'enveloppe ajoute :
//   1. le court-circuit `prefers-reduced-motion` : la progression n'est pas
//      abonnée du tout et reste figée sur `frozen` (0 = « scène au repos »,
//      1 = « scène terminée, contenu en place ») ;
//   2. un compteur exposé en développement (`window.__n2Progress`) : il permet
//      de vérifier, depuis Playwright, combien de progressions sont réellement
//      branchées sur le défilement.

import { useEffect } from "react";
import useScrollRatio from "../shared/useScrollRatio";
import useReducedMotion from "../shared/useReducedMotion";

// Compteur de contrôle : { live, frozen }. Uniquement pour la vérification.
const compteur = { live: 0, frozen: 0 };
const publier = () => {
  if (typeof window !== "undefined") {
    window.__n2Progress = { live: compteur.live, frozen: compteur.frozen };
  }
};

/**
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{ start?: string, end?: string, enabled?: boolean, frozen?: number }} [options]
 * @returns {import("framer-motion").MotionValue<number>}
 */
const useSectionProgress = (ref, { start, end, enabled = true, frozen = 1 } = {}) => {
  const reduit = useReducedMotion();
  const actif = enabled && !reduit;
  const progression = useScrollRatio(ref, { start, end, enabled: actif, frozen });

  useEffect(() => {
    if (actif) compteur.live += 1;
    else compteur.frozen += 1;
    publier();
    return () => {
      if (actif) compteur.live -= 1;
      else compteur.frozen -= 1;
      publier();
    };
  }, [actif]);

  return progression;
};

export default useSectionProgress;
