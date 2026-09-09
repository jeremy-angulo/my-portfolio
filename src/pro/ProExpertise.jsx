// src/pro/ProExpertise.jsx
// Section « Expertises ». La tête se trace (filet + H2 mot à mot) et les cartes
// entrent en cascade CSS pilotée par `.is-in` — un seul commit React — avec un
// spotlight ambre qui suit la souris sur leur bord.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { FiTrendingUp, FiUsers, FiCompass } from "react-icons/fi";
import { useProContent } from "../i18n/useContent";
import ProSectionHead from "./ProSectionHead";
import useSpotlight from "../hooks/useSpotlight";

const ICONS = {
  trending: <FiTrendingUp />,
  users: <FiUsers />,
  compass: <FiCompass />,
};

const ProExpertise = ({ statique = false }) => {
  const { proPillars, proUi } = useProContent();
  const grille = useRef(null);
  const vu = useInView(grille, { once: true, amount: 0.25 });
  const actif = statique || vu;

  useSpotlight(grille, { selecteur: ".pro-card" });

  return (
    <section id="expertises" className="pro-section pro-section--flush">
      <div className="pro-container">
        <ProSectionHead
          eyebrow={proUi.expertise.eyebrow}
          title={proUi.expertise.title}
          sub={proUi.expertise.sub}
          statique={statique}
        />

        <div ref={grille} className={`pro-pillars day-pillars${actif ? " is-in" : ""}`}>
          {proPillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className="pro-card"
              style={{ "--day-fx-delai": `${i * 110}ms` }}
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

export default ProExpertise;
