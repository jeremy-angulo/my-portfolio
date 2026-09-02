// src/stats/ColumnChart.jsx — mini-colonnes ordonnées pour les buckets
// (profondeur de lecture, temps passé par page).
//
// ordre = ordre serveur, buckets ordonnés : ce composant ne trie JAMAIS.
// « 25 % 50 % 75 % 100 % » et « < 10 s … 5 min et + » restent dans l'ordre
// reçu quel que soit le volume de chaque tranche.

import { nf } from "./format";
import Empty from "./Empty";

const DEFAULT_HEIGHT = 120;
const NBSP = " ";

// Affichage seul (le libellé serveur reste la clé et l'ordre) : on soude le
// « + » final et l'unité à son nombre, pour éviter un « + » orphelin sur sa
// ligne quand « 5 min et + » passe sur deux lignes dans une tuile étroite.
const displayLabel = (label) =>
  String(label ?? "")
    .replace(/ \+$/, `${NBSP}+`)
    .replace(/(\d) (min|s)\b/g, `$1${NBSP}$2`);

/**
 * @param {{ rows: Array<{label: string, pageviews: number}>, height?: number, foot?: import("react").ReactNode }} props
 *   height — hauteur de la zone de tracé en px. La valeur par défaut est
 *   laissée au CSS (120 px, 100 px ≤ 600 px) ; une valeur explicite l'emporte.
 */
const ColumnChart = ({ rows, height = DEFAULT_HEIGHT, foot }) => {
  const list = Array.isArray(rows) ? rows : [];
  const max = list.reduce((acc, row) => Math.max(acc, row.pageviews ?? 0), 0);

  // Tous à zéro (ou aucune tranche) : même phrase vide que les classements.
  if (!list.length || max <= 0) return <Empty />;

  // Une seule colonne accentuée en cas d'égalité : la première (même règle
  // que peakDay pour le meilleur jour).
  const maxIndex = list.findIndex((row) => (row.pageviews ?? 0) === max);

  const style = { "--colchart-n": list.length };
  if (height !== DEFAULT_HEIGHT) style["--colchart-height"] = `${height}px`;

  return (
    <>
      <div className="colchart" style={style}>
        {list.map((row, index) => {
          const value = row.pageviews ?? 0;
          return (
            <div
              className="colchart__col"
              key={`${row.label}-${index}`}
              title={`${nf.format(value)} évènement${value > 1 ? "s" : ""}`}
            >
              <span className="colchart__count">{nf.format(value)}</span>
              <span
                className={`colchart__bar${index === maxIndex ? " is-max" : ""}`}
                aria-hidden="true"
                style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? 3 : 0 }}
              />
              <span className="colchart__label">{displayLabel(row.label)}</span>
            </div>
          );
        })}
      </div>
      {foot ? <p className="tile__foot">{foot}</p> : null}
    </>
  );
};

export default ColumnChart;
