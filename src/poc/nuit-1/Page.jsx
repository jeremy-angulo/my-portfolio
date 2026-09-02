// src/poc/nuit-1/Page.jsx
// POC « Veilleuse » (facette nuit, créneau 1).
//
// Il est tard, une seule lampe reste allumée — et c'est le visiteur qui la
// tient. Le prénom s'écrit tout seul, la lueur qui l'a tracé se pose sur la
// lune du portrait, puis passe dans la main du visiteur ; sous le hero, la
// même lumière ne se manifeste que là où le pointeur passe.
//
// Zéro WebGL, zéro nouvelle image, `herobg.png` (930 Ko) abandonné.
// Ce composant n'appelle PAS `useDocumentMeta` : App s'en charge pour /poc*.

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import PocBadge from "../shared/PocBadge";
import { useLang } from "../../i18n/LanguageContext";
import { useNightContent } from "../../i18n/useContent";
import NuitNavbar from "./NuitNavbar";
import HeroNuit from "./HeroNuit";
import DockNuit from "./DockNuit";
import Formation from "./Formation";
import Projets from "./Projets";
import Parcours from "./Parcours";
import Distinctions from "./Distinctions";
import ContactNuit from "./ContactNuit";
import PiedNuit from "./PiedNuit";
import "./page.scss";

const Page = () => {
  const location = useLocation();
  const { lang } = useLang();
  const contenu = useNightContent();
  const { achievements, educations, experiences, nightUi } = contenu;

  // Comme sur /tech : pendant la bascule de facette, seul le hero est monté ;
  // les sections arrivent une fois la transition d'entrée terminée, pour ne pas
  // faire chuter le framerate. Une arrivée avec ancre monte tout tout de suite.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  useEffect(() => {
    if (belowFoldReady) return undefined;
    const timer = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(timer);
  }, [belowFoldReady]);

  useEffect(() => {
    if (location.hash) {
      setBelowFoldReady(true);
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // `belowFoldReady` en dépendance : on retente le scroll une fois les
    // sections effectivement montées.
  }, [location, belowFoldReady]);

  return (
    // La nuit tombe : entrée depuis l'obscurité, sortie en s'éclaircissant vers
    // le jour — même transition que HomePage. `transitionEnd` retire le filtre,
    // qui casserait sinon le `position: fixed` de la navbar et du dock.
    <motion.div
      className="nuit1"
      initial={{ opacity: 0, filter: "brightness(0.4)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(1.6)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <NuitNavbar nav={nightUi.nav} />

      <main className="nuit1-main">
        <HeroNuit ui={nightUi.hero} lang={lang} />

        {belowFoldReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45 } }}
          >
            <Formation educations={educations} sections={nightUi.sections} />
            <Projets contenu={contenu} />
            <Parcours experiences={experiences} sections={nightUi.sections} />
            <Distinctions achievements={achievements} sections={nightUi.sections} />
            <ContactNuit contactUi={nightUi.contactUi} />
          </motion.div>
        )}
      </main>

      {belowFoldReady && (
        <>
          <PiedNuit />
          <DockNuit labels={nightUi.contentNav} />
        </>
      )}

      <PocBadge slug="nuit-1" />
    </motion.div>
  );
};

export default Page;
