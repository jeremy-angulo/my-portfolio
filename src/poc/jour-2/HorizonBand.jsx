// src/poc/jour-2/HorizonBand.jsx
// Le fond bleu ciel des deux bandeaux (chiffres clés, cartes défilantes)
// s'ouvre comme un horizon : scaleY 0 → 1 depuis le centre, à l'entrée de la
// section dans le viewport. Le CONTENU n'est jamais mis à l'échelle, seulement
// la couche de fond — et les deux filets qui la bordent.
//
// Couche décorative : `aria-hidden`, posée en `position: absolute` par la
// feuille du POC.

import React from "react";
import { motion, useTransform } from "framer-motion";
import useScrollRatio from "../shared/useScrollRatio";

/**
 * @param {{ trackRef: React.RefObject<HTMLElement>, reduced?: boolean,
 *           className?: string }} props
 */
const HorizonBand = ({ trackRef, reduced = false, className = "" }) => {
  const p = useScrollRatio(trackRef, {
    start: "start 95%",
    end: "start 25%",
    enabled: !reduced,
    frozen: 1,
  });
  const bords = useTransform(p, [0.85, 1], [0, 1]);

  return (
    <div className={`j2-horizon ${className}`} aria-hidden="true">
      <motion.div className="j2-horizon__bg" style={{ scaleY: p }} />
      <motion.div className="j2-horizon__edge j2-horizon__edge--top" style={{ opacity: bords }} />
      <motion.div className="j2-horizon__edge j2-horizon__edge--bottom" style={{ opacity: bords }} />
    </div>
  );
};

export default HorizonBand;
