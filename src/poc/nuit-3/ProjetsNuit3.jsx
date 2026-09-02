// src/poc/nuit-3/ProjetsNuit3.jsx
// Projets : mêmes onglets, mêmes quatre jeux de données, même clé de session
// (`activeProjectTab`). L'onglet actif est souligné par un trait violet qui
// glisse — au clic seulement : un survol ne déplace jamais un contrôle.

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import Plateau from "./Plateau";
import CarteProjet from "./CarteProjet";
import useReducedMotion from "../shared/useReducedMotion";

const ProjetsNuit3 = () => {
  const {
    list,
    entrepreneurshipProjects,
    aiAndDeepTechProjects,
    itConsultingProjects,
    leadershipAndInitiativesProjects,
    nightUi,
  } = useNightContent();

  const mouvementReduit = useReducedMotion();
  const [choisi, setChoisi] = useState(
    () => sessionStorage.getItem("activeProjectTab") || "entrepreneurship"
  );

  // Dérivé plutôt que stocké : les données changent aussi avec la langue.
  const jeux = {
    entrepreneurship: entrepreneurshipProjects,
    ai_deep_tech: aiAndDeepTechProjects,
    it_consulting: itConsultingProjects,
    leadership_initiatives: leadershipAndInitiativesProjects,
  };
  const donnees = jeux[choisi] || aiAndDeepTechProjects;

  const choisir = (id) => {
    setChoisi(id);
    try {
      sessionStorage.setItem("activeProjectTab", id);
    } catch {
      /* navigation privée : l'onglet n'est simplement pas mémorisé */
    }
  };

  return (
    <Plateau
      id="project"
      sous={nightUi.sections.projectsSub}
      titre={nightUi.sections.projectsTitle}
    >
      <div className="n3-onglets" role="tablist" aria-label={nightUi.sections.projectsTitle}>
        <div className="n3-onglets__rail">
          {list.map((item) => {
            const actif = choisi === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={actif}
                className={`n3-onglet ${actif ? "is-actif" : ""}`}
                onClick={() => choisir(item.id)}
              >
                {item.title}
                {actif &&
                  (mouvementReduit ? (
                    <span className="n3-onglet__trait" />
                  ) : (
                    <motion.span
                      layoutId="n3-onglet-trait"
                      className="n3-onglet__trait"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  ))}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={choisi}
          className="n3-grille n3-grille--projets"
          initial={mouvementReduit ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={mouvementReduit ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
        >
          {donnees.map((projet, i) => (
            <motion.div
              key={`${projet.name}-${i}`}
              initial={mouvementReduit ? false : { opacity: 0, y: 22 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: i * 0.06, ease: "easeOut" },
              }}
            >
              <CarteProjet {...projet} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Plateau>
  );
};

export default ProjetsNuit3;
