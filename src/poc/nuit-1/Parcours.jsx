// src/poc/nuit-1/Parcours.jsx
// Section « Expérience », sans `react-vertical-timeline-component` : une
// timeline maison sur un seul côté, lisible comme un texte — date à gauche,
// rail au milieu, carte à droite. 11 étapes, contenu `experiences` inchangé.

import React from "react";
import EnteteSection from "./EnteteSection";
import EtapeParcours from "./EtapeParcours";
import { useDict } from "./dictionnaire";

const Parcours = ({ experiences, sections }) => {
  const dict = useDict();

  return (
    <section id="experience" className="nuit1-section nuit1-parcours">
      <div className="nuit1-container">
        <EnteteSection sub={sections.experienceSub} title={sections.experienceTitle} />

        <ol className="nuit1-parcours__liste" aria-label={dict.parcours}>
          {experiences.map((etape, i) => (
            <EtapeParcours
              key={`${etape.company_name}-${etape.date}`}
              etape={etape}
              dernier={i === experiences.length - 1}
              libelleLien={sections.link}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Parcours;
