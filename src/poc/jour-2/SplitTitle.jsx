// src/poc/jour-2/SplitTitle.jsx
// Le H1 du site, inchangé au caractère près, mais rendu en morceaux
// manipulables : « Le pont entre » · « la technique » · « et » · « le business »
// · « . ». Les espaces entre les morceaux sont de VRAIS nœuds texte, donc
// `innerText` du h1 reste exactement `heroTitle.pre + em + post` et le retour à
// la ligne se fait naturellement (3 lignes visuelles, comme aujourd'hui).
//
// Chaque morceau est un inline-block masqué par `clip-path` le temps de son
// arrivée ; le masque est retiré (`clipPath: none`) à la fin de l'animation,
// sinon il rognerait le vol des morceaux pendant la construction du pont.

import React from "react";
import { motion } from "framer-motion";

const E = [0.22, 1, 0.36, 1];
const MASQUE_CACHE = "inset(-20% -8% 100% -2%)";
const MASQUE_VU = "inset(-20% -8% -20% -2%)";

/**
 * Un morceau du titre.
 * @param {{ children: React.ReactNode, delay: number, reduced: boolean,
 *           style?: object, innerRef?: React.Ref<HTMLElement>, className?: string }} props
 */
const Token = ({ children, delay, reduced, style, innerRef, className = "" }) => {
  // Mouvement réduit : texte nu, aucune enveloppe animée, aucun masque.
  if (reduced) {
    return (
      <span className={`j2-title__w ${className}`} ref={innerRef}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={`j2-title__w ${className}`}
      ref={innerRef}
      style={style}
      initial={{ clipPath: MASQUE_CACHE }}
      animate={{
        clipPath: MASQUE_VU,
        transition: { duration: 0.55, delay: delay / 1000, ease: E },
        transitionEnd: { clipPath: "none" },
      }}
    >
      <motion.span
        className="j2-title__in"
        initial={{ opacity: 0, y: "0.35em" }}
        animate={{
          opacity: 1,
          y: "0em",
          transition: { duration: 0.55, delay: delay / 1000, ease: E },
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
};

/**
 * @param {{ parts: {head,mid,link,em,post}|null, heroTitle: object,
 *           reduced: boolean, styles?: {head,mid,link,em},
 *           refs?: {mid: React.Ref, em: React.Ref}, className?: string }} props
 */
const SplitTitle = ({ parts, heroTitle, reduced, styles = {}, refs = {}, className = "" }) => {
  // Repli : la forme de `proUi.heroTitle` a changé — on rend le titre entier,
  // exactement comme la page d'accueil. Pas de pont, mais rien de cassé.
  if (!parts) {
    return (
      <h1 className={`pro-hero__title j2-title j2-title--plain ${className}`}>
        {heroTitle.pre}
        <em>{heroTitle.em}</em>
        {heroTitle.post}
      </h1>
    );
  }

  return (
    <h1 className={`pro-hero__title j2-title ${className}`}>
      <Token delay={100} reduced={reduced} style={styles.head} className="j2-title__w--head">
        {parts.head}
      </Token>{" "}
      <Token delay={190} reduced={reduced} style={styles.mid} innerRef={refs.mid} className="j2-title__w--mid">
        {parts.mid}
      </Token>{" "}
      <Token delay={190} reduced={reduced} style={styles.link} className="j2-title__w--link">
        {parts.link}
      </Token>{" "}
      <Token delay={280} reduced={reduced} style={styles.em} innerRef={refs.em} className="j2-title__w--em">
        <em>{parts.em}</em>
        {parts.post}
      </Token>
    </h1>
  );
};

export default SplitTitle;
