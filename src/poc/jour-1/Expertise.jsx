// src/poc/jour-1/Expertise.jsx
// Section « Expertises » : mêmes classes et mêmes textes que ProExpertise.
// Seuls changent la tête (filet tracé + H2 mot à mot) et l'entrée des cartes,
// qui devient une cascade CSS pilotée par `.is-in` — un seul commit React —
// plus un spotlight ambre qui suit la souris sur le bord des cartes.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { FiTrendingUp, FiUsers, FiCompass } from "react-icons/fi";
import { useProContent } from "../../i18n/useContent";
import SectionHead from "./SectionHead";
import useSpotlight from "./useSpotlight";

const ICONS = {
  trending: <FiTrendingUp />,
  users: <FiUsers />,
  compass: <FiCompass />,
};

const Expertise = ({ statique = false }) => {
  const { proPillars, proUi } = useProContent();
  const grille = useRef(null);
  const vu = useInView(grille, { once: true, amount: 0.25 });
  const actif = statique || vu;

  useSpotlight(grille, { selecteur: ".pro-card" });

  return (
    <section id="expertises" className="pro-section pro-section--flush">
      <div className="pro-container">
        <SectionHead
          eyebrow={proUi.expertise.eyebrow}
          title={proUi.expertise.title}
          sub={proUi.expertise.sub}
          statique={statique}
        />

        <div ref={grille} className={`pro-pillars j1-pillars${actif ? " is-in" : ""}`}>
          {proPillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className="pro-card"
              style={{ "--j1-delai": `${i * 110}ms` }}
            >
              <span className="pro-card__icon">{ICONS[pillar.icon]}</span>
              <h3 className="pro-card__title">{pillar.title}</h3>
              <p className="pro-card__text">{pillar.text}</p>
              <ul>
                {pillar.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Expertise;
