// src/pro/ProPage.jsx
// La facette "Jour" : le site corporate de l'Ingénieur d'Affaires.
// C'est la page d'accueil du site ; la facette nuit n'est accessible
// que par le toggle jour/nuit de la navbar.

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProNavbar from "./ProNavbar";
import ProHero from "./ProHero";
import ProExpertise from "./ProExpertise";
import ProStats from "./ProStats";
import ProJourney from "./ProJourney";
import ProTicker from "./ProTicker";
import ProContact from "./ProContact";
import ProFooter from "./ProFooter";
import "./pro.scss";

// Ancres de l'ancien site (quand la nuit vivait sur "/") : on renvoie
// les vieux liens partagés vers la facette nuit plutôt que de les perdre.
const NIGHT_HASHES = ["#project", "#experience", "#education", "#achievement"];

const ProPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Seul le hero est monté pendant la transition jour/nuit ; les sections
  // suivantes arrivent juste après, pour une fin d'animation fluide.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  useEffect(() => {
    if (belowFoldReady) return;
    const timer = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(timer);
  }, [belowFoldReady]);

  useEffect(() => {
    if (NIGHT_HASHES.includes(location.hash)) {
      navigate(`/tech${location.hash}`, { replace: true });
      return;
    }
    if (location.hash) {
      setBelowFoldReady(true);
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    window.scrollTo(0, 0);
  }, [location.hash, navigate, belowFoldReady]);

  return (
    // Le jour entre comme un lever de soleil (depuis la surexposition)
    // et sort en s'assombrissant vers la nuit. transitionEnd retire le
    // filtre une fois l'animation finie : un filter résiduel casserait
    // le position:fixed de la navbar.
    <motion.div
      className="pro-root"
      id="top"
      initial={{ opacity: 0, filter: "brightness(1.5)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(0.5)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <ProNavbar />
      <main>
        <ProHero />
        {belowFoldReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45 } }}
          >
            <ProExpertise />
            <ProStats />
            <ProJourney />
            <ProTicker />
            <ProContact />
          </motion.div>
        )}
      </main>
      {belowFoldReady && <ProFooter />}
    </motion.div>
  );
};

export default ProPage;
