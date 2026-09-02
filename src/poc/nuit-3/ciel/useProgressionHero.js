// src/poc/nuit-3/ciel/useProgressionHero.js
// Progression du hero : p = clamp(-rect.top / rect.height, 0, 1).
//
// `useScroll({ target, offset })` de framer-motion mélange les rects (repère
// zoomé) et `window.innerHeight` (repère non zoomé) : sous `body { zoom: .85 }`
// ses offsets sont faux de ~18 %. On passe donc par `useScrollRatio` du
// dossier partagé, qui ne lit que des rects et la sonde de viewport ;
// `{ start: "start start", end: "end start" }` redonne exactement la formule
// attendue, sur le rAF partagé du chantier.

import { useEffect } from "react";
import { useMotionValueEvent, useTransform } from "framer-motion";
import useScrollRatio from "../../shared/useScrollRatio";
import store from "./cielStore";

// smoothstep(bord0, bord1, x)
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * @param {React.RefObject<HTMLElement>} heroRef
 * @param {{ actif?: boolean }} [options] `actif: false` (mouvement réduit)
 *   fige p à 0 : le portrait reste en place, rien ne se dissout.
 */
const useProgressionHero = (heroRef, { actif = true } = {}) => {
  const p = useScrollRatio(heroRef, {
    start: "start start",
    end: "end start",
    enabled: actif,
    frozen: 0,
  });

  // Le ciel lit sa cible dans le store ; le ressort est intégré côté WebGL.
  useMotionValueEvent(p, "change", (v) => {
    store.dissolveCible = smoothstep(0.12, 0.7, v);
    store.heroVisible = v < 0.999;
    store.derniereActivite = performance.now();
  });

  useEffect(() => {
    store.dissolveCible = actif ? smoothstep(0.12, 0.7, p.get()) : 0;
    store.heroVisible = true;
  }, [actif, p]);

  // Opacités DOM pilotées par la même progression : des motion values, donc
  // aucun re-render pendant le défilement.
  const opaciteCarte = useTransform(p, [0.35, 0.65], [1, 0]);
  const opaciteDock = useTransform(p, [0.78, 0.86], [0, 1]);

  return { p, opaciteCarte, opaciteDock };
};

export default useProgressionHero;
