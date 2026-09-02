// src/poc/jour-1/DrawnTimeline.jsx
// La colonne du parcours se dessine : la ligne descend en 1,4 s, et chaque
// étape s'allume au moment précis où la pointe la traverse.
//
// La position de chaque étape est mesurée AU DÉCLENCHEMENT (police déjà
// chargée) en ratio `offsetTop / clientHeight` : deux grandeurs du même
// repère, donc insensible au `body { zoom: 0.85 }` — on ne mélange jamais
// `offsetTop` avec un rect ou un `scrollY`. Ce ratio devient le
// `transition-delay` de la pastille et de son texte : tout est ensuite en CSS,
// sans re-render.

import React, { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const DUREE_LIGNE = 1400;

const DrawnTimeline = ({ etapes, statique = false }) => {
  const colonne = useRef(null);
  const vu = useInView(colonne, { once: true, amount: 0.25 });
  const actif = statique || vu;
  const [retards, setRetards] = useState(null);

  useEffect(() => {
    if (!actif || retards) return;
    const noeud = colonne.current;
    if (!noeud) return;
    const hauteur = noeud.clientHeight || 1;
    // +13 px : le centre de la pastille (14 px de haut, posée à 6 px du haut
    // de l'étape), toujours dans le repère non zoomé des offsets.
    const mesures = Array.from(noeud.querySelectorAll(".pro-timeline__item")).map((item) =>
      Math.max(0, Math.min(1, (item.offsetTop + 13) / hauteur))
    );
    setRetards(mesures);
  }, [actif, retards]);

  // `.is-drawn` n'est posée qu'une fois les retards connus : sinon les
  // transitions partiraient toutes ensemble, et changer un transition-delay
  // en cours de route ne les rattraperait pas.
  const dessine = actif && retards !== null;

  return (
    <div ref={colonne} className={`pro-timeline j1-timeline${dessine ? " is-drawn" : ""}`}>
      <div className="j1-timeline__line" aria-hidden="true" />

      {etapes.map((step, i) => (
        <div
          key={step.title}
          className="pro-timeline__item"
          style={{ "--j1-delai": `${Math.round((retards?.[i] ?? 0) * DUREE_LIGNE)}ms` }}
        >
          <p className="pro-timeline__date">{step.date}</p>
          <h3 className="pro-timeline__title">{step.title}</h3>
          <p className="pro-timeline__company">
            <img src={step.icon} alt="" aria-hidden="true" />
            {step.company}
          </p>
          <p className="pro-timeline__text">{step.text}</p>
        </div>
      ))}
    </div>
  );
};

export default DrawnTimeline;
