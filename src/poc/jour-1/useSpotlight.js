// src/poc/jour-1/useSpotlight.js
// Éclaire à la souris les cartes d'une grille : un seul `pointermove` posé sur
// le CONTENEUR, throttlé en rAF, qui écrit sur chaque carte `--mx` / `--my`
// (en % de son propre rect) et `--spot` (1 sur la carte survolée, 0 ailleurs).
//
// Aucun setState : le rendu React n'est jamais rejoué pendant un déplacement
// de souris. Les positions viennent uniquement de `getBoundingClientRect()` et
// de `clientX/clientY`, qui sont dans le MÊME repère sous `body { zoom: 0.85 }`.
//
// Local au POC (un seul l'utilise) : les modules de `shared/` sont en lecture
// seule et cette API n'y a pas sa place.

import { useEffect } from "react";
import useHoverCapable from "../shared/useHoverCapable";
import useReducedMotion from "../shared/useReducedMotion";

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pourcent = (v) => `${Math.round(borner(v) * 1000) / 10}%`;

/**
 * @param {React.RefObject<HTMLElement>} ref conteneur (la grille)
 * @param {{ selecteur?: string, enabled?: boolean }} [options]
 * @returns {void}
 */
const useSpotlight = (ref, { selecteur = ":scope > *", enabled = true } = {}) => {
  const survolPossible = useHoverCapable();
  const mouvementReduit = useReducedMotion();
  const actif = enabled && survolPossible && !mouvementReduit;

  useEffect(() => {
    const conteneur = ref && ref.current;
    if (!conteneur || !actif) return undefined;

    let rafId = 0;
    let dernier = null;

    const cartes = () => conteneur.querySelectorAll(selecteur);

    const appliquer = () => {
      rafId = 0;
      if (!dernier) return;
      cartes().forEach((carte) => {
        const r = carte.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const x = (dernier.x - r.left) / r.width;
        const y = (dernier.y - r.top) / r.height;
        const dedans = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        carte.style.setProperty("--mx", pourcent(x));
        carte.style.setProperty("--my", pourcent(y));
        carte.style.setProperty("--spot", dedans ? "1" : "0");
      });
    };

    const onMove = (e) => {
      dernier = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(appliquer);
    };

    const onLeave = () => {
      dernier = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      cartes().forEach((carte) => carte.style.setProperty("--spot", "0"));
    };

    conteneur.addEventListener("pointermove", onMove, { passive: true });
    conteneur.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      conteneur.removeEventListener("pointermove", onMove);
      conteneur.removeEventListener("pointerleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref, actif, selecteur]);
};

export default useSpotlight;
