// src/poc/shared/useCountUp.js
// Compteur animé, sans observation intégrée : le POC branche lui-même
// `enabled` sur son `useInView({ once: true, amount })`.
//
// Le hook ne s'occupe PAS du formatage. Pour couvrir « 80 k€ », « €80k »,
// « 150+ » ou « 3 », le POC découpe la valeur d'origine avec
// `/^([^\d]*)(\d+)(.*)$/` (préfixe / entier / suffixe), anime l'entier, et
// rend la chaîne exacte des constants une fois le compte fini.

import { useEffect, useRef, useState } from "react";
import useReducedMotion from "./useReducedMotion";

// Sortie exponentielle : démarrage franc, arrivée douce.
export const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * @param {number} target valeur finale
 * @param {{ duration?: number, delay?: number, enabled?: boolean,
 *           ease?: (t:number)=>number }} [options] durées en ms
 * @returns {number} entier courant
 */
const useCountUp = (target, { duration = 1200, delay = 0, enabled = true, ease = expoOut } = {}) => {
  const mouvementReduit = useReducedMotion();
  const immediat = mouvementReduit || duration <= 0;
  const cible = Number.isFinite(target) ? target : 0;

  const [valeur, setValeur] = useState(() => (immediat ? Math.round(cible) : 0));

  const demarre = useRef(false);
  const rafRef = useRef(0);
  const minuteurRef = useRef(0);

  useEffect(() => {
    // Démarre une seule fois, quand `enabled` passe à true ; un re-render ne
    // relance jamais l'animation (le rAF est gardé dans un ref).
    if (!enabled || demarre.current) return;
    demarre.current = true;

    if (immediat) {
      setValeur(Math.round(cible));
      return;
    }

    const lancer = () => {
      const t0 = performance.now();
      const pas = (maintenant) => {
        const t = Math.min(1, (maintenant - t0) / duration);
        setValeur(Math.round(ease(t) * cible));
        if (t < 1) rafRef.current = requestAnimationFrame(pas);
        else rafRef.current = 0;
      };
      rafRef.current = requestAnimationFrame(pas);
    };

    if (delay > 0) minuteurRef.current = setTimeout(lancer, delay);
    else lancer();
  }, [enabled, immediat, cible, duration, delay, ease]);

  // Nettoyage au démontage : ni rAF ni timer orphelin.
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
    },
    []
  );

  return valeur;
};

export default useCountUp;
