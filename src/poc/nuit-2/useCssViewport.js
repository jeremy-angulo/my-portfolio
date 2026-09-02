// src/poc/nuit-2/useCssViewport.js
// Hauteur du viewport exprimée en PIXELS CSS (repère non zoomé), poussée en
// `--n2-vh` / `--n2-vw` sur la racine du POC.
//
// POURQUOI un deuxième jeu de variables alors que `useViewport` (partagé) écrit
// déjà `--poc-vh` ? Parce que les deux repères ne servent pas à la même chose.
// Mesuré sur ce dépôt (viewport 1440 × 900, `body { zoom: 0.85 }`) :
//
//   sonde fixe → getBoundingClientRect() ............ 1440 × 900   (repère des rects)
//   sonde fixe → offsetWidth / offsetHeight ......... 1694 × 1059  (repère CSS)
//   div { height: var(--poc-vh) } → rect.height ..... 765          (= 900 × 0,85)
//
// `--poc-vh` (900 px) est la bonne unité pour comparer des rects et des ratios,
// mais l'utiliser comme LONGUEUR CSS donne une boîte de 765 px à l'écran, soit
// 85 % du viewport — exactement le même piège que `100vh`. Une scène épinglée
// doit donc mesurer `--poc-vh / zoom` = 1059 px CSS. C'est ce que ce hook écrit.
//
// Le facteur est relu dans le DOM (`getComputedStyle(document.body).zoom`) :
// si le zoom global change un jour, la page suit sans retouche.

import { useEffect } from "react";
import { acquireViewport, viewportSize } from "../shared/useViewport";

/**
 * @param {React.RefObject<HTMLElement>} elRef racine qui reçoit les variables
 * @param {React.MutableRefObject<{w:number,h:number,zoom:number}>} tailleRef
 *        muté sur place (aucun re-render) : { w, h } en px CSS, `zoom` mesuré
 */
const useCssViewport = (elRef, tailleRef) => {
  useEffect(() => {
    const appliquer = () => {
      const zoomBrut = parseFloat(getComputedStyle(document.body).zoom);
      const zoom = Number.isFinite(zoomBrut) && zoomBrut > 0 ? zoomBrut : 1;
      const w = viewportSize.width / zoom;
      const h = viewportSize.height / zoom;
      tailleRef.current.w = w;
      tailleRef.current.h = h;
      tailleRef.current.zoom = zoom;
      const el = elRef.current;
      if (el && el.style) {
        el.style.setProperty("--n2-vw", `${w}px`);
        el.style.setProperty("--n2-vh", `${h}px`);
      }
    };

    const liberer = acquireViewport(appliquer);
    appliquer();
    return liberer;
  }, [elRef, tailleRef]);
};

export default useCssViewport;
