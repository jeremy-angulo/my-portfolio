// src/poc/nuit-3/SuccesNuit3.jsx
// Distinctions : une simple liste, révélée ligne à ligne, sur un plateau à
// hauteur automatique. La puce ✦ prolonge le vocabulaire du ciel.

import React from "react";
import { useNightContent } from "../../i18n/useContent";
import Plateau from "./Plateau";
import Reveal from "../shared/Reveal";

const SuccesNuit3 = () => {
  const { achievements, nightUi } = useNightContent();

  return (
    <Plateau
      id="achievement"
      sous={nightUi.sections.achievementSub}
      titre={nightUi.sections.achievementTitle}
    >
      <ul className="n3-succes">
        {achievements.map((succes, i) => (
          <li key={succes.id || i}>
            <span className="n3-succes__puce" aria-hidden="true">
              ✦
            </span>
            <Reveal as="span" by="line" delay={i * 40} duration={480}>
              {succes.title}
            </Reveal>
          </li>
        ))}
      </ul>
    </Plateau>
  );
};

export default SuccesNuit3;
