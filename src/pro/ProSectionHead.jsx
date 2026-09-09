// src/pro/ProSectionHead.jsx
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
import Reveal from "../components/Reveal";

/**
 * @param {{ eyebrow: string, title: string, sub?: string, statique?: boolean,
 *           className?: string }} props
 */
const ProSectionHead = ({ eyebrow, title, sub, statique = false, className }) => {
  const tete = useRef(null);
  const vu = useInView(tete, { once: true, amount: 0.4 });
  const actif = statique || vu;

  return (
    <div
      ref={tete}
      className={`pro-section__head day-head${actif ? " is-in" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <p className="pro-section__eyebrow day-eyebrow">
        <span className="day-rule" aria-hidden="true" />
        <span className="day-eyebrow__texte">{eyebrow}</span>
      </p>

      <Reveal
        as="h2"
        by="word"
        variant="mask"
        mode="inView"
        amount={0.4}
        duration={600}
        stagger={60}
        className="pro-section__title day-title"
      >
        {title}
      </Reveal>

      {sub ? <p className="pro-section__sub day-sub">{sub}</p> : null}
    </div>
  );
};

export default ProSectionHead;
