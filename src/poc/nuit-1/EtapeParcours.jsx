// src/poc/nuit-1/EtapeParcours.jsx
// Une étape du parcours. Le segment violet se trace en `whileInView` : aucune
// mathématique de défilement, donc rien à corriger sous `body { zoom: 0.85 }`
// — c'est la greffe qui remplace le rail piloté par `useScroll`.
// Quand le segment a fini de se tracer, le nœud s'allume, une fois pour toutes.

import React, { useState } from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../shared/useReducedMotion";
import CarteLumiere from "./CarteLumiere";
import { rise, segmentTrace } from "./motion";

const EtapeParcours = ({ etape, dernier, libelleLien }) => {
  const reduit = useReducedMotion();
  const [allume, setAllume] = useState(reduit);

  return (
    <li className="nuit1-parcours__etape">
      <p className="nuit1-parcours__date">{etape.date}</p>

      <div className="nuit1-parcours__rail" aria-hidden="true">
        <motion.span
          className={`nuit1-parcours__segment${dernier ? " nuit1-parcours__segment--dernier" : ""}`}
          variants={segmentTrace(reduit)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          onAnimationComplete={() => setAllume(true)}
        />
        <span
          className={`nuit1-parcours__noeud${allume ? " nuit1-parcours__noeud--allume" : ""}`}
          style={{ background: etape.iconBg }}
        >
          <img src={etape.icon} alt="" loading="lazy" decoding="async" />
        </span>
      </div>

      <CarteLumiere
        className="nuit1-parcours__carte"
        variante="compacte"
        levee={false}
        variants={rise(reduit, { y: 20, duration: 500 })}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h3 className="nuit1-parcours__titre">{etape.title}</h3>
        <p className="nuit1-parcours__entreprise">{etape.company_name}</p>

        <ul className="nuit1-parcours__points">
          {etape.points.map((point) => (
            <li key={point} className="nuit1-parcours__point">
              {point}
            </li>
          ))}
        </ul>

        {/* Le lien n'est rendu que s'il existe : plus d'ancre « LINK » vide. */}
        {etape.link && (
          <a
            className="nuit1-parcours__lien"
            href={etape.link}
            target="_blank"
            rel="noreferrer"
          >
            {libelleLien}
          </a>
        )}
      </CarteLumiere>
    </li>
  );
};

export default EtapeParcours;
