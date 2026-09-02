// src/poc/jour-2/useSceneProgress.js
// Enveloppe de `useScrollRatio` (partagé) : mappage direct 1:1, réversible,
// sans ressort. Hors épinglage (mobile, mouvement réduit) la progression est
// figée à 1 — « scène terminée, contenu en place » — et rien ne s'abonne.
//
// Aucun `useScroll` de framer-motion dans ce POC : ses offsets mélangent des
// rects et `window.innerHeight`, faux sous `body { zoom: 0.85 }`.

import { useTransform } from "framer-motion";
import useScrollRatio from "../shared/useScrollRatio";

/**
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{start?:string, end?:string, enabled?:boolean, frozen?:number}} [options]
 * @returns {import("framer-motion").MotionValue<number>}
 */
const useSceneProgress = (ref, { start = "start start", end = "end end", enabled = true, frozen = 1 } = {}) =>
  useScrollRatio(ref, { start, end, enabled, frozen });

/**
 * Fenêtre [a, b] d'une progression, renormalisée 0..1 (clampée).
 * @param {import("framer-motion").MotionValue<number>} p
 * @param {number} a
 * @param {number} b
 */
export const useWindow = (p, a, b) => useTransform(p, [a, b], [0, 1]);

export default useSceneProgress;
