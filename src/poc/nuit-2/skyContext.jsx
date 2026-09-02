// src/poc/nuit-2/skyContext.js
// Le contexte qui tient la page ensemble : c'est ici que vivent la couche
// « ciel » (l'espace de coordonnées de la lune), les ancres mesurées, et les
// quatre progressions de défilement partagées par plusieurs composants
// (page, hero, contact). Les progressions strictement locales à une section
// (cartes de formation, rail des projets, timeline, pile) sont créées dans
// leur propre composant.
//
// Toute la géométrie de la page est exprimée en RATIOS (0..1) d'un même
// repère : le rect de la couche `.n2-sky` (position: fixed; inset: 0). Un
// ratio issu de deux `getBoundingClientRect()` est juste sous
// `body { zoom: 0.85 }` ; un pixel ne l'est jamais.

import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import useReducedMotion from "../shared/useReducedMotion";
import useViewport from "../shared/useViewport";
import useSectionProgress from "./useSectionProgress";
import useScrollRatio from "../shared/useScrollRatio";
import useCssViewport from "./useCssViewport";

const N2SkyContext = createContext(null);

/** Accès au contexte du POC (jamais nul sous <N2SkyProvider>). */
export const useN2Sky = () => useContext(N2SkyContext);

// Média-requête réactive, SSR-safe. Le même seuil que le hero actuel (900 px),
// évalué sur le viewport NON zoomé — comme les `@media` de la feuille.
const useMinWidth = (px) => {
  const [ok, setOk] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia(`(min-width: ${px}px)`).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const onChange = (e) => setOk(e.matches);
    setOk(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [px]);
  return ok;
};

/**
 * @param {{ rootRef: React.RefObject<HTMLElement>, children: React.ReactNode }} props
 */
export const N2SkyProvider = ({ rootRef, children }) => {
  const reduit = useReducedMotion();
  const large = useMinWidth(900);
  // « Épinglé » = les scènes collantes (hero, rail des projets) sont actives.
  // Sur mobile le hero fait ~1,5 écran : l'épingler tronquerait le portrait.
  const epingle = large && !reduit;

  // --- repères et ancres -------------------------------------------------
  const skyRef = useRef(null); // couche fixe : l'espace de coordonnées
  const heroTrackRef = useRef(null); // piste du hero (ou le hero lui-même en flux)
  const heroMoonRef = useRef(null); // lune en flux du hero (ancre de départ)
  const contactMoonRef = useRef(null); // lune en flux du contact (ancre d'arrivée)

  // Les cinq sections repérées par les ticks de l'orbite. Objet stable : les
  // composants y branchent leur <section>, N2Sky y branche ses progressions.
  const sectionRefs = useRef({
    education: { current: null },
    project: { current: null },
    experience: { current: null },
    achievement: { current: null },
    contact: { current: null },
  }).current;

  // --- viewport ----------------------------------------------------------
  // `--poc-vw` / `--poc-vh` : repère des rects (sonde partagée).
  useViewport({ el: rootRef });
  // `--n2-vw` / `--n2-vh` : le même viewport en pixels CSS, seule unité
  // utilisable pour une hauteur de scène (voir useCssViewport.js).
  const viewportCss = useRef({ w: 0, h: 0, zoom: 1 });
  useCssViewport(rootRef, viewportCss);

  // --- progressions partagées -------------------------------------------
  // Progression de page : elle reste vivante même en mouvement réduit, car
  // l'anneau d'orbite est une INFORMATION (où en suis-je dans la page), pas
  // une animation d'agrément.
  const P = useScrollRatio(rootRef, { start: "start start", end: "end end" });

  // Progression du hero. Épinglé : 0 quand la piste touche le haut du viewport,
  // 1 quand son bas touche le bas. En flux (mobile) : progression de sortie.
  const h = useSectionProgress(heroTrackRef, {
    start: "start start",
    end: epingle ? "end end" : "end start",
    frozen: 0, // au repos, le hero est intact
  });

  // Progression d'atterrissage : la lune quitte son coin pour se poser dans la
  // section contact.
  const c = useSectionProgress(sectionRefs.contact, {
    start: "start end",
    end: "start 25%",
    frozen: 1, // mouvement réduit : la lune du contact est déjà en place
  });

  // La racine porte les deux drapeaux de mise en scène : le CSS n'a plus qu'à
  // les suivre (piste, collage, drap, rail natif).
  useEffect(() => {
    const el = rootRef && rootRef.current;
    if (!el) return;
    el.classList.toggle("n2-root--epingle", epingle);
    el.classList.toggle("n2-root--reduit", reduit);
  }, [rootRef, epingle, reduit]);

  const valeur = useMemo(
    () => ({
      reduit,
      large,
      epingle,
      skyRef,
      heroTrackRef,
      heroMoonRef,
      contactMoonRef,
      sectionRefs,
      viewportCss,
      P,
      h,
      c,
    }),
    [reduit, large, epingle, sectionRefs, P, h, c]
  );

  return <N2SkyContext.Provider value={valeur}>{children}</N2SkyContext.Provider>;
};

export default N2SkyContext;
