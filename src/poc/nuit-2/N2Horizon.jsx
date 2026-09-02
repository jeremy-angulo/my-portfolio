// src/poc/nuit-2/N2Horizon.jsx
// Trait d'horizon : 1 px de lumière qui se dessine à l'entrée dans le champ,
// une seule fois. Sépare les sections sans les cloisonner.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";

const N2Horizon = () => {
  const ref = useRef(null);
  const reduit = useReducedMotion();
  const vu = useInView(ref, { once: true, amount: 1 });

  return (
    <div className="n2-horizon" ref={ref} aria-hidden="true">
      <i className={`n2-horizon__line${reduit || vu ? " is-in" : ""}`} />
    </div>
  );
};

export default N2Horizon;
