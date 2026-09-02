// src/poc/jour-2/ContactGlow.jsx
// ProContact réutilisée telle quelle (formulaire EmailJS, canaux, id contact,
// focus ambre). On ajoute seulement une lueur ambre qui monte du bas de la
// section à mesure qu'on l'approche : la fin de page se réchauffe, sans
// raconter un coucher de soleil (ça, c'est jour-3).

import React, { useRef } from "react";
import { motion } from "framer-motion";
import ProContact from "../../pro/ProContact";
import useScrollRatio from "../shared/useScrollRatio";

const ContactGlow = ({ reduced }) => {
  const ref = useRef(null);
  const opacite = useScrollRatio(ref, {
    start: "start 80%",
    end: "center center",
    enabled: !reduced,
    frozen: 1,
  });

  return (
    <div className="j2-lueur" ref={ref}>
      <motion.div className="j2-lueur__glow" style={{ opacity: opacite }} aria-hidden="true" />
      <div className="j2-lueur__in">
        <ProContact />
      </div>
    </div>
  );
};

export default ContactGlow;
