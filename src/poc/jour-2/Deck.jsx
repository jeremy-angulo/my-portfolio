// src/poc/jour-2/Deck.jsx
// Le tablier du pont : la ligne ambre sur laquelle viennent se poser les trois
// cartes d'expertise. C'est aussi le repère de mesure des cibles du titre
// (largeur = contenu du .pro-container, position = 46 % de la scène).

import React from "react";
import { motion } from "framer-motion";

/**
 * @param {{ deckRef: React.RefObject<HTMLDivElement>,
 *           scaleX: import("framer-motion").MotionValue<number>,
 *           ticks: import("framer-motion").MotionValue<number> }} props
 */
const Deck = ({ deckRef, scaleX, ticks }) => (
  <div className="j2-deck" ref={deckRef} aria-hidden="true">
    <motion.div className="j2-deck__line" style={{ scaleX }} />
    <motion.span className="j2-deck__tick j2-deck__tick--left" style={{ opacity: ticks }} />
    <motion.span className="j2-deck__tick j2-deck__tick--right" style={{ opacity: ticks }} />
  </div>
);

export default Deck;
