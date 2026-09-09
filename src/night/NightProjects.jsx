// src/night/NightProjects.jsx
// Section « NightProjects ». Le `dataMap` reste DÉRIVÉ (et non stocké) : les données
// changent aussi avec la langue. L'onglet actif est mémorisé dans
// `sessionStorage.activeProjectTab`.
//
// Pendant un changement d'onglet, la grille garde transitoirement la hauteur
// qu'elle avait : la page ne saute pas sous le curseur.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import NightSectionHead from "./NightSectionHead";
import NightProjectTabs from "./NightProjectTabs";
import NightProjectCard from "./NightProjectCard";
import { rise } from "./nightMotion";

const lireOnglet = () => {
  try {
    return sessionStorage.getItem("activeProjectTab") || "entrepreneurship";
  } catch {
    return "entrepreneurship";
  }
};

const NightProjects = ({ contenu }) => {
  const reduit = useReducedMotion();
  const {
    list,
    entrepreneurshipProjects,
    aiAndDeepTechProjects,
    itConsultingProjects,
    leadershipAndInitiativesProjects,
    nightUi,
  } = contenu;

  const [selected, setSelected] = useState(lireOnglet);
  const grilleRef = useRef(null);
  const [hauteurMini, setHauteurMini] = useState(null);

  const dataMap = {
    entrepreneurship: entrepreneurshipProjects,
    ai_deep_tech: aiAndDeepTechProjects,
    it_consulting: itConsultingProjects,
    leadership_initiatives: leadershipAndInitiativesProjects,
  };
  const data = dataMap[selected] || entrepreneurshipProjects;

  const choisir = useCallback((id) => {
    if (id === selected) return;
    // Hauteur figée AVANT le changement d'état. Ici — et ici seulement —
    // `offsetHeight` est le bon outil : il est exprimé dans le MÊME repère
    // (px CSS, avant `body { zoom: 0.85 }`) que le `min-height` qu'on écrit
    // juste après. Un `getBoundingClientRect()`, lui, serait 15 % trop court.
    const noeud = grilleRef.current;
    if (noeud && noeud.offsetHeight > 0) setHauteurMini(noeud.offsetHeight);
    setSelected(id);
    try {
      sessionStorage.setItem("activeProjectTab", id);
    } catch {
      /* navigation privée : l'onglet n'est simplement pas mémorisé */
    }
  }, [selected]);

  // La contrainte de hauteur est relâchée peu après l'entrée de la grille.
  useEffect(() => {
    if (hauteurMini === null) return undefined;
    const id = setTimeout(() => setHauteurMini(null), 600);
    return () => clearTimeout(id);
  }, [hauteurMini, selected]);

  const variantsCarte = rise(reduit, { y: 16, duration: 500, stagger: 40 });

  return (
    <section id="project" className="night-section night-projets">
      <div className="night-container">
        <NightSectionHead sub={nightUi.sections.projectsSub} title={nightUi.sections.projectsTitle} />

        <NightProjectTabs list={list} selected={selected} onSelect={choisir} />

        <div ref={grilleRef} style={hauteurMini ? { minHeight: `${hauteurMini}px` } : undefined}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected}
              id="night-grille-projets"
              role="tabpanel"
              aria-labelledby={`night-onglet-${selected}`}
              className="night-projets__grille"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: reduit ? 0.12 : 0.2 } }}
              exit={{ opacity: 0, transition: { duration: reduit ? 0.12 : 0.16 } }}
            >
              {data.map((projet, i) => (
                <NightProjectCard
                  key={`${selected}-${projet.name}`}
                  projet={projet}
                  variants={variantsCarte}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default NightProjects;
