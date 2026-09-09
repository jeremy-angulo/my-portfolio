// src/night/NightAwards.jsx
// Section « NightAwards » : une liste numérotée 01 → 05, révélée ligne à
// ligne. Plus de bandeau de 150–200 px, plus de cartes : du texte, un numéro,
// un filet. Le survol n'allume qu'un projecteur très doux sur la ligne visée.

import React, { useRef } from "react";
import Reveal from "../components/Reveal";
import usePointerVars from "../hooks/usePointerVars";
import NightSectionHead from "./NightSectionHead";
import { useDict } from "./nightLabels";

const Ligne = ({ index, titre }) => {
  const noeud = useRef(null);
  // Projecteur rectangulaire : la ligne survolée, et elle seule.
  usePointerVars(noeud, { rest: { x: 50, y: 50 } });

  return (
    <li ref={noeud} className="night-distinctions__item">
      <span className="night-distinctions__num" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Reveal
        as="span"
        className="night-distinctions__texte"
        by="line"
        y={12}
        duration={420}
        stagger={90}
        delay={index * 90}
      >
        {titre}
      </Reveal>
    </li>
  );
};

const NightAwards = ({ achievements, sections }) => {
  const dict = useDict();

  return (
    <section id="achievement" className="night-section night-distinctions">
      <div className="night-container">
        <NightSectionHead sub={sections.achievementSub} title={sections.achievementTitle} />

        <ol className="night-distinctions__liste" aria-label={dict.distinctions}>
          {achievements.map((item, i) => (
            <Ligne key={item.title} index={i} titre={item.title} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default NightAwards;
