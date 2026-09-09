// src/hooks/useRectRatio.js
// Position et taille d'un élément exprimées en ratios (0..1) d'un élément de
// référence — ou du viewport réel (sonde partagée) si aucune référence n'est
// donnée. Sert à ancrer un décor (lune, clairière, cible de translation) sur
// un élément de contenu sans jamais manipuler de pixels absolus.
//
// Tout vient de `getBoundingClientRect()` : même repère que `clientX/clientY`,
// le `zoom: 0.85` s'annule.

import { useEffect, useMemo, useRef } from "react";
import { acquireViewport, viewportSize } from "./useViewport";
import { subscribeScrollFrame } from "./useScrollRatio";

const resoudre = (r) => (r && typeof r === "object" && "current" in r ? r.current : r) || null;

// Un objet passé en 2e position sans propriété `current` est en fait le bloc
// d'options : `useRectRatio(ref, { deps: [lang] })` reste valide.
const estRef = (v) => !!v && typeof v === "object" && "current" in v;

/**
 * @param {React.RefObject<HTMLElement>} targetRef élément mesuré
 * @param {React.RefObject<HTMLElement>} [referenceRef] repère (défaut : viewport)
 * @param {{ deps?: any[], live?: boolean }} [options]
 * @returns {React.MutableRefObject<{x:number,y:number,w:number,h:number}>}
 *
 * x, y = CENTRE de la cible en ratio du rect de référence ;
 * w, h = taille de la cible en ratio de celle de la référence.
 * Ref mutable : aucun re-render, lisible dans un useFrame.
 */
const useRectRatio = (targetRef, referenceRef, options) => {
  const opts = estRef(referenceRef) ? options : referenceRef;
  const reference = estRef(referenceRef) ? referenceRef : null;
  const { deps = [], live = false } = opts || {};

  const ratios = useRef({ x: 0.5, y: 0.5, w: 0, h: 0 });

  // Les deps de l'appelant (ex. `lang`) sont sérialisées : un tableau littéral
  // change d'identité à chaque rendu et relancerait l'effet en boucle.
  const cleDeps = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    const mesurer = () => {
      const cible = resoudre(targetRef);
      if (!cible) return;
      const t = cible.getBoundingClientRect();
      const noeudRef = resoudre(reference);
      const r = noeudRef
        ? noeudRef.getBoundingClientRect()
        : { left: 0, top: 0, width: viewportSize.width, height: viewportSize.height };
      if (!r.width || !r.height) return;
      ratios.current.x = (t.left + t.width / 2 - r.left) / r.width;
      ratios.current.y = (t.top + t.height / 2 - r.top) / r.height;
      ratios.current.w = t.width / r.width;
      ratios.current.h = t.height / r.height;
    };

    const libererViewport = acquireViewport(mesurer);
    mesurer();

    const observateur =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(mesurer) : null;
    const cible = resoudre(targetRef);
    const noeudRef = resoudre(reference);
    if (observateur) {
      if (cible) observateur.observe(cible);
      if (noeudRef) observateur.observe(noeudRef);
    }

    window.addEventListener("resize", mesurer, { passive: true });

    // Une police qui arrive après coup déplace tout : on remesure.
    let annule = false;
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!annule) mesurer();
      });
    }

    // `live` : relecture à chaque tour du rAF partagé, pour un élément dont la
    // position bouge avec le défilement. À n'activer que tant qu'il est à
    // l'écran — c'est une lecture de layout par frame.
    const desabonner = live ? subscribeScrollFrame(mesurer) : null;

    return () => {
      annule = true;
      if (desabonner) desabonner();
      if (observateur) observateur.disconnect();
      window.removeEventListener("resize", mesurer);
      libererViewport();
    };
  }, [targetRef, reference, live, cleDeps]);

  return ratios;
};

export default useRectRatio;
