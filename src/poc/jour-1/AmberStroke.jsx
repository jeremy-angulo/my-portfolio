// src/poc/jour-1/AmberStroke.jsx
// Le trait d'ambre tracé sous un mot : la signature du POC « Trait d'union ».
//
// Un <svg> par mot (l'<em> « le business » est coupé sur deux lignes au
// desktop : un seul trait absolu ne pourrait pas suivre). Le path est
// légèrement bombé, `pathLength="1"` normalise sa longueur pour que
// stroke-dasharray/offset valent 1 quelle que soit la largeur du mot.
// `preserveAspectRatio="none"` étire le trait sur toute la largeur du mot ;
// les unités du viewBox restent proportionnelles au corps du titre, donc
// insensibles au `body { zoom: 0.85 }`.
//
// Le tracé est une simple transition CSS déclenchée par la classe `.is-drawn`
// posée sur le titre : delay et durée arrivent en styles inline (elles varient
// d'un mot à l'autre, au prorata du nombre de caractères).

import React from "react";

/**
 * @param {{ delay?: number, duration?: number, statique?: boolean }} props (ms)
 */
const AmberStroke = ({ delay = 0, duration = 620, statique = false }) => (
  <svg
    className="j1-word__stroke"
    viewBox="0 0 100 12"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M2 8 C 30 3, 70 11, 98 6"
      pathLength="1"
      style={
        statique
          ? undefined
          : { transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }
      }
    />
  </svg>
);

export default AmberStroke;
