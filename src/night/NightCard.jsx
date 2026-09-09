// src/night/NightCard.jsx
// La surface unique de la facette nuit : une carte qui ne s'allume que là où le pointeur
// passe. `usePointerVars` y écrit `--mx` / `--my` (en %) et `--pv-active`
// directement dans le style de l'élément — aucun state, aucun re-render, et
// une seule carte repeinte à la fois.
//
// Au tactile et sous mouvement réduit, le hook n'attache aucun écouteur mais
// écrit une fois les valeurs de repos : le liseré reste éclairé en haut à
// gauche (rest { x: 20, y: 0 }), la carte garde sa matière.

import React, { useRef } from "react";
import { motion } from "framer-motion";
import usePointerVars from "../hooks/usePointerVars";

const REPOS = { x: 20, y: 0 };

/**
 * @param {{ as?: string, variante?: string, levee?: boolean,
 *           className?: string, children?: React.ReactNode }} props
 */
const NightCard = ({ as = "div", variante, levee = true, className, children, ...reste }) => {
  const noeud = useRef(null);
  usePointerVars(noeud, { rest: REPOS });

  const Balise = motion[as] || motion.div;
  const classes = [
    "night-carte",
    variante ? `night-carte--${variante}` : null,
    levee ? "night-carte--levee" : null,
    className || null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Balise ref={noeud} className={classes} {...reste}>
      {children}
    </Balise>
  );
};

export default NightCard;
