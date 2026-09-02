// src/poc/jour-2/useZoomVar.js
// LE point technique de ce POC. `--poc-vh` (sonde partagée) vaut la hauteur du
// viewport DANS LE REPÈRE DES RECTS : 900 px en 1440 × 900. Or `body` porte
// `zoom: 0.85` : écrire `height: var(--poc-vh)` donne 900 px de mise en page,
// qui s'affichent 900 × 0,85 = 765 px. Une scène « plein écran » serait donc
// amputée de 15 % — exactement le défaut de `100vh` que la sonde est censée
// corriger (mesuré : un `height: 100vh` rend 765 px de haut sur ce dépôt).
//
// On pousse donc le facteur de zoom en variable CSS, et la feuille du POC
// définit `--j2-vh: calc(var(--poc-vh) / var(--j2-zoom))` : la scène épinglée
// fait alors exactement un viewport, vérifiable au rect.

import { useEffect } from "react";
import { lireZoom } from "./mesure";

/**
 * @param {React.RefObject<HTMLElement>} ref racine du POC
 * @param {string} [nom] nom de la variable CSS
 */
const useZoomVar = (ref, nom = "--j2-zoom") => {
  useEffect(() => {
    const appliquer = () => {
      const noeud = ref.current;
      if (!noeud) return;
      const z = lireZoom();
      noeud.style.setProperty(nom, String(z > 0.05 ? z : 1));
    };
    appliquer();
    window.addEventListener("resize", appliquer, { passive: true });
    return () => window.removeEventListener("resize", appliquer);
  }, [ref, nom]);
};

export default useZoomVar;
