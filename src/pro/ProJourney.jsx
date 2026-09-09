// src/pro/ProJourney.jsx
// Section « Parcours ». La timeline se dessine (ProDrawnTimeline) et la colonne
// Formation reprend le filet d'ambre des eyebrows puis le spotlight des cartes.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { useProContent } from "../i18n/useContent";
import ProSectionHead from "./ProSectionHead";
import ProDrawnTimeline from "./ProDrawnTimeline";
import useSpotlight from "../hooks/useSpotlight";

const ProJourney = ({ statique = false }) => {
  const { proTimeline, proEducations, proUi } = useProContent();
  const formation = useRef(null);
  const vu = useInView(formation, { once: true, amount: 0.25 });
  const actif = statique || vu;

  useSpotlight(formation, { selecteur: ".pro-edu__card" });

  return (
    <section id="parcours" className="pro-section pro-journey">
      <div className="pro-container">
        <ProSectionHead
          eyebrow={proUi.journey.eyebrow}
          title={proUi.journey.title}
          sub={proUi.journey.sub}
          statique={statique}
        />

        <div className="pro-journey__grid">
          <ProDrawnTimeline etapes={proTimeline} statique={statique} />

          <aside ref={formation} className={`pro-edu day-edu${actif ? " is-in" : ""}`}>
            <p className="pro-edu__label day-eyebrow">
              <span className="day-rule" aria-hidden="true" />
              <span className="day-eyebrow__texte">{proUi.journey.eduLabel}</span>
            </p>
            {proEducations.map((edu, i) => (
              <div
                key={edu.school}
                className="pro-edu__card"
                style={{ "--day-fx-delai": `${120 + i * 90}ms` }}
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

export default ProJourney;
