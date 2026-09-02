// src/poc/nuit-1/OngletsProjets.jsx
// Contrôle segmenté des catégories de projets. Le soulignement se déplace par
// `layoutId` — au CLIC uniquement : le survol ne fait changer que la couleur,
// conformément à la règle « un survol ne déplace jamais un contrôle ».
// Sur mobile, c'est le rail qui défile dans son propre conteneur, jamais la page.

import React from "react";
import { LayoutGroup, motion } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";
import { useDict } from "./dictionnaire";

const OngletsProjets = ({ list, selected, onSelect }) => {
  const reduit = useReducedMotion();
  const dict = useDict();

  return (
    <div className="nuit1-onglets">
      <LayoutGroup id="nuit1-onglets">
        <div className="nuit1-onglets__rail" role="tablist" aria-label={dict.onglets}>
          {list.map((item) => {
            const actif = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`nuit1-onglet-${item.id}`}
                aria-selected={actif}
                aria-controls="nuit1-grille-projets"
                className={`nuit1-onglets__btn${actif ? " nuit1-onglets__btn--actif" : ""}`}
                onClick={() => onSelect(item.id)}
              >
                {item.title}
                {actif && (
                  <motion.span
                    className="nuit1-onglets__souligne"
                    layoutId={reduit ? undefined : "nuit1-onglet-souligne"}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
};

export default OngletsProjets;
