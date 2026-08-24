// src/pro/ProStats.jsx
// Rangée de chiffres clés : la valeur en grand, le libellé en toutes lettres.

import React from "react";
import { motion } from "framer-motion";
import { useProContent } from "../i18n/useContent";
import { rise, viewportOnce } from "./proMotion";

const ProStats = () => {
  const { proStats, proUi } = useProContent();

  return (
    <section className="pro-stats" aria-label={proUi.statsLabel}>
      <div className="pro-container pro-stats__row">
        {proStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="pro-stat"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            custom={i}
          >
            <p className="pro-stat__value">{stat.value}</p>
            <p className="pro-stat__label">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProStats;
