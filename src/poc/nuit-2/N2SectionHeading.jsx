// src/poc/nuit-2/N2SectionHeading.jsx
// En-tête de section : sous-titre puis titre révélés par un clip-path qui
// remonte, une seule fois. Les libellés viennent de nightUi.sections /
// nightUi.contactUi — aucun texte inventé.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";

/**
 * @param {{ sub: string, title: string, as?: "h2"|"h3", className?: string }} props
 */
const N2SectionHeading = ({ sub, title, as = "h2", className }) => {
  const ref = useRef(null);
  const reduit = useReducedMotion();
  const vu = useInView(ref, { once: true, amount: 0.6 });
  const montre = reduit || vu;
  const Titre = as;

  return (
    <div className={`n2-heading${className ? ` ${className}` : ""}`} ref={ref}>
      <p className={`n2-heading__sub${montre ? " is-in" : ""}`}>{sub}</p>
      <Titre className={`n2-heading__title${montre ? " is-in" : ""}`}>{title}</Titre>
    </div>
  );
};

export default N2SectionHeading;
