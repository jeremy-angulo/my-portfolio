// src/poc/shared/useHoverCapable.js
// Garde unique de tous les effets de pointeur du chantier POC.
// Volontairement stricte : `(hover: hover) and (pointer: fine)`. Un pointeur
// grossier (stylet, télécommande, tactile qui émule le survol) ne déclenche
// aucun effet de souris. Aucun POC ne redéclare de matchMedia de survol.

import { useEffect, useState } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

// Sûr au rendu serveur : false tant qu'il n'y a pas de window.
const lire = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
};

const useHoverCapable = () => {
  const [capable, setCapable] = useState(lire);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setCapable(e.matches);

    // Réévalué à chaud : un iPad auquel on branche une souris passe à true
    // sans rechargement.
    setCapable(mql.matches);

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return capable;
};

export default useHoverCapable;
