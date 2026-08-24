// src/pro/ProExpertise.jsx

import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiUsers, FiCompass } from "react-icons/fi";
import { useProContent } from "../i18n/useContent";
import { rise, viewportOnce } from "./proMotion";

const ICONS = {
  trending: <FiTrendingUp />,
  users: <FiUsers />,
  compass: <FiCompass />,
};

const ProExpertise = () => {
  const { proPillars, proUi } = useProContent();

  return (
    <section id="expertises" className="pro-section pro-section--flush">
      <div className="pro-container">
        <motion.div
          className="pro-section__head"
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <p className="pro-section__eyebrow">{proUi.expertise.eyebrow}</p>
          <h2 className="pro-section__title">{proUi.expertise.title}</h2>
          <p className="pro-section__sub">{proUi.expertise.sub}</p>
        </motion.div>

        <div className="pro-pillars">
          {proPillars.map((pillar, i) => (
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
      </div>
    </section>
  );
};

export default ProExpertise;
