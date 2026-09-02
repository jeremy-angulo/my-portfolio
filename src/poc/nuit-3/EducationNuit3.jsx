// src/poc/nuit-3/EducationNuit3.jsx
// Formation : trois cartes lunaires à hauteur automatique dans une grille
// auto-fit. Fin du bandeau `bg-tertiary` de hauteur fixe et du défilement
// horizontal mobile de la version actuelle ; contenu `educations` inchangé.

import React from "react";
import { motion, useInView } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import Plateau from "./Plateau";
import CarteLunaire from "./CarteLunaire";
import useReducedMotion from "../shared/useReducedMotion";

const EducationNuit3 = () => {
  const { educations, nightUi } = useNightContent();
  const grille = React.useRef(null);
  const vu = useInView(grille, { once: true, amount: 0.15 });
  const mouvementReduit = useReducedMotion();

  return (
    <Plateau
      id="education"
      sous={nightUi.sections.educationSub}
      titre={nightUi.sections.educationTitle}
    >
      <div className="n3-grille n3-grille--formation" ref={grille}>
        {educations.map((formation, i) => (
          <motion.div
            key={`${formation.name}-${i}`}
            initial={mouvementReduit ? false : { opacity: 0, y: 22 }}
            animate={
              mouvementReduit || vu
                ? { opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" } }
                : { opacity: 0, y: 22 }
            }
          >
            <CarteLunaire className="n3-formation">
              <img className="n3-formation__logo" src={formation.image} alt="" aria-hidden="true" />
              <p className="n3-formation__nom blue-text-gradient">{formation.name}</p>
              <p className="n3-formation__annee">{formation.year}</p>
              <p className="n3-formation__diplome">{formation.degree}</p>
              <p className="n3-formation__filiere pink-text-gradient">{formation.branch}</p>
              <p className="n3-formation__mention green-text-gradient">{formation.marks}</p>
            </CarteLunaire>
          </motion.div>
        ))}
      </div>
    </Plateau>
  );
};

export default EducationNuit3;
