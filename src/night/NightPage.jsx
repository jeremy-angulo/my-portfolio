// src/night/NightPage.jsx
// La facette « Nuit » : la page de l'ingénieur et du bricoleur de code,
// servie sur /tech. Son homologue jour est src/pro/ProPage.jsx.
//
// Il est tard, une seule lampe reste allumée — et c'est le visiteur qui la
// tient. Le prénom s'écrit tout seul, la lueur qui l'a tracé se pose sur la
// lune du portrait, puis passe dans la main du visiteur ; sous le hero, la
// même lumière ne se manifeste que là où le pointeur passe.
//
// Zéro WebGL : la page porte son propre décor, en dégradés CSS.
// Ce composant n'appelle PAS `useDocumentMeta` : App s'en charge.

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LanguageContext";
import { useNightContent } from "../i18n/useContent";
import NightNavbar from "./NightNavbar";
import NightHero from "./NightHero";
import NightDock from "./NightDock";
import NightEducation from "./NightEducation";
import NightProjects from "./NightProjects";
import NightJourney from "./NightJourney";
import NightAwards from "./NightAwards";
import NightContact from "./NightContact";
import NightFooter from "./NightFooter";
import "./night.scss";

const NightPage = () => {
  const location = useLocation();
  const { lang } = useLang();
  const contenu = useNightContent();
  const { achievements, educations, experiences, nightUi } = contenu;

  // Pendant la bascule de facette, seul le hero est monté ; les sections
  // arrivent une fois la transition d'entrée terminée, pour ne pas faire
  // chuter le framerate. Une arrivée avec ancre monte tout tout de suite.
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
    // le jour — le miroir exact de la transition de ProPage. `transitionEnd`
    // retire le filtre, qui casserait sinon le `position: fixed` de la navbar
    // et du dock.
    <motion.div
      className="night-root"
      initial={{ opacity: 0, filter: "brightness(0.4)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(1.6)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <NightNavbar nav={nightUi.nav} />

      <main className="night-main">
        <NightHero ui={nightUi.hero} lang={lang} />

        {belowFoldReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45 } }}
          >
            <NightEducation educations={educations} sections={nightUi.sections} />
            <NightProjects contenu={contenu} />
            <NightJourney experiences={experiences} sections={nightUi.sections} />
            <NightAwards achievements={achievements} sections={nightUi.sections} />
            <NightContact contactUi={nightUi.contactUi} />
          </motion.div>
        )}
      </main>

      {belowFoldReady && (
        <>
          <NightFooter />
          <NightDock labels={nightUi.contentNav} />
        </>
      )}
    </motion.div>
  );
};

export default NightPage;
