// src/poc/nuit-3/Plateau.jsx
// Le plateau de verre sombre sur lequel se posent les sections. Entre deux
// plateaux, du ciel nu : c'est la respiration qui rend le champ d'étoiles
// continu du hero au pied de page.
//
// Pas de backdrop-filter ici (seuls la navbar et le dock en portent) : un
// flou sur une surface de cette taille coûte plusieurs millisecondes par
// frame et le ciel est déjà sombre.

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Reveal from "../shared/Reveal";
import useReducedMotion from "../shared/useReducedMotion";

const Plateau = ({ id, sous, titre, children, className = "", entete = true }) => {
  const ref = useRef(null);
  const vu = useInView(ref, { once: true, amount: 0.2 });
  const mouvementReduit = useReducedMotion();

  return (
    <motion.section
      id={id}
      ref={ref}
      className={`n3-plateau ${vu ? "is-vu" : ""} ${className}`.trim()}
      initial={mouvementReduit ? false : { opacity: 0, y: 24 }}
      animate={
        mouvementReduit || vu
          ? { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
          : { opacity: 0, y: 24 }
      }
    >
      {entete && (
        <header className="n3-plateau__entete">
          {sous && <p className="n3-plateau__sous">{sous}</p>}
          {titre && (
            <Reveal as="h2" by="word" className="n3-plateau__titre" stagger={60} duration={450}>
              {titre}
            </Reveal>
          )}
        </header>
      )}
      {children}
    </motion.section>
  );
};

export default Plateau;
