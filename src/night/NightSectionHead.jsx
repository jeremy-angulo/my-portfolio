// src/night/NightSectionHead.jsx
// L'en-tête commun à toutes les sections : un point, un filet qui se trace, un
// sur-titre, un H2 révélé par un volet qui remonte (clip-path).
// Aucun texte inventé : `sub` et `title` viennent des `constants`.

import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import { clipReveal, pointEntete, riseSoft, traitTrace, vuUneFois } from "./nightMotion";

/**
 * @param {{ sub: string, title: string }} props
 */
const NightSectionHead = ({ sub, title }) => {
  const reduit = useReducedMotion();

  return (
    <motion.div
      className="night-entete"
      initial="hidden"
      whileInView="show"
      viewport={vuUneFois}
    >
      <div className="night-entete__ligne">
        <motion.span className="night-entete__point" variants={pointEntete(reduit)} aria-hidden="true" />
        <motion.span className="night-entete__trait" variants={traitTrace(reduit)} aria-hidden="true" />
      </div>
      <motion.span className="night-entete__sur" variants={riseSoft(reduit, { y: 16, delay: 120 })}>
        {sub}
      </motion.span>
      <motion.h2 className="night-entete__titre" variants={clipReveal(reduit)}>
        {title}
      </motion.h2>
    </motion.div>
  );
};

export default NightSectionHead;
