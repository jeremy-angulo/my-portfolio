// src/poc/nuit-2/Page.jsx
// POC « Clair de lune » (facette nuit, créneau 2 — scroll cinématique).
//
// La lune, aujourd'hui à moitié cachée derrière la carte portrait, devient le
// fil conducteur : elle se dégage au premier défilement, se range sous la
// navbar où son orbite affiche la progression de la page, puis redescend se
// poser dans la section contact. Entre les deux, la formation recouvre le hero
// comme un drap, les projets défilent sur un rail épinglé, l'expérience
// s'allume au passage et les réussites s'empilent.
//
// Zéro WebGL, zéro image nouvelle (herobg.png n'est pas importé), zéro
// dépendance ajoutée. Le seul libellé écrit pour ce POC est « Faire défiler »
// (dict.js) ; tout le reste vient de useNightContent().

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../../components/Footer";
import PocBadge from "../shared/PocBadge";
import { requestScrollFrame } from "../shared/useScrollRatio";
import { N2SkyProvider } from "./skyContext";
import N2Navbar from "./N2Navbar";
import N2Sky from "./N2Sky";
import N2Hero from "./N2Hero";
import N2Education from "./N2Education";
import N2Projects from "./N2Projects";
import N2Experience from "./N2Experience";
import N2Achievements from "./N2Achievements";
import N2Contact from "./N2Contact";
import N2Horizon from "./N2Horizon";
import "./page.scss";

const Page = () => {
  const location = useLocation();
  const rootRef = useRef(null);

  // Comme HomePage : pendant la transition d'entrée, seul le hero est monté ;
  // le reste arrive à 550 ms pour ne pas faire chuter le framerate. Une arrivée
  // avec ancre monte tout de suite (il faut pouvoir défiler).
  const [sousPliPret, setSousPliPret] = useState(Boolean(location.hash));

  useEffect(() => {
    if (sousPliPret) return undefined;
    const t = setTimeout(() => setSousPliPret(true), 550);
    return () => clearTimeout(t);
  }, [sousPliPret]);

  useEffect(() => {
    if (location.hash) {
      setSousPliPret(true);
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    // Les sections viennent de changer de hauteur : un tour de calcul remet
    // toutes les progressions d'aplomb sans attendre un évènement de scroll.
    requestScrollFrame();
  }, [location, sousPliPret]);

  return (
    // Même transition que HomePage (la nuit entre depuis l'obscurité).
    // transitionEnd retire le filtre : un `filter` résiduel ferait de la racine
    // un bloc conteneur et casserait la navbar fixe comme la couche ciel.
    <motion.div
      ref={rootRef}
      className="n2-root"
      initial={{ opacity: 0, filter: "brightness(0.4)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(1.6)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <N2SkyProvider rootRef={rootRef}>
        <N2Navbar />
        <N2Sky />

        <main className="n2-main">
          <N2Hero />

          {sousPliPret && (
            <>
              <N2Education />
              <N2Projects />
              <N2Experience />
              <N2Achievements />
              <N2Contact />
            </>
          )}
        </main>

        {sousPliPret && (
          <footer className="n2-footer">
            <N2Horizon />
            <Footer />
          </footer>
        )}

        <PocBadge slug="nuit-2" />
      </N2SkyProvider>
    </motion.div>
  );
};

export default Page;
