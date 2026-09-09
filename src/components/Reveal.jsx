// src/components/Reveal.jsx
// Révélation d'un texte mot à mot ou ligne à ligne.
//
// Le composant NE PARSE PAS les éléments inline : `children` est une CHAÎNE
// (`by="word"`), ou une chaîne / un tableau de chaînes (`by="line"` ; les
// `\n` découpent aussi). Pour garder un `<em>` à l'intérieur d'un
// titre compose lui-même avec le primitif `RevealWord` — c'est la seule façon
// robuste de conserver la sémantique ET de greffer un décor par mot.
//
// Accessibilité : les mots sont des `<span style="display:inline-block">`
// séparés par de VRAIS nœuds texte espace (retour à la ligne naturel, lecture
// d'écran correcte). Pas de copie visually-hidden, pas d'`aria-hidden`, pas
// d'`aria-label`.

import React, { createContext, useContext, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import "./Reveal.scss";

// Autorisation de jouer, descendue par Reveal aux RevealWord qu'il compose.
// Par défaut true : un RevealWord utilisé seul s'anime au montage.
const ContexteReveal = createContext(true);

const EASE_DEFAUT = [0.22, 1, 0.36, 1];

/**
 * Primitif : un fragment de texte révélé, à composer librement.
 * @param {{ delay?: number, duration?: number, y?: number,
 *           variant?: "soft"|"mask", ease?: number[],
 *           className?: string, style?: object, children?: React.ReactNode }} props
 */
export const RevealWord = ({
  delay = 0,
  duration = 500,
  y = 18,
  variant = "soft",
  ease = EASE_DEFAUT,
  className,
  style,
  children,
}) => {
  const mouvementReduit = useReducedMotion();
  const jouer = useContext(ContexteReveal);
  const [pose, setPose] = useState(false);

  // Mouvement réduit : le texte nu, sans wrapper, sans transition,
  // sans will-change.
  if (mouvementReduit) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  const depart = variant === "mask" ? { y: "108%" } : { opacity: 0, y };
  const arrivee = variant === "mask" ? { y: "0%" } : { opacity: 1, y: 0 };
  const transition = { duration: duration / 1000, delay: delay / 1000, ease };

  const interieur = (
    <motion.span
      className={`reveal__in${pose ? " is-settled" : ""}`}
      initial={depart}
      animate={jouer ? arrivee : depart}
      transition={transition}
      onAnimationComplete={() => {
        if (jouer) setPose(true);
      }}
    >
      {children}
    </motion.span>
  );

  if (variant === "mask") {
    return (
      <span
        className={`reveal__mask${className ? ` ${className}` : ""}`}
        style={style}
      >
        {interieur}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {interieur}
    </span>
  );
};

const enLignes = (children) => {
  const brut = Array.isArray(children) ? children : [children];
  return brut
    .flatMap((morceau) => String(morceau).split("\n"))
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.length > 0);
};

/**
 * @param {{ as?: string, by?: "word"|"line", variant?: "soft"|"mask",
 *           mode?: "inView"|"animate", delay?: number, stagger?: number,
 *           duration?: number, y?: number, ease?: number[], amount?: number,
 *           className?: string, style?: object, children?: React.ReactNode }} props
 *
 * Le retard total d'un mot i vaut `delay + i * stagger` (ms).
 */
const Reveal = ({
  as = "span",
  by = "word",
  variant = "soft",
  mode = "inView",
  delay = 0,
  stagger = 60,
  duration = 500,
  y = 18,
  ease = EASE_DEFAUT,
  amount = 0.2,
  className,
  style,
  children,
}) => {
  const mouvementReduit = useReducedMotion();
  const conteneur = useRef(null);
  const vu = useInView(conteneur, { once: true, amount });
  const As = as || "span";

  const jouer = mode === "animate" ? true : vu;

  // Mouvement réduit : texte nu, immédiatement lisible.
  if (mouvementReduit) {
    const brut = Array.isArray(children) ? children.join(" ") : children;
    return (
      <As ref={conteneur} className={className} style={style}>
        {brut}
      </As>
    );
  }

  let contenu;
  if (by === "line") {
    contenu = enLignes(children).map((ligne, i) => (
      <span className="reveal__line" key={`${i}-${ligne.slice(0, 12)}`}>
        <RevealWord
          delay={delay + i * stagger}
          duration={duration}
          y={y}
          variant={variant}
          ease={ease}
        >
          {ligne}
        </RevealWord>
      </span>
    ));
  } else if (typeof children === "string") {
    // On garde les séparateurs : les espaces restent de vrais nœuds texte.
    let indexMot = 0;
    contenu = children.split(/(\s+)/).map((morceau, i) => {
      if (!morceau) return null;
      if (/^\s+$/.test(morceau)) return morceau;
      const retard = delay + indexMot * stagger;
      indexMot += 1;
      return (
        <RevealWord
          key={`${i}-${morceau}`}
          delay={retard}
          duration={duration}
          y={y}
          variant={variant}
          ease={ease}
        >
          {morceau}
        </RevealWord>
      );
    });
  } else {
    // Un contenu non textuel n'est pas découpé : il est révélé d'un bloc.
    contenu = (
      <RevealWord delay={delay} duration={duration} y={y} variant={variant} ease={ease}>
        {children}
      </RevealWord>
    );
  }

  return (
    <As ref={conteneur} className={`reveal${className ? ` ${className}` : ""}`} style={style}>
      <ContexteReveal.Provider value={jouer}>{contenu}</ContexteReveal.Provider>
    </As>
  );
};

export default Reveal;
