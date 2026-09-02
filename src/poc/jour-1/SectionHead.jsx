// src/poc/jour-1/SectionHead.jsx
// Tête de section : un filet d'ambre se trace, l'eyebrow apparaît, le H2 se
// compose mot à mot, le sous-titre suit. C'est le geste du hero, à l'échelle
// d'une section — et c'est ce qui donne son unité à la page.
//
// Un seul `useInView` (once) pour le filet, l'eyebrow et le sous-titre : tout
// le reste est une transition CSS pilotée par la classe `.is-in`, donc un seul
// commit React par section. Le H2 utilise `Reveal` (module partagé), qui porte
// sa propre observation et son propre repli « mouvement réduit ».

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import Reveal from "../shared/Reveal";

/**
 * @param {{ eyebrow: string, title: string, sub?: string, statique?: boolean,
 *           className?: string }} props
 */
const SectionHead = ({ eyebrow, title, sub, statique = false, className }) => {
  const tete = useRef(null);
  const vu = useInView(tete, { once: true, amount: 0.4 });
  const actif = statique || vu;

  return (
    <div
      ref={tete}
      className={`pro-section__head j1-head${actif ? " is-in" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <p className="pro-section__eyebrow j1-eyebrow">
        <span className="j1-rule" aria-hidden="true" />
        <span className="j1-eyebrow__texte">{eyebrow}</span>
      </p>

      <Reveal
        as="h2"
        by="word"
        variant="mask"
        mode="inView"
        amount={0.4}
        duration={600}
        stagger={60}
        className="pro-section__title j1-title"
      >
        {title}
      </Reveal>

      {sub ? <p className="pro-section__sub j1-sub">{sub}</p> : null}
    </div>
  );
};

export default SectionHead;
