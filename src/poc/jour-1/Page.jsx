// src/poc/jour-1/Page.jsx
// POC « Trait d'union » — facette jour, créneau 1 (Éditorial+).
//
// La même page que l'accueil (navbar → hero → expertises → chiffres →
// parcours → ticker → contact → pied de page), le même contenu bilingue, les
// mêmes classes `.pro-*` : seul le traitement s'élève. Une idée unique tient
// la page — aucune ligne n'est imprimée, toutes se tracent sous les yeux du
// visiteur : le titre se compose mot à mot, un trait d'ambre se dessine sous
// « le business » et colore les mots en passant, puis ce geste revient devant
// chaque eyebrow, entre les chiffres, dans la colonne du parcours, aux bords
// des bandeaux bleus et en dernier trait du pied de page.
//
// Zéro WebGL, zéro canvas, zéro sticky. `useDocumentMeta` n'est PAS appelé :
// App s'en charge, la clé `poc` couvre /poc* (titre neutre, noindex).

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";
import PocBadge from "../shared/PocBadge";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Expertise from "./Expertise";
import Stats from "./Stats";
import Journey from "./Journey";
import TickerFrame from "./TickerFrame";
import ContactFrame from "./ContactFrame";
import FooterFrame from "./FooterFrame";
// pro.scss est une feuille GLOBALE et idempotente : elle s'importe en JS,
// jamais par `@use` (qui la dupliquerait dans la feuille du POC).
import "../../pro/pro.scss";
import "./page.scss";

const Page = () => {
  const location = useLocation();
  const statique = useReducedMotion();
  const racine = useRef(null);

  // Comme sur l'accueil : seul le hero est monté pendant la transition de
  // route, les sections suivantes arrivent juste après.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  useEffect(() => {
    if (belowFoldReady) return undefined;
    const minuteur = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(minuteur);
  }, [belowFoldReady]);

  useEffect(() => {
    if (location.hash) {
      setBelowFoldReady(true);
      const cible = document.getElementById(location.hash.slice(1));
      if (cible) cible.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo(0, 0);
  }, [location.hash, belowFoldReady]);

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
    // Le jour entre comme un lever de soleil et sort en s'assombrissant, comme
    // sur l'accueil. transitionEnd retire le filtre : un filter résiduel
    // casserait le position: fixed de la navbar.
    <motion.div
      ref={racine}
      className={`pro-root j1-root${statique ? " is-static" : ""}`}
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
      <Navbar />
      <main>
        <Hero statique={statique} />
        {belowFoldReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45 } }}
          >
            <Expertise statique={statique} />
            <Stats statique={statique} />
            <Journey statique={statique} />
            <TickerFrame />
            <ContactFrame />
          </motion.div>
        )}
      </main>
      {belowFoldReady && <FooterFrame />}
      <PocBadge slug="jour-1" />
    </motion.div>
  );
};

export default Page;
