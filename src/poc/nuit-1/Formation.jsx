// src/poc/nuit-1/Formation.jsx
// Section « Formation ». Plus de bandeau `bg-black-100` ni de `<p>` vide de
// 48 px : trois cartes sur la surface de la page. Les dégradés texte
// bleu/rose/vert du template disparaissent — la hiérarchie se fait à la taille
// et à la teinte. Textes `educations` inchangés.

import React from "react";
import EnteteSection from "./EnteteSection";
import CarteLumiere from "./CarteLumiere";
import useReducedMotion from "../shared/useReducedMotion";
import { rise, vuUneFois } from "./motion";
import { useDict } from "./dictionnaire";

const Formation = ({ educations, sections }) => {
  const reduit = useReducedMotion();
  const dict = useDict();
  const variants = rise(reduit, { y: 24, duration: 600, stagger: 90, delay: 300 });

  return (
    <section id="education" className="nuit1-section nuit1-formation">
      <div className="nuit1-container">
        <EnteteSection sub={sections.educationSub} title={sections.educationTitle} />

        <div className="nuit1-formation__grille" role="list" aria-label={dict.formations}>
          {educations.map((formation, i) => (
            <CarteLumiere
              key={formation.degree}
              role="listitem"
              variante="pleine"
              variants={variants}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={vuUneFois}
            >
              <span className="nuit1-formation__logo" aria-hidden="true">
                <img src={formation.image} alt="" loading="lazy" decoding="async" />
              </span>
              <p className="nuit1-formation__ecole">{formation.name}</p>
              <p className="nuit1-formation__annee">{formation.year}</p>
              <p className="nuit1-formation__diplome">{formation.degree}</p>
              <p className="nuit1-formation__filiere">{formation.branch}</p>
              <p className="nuit1-formation__gpa">{formation.marks}</p>
            </CarteLumiere>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Formation;
