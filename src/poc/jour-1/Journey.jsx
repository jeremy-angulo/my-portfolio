// src/poc/jour-1/Journey.jsx
// Section « Parcours » : mêmes classes, même grille et mêmes textes que
// ProJourney. La timeline se dessine (DrawnTimeline), et la colonne Formation
// reprend le filet d'ambre des eyebrows puis le spotlight des cartes.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { useProContent } from "../../i18n/useContent";
import SectionHead from "./SectionHead";
import DrawnTimeline from "./DrawnTimeline";
import useSpotlight from "./useSpotlight";

const Journey = ({ statique = false }) => {
  const { proTimeline, proEducations, proUi } = useProContent();
  const formation = useRef(null);
  const vu = useInView(formation, { once: true, amount: 0.25 });
  const actif = statique || vu;

  useSpotlight(formation, { selecteur: ".pro-edu__card" });

  return (
    <section id="parcours" className="pro-section pro-journey">
      <div className="pro-container">
        <SectionHead
          eyebrow={proUi.journey.eyebrow}
          title={proUi.journey.title}
          sub={proUi.journey.sub}
          statique={statique}
        />

        <div className="pro-journey__grid">
          <DrawnTimeline etapes={proTimeline} statique={statique} />

          <aside ref={formation} className={`pro-edu j1-edu${actif ? " is-in" : ""}`}>
            <p className="pro-edu__label j1-eyebrow">
              <span className="j1-rule" aria-hidden="true" />
              <span className="j1-eyebrow__texte">{proUi.journey.eduLabel}</span>
            </p>
            {proEducations.map((edu, i) => (
              <div
                key={edu.school}
                className="pro-edu__card"
                style={{ "--j1-delai": `${120 + i * 90}ms` }}
              >
                <img src={edu.image} alt={edu.school} />
                <div>
                  <strong>{edu.school}</strong>
                  <span>{edu.degree}</span>
                  <span>{edu.year}</span>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Journey;
