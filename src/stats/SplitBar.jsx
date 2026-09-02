// src/stats/SplitBar.jsx — barre à deux segments pour les répartitions
// binaires (Langue fr/en, Bascule jour ↔ nuit) : ambre puis encre, jamais de
// troisième couleur. À partir de trois lignes, la barre n'est plus lisible :
// on repasse sur le classement.

import { nf } from "./format";
import RankList from "./RankList";
import Empty from "./Empty";

/**
 * @param {{ rows: Array<{label: string, pageviews: number}> }} props
 */
const SplitBar = ({ rows: allRows }) => {
  const rows = (Array.isArray(allRows) ? allRows : []).filter((row) => (row.pageviews ?? 0) > 0);

  if (!rows.length) return <Empty />;
  if (rows.length >= 3) return <RankList rows={rows} />;

  const sum = rows.reduce((acc, row) => acc + (row.pageviews ?? 0), 0);
  const part = (value) => Math.round((value / sum) * 100);

  return (
    <div className="split">
      {/* La légende porte déjà les valeurs : la barre est décorative. */}
      <div className="split__bar" aria-hidden="true">
        {rows.map((row, index) => (
          <span
            className="split__seg"
            key={`${row.label}-${index}`}
            // flex-grow proportionnel : la gouttière de 2 px reste hors calcul
            // et les deux segments couvrent exactement la barre.
            style={{ flexGrow: row.pageviews ?? 0 }}
          />
        ))}
      </div>
      <ul className="split__legend">
        {rows.map((row, index) => {
          const value = row.pageviews ?? 0;
          return (
            <li className="split__item" key={`${row.label}-${index}`}>
              <span className="split__name">
                <span className="split__dot" aria-hidden="true" />
                <span className="split__label" title={row.label}>
                  {row.label}
                </span>
              </span>
              <span className="split__figures">
                <span className="split__value">{nf.format(value)}</span>
                <span className="split__part">{part(value)}&nbsp;%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SplitBar;
