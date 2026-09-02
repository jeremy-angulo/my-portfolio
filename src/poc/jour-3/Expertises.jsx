// src/poc/jour-3/Expertises.jsx
// Copie fidèle de ProExpertise (mêmes textes, mêmes classes, même id d'ancre).
// Seul ajout : chaque carte pilier est enveloppée d'une CarteLumiere — au repos
// son ombre suit la course du soleil, au survol elle s'incline vers le pointeur.
// Premier « mur » ivoire de la page : il ferme le ciel du hero.

import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiUsers, FiCompass } from "react-icons/fi";
import { useProContent } from "../../i18n/useContent";
import { rise, viewportOnce } from "../../pro/proMotion";
import CarteLumiere from "./CarteLumiere";

const ICONS = {
  trending: <FiTrendingUp />,
  users: <FiUsers />,
  compass: <FiCompass />,
};

const Expertises = () => {
  const { proPillars, proUi } = useProContent();

  return (
    <section id="expertises" className="pro-section pro-section--flush j3-mur j3-mur--raccord">
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
            <CarteLumiere key={pillar.title} mode="hover" tilt={5} radius={20}>
              <motion.article
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
            </CarteLumiere>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Expertises;
