// src/poc/jour-2/Page.jsx
// POC « Le Pont » — facette jour, créneau 2 (scroll cinématique).
//
// Le défilement construit la page. La phrase du hero est la colonne
// vertébrale : « Le pont entre la technique et le business. » En descendant, le
// titre se démonte — « la technique » à gauche, « le business. » à droite — un
// tablier ambre se tend entre les deux et les trois cartes d'expertise viennent
// s'y poser. Trois scènes épinglées seulement (le pont, les chiffres, le
// travelling du parcours), toutes mappées 1:1 sur le scroll, donc réversibles.
// Le motif de la page est la LIGNE, jamais l'astre.
//
// Zéro WebGL, zéro image nouvelle, zéro dépendance, aucun texte inventé hors
// « Faire défiler / Scroll ».

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/LanguageContext";
import { useProContent } from "../../i18n/useContent";
import useViewport from "../shared/useViewport";
import useReducedMotion from "../shared/useReducedMotion";
import PocBadge from "../shared/PocBadge";
import usePinned from "./usePinned";
import useZoomVar from "./useZoomVar";
import { splitHeroTitle, useLabels } from "./labels";
import Navbar from "./Navbar";
import NavChapters from "./NavChapters";
import DeckProgress from "./DeckProgress";
import HeroStage from "./HeroStage";
import StatsStage from "./StatsStage";
import JourneyDolly from "./JourneyDolly";
import TickerDrift from "./TickerDrift";
import ContactGlow from "./ContactGlow";
import FooterFrame from "./FooterFrame";

// pro.scss est une feuille GLOBALE : on l'importe en JS (jamais en @use, qui
// la dupliquerait) pour qu'une arrivée directe sur /poc/jour-2 se suffise.
import "../../pro/pro.scss";
import "./page.scss";

const Page = () => {
  const location = useLocation();
  const { lang } = useLang();
  const content = useProContent();
  const labels = useLabels(lang);
  const reduced = useReducedMotion();
  const pinned = usePinned();

  const rootRef = useRef(null);
  // Sonde partagée : écrit --poc-vw / --poc-vh (hauteur ENTIÈRE) sur la racine.
  useViewport({ el: rootRef });
  // …et le facteur de zoom, dont la feuille tire --j2-vh (voir useZoomVar.js).
  useZoomVar(rootRef);

  // Découpage du titre : jamais une réécriture, toujours une lecture de la
  // chaîne des constants. `null` = repli propre (titre entier, pas de pont).
  const parts = splitHeroTitle(content.proUi.heroTitle, lang);

  // Comme ProPage : seul le hero est monté pendant la transition de facette.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  useEffect(() => {
    if (belowFoldReady) return undefined;
    const timer = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(timer);
  }, [belowFoldReady]);

  useEffect(() => {
    if (location.hash) {
      setBelowFoldReady(true);
      const element = document.getElementById(location.hash.slice(1));
      if (element) element.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo(0, 0);
  }, [location.hash]);

  return (
    <motion.div
      className="pro-root j2-root"
      id="top"
      ref={rootRef}
      initial={reduced ? { opacity: 0 } : { opacity: 0, filter: "brightness(1.5)" }}
      animate={
        reduced
          ? { opacity: 1, transition: { duration: 0.2 } }
          : {
              opacity: 1,
              filter: "brightness(1)",
              transition: { duration: 0.5, ease: "easeOut" },
              // Un filter résiduel casserait tout position: fixed enfant.
              transitionEnd: { filter: "none" },
            }
      }
      exit={
        reduced
          ? { opacity: 0, transition: { duration: 0.2 } }
          : { opacity: 0, filter: "brightness(0.5)", transition: { duration: 0.3, ease: "easeIn" } }
      }
    >
      <NavChapters>
        <Navbar />
      </NavChapters>

      <DeckProgress rootRef={rootRef} />

      <main>
        <HeroStage
          pinned={pinned}
          reduced={reduced}
          content={content}
          parts={parts}
          ready={belowFoldReady}
          hint={labels.hint}
        />

        {belowFoldReady && (
          <>
            <StatsStage
              pinned={pinned}
              reduced={reduced}
              stats={content.proStats}
              label={content.proUi.statsLabel}
            />
            <JourneyDolly
              pinned={pinned}
              reduced={reduced}
              timeline={content.proTimeline}
              educations={content.proEducations}
              ui={content.proUi}
            />
            <TickerDrift reduced={reduced} />
            <ContactGlow reduced={reduced} />
          </>
        )}
      </main>

      {belowFoldReady && <FooterFrame />}

      <PocBadge slug="jour-2" />
    </motion.div>
  );
};

export default Page;
