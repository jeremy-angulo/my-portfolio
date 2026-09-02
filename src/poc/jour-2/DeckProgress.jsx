// src/poc/jour-2/DeckProgress.jsx
// Le tablier du pont, à l'échelle de la page : un filet de 2 px sous la navbar
// qui se tend au fil du document. Mêmes couleurs et mêmes ticks que le tablier
// du hero — c'est littéralement la même pièce, vue de loin.
//
// Aucun astre ne parcourt le filet : la course du soleil appartient à jour-3.

import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import useScrollRatio from "../shared/useScrollRatio";
import useReducedMotion from "../shared/useReducedMotion";

const DeckProgress = ({ rootRef }) => {
  const mouvementReduit = useReducedMotion();

  // Progression du document entier : le haut de la racine au haut du viewport
  // (0) jusqu'à son bas au bas du viewport (1). Uniquement des rects et la
  // sonde partagée — jamais `window.innerHeight` ni `scrollHeight` mélangés.
  const brut = useScrollRatio(rootRef, { start: "start start", end: "end end" });

  // Un seul ressort de toute la page, et c'est celui-ci. Sous mouvement
  // réduit, la ligne reste liée au scroll sans lissage : c'est de
  // l'information, on la garde.
  const lisse = useSpring(brut, { stiffness: 100, damping: 30, restDelta: 0.0005 });
  const avancee = mouvementReduit ? brut : lisse;

  const ticks = useTransform(brut, [0, 0.03], [0, 1]);

  return (
    <div className="j2-deckbar" aria-hidden="true">
      <motion.div className="j2-deckbar__line" style={{ scaleX: avancee }} />
      <motion.span className="j2-deckbar__tick j2-deckbar__tick--left" style={{ opacity: ticks }} />
      <motion.span className="j2-deckbar__tick j2-deckbar__tick--right" style={{ opacity: ticks }} />
    </div>
  );
};

export default DeckProgress;
