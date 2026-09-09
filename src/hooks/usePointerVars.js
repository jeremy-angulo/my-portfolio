// src/hooks/usePointerVars.js
// Pousse la position du pointeur sur un élément sous forme de variables CSS.
//
// `e.clientX` et `el.getBoundingClientRect()` sont dans le MÊME repère, même
// sous `body { zoom: 0.85 }` : le ratio `(e.clientX - r.left) / r.width` est
// donc juste, et c'est la seule façon correcte d'écrire un effet de pointeur
// sur ce dépôt. JAMAIS de pixels absolus, jamais de `window.inner*`, jamais
// la mesure d'un élément comparée à celle d'un autre.
//
// Le hook ne retourne RIEN et ne provoque aucun re-render : l'état « pointeur
// à l'intérieur » passe lui aussi par une variable CSS (`--pv-active` = 1/0).

import { useEffect } from "react";
import useHoverCapable from "./useHoverCapable";
import useReducedMotion from "./useReducedMotion";

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const arrondir = (v) => Math.round(v * 1000) / 1000;

/**
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{ enabled?: boolean, varX?: string, varY?: string,
 *           unit?: "%"|"ratio", rest?: {x:number,y:number},
 *           resetOnLeave?: boolean, activeVar?: string }} [options]
 * @returns {void}
 *
 * `rest` est exprimé dans la MÊME unité que `unit` (50/50 en « % »,
 * 0.5/0.5 en « ratio »).
 */
const usePointerVars = (
  ref,
  {
    enabled = true,
    varX = "--mx",
    varY = "--my",
    unit = "%",
    rest = { x: 50, y: 50 },
    resetOnLeave = true,
    activeVar = "--pv-active",
  } = {}
) => {
  const survolPossible = useHoverCapable();
  const mouvementReduit = useReducedMotion();

  const reposX = rest && typeof rest.x === "number" ? rest.x : unit === "%" ? 50 : 0.5;
  const reposY = rest && typeof rest.y === "number" ? rest.y : unit === "%" ? 50 : 0.5;
  const actif = enabled && survolPossible && !mouvementReduit;

  useEffect(() => {
    const noeud = ref && ref.current;
    if (!noeud) return undefined;

    const ecrire = (x, y) => {
      noeud.style.setProperty(varX, unit === "%" ? `${arrondir(x)}%` : `${arrondir(x)}`);
      noeud.style.setProperty(varY, unit === "%" ? `${arrondir(y)}%` : `${arrondir(y)}`);
    };
    const repos = () => {
      ecrire(reposX, reposY);
      if (activeVar) noeud.style.setProperty(activeVar, "0");
    };

    // Inactif : aucun listener, mais l'état de repos est écrit une fois pour
    // que le CSS ait toujours des valeurs définies (reflets figés au tactile).
    if (!actif) {
      repos();
      return undefined;
    }

    repos();

    let rafId = 0;
    let dernier = null;

    const appliquer = () => {
      rafId = 0;
      if (!dernier) return;
      const r = noeud.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const rx = borner((dernier.x - r.left) / r.width);
      const ry = borner((dernier.y - r.top) / r.height);
      ecrire(unit === "%" ? rx * 100 : rx, unit === "%" ? ry * 100 : ry);
    };

    // pointermove passif, throttlé en rAF : une frame en attente au maximum.
    const onMove = (e) => {
      dernier = { x: e.clientX, y: e.clientY };
      if (activeVar) noeud.style.setProperty(activeVar, "1");
      if (!rafId) rafId = requestAnimationFrame(appliquer);
    };
    const onEnter = () => {
      if (activeVar) noeud.style.setProperty(activeVar, "1");
    };
    const onLeave = () => {
      dernier = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (resetOnLeave) repos();
      else if (activeVar) noeud.style.setProperty(activeVar, "0");
    };

    noeud.addEventListener("pointerenter", onEnter, { passive: true });
    noeud.addEventListener("pointermove", onMove, { passive: true });
    noeud.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      noeud.removeEventListener("pointerenter", onEnter);
      noeud.removeEventListener("pointermove", onMove);
      noeud.removeEventListener("pointerleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref, actif, varX, varY, unit, reposX, reposY, resetOnLeave, activeVar]);
};

export default usePointerVars;
