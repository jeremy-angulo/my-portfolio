// src/pro/ProPage.jsx
// La facette "Jour" : le site corporate de l'Ingénieur d'Affaires.
// C'est la page d'accueil du site ; la facette nuit n'est accessible
// que par le toggle jour/nuit de la navbar.
//
// Rien n'est imprimé d'avance : le titre se compose mot à mot, un trait
// d'ambre se dessine sous « le business », et ce même geste revient devant
// chaque eyebrow, entre les chiffres, dans la colonne du parcours et en
// dernier trait du pied de page. Toute cette couche vit dans proAnim.scss.

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import ProNavbar from "./ProNavbar";
import ProHero from "./ProHero";
import ProExpertise from "./ProExpertise";
import ProStats from "./ProStats";
import ProJourney from "./ProJourney";
import ProTicker from "./ProTicker";
import ProContact from "./ProContact";
import ProFooter from "./ProFooter";
import "./pro.scss";
import "./proAnim.scss";

// Ancres de l'ancien site (quand la nuit vivait sur "/") : on renvoie
// les vieux liens partagés vers la facette nuit plutôt que de les perdre.
const NIGHT_HASHES = ["#project", "#experience", "#education", "#achievement"];

const ProPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const statique = useReducedMotion();
  const racine = useRef(null);

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

  // La navbar est plus transparente au sommet (le ciel d'aube respire) et se
  // pose dès le premier défilement. Un seul écouteur passif, throttlé en rAF,
  // qui ne touche qu'un attribut : aucun re-render React.
  useEffect(() => {
    const noeud = racine.current;
    if (!noeud) return undefined;

    let rafId = 0;
    const appliquer = () => {
      rafId = 0;
      noeud.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
    };
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(appliquer);
    };

    appliquer();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    // Le jour entre comme un lever de soleil (depuis la surexposition)
    // et sort en s'assombrissant vers la nuit. transitionEnd retire le
    // filtre une fois l'animation finie : un filter résiduel casserait
    // le position:fixed de la navbar.
    <motion.div
      ref={racine}
      className={`pro-root day-root${statique ? " is-static" : ""}`}
      id="top"
      data-scrolled="false"
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
        <ProHero statique={statique} />
        {belowFoldReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45 } }}
          >
            <ProExpertise statique={statique} />
            <ProStats statique={statique} />
            <ProJourney statique={statique} />
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
