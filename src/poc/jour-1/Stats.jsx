// src/poc/jour-1/Stats.jsx
// Bandeau des chiffres clés : même bleu ciel, même grille, mêmes chaînes que
// ProStats. Les nombres comptent jusqu'à leur valeur, les filets qui séparent
// les colonnes se tracent du haut vers le bas, et les deux bords du bandeau
// s'ouvrent depuis le centre.
//
// Le compte n'invente aucun format : la valeur d'origine est découpée en
// préfixe / entier / suffixe (« 80 k€ », « €80k », « 150+ », « 3 »), seul
// l'entier est animé, et dès le compte terminé on rend la CHAÎNE EXACTE des
// constants — aucune reformatation.

import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { useProContent } from "../../i18n/useContent";
import useCountUp from "../shared/useCountUp";

const DECOUPE = /^([^\d]*)(\d+)(.*)$/;

const Stat = ({ stat, index, vu }) => {
  const m = DECOUPE.exec(String(stat.value));
  const prefixe = m ? m[1] : "";
  const chiffres = m ? m[2] : "";
  const suffixe = m ? m[3] : "";
  const cible = m ? parseInt(chiffres, 10) : 0;

  // Les petits nombres comptent plus vite : « 3 » n'a pas besoin de 1,3 s.
  const duree = cible < 10 ? 600 : 1300;
  const compte = useCountUp(cible, { duration: duree, delay: index * 120, enabled: vu });
  const fini = !m || compte >= cible;

  return (
    <div className="pro-stat j1-stat" style={{ "--j1-delai": `${index * 120}ms` }}>
      {index > 0 && (
        <span
          className="j1-rule j1-rule--v"
          aria-hidden="true"
          style={{ "--j1-delai": `${index * 100}ms` }}
        />
      )}
      <p className="pro-stat__value j1-value">
        {fini ? (
          stat.value
        ) : (
          <>
            <span>{prefixe}</span>
            <span className="j1-count" style={{ minWidth: `${chiffres.length}ch` }}>
              {compte}
            </span>
            <span>{suffixe}</span>
          </>
        )}
      </p>
      <p className="pro-stat__label j1-label">{stat.label}</p>
    </div>
  );
};

const Stats = ({ statique = false }) => {
  const { proStats, proUi } = useProContent();
  const bandeau = useRef(null);
  const rangee = useRef(null);

  // Deux seuils : les bords du bandeau s'ouvrent tôt (25 %), les chiffres ne
  // partent que lorsqu'on les regarde vraiment (50 %).
  const bandeauVu = useInView(bandeau, { once: true, amount: 0.25 });
  const rangeeVue = useInView(rangee, { once: true, amount: 0.5 });
  const borde = statique || bandeauVu;
  const compte = statique || rangeeVue;

  return (
    <section
      ref={bandeau}
      className={`pro-stats j1-stats${borde ? " is-lined" : ""}`}
      aria-label={proUi.statsLabel}
    >
      <span className="j1-rule j1-rule--h j1-rule--haut" aria-hidden="true" />
      <div
        ref={rangee}
        className={`pro-container pro-stats__row j1-stats__row${compte ? " is-in" : ""}`}
      >
        {proStats.map((stat, i) => (
          <Stat key={stat.label} stat={stat} index={i} vu={compte} />
        ))}
      </div>
      <span className="j1-rule j1-rule--h j1-rule--bas" aria-hidden="true" />
    </section>
  );
};

export default Stats;
