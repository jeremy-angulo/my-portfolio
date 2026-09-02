// src/poc/jour-2/NavChapters.jsx
// Enveloppe la navbar locale et pose `data-chapter` : un point ambre s'allume
// sous le lien de la section traversée. Le lien ne bouge jamais (règle de
// Jérémy : un survol/état ne déplace pas un contrôle) — seule une opacité change.
//
// Le chapitre courant se lit sur des rects (`getBoundingClientRect`) comparés à
// la sonde de viewport partagée : même repère, donc juste sous `zoom: 0.85`.
// Aucun `offsetTop`, aucun `window.innerHeight`.

import React, { useEffect, useState } from "react";
import { subscribeScrollFrame } from "../shared/useScrollRatio";
import { viewportSize } from "../shared/useViewport";

const IDS = ["expertises", "parcours", "contact"];

const NavChapters = ({ children }) => {
  const [chapitre, setChapitre] = useState("");

  useEffect(() => {
    let courant = "";
    const calculer = () => {
      const vh = viewportSize.height || 1;
      // Seuil : une section devient « courante » quand son repère passe au
      // dessus de 55 % de la hauteur d'écran.
      const seuil = vh * 0.55;
      let trouve = "";
      for (const id of IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= seuil) trouve = id;
      }
      if (trouve !== courant) {
        courant = trouve;
        setChapitre(trouve);
      }
    };
    return subscribeScrollFrame(calculer);
  }, []);

  return (
    <div className="j2-nav" data-chapter={chapitre}>
      {children}
    </div>
  );
};

export default NavChapters;
