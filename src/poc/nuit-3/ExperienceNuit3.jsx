// src/poc/nuit-3/ExperienceNuit3.jsx
// Parcours : une constellation verticale, dessinée à la main, à la place de
// react-vertical-timeline-component (qui n'entre donc plus dans le chunk).
// 11 nœuds, 10 segments : chaque segment se trace et son nœud s'allume à
// l'entrée dans le viewport, une seule fois, sans rien lier au défilement.

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Reveal from "../shared/Reveal";
import useReducedMotion from "../shared/useReducedMotion";
import { useNightContent } from "../../i18n/useContent";
import { useLang } from "../../i18n/LanguageContext";
import { dicoNuit3 } from "./dictionnaire";

const Etape = ({ experience, indice, dernier, linkLabel, mouvementReduit }) => {
  const ref = useRef(null);
  const vu = useInView(ref, { once: true, amount: 0.6 });
  const joue = mouvementReduit || vu;
  const cote = indice % 2 === 0 ? "gauche" : "droite";

  return (
    <li className={`n3-exp__etape n3-exp__etape--${cote}`} ref={ref}>
      <div className="n3-exp__rail" aria-hidden="true">
        <motion.span
          className="n3-exp__noeud"
          initial={mouvementReduit ? false : { scale: 0.6, opacity: 0.4 }}
          animate={joue ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {!dernier && (
          <svg
            className="n3-exp__lien"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <motion.line
              className="n3-exp__segment"
              x1="1"
              y1="0"
              x2="1"
              y2="100"
              pathLength="1"
              strokeDasharray="1"
              initial={mouvementReduit ? false : { strokeDashoffset: 1 }}
              animate={joue ? { strokeDashoffset: 0 } : { strokeDashoffset: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </svg>
        )}
      </div>

      <motion.article
        className="n3-exp__carte"
        initial={mouvementReduit ? false : { opacity: 0, y: 24 }}
        animate={joue ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <header className="n3-exp__entete">
          <span className="n3-exp__logo" style={{ background: experience.iconBg }}>
            <img src={experience.icon} alt="" aria-hidden="true" />
          </span>
          <span className="n3-exp__date">{experience.date}</span>
        </header>
        <h3 className="n3-exp__titre">{experience.title}</h3>
        <p className="n3-exp__entreprise">{experience.company_name}</p>
        <ul className="n3-exp__points">
          {experience.points.map((point, i) => (
            <li key={`${experience.title}-${i}`}>
              <span className="n3-exp__puce" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {experience.link && (
          <a
            className="n3-exp__lien-externe blue-text-gradient"
            href={experience.link}
            target="_blank"
            rel="noreferrer"
          >
            {linkLabel}
          </a>
        )}
      </motion.article>
    </li>
  );
};

const ExperienceNuit3 = () => {
  const { experiences, nightUi } = useNightContent();
  const { lang } = useLang();
  const dico = dicoNuit3(lang);
  const mouvementReduit = useReducedMotion();

  return (
    <section id="experience" className="n3-exp">
      <header className="n3-exp__section-entete">
        <p className="n3-plateau__sous">{nightUi.sections.experienceSub}</p>
        <Reveal as="h2" by="word" className="n3-plateau__titre" stagger={60} duration={450}>
          {nightUi.sections.experienceTitle}
        </Reveal>
      </header>

      <ol className="n3-exp__liste" aria-label={dico.constellation}>
        {experiences.map((experience, i) => (
          <Etape
            key={`${experience.title}-${i}`}
            experience={experience}
            indice={i}
            dernier={i === experiences.length - 1}
            linkLabel={nightUi.sections.link}
            mouvementReduit={mouvementReduit}
          />
        ))}
      </ol>
    </section>
  );
};

export default ExperienceNuit3;
