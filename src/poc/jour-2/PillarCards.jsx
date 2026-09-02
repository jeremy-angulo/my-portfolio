// src/poc/jour-2/PillarCards.jsx
// Les trois cartes d'expertise : contenu `proPillars` inchangé, mêmes classes
// `.pro-card` et mêmes icônes que la page d'accueil.
//
// Deux rendus, deux composants distincts (donc deux arbres de hooks stables) :
// « épinglé », où les cartes viennent se poser sous le tablier au fil du
// défilement, et « linéaire », où elles montent en `rise` à l'entrée.

import React from "react";
import { motion, useTransform } from "framer-motion";
import { FiTrendingUp, FiUsers, FiCompass } from "react-icons/fi";
import { rise, viewportOnce } from "../../pro/proMotion";
import { easeOutCubic } from "./mesure";

const ICONS = {
  trending: <FiTrendingUp />,
  users: <FiUsers />,
  compass: <FiCompass />,
};

const Carte = ({ pillar, style, className = "" }) => (
  <motion.article className={`pro-card ${className}`} style={style}>
    <span className="pro-card__icon">{ICONS[pillar.icon]}</span>
    <h3 className="pro-card__title">{pillar.title}</h3>
    <p className="pro-card__text">{pillar.text}</p>
    <ul>
      {pillar.points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  </motion.article>
);

/**
 * Mode épinglé : fenêtre i = [0,50 + 0,09 i ; 0,68 + 0,09 i].
 * Trois jeux de transformations créés inconditionnellement : le nombre de
 * hooks ne dépend jamais du contenu.
 */
export const PillarCardsPinned = ({ pillars, p }) => {
  const opts = { ease: easeOutCubic };
  const y0 = useTransform(p, [0.5, 0.68], ["45%", "0%"], opts);
  const y1 = useTransform(p, [0.59, 0.77], ["45%", "0%"], opts);
  const y2 = useTransform(p, [0.68, 0.86], ["45%", "0%"], opts);
  const o0 = useTransform(p, [0.5, 0.63], [0, 1]);
  const o1 = useTransform(p, [0.59, 0.72], [0, 1]);
  const o2 = useTransform(p, [0.68, 0.81], [0, 1]);
  const r0 = useTransform(p, [0.5, 0.68], [-1.5, 0], opts);
  const r1 = useTransform(p, [0.59, 0.77], [0, 0], opts);
  const r2 = useTransform(p, [0.68, 0.86], [1.5, 0], opts);

  const jeux = [
    { y: y0, opacity: o0, rotate: r0 },
    { y: y1, opacity: o1, rotate: r1 },
    { y: y2, opacity: o2, rotate: r2 },
  ];

  return (
    <div className="pro-pillars j2-pillars">
      {pillars.map((pillar, i) => (
        <Carte key={pillar.title} pillar={pillar} style={jeux[i] ?? jeux[2]} />
      ))}
    </div>
  );
};

/** Mode linéaire (mobile, mouvement réduit) : le `rise` de la page d'accueil. */
export const PillarCardsLinear = ({ pillars }) => (
  <div className="pro-pillars j2-pillars">
    {pillars.map((pillar, i) => (
      <motion.article
        key={pillar.title}
        className="pro-card"
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        custom={i}
      >
        <span className="pro-card__icon">{ICONS[pillar.icon]}</span>
        <h3 className="pro-card__title">{pillar.title}</h3>
        <p className="pro-card__text">{pillar.text}</p>
        <ul>
          {pillar.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </motion.article>
    ))}
  </div>
);

export default PillarCardsPinned;
