// src/poc/shared/useViewport.js
// Sonde de viewport partagée par tout le chantier POC.
//
// POURQUOI. `src/global.scss` pose `body { zoom: 0.85 }`. Sous ce zoom,
// `window.innerHeight`, `100vh`, `offsetTop` et `ResizeObserver.contentRect`
// ne sont PAS dans le même repère que `e.clientY` et `getBoundingClientRect()`.
// Mesuré sur ce dépôt (viewport 1440 × 900) :
//     probe.getBoundingClientRect() → 1440 × 900      (repère des rects, le bon)
//     ResizeObserver contentRect    → 1694 × 1059     (avant zoom)
//     probe.offsetWidth/Height      → 1694 × 1059     (avant zoom)
// Le rect d'un élément `position: fixed; inset: 0` est donc la SEULE mesure
// du viewport exprimée dans le même repère que les rects des éléments.
// Le ResizeObserver ne sert ici que de DÉCLENCHEUR : la valeur vient toujours
// de `getBoundingClientRect()`.
//
// La sonde est unique au niveau du module, comptée en références : créée au
// premier consommateur, retirée au démontage du dernier. Un POC n'a rien à
// rendre.

import { useEffect, useRef } from "react";

// Taille courante du viewport, dans le repère des rects. Objet partagé, muté
// sur place : aucun re-render, lisible dans un useFrame ou un rAF.
const TAILLE = { width: 0, height: 0 };

let sonde = null;
let observateur = null;
let compteur = 0;
const abonnes = new Set();

const mesurer = () => {
  if (!sonde) return;
  const r = sonde.getBoundingClientRect();
  if (r.width === TAILLE.width && r.height === TAILLE.height) return;
  TAILLE.width = r.width;
  TAILLE.height = r.height;
  abonnes.forEach((fn) => fn(TAILLE));
};

const onResize = () => mesurer();

const monter = () => {
  if (sonde || typeof document === "undefined") return;
  sonde = document.createElement("div");
  sonde.setAttribute("aria-hidden", "true");
  sonde.style.cssText =
    "position:fixed;inset:0;pointer-events:none;visibility:hidden;z-index:-1;";
  document.body.appendChild(sonde);

  const r = sonde.getBoundingClientRect();
  TAILLE.width = r.width;
  TAILLE.height = r.height;

  if (typeof ResizeObserver !== "undefined") {
    // contentRect est en unités NON zoomées : on l'ignore, on relit le rect.
    observateur = new ResizeObserver(mesurer);
    observateur.observe(sonde);
  }
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
};

const demonter = () => {
  if (!sonde) return;
  if (observateur) observateur.disconnect();
  observateur = null;
  window.removeEventListener("resize", onResize);
  window.removeEventListener("orientationchange", onResize);
  sonde.remove();
  sonde = null;
};

/**
 * Réserve la sonde partagée (usage interne : useScrollRatio, useRectRatio).
 * @param {(taille: {width:number,height:number}) => void} [onChange]
 * @returns {() => void} libération (à appeler au démontage)
 */
export const acquireViewport = (onChange) => {
  compteur += 1;
  monter();
  if (onChange) abonnes.add(onChange);
  let libere = false;
  return () => {
    if (libere) return;
    libere = true;
    if (onChange) abonnes.delete(onChange);
    compteur -= 1;
    if (compteur <= 0) {
      compteur = 0;
      demonter();
    }
  };
};

/** Taille courante du viewport, dans le repère des rects. Lecture seule. */
export const viewportSize = TAILLE;

const resoudre = (el) => {
  if (!el) return null;
  return typeof el === "object" && "current" in el ? el.current : el;
};

/**
 * @param {{ el?: HTMLElement|React.RefObject<HTMLElement>|null,
 *           varWidth?: string, varHeight?: string }} [options]
 * @returns {React.MutableRefObject<{width:number,height:number}>}
 *
 * `--poc-vh` vaut la HAUTEUR ENTIÈRE du viewport, pas 1 % : une scène de
 * 2,6 écrans s'écrit `height: calc(var(--poc-vh) * 2.6)`, et 6 % de viewport
 * `calc(var(--poc-vh) * 0.06)`.
 */
const useViewport = ({ el = null, varWidth = "--poc-vw", varHeight = "--poc-vh" } = {}) => {
  const ref = useRef({ width: TAILLE.width, height: TAILLE.height });
  // Les options sont relues à chaque mesure sans relancer l'abonnement.
  const opts = useRef({ el, varWidth, varHeight });
  opts.current = { el, varWidth, varHeight };

  useEffect(() => {
    const appliquer = (taille) => {
      ref.current.width = taille.width;
      ref.current.height = taille.height;
      const cible = resoudre(opts.current.el);
      if (cible && cible.style) {
        cible.style.setProperty(opts.current.varWidth, `${taille.width}px`);
        cible.style.setProperty(opts.current.varHeight, `${taille.height}px`);
      }
    };
    const liberer = acquireViewport(appliquer);
    // Première application immédiate (la sonde vient d'être montée).
    appliquer(TAILLE);
    return liberer;
  }, []);

  // Une cible fournie après coup (ref branchée au premier rendu) reçoit
  // quand même ses variables.
  useEffect(() => {
    const cible = resoudre(el);
    if (!cible || !cible.style) return;
    cible.style.setProperty(varWidth, `${TAILLE.width}px`);
    cible.style.setProperty(varHeight, `${TAILLE.height}px`);
  }, [el, varWidth, varHeight]);

  return ref;
};

export default useViewport;
