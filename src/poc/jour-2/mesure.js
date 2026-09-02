// src/poc/jour-2/mesure.js
// Outils de mesure locaux au POC « Le Pont ».
//
// POURQUOI DES `offset*` ICI, alors que le brief les interdit ailleurs ?
// Parce qu'on ne les mélange JAMAIS avec du rect ni du scroll : on mesure des
// positions de mise en page (offsetLeft/offsetTop/offsetWidth, exprimées en
// pixels CSS AVANT le `zoom: 0.85` du body) pour les réinjecter telles quelles
// dans des `transform: translate(...)`, eux aussi en pixels CSS avant zoom.
// Les deux bouts sont dans le même repère : le zoom s'annule exactement.
// Bonus décisif : `offsetTop` ignore les transforms, donc on peut remesurer
// une cible même pendant que la scène est animée, sans rien remettre à zéro.

/**
 * Position d'un élément dans le repère de mise en page d'un ancêtre positionné.
 * @param {HTMLElement} el
 * @param {HTMLElement} ancetre doit être `position: relative|absolute|sticky`
 * @returns {{x:number, y:number}} pixels CSS (avant zoom)
 */
export const offsetIn = (el, ancetre) => {
  let x = 0;
  let y = 0;
  let n = el;
  // La chaîne des offsetParent s'arrête à l'ancêtre positionné : on cumule.
  while (n && n !== ancetre) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y };
};

/**
 * Facteur de zoom appliqué au document (`body { zoom: 0.85 }`).
 * Lu d'abord sur le style calculé ; à défaut, déduit du rapport entre la
 * largeur du viewport (repère des rects) et celle du body (repère non zoomé).
 * @returns {number}
 */
export const lireZoom = () => {
  if (typeof document === "undefined") return 1;
  const brut = getComputedStyle(document.body).zoom;
  const z = parseFloat(brut);
  if (Number.isFinite(z) && z > 0.05) return z;
  const doc = document.documentElement.clientWidth;
  const body = document.body.clientWidth;
  if (doc > 0 && body > 0) return doc / body;
  return 1;
};

// Courbes locales : on n'importe aucune fonction d'easing de framer, dont la
// surface d'API varie d'une version à l'autre.
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
