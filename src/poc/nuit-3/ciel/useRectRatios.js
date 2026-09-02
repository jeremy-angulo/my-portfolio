// src/poc/nuit-3/ciel/useRectRatios.js
// Pont DOM → ciel : le contenu dépose les éléments d'ancrage (image du
// portrait, lune, colonne texte, clairière du contact), la boucle WebGL les
// relit en ratios du canvas.
//
// Le canvas est `position: fixed; inset: 0` : son rect EST celui du viewport,
// donné par la sonde partagée (`useViewport`). Un rect d'élément divisé par ce
// rect est donc juste malgré `body { zoom: .85 }` — les deux sont dans le même
// repère. Aucune écriture DOM ici, uniquement des lectures.

import { useEffect, useRef } from "react";
import store, { poserElement } from "./cielStore";

/**
 * Dépose un élément dans le store sous une clé connue du ciel.
 * @param {"photo"|"lune"|"texte"|"clairiere"|"hero"} cle
 * @returns {React.RefObject<HTMLElement>}
 */
export const usePoserElement = (cle) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return poserElement(cle, ref.current);
  }, [cle]);
  return ref;
};

/** Centre + demi-taille d'un élément, en ratios du viewport. */
const enRatios = (el, vw, vh, cible) => {
  if (!el || !vw || !vh) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  cible.x = (r.left + r.width / 2) / vw;
  cible.y = (r.top + r.height / 2) / vh;
  cible.w = r.width / 2 / vw;
  cible.h = r.height / 2 / vh;
  return true;
};

/** Bornes d'un élément (x0,y0,x1,y1), en ratios du viewport. */
const enBornes = (el, vw, vh, cible) => {
  if (!el || !vw || !vh) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  cible.x0 = r.left / vw;
  cible.y0 = r.top / vh;
  cible.x1 = r.right / vw;
  cible.y1 = r.bottom / vh;
  return true;
};

/**
 * Relit les rects utiles à la frame courante.
 * Budget : 1 lecture de layout par frame tant que le hero est visible (l'image
 * du portrait), 1 tant que le contact est visible (la clairière) ; la colonne
 * texte et la lune ne sont relues qu'une frame sur six — leur retard est
 * invisible (masque doux, lueur amortie) et cela divise le coût par trois.
 * @param {{width:number,height:number}} vp taille du canvas (= viewport)
 * @param {number} frame compteur de frames
 */
export const mesurerRects = (vp, frame) => {
  const vw = vp.width;
  const vh = vp.height;
  if (!vw || !vh) return;

  if (store.heroVisible) {
    enRatios(store.els.photo, vw, vh, store.carte);
    if (frame % 6 === 0) {
      enBornes(store.els.texte, vw, vh, store.texte);
      const lune = { x: 0, y: 0, w: 0, h: 0 };
      if (enRatios(store.els.lune, vw, vh, lune)) {
        store.lune.x = lune.x;
        store.lune.y = lune.y;
      }
    }
  }

  if (store.contactVisible && frame % 2 === 0) {
    enRatios(store.els.clairiere, vw, vh, store.clairiere);
  }
};

export default usePoserElement;
