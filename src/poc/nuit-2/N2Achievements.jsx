// src/poc/nuit-2/N2Achievements.jsx
// LA PILE. Cinq cartes collantes qui se recouvrent : la carte du dessous
// recule (scale + opacité) au fur et à mesure que la suivante monte. Aucun
// texte ajouté — le numéro est un index, pas un slogan.
//
// Les cartes sont en flux de BLOC (pas en grille) : dans une grille, un
// élément collant est enfermé dans sa propre piste et ne peut pas s'empiler.

import React, { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import { useN2Sky } from "./skyContext";
import useSectionProgress from "./useSectionProgress";
import N2SectionHeading from "./N2SectionHeading";
import N2Horizon from "./N2Horizon";

const N2StackCard = ({ achievement, index, suivanteRef, refCb }) => {
  // Progression de la carte SUIVANTE : 0 quand son haut entre par le bas du
  // viewport, 1 quand il atteint 20 % de la hauteur.
  const s = useSectionProgress(suivanteRef, { start: "start end", end: "start 20%", frozen: 0 });
  const scale = useTransform(s, [0, 1], [1, 0.95]);
  const opacity = useTransform(s, [0, 1], [1, 0.6]);

  return (
    <motion.article
      className="n2-stack__card"
      ref={refCb}
      style={{ scale, opacity, "--i": index }}
    >
      <span className="n2-stack__num" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="n2-stack__text">{achievement.title}</p>
    </motion.article>
  );
};

const N2Achievements = () => {
  const { achievements, nightUi } = useNightContent();
  const { sectionRefs } = useN2Sky();

  // Refs stables, une par carte : chaque carte lit celle qui la suit.
  const refs = useRef([]);
  if (refs.current.length !== achievements.length) {
    refs.current = Array.from(
      { length: achievements.length },
      (unused, i) => refs.current[i] || { current: null }
    );
  }
  const vide = useRef(null);

  return (
    <section className="n2-stack" id="achievement" ref={sectionRefs.achievement}>
      <div className="n2-container">
        <N2SectionHeading
          sub={nightUi.sections.achievementSub}
          title={nightUi.sections.achievementTitle}
        />

        <div className="n2-stack__list">
          {achievements.map((achievement, index) => (
            <N2StackCard
              key={achievement.id || index}
              achievement={achievement}
              index={index}
              suivanteRef={refs.current[index + 1] || vide}
              refCb={(el) => {
                refs.current[index].current = el;
              }}
            />
          ))}
        </div>
      </div>
      <N2Horizon />
    </section>
  );
};

export default N2Achievements;
