// src/poc/nuit-3/CarteLunaire.jsx
// Carte de verre inclinable, en CSS pur : pas de react-parallax-tilt, donc
// aucune boucle JS par carte. Le pointeur écrit --mx / --my (ratios 0..1) via
// le hook partagé ; le CSS s'en sert pour l'inclinaison ET pour le reflet.
//
// Adaptation assumée de la spec : `usePointerVars` est appelé en unité
// « ratio » (repos 0,3 / 0,2 = les 30 % / 20 % demandés) parce qu'une longueur
// en pourcentage ne se convertit pas en angle dans un calc().

import React, { useEffect, useRef } from "react";
import usePointerVars from "../shared/usePointerVars";
import useHoverCapable from "../shared/useHoverCapable";
import useReducedMotion from "../shared/useReducedMotion";

const CarteLunaire = ({ className = "", children, as: Balise = "div", ...reste }) => {
  const ref = useRef(null);
  const survolPossible = useHoverCapable();
  const mouvementReduit = useReducedMotion();

  usePointerVars(ref, { unit: "ratio", rest: { x: 0.3, y: 0.2 } });

  // will-change posé au survol seulement : une carte au repos ne réserve
  // aucune couche de composition.
  useEffect(() => {
    const noeud = ref.current;
    if (!noeud || !survolPossible || mouvementReduit) return undefined;
    const interieur = noeud.firstElementChild;
    if (!interieur) return undefined;
    const entrer = () => {
      interieur.style.willChange = "transform";
    };
    const sortir = () => {
      interieur.style.willChange = "";
    };
    noeud.addEventListener("pointerenter", entrer, { passive: true });
    noeud.addEventListener("pointerleave", sortir, { passive: true });
    return () => {
      noeud.removeEventListener("pointerenter", entrer);
      noeud.removeEventListener("pointerleave", sortir);
      interieur.style.willChange = "";
    };
  }, [survolPossible, mouvementReduit]);

  return (
    <Balise ref={ref} className={`n3-carte ${className}`.trim()} {...reste}>
      <div className="n3-carte__in">{children}</div>
    </Balise>
  );
};

export default CarteLunaire;
