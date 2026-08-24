// src/pro/ProJourney.jsx
// Parcours business : la timeline à gauche, la formation à droite.

import React from "react";
import { motion } from "framer-motion";
import { useProContent } from "../i18n/useContent";
import { rise, viewportOnce } from "./proMotion";

const ProJourney = () => {
  const { proTimeline, proEducations, proUi } = useProContent();

  return (
    <section id="parcours" className="pro-section pro-journey">
      <div className="pro-container">
        <motion.div
          className="pro-section__head"
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <p className="pro-section__eyebrow">{proUi.journey.eyebrow}</p>
          <h2 className="pro-section__title">{proUi.journey.title}</h2>
          <p className="pro-section__sub">{proUi.journey.sub}</p>
        </motion.div>

        <div className="pro-journey__grid">
          <div className="pro-timeline">
            {proTimeline.map((step, i) => (
              <motion.div
                key={step.title}
                className="pro-timeline__item"
                variants={rise}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                custom={i * 0.5}
              >
                <p className="pro-timeline__date">{step.date}</p>
                <h3 className="pro-timeline__title">{step.title}</h3>
                <p className="pro-timeline__company">
                  <img src={step.icon} alt="" aria-hidden="true" />
                  {step.company}
                </p>
                <p className="pro-timeline__text">{step.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.aside
            className="pro-edu"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            custom={1}
          >
            <p className="pro-edu__label">{proUi.journey.eduLabel}</p>
            {proEducations.map((edu) => (
              <div key={edu.school} className="pro-edu__card">
                <img src={edu.image} alt={edu.school} />
                <div>
                  <strong>{edu.school}</strong>
                  <span>{edu.degree}</span>
                  <span>{edu.year}</span>
                </div>
              </div>
            ))}
          </motion.aside>
        </div>
      </div>
    </section>
  );
};

export default ProJourney;
