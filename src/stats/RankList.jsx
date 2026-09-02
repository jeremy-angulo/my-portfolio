// src/stats/RankList.jsx — classement à remplissage derrière le libellé :
// une ligne de 30 px par catégorie, un remplissage ambre pâle proportionnel
// au max des lignes affichées, la valeur et la part. L'unité n'est jamais
// répétée ici : elle est portée une fois par le libellé de groupe.

import { useState } from "react";
import { nf } from "./format";
import Empty from "./Empty";

/**
 * @param {{ rows: Array<{label: string, pageviews: number, title?: string}>, max?: number }} props
 */
const RankList = ({ rows: allRows, max = 8 }) => {
  // État local : réinitialisé par le `key={days}` du corps de tuile.
  const [expanded, setExpanded] = useState(false);

  // GoatCounter renvoie certaines catégories même à zéro (les tailles d'écran
  // notamment) : des lignes « 0 · 0 % » n'apprennent rien, on les tait.
  // Tri décroissant stable : le serveur trie déjà, on garantit le contrat.
  const rows = (Array.isArray(allRows) ? allRows : [])
    .filter((row) => (row.pageviews ?? 0) > 0)
    .sort((a, b) => (b.pageviews ?? 0) - (a.pageviews ?? 0));

  if (!rows.length) return <Empty />;

  // Les parts se calculent sur TOUTES les lignes > 0, pas seulement les
  // visibles : « Tout afficher » ne change aucun pourcentage.
  const sum = rows.reduce((acc, row) => acc + (row.pageviews ?? 0), 0);
  const visible = expanded ? rows : rows.slice(0, max);
  // Le remplissage, lui, est relatif au max des lignes affichées.
  const top = Math.max(...visible.map((row) => row.pageviews ?? 0), 1);

  return (
    <>
      <ul className="rank">
        {visible.map((row, index) => {
          const value = row.pageviews ?? 0;
          // Arrondi sur la somme totale ; « < 1 % » plutôt qu'un « 0 % » à
          // côté d'une valeur non nulle.
          const part = Math.round((value / sum) * 100);
          const partLabel = part === 0 && value > 0 ? "< 1" : String(part);
          return (
            <li className="rank__row" key={`${row.label}-${index}`}>
              <span
                className="rank__fill"
                aria-hidden="true"
                style={{ width: `${(value / top) * 100}%` }}
              />
              <span className="rank__label" title={row.title ?? row.label}>
                {row.label}
              </span>
              <span className="rank__value">{nf.format(value)}</span>
              <span className="rank__part">{partLabel}&nbsp;%</span>
            </li>
          );
        })}
      </ul>
      {rows.length > max ? (
        <button
          type="button"
          className="rank__more"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Réduire" : `Tout afficher (${rows.length})`}
        </button>
      ) : null}
    </>
  );
};

export default RankList;
