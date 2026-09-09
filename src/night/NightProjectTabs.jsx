// src/night/NightProjectTabs.jsx
// Contrôle segmenté des catégories de projets. Le soulignement se déplace par
// `layoutId` — au CLIC uniquement : le survol ne fait changer que la couleur,
// conformément à la règle « un survol ne déplace jamais un contrôle ».
// Sur mobile, c'est le rail qui défile dans son propre conteneur, jamais la page.

import React from "react";
import { LayoutGroup, motion } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import { useDict } from "./nightLabels";

const NightProjectTabs = ({ list, selected, onSelect }) => {
  const reduit = useReducedMotion();
  const dict = useDict();

  return (
    <div className="night-onglets">
      <LayoutGroup id="night-onglets">
        <div className="night-onglets__rail" role="tablist" aria-label={dict.onglets}>
          {list.map((item) => {
            const actif = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`night-onglet-${item.id}`}
                aria-selected={actif}
                aria-controls="night-grille-projets"
                className={`night-onglets__btn${actif ? " night-onglets__btn--actif" : ""}`}
                onClick={() => onSelect(item.id)}
              >
                {item.title}
                {actif && (
                  <motion.span
                    className="night-onglets__souligne"
                    layoutId={reduit ? undefined : "night-onglet-souligne"}
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

export default NightProjectTabs;
