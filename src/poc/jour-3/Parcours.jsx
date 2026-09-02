// src/poc/jour-3/Parcours.jsx
// Copie fidèle de ProJourney (timeline intacte, mêmes textes, id d'ancre
// « parcours »). Les trois cartes de formation reçoivent une ombre
// directionnelle seule (variant « lite », sans inclinaison ni reflet) : à
// mi-page le soleil est haut, la section se lit « à midi ».

import React from "react";
import { motion } from "framer-motion";
import { useProContent } from "../../i18n/useContent";
import { rise, viewportOnce } from "../../pro/proMotion";
import CarteLumiere from "./CarteLumiere";

const Parcours = () => {
  const { proTimeline, proEducations, proUi } = useProContent();

  return (
    <section id="parcours" className="pro-section pro-journey j3-mur">
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
              <CarteLumiere key={edu.school} mode="fixe" variant="lite" radius={16}>
                <div className="pro-edu__card">
                  <img src={edu.image} alt={edu.school} />
                  <div>
                    <strong>{edu.school}</strong>
                    <span>{edu.degree}</span>
                    <span>{edu.year}</span>
                  </div>
                </div>
              </CarteLumiere>
            ))}
          </motion.aside>
        </div>
      </div>
    </section>
  );
};

export default Parcours;
