// src/poc/nuit-1/EnteteSection.jsx
// L'en-tête commun à toutes les sections : un point, un filet qui se trace, un
// sur-titre, un H2 révélé par un volet qui remonte (clip-path).
// Aucun texte inventé : `sub` et `title` viennent des `constants`.

import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";
import { clipReveal, pointEntete, riseSoft, traitTrace, vuUneFois } from "./motion";

/**
 * @param {{ sub: string, title: string }} props
 */
const EnteteSection = ({ sub, title }) => {
  const reduit = useReducedMotion();

  return (
    <motion.div
      className="nuit1-entete"
      initial="hidden"
      whileInView="show"
      viewport={vuUneFois}
    >
      <div className="nuit1-entete__ligne">
        <motion.span className="nuit1-entete__point" variants={pointEntete(reduit)} aria-hidden="true" />
        <motion.span className="nuit1-entete__trait" variants={traitTrace(reduit)} aria-hidden="true" />
      </div>
      <motion.span className="nuit1-entete__sur" variants={riseSoft(reduit, { y: 16, delay: 120 })}>
        {sub}
      </motion.span>
      <motion.h2 className="nuit1-entete__titre" variants={clipReveal(reduit)}>
        {title}
      </motion.h2>
    </motion.div>
  );
};

export default EnteteSection;
