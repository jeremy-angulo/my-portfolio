// src/poc/nuit-2/N2Education.jsx
// LE DRAP. La formation ne « suit » pas le hero : elle monte par-dessus la
// scène collante, portée par le défilement lui-même (marge négative + z-index),
// avec un bord haut arrondi et un liseré violet. Aucun tween.
//
// Les trois cartes n'entrent pas sur un whileInView (tout ou rien) mais sont
// scrubbées par la progression de la section : on peut remonter, elles se
// redéposent.

import React, { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import { useN2Sky } from "./skyContext";
import useSectionProgress from "./useSectionProgress";
import N2SectionHeading from "./N2SectionHeading";
import N2Horizon from "./N2Horizon";

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (v, a, b) => (b === a ? (v >= b ? 1 : 0) : borner((v - a) / (b - a)));

const ROTATIONS = [-3, 0, 3];

const N2EduCard = ({ education, index, progression }) => {
  const debut = 0.12 * index;
  const fin = debut + 0.6;
  const y = useTransform(progression, (v) => 80 * (1 - seg(v, debut, fin)));
  const rotate = useTransform(
    progression,
    (v) => (ROTATIONS[index % ROTATIONS.length] || 0) * (1 - seg(v, debut, fin))
  );
  const opacity = useTransform(progression, (v) => seg(v, debut, fin));

  return (
    <motion.article className="n2-edu__card" style={{ y, rotate, opacity }}>
      <img className="n2-edu__logo" src={education.image} alt="" loading="lazy" decoding="async" />
      <p className="n2-edu__name blue-text-gradient">{education.name}</p>
      <p className="n2-edu__year">{education.year}</p>
      <p className="n2-edu__degree">{education.degree}</p>
      <p className="n2-edu__branch pink-text-gradient">{education.branch}</p>
      <p className="n2-edu__marks green-text-gradient">{education.marks}</p>
    </motion.article>
  );
};

const N2Education = () => {
  const { educations, nightUi } = useNightContent();
  const { sectionRefs } = useN2Sky();
  const grilleRef = useRef(null);

  // 0 quand le haut de la grille est à 95 % du viewport, 1 quand il atteint 35 %.
  const e = useSectionProgress(grilleRef, { start: "start 95%", end: "start 35%", frozen: 1 });

  return (
    <section className="n2-edu" id="education" ref={sectionRefs.education}>
      <div className="n2-container">
        <N2SectionHeading sub={nightUi.sections.educationSub} title={nightUi.sections.educationTitle} />
        <div className="n2-edu__grid" ref={grilleRef}>
          {educations.map((education, index) => (
            <N2EduCard
              key={`${education.name}-${index}`}
              education={education}
              index={index}
              progression={e}
            />
          ))}
        </div>
      </div>
      <N2Horizon />
    </section>
  );
};

export default N2Education;
