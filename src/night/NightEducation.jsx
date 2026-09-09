// src/night/NightEducation.jsx
// Section « Formation » : trois cartes posées sur la surface de la page, sans
// bandeau de fond. La hiérarchie se fait à la taille et à la teinte, jamais
// par un dégradé de texte. Textes `educations` inchangés.

import React from "react";
import NightSectionHead from "./NightSectionHead";
import NightCard from "./NightCard";
import useReducedMotion from "../hooks/useReducedMotion";
import { rise, vuUneFois } from "./nightMotion";
import { useDict } from "./nightLabels";

const NightEducation = ({ educations, sections }) => {
  const reduit = useReducedMotion();
  const dict = useDict();
  const variants = rise(reduit, { y: 24, duration: 600, stagger: 90, delay: 300 });

  return (
    <section id="education" className="night-section night-formation">
      <div className="night-container">
        <NightSectionHead sub={sections.educationSub} title={sections.educationTitle} />

        <div className="night-formation__grille" role="list" aria-label={dict.formations}>
          {educations.map((formation, i) => (
            <NightCard
              key={formation.degree}
              role="listitem"
              variante="pleine"
              variants={variants}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={vuUneFois}
            >
              <span className="night-formation__logo" aria-hidden="true">
                <img src={formation.image} alt="" loading="lazy" decoding="async" />
              </span>
              <p className="night-formation__ecole">{formation.name}</p>
              <p className="night-formation__annee">{formation.year}</p>
              <p className="night-formation__diplome">{formation.degree}</p>
              <p className="night-formation__filiere">{formation.branch}</p>
              <p className="night-formation__gpa">{formation.marks}</p>
            </NightCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NightEducation;
