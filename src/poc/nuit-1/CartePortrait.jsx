// src/poc/nuit-1/CartePortrait.jsx
// Le portrait réagit physiquement à la lampe : son liseré conique s'oriente
// vers la lumière (`--la`), son ombre fuit à l'opposé, la carte et la lune
// glissent de quelques pixels en sens contraire.
//
// Les trois variables (`--lx`, `--ly`, `--la`) sont écrites par des motion
// values sur le wrapper : aucun state React, aucun re-render par frame.

import React from "react";
import { motion } from "framer-motion";
import { FiCpu, FiMoon } from "react-icons/fi";
import { jeremy } from "../../assets";
import { EASE } from "./motion";
import { useLampe } from "./Lampe";

/**
 * @param {{ ui: object, reduit: boolean }} props
 */
const CartePortrait = ({ ui, reduit }) => {
  const { luneRef, carteRef, lxTexte, lyTexte, laTexte } = useLampe();

  const transitionCarte = reduit
    ? { duration: 0.2 }
    : { duration: 0.8, delay: 0.3, ease: EASE };
  const transitionLune = reduit
    ? { duration: 0.2, delay: 0.1 }
    : { duration: 0.7, delay: 0.9, ease: EASE };
  const transitionChip = (delai) =>
    reduit ? { duration: 0.2 } : { duration: 0.4, delay: delai, ease: EASE };

  return (
    <motion.div
      className="nuit1-portrait"
      style={{ "--lx": lxTexte, "--ly": lyTexte, "--la": laTexte }}
    >
      {/* La lune : élément réel (et non pseudo-élément) car c'est lui que la
          lampe mesure pour savoir où revenir se poser. */}
      <div className="nuit1-portrait__lune-parallaxe" aria-hidden="true">
        <motion.span
          ref={luneRef}
          className="nuit1-portrait__lune"
          initial={reduit ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          animate={reduit ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={transitionLune}
        />
      </div>

      <span className="nuit1-portrait__ombre" aria-hidden="true" />

      <div className="nuit1-portrait__parallaxe">
        <motion.div
          ref={carteRef}
          className="nuit1-portrait__carte"
          initial={reduit ? { opacity: 0 } : { opacity: 0, y: 32, rotate: 6 }}
          animate={reduit ? { opacity: 1, rotate: 2.5 } : { opacity: 1, y: 0, rotate: 2.5 }}
          transition={transitionCarte}
          whileHover={reduit ? undefined : { rotate: 0.5, y: -4, transition: { duration: 0.5, ease: "easeOut" } }}
        >
          <span className="nuit1-portrait__lisere" aria-hidden="true" />
          <img src={jeremy} alt={ui.alt} />
        </motion.div>
      </div>

      <motion.span
        className="nuit1-portrait__chip nuit1-portrait__chip--haut"
        initial={reduit ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduit ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={transitionChip(1.5)}
        style={{ rotate: -3 }}
      >
        <FiMoon />
        {ui.chipTop}
      </motion.span>

      <motion.span
        className="nuit1-portrait__chip nuit1-portrait__chip--bas"
        initial={reduit ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduit ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={transitionChip(1.65)}
        style={{ rotate: 2 }}
      >
        <FiCpu />
        {ui.chipBottom}
      </motion.span>
    </motion.div>
  );
};

export default CartePortrait;
