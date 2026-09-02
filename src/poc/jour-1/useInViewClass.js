// src/poc/jour-1/useInViewClass.js
// Pose une classe (`is-in` par défaut) sur un élément la première fois qu'il
// entre dans le viewport, puis se débranche. Sert à habiller des composants
// existants (ProTicker, ProContact, ProFooter) uniquement en CSS descendant,
// sans les modifier ni dupliquer leur logique.
//
// Sous « mouvement réduit », la classe est posée dès le montage : le contenu
// est visible d'emblée, sans transition.
//
// Local au POC : `shared/` est en lecture seule.

import { useEffect } from "react";
import useReducedMotion from "../shared/useReducedMotion";

/**
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{ amount?: number, classe?: string }} [options] `amount` = seuil 0..1
 * @returns {void}
 */
const useInViewClass = (ref, { amount = 0.2, classe = "is-in" } = {}) => {
  const mouvementReduit = useReducedMotion();

  useEffect(() => {
    const noeud = ref && ref.current;
    if (!noeud) return undefined;

    if (mouvementReduit || typeof IntersectionObserver === "undefined") {
      noeud.classList.add(classe);
      return undefined;
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          noeud.classList.add(classe);
          observateur.disconnect();
        }
      },
      { threshold: Math.min(Math.max(amount, 0), 1) }
    );

    observateur.observe(noeud);
    return () => observateur.disconnect();
  }, [ref, amount, classe, mouvementReduit]);
};

export default useInViewClass;
