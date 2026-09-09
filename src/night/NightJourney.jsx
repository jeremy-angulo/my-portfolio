// src/night/NightJourney.jsx
// Section « Expérience », sans `react-vertical-timeline-component` : une
// timeline maison sur un seul côté, lisible comme un texte — date à gauche,
// rail au milieu, carte à droite. 11 étapes, contenu `experiences` inchangé.

import React from "react";
import NightSectionHead from "./NightSectionHead";
import NightJourneyStep from "./NightJourneyStep";
import { useDict } from "./nightLabels";

const NightJourney = ({ experiences, sections }) => {
  const dict = useDict();

  return (
    <section id="experience" className="night-section night-parcours">
      <div className="night-container">
        <NightSectionHead sub={sections.experienceSub} title={sections.experienceTitle} />

        <ol className="night-parcours__liste" aria-label={dict.parcours}>
          {experiences.map((etape, i) => (
            <NightJourneyStep
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

export default NightJourney;
