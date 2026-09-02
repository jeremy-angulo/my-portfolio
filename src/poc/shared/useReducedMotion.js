// src/poc/shared/useReducedMotion.js
// Point de vérité unique de la règle « prefers-reduced-motion » du chantier POC.
// Tous les autres modules partagés (usePointerVars, useCountUp, Reveal…)
// l'appellent eux-mêmes et se neutralisent : un POC n'a jamais à les recâbler.

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Sûr au rendu serveur : pas d'accès à window pendant le rendu initial.
const lire = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
};

const useReducedMotion = () => {
  const [reduit, setReduit] = useState(lire);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setReduit(e.matches);

    // Le réglage système peut avoir changé entre le premier rendu et l'effet.
    setReduit(mql.matches);

    // addListener : repli pour les Safari < 14, qui ignorent addEventListener ici.
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return reduit;
};

export default useReducedMotion;
