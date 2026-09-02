// src/poc/nuit-1/useMediaQuery.js
// Variante locale (le dossier partagé est en lecture seule) : une media query
// évaluée en JS, pour brancher/débrancher un effet exactement là où le CSS le
// fait. Les media queries ne sont PAS affectées par `body { zoom: 0.85 }` :
// `(min-width: 900px)` s'évalue sur 1440 px comme la feuille de styles.

import { useEffect, useState } from "react";

const lire = (query) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
};

const useMediaQuery = (query) => {
  const [correspond, setCorrespond] = useState(() => lire(query));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setCorrespond(e.matches);
    setCorrespond(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return correspond;
};

export default useMediaQuery;
