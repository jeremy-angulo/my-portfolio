// src/poc/jour-2/usePinned.js
// Faut-il épingler les scènes ? Oui seulement sur un écran assez grand, assez
// haut, piloté à la souris, et hors mouvement réduit. Partout ailleurs le POC
// rend une page linéaire classique — jamais une scène collante tronquée.

import { useEffect, useState } from "react";
import useReducedMotion from "../shared/useReducedMotion";

const QUERY = "(min-width: 900px) and (min-height: 700px) and (hover: hover)";

const lire = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
};

const usePinned = () => {
  const mouvementReduit = useReducedMotion();
  const [assezGrand, setAssezGrand] = useState(lire);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setAssezGrand(e.matches);
    setAssezGrand(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return assezGrand && !mouvementReduit;
};

export default usePinned;
