// src/hooks/useScrollRatio.js
// Progression 0..1 d'un élément dans le viewport, liée au défilement.
//
// Remplace `useScroll({ target, offset })` de framer-motion, dont les offsets
// sont faux sous `body { zoom: 0.85 }` : ils mélangent des rects (repère
// zoomé) et des hauteurs de viewport lues sur window (repère non zoomé).
// Ici tout vient de `getBoundingClientRect()` et de la sonde partagée
// (useViewport), donc du même repère. Aucun `window.scrollY`, aucune lecture
// de layout dans le handler de scroll : tout se fait dans le rAF partagé.

import { useEffect, useMemo } from "react";
import { useMotionValue } from "framer-motion";
import { acquireViewport, viewportSize } from "./useViewport";

// -------------------------------------------------------- moteur partagé
// Un seul listener scroll, un seul listener resize, une seule boucle rAF pour
// tous les abonnés. La boucle ne tourne que tant qu'il y a au
// moins un abonné ET qu'un évènement est en attente.

const calculs = new Set(); // fonctions de calcul (une par abonné)
let rafId = 0;
let enAttente = false;
let libererViewport = null;

const tour = () => {
  rafId = 0;
  if (!enAttente) return;
  enAttente = false;
  calculs.forEach((fn) => {
    try {
      fn();
    } catch {
      /* un abonné démonté en cours de tour ne doit pas casser les autres */
    }
  });
};

const planifier = () => {
  enAttente = true;
  if (rafId || !calculs.size || typeof requestAnimationFrame === "undefined") return;
  rafId = requestAnimationFrame(tour);
};

const onEvenement = () => planifier();

const brancher = () => {
  if (calculs.size !== 1) return; // déjà branché
  libererViewport = acquireViewport(onEvenement);
  window.addEventListener("scroll", onEvenement, { passive: true });
  window.addEventListener("resize", onEvenement, { passive: true });
};

const debrancher = () => {
  if (calculs.size) return;
  window.removeEventListener("scroll", onEvenement);
  window.removeEventListener("resize", onEvenement);
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  enAttente = false;
  if (libererViewport) libererViewport();
  libererViewport = null;
};

/**
 * Abonne une fonction au rAF partagé (usage interne : useRectRatio en mode
 * `live`). Elle est appelée à chaque tour utile, jamais en continu.
 * @param {() => void} fn
 * @returns {() => void} désabonnement
 */
export const subscribeScrollFrame = (fn) => {
  calculs.add(fn);
  brancher();
  planifier();
  return () => {
    calculs.delete(fn);
    debrancher();
  };
};

/** Force un tour de calcul (après un changement de mise en page). */
export const requestScrollFrame = () => planifier();

// -------------------------------------------------------- bornes
// Syntaxe identique à framer : "<bord de l'élément> <bord du viewport>",
// chaque jeton valant start | center | end | <n>%.
const jeton = (t) => {
  if (t === "start") return 0;
  if (t === "center") return 0.5;
  if (t === "end") return 1;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n / 100 : 0;
};

const bornes = (spec, defaut) => {
  const morceaux = String(spec ?? defaut)
    .trim()
    .split(/\s+/);
  return [jeton(morceaux[0]), jeton(morceaux[1] ?? morceaux[0])];
};

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * @param {React.RefObject<HTMLElement>} ref élément mesuré
 * @param {{ start?: string, end?: string, enabled?: boolean, frozen?: number }} [options]
 * @returns {import("framer-motion").MotionValue<number>} 0..1, clampé
 *
 * `{ start: "start start", end: "end start" }` redonne exactement
 * `clamp(-r.top / r.height, 0, 1)` ; `{ start: "start start", end: "end end" }`
 * vaut 0 quand le haut de l'élément touche le haut du viewport et 1 quand son
 * bas touche le bas.
 */
const useScrollRatio = (ref, { start = "start start", end = "end end", enabled = true, frozen = 1 } = {}) => {
  const progression = useMotionValue(enabled ? 0 : frozen);

  const [eDebut, vDebut] = useMemo(() => bornes(start, "start start"), [start]);
  const [eFin, vFin] = useMemo(() => bornes(end, "end end"), [end]);

  useEffect(() => {
    if (!enabled) {
      // Scène neutralisée (reduced motion, mode non épinglé, mobile) :
      // aucun abonnement, la valeur reste figée — 1 par défaut, c'est-à-dire
      // « scène terminée, contenu en place ».
      progression.set(frozen);
      return undefined;
    }

    const calculer = () => {
      const noeud = ref && ref.current;
      if (!noeud) return;
      const r = noeud.getBoundingClientRect();
      const vh = viewportSize.height || 1;
      const dDebut = r.top + eDebut * r.height - vDebut * vh;
      const dFin = r.top + eFin * r.height - vFin * vh;
      const denom = dDebut - dFin;
      const p = denom === 0 ? 0 : borner(dDebut / denom);
      const actuel = progression.get();
      // Seuil anti-bruit, mais les extrêmes doivent être atteints exactement
      // (une jauge doit finir à 1, pas à 0,9999).
      if (Math.abs(p - actuel) > 1e-4 || (p !== actuel && (p === 0 || p === 1))) {
        progression.set(p);
      }
    };

    return subscribeScrollFrame(calculer);
  }, [ref, eDebut, vDebut, eFin, vFin, enabled, frozen, progression]);

  return progression;
};

export default useScrollRatio;
