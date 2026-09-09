// src/night/NightJourneyStep.jsx
// Une étape du parcours. Le segment violet se trace en `whileInView` : aucune
// mathématique de défilement, donc rien à corriger sous `body { zoom: 0.85 }`
// — c'est la greffe qui remplace le rail piloté par `useScroll`.
// Quand le segment a fini de se tracer, le nœud s'allume, une fois pour toutes.

import React, { useState } from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";
import NightCard from "./NightCard";
import { rise, segmentTrace } from "./nightMotion";

const NightJourneyStep = ({ etape, dernier, libelleLien }) => {
  const reduit = useReducedMotion();
  const [allume, setAllume] = useState(reduit);

  return (
    <li className="night-parcours__etape">
      <p className="night-parcours__date">{etape.date}</p>

      <div className="night-parcours__rail" aria-hidden="true">
        <motion.span
          className={`night-parcours__segment${dernier ? " night-parcours__segment--dernier" : ""}`}
          variants={segmentTrace(reduit)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          onAnimationComplete={() => setAllume(true)}
        />
        <span
          className={`night-parcours__noeud${allume ? " night-parcours__noeud--allume" : ""}`}
          style={{ background: etape.iconBg }}
        >
          <img src={etape.icon} alt="" loading="lazy" decoding="async" />
        </span>
      </div>

      <NightCard
        className="night-parcours__carte"
        variante="compacte"
        levee={false}
        variants={rise(reduit, { y: 20, duration: 500 })}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h3 className="night-parcours__titre">{etape.title}</h3>
        <p className="night-parcours__entreprise">{etape.company_name}</p>

        <ul className="night-parcours__points">
          {etape.points.map((point) => (
            <li key={point} className="night-parcours__point">
              {point}
            </li>
          ))}
        </ul>

        {/* Le lien n'est rendu que s'il existe : plus d'ancre « LINK » vide. */}
        {etape.link && (
          <a
            className="night-parcours__lien"
            href={etape.link}
            target="_blank"
            rel="noreferrer"
          >
            {libelleLien}
          </a>
        )}
      </NightCard>
    </li>
  );
};

export default NightJourneyStep;
