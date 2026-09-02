// src/stats/KpiTiles.jsx — les trois chiffres de tête, dans deux tuiles
// blanches à hauteur fixée (150 px) pour que la tuile courbe voisine ne
// s'étire jamais : « Pages vues » + variation, puis « Moyenne / jour » et
// « Meilleur jour ».

import React from "react";
import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { Tile } from "./Bento";
import { comparisonLabel, nf, peakDay, weekdayShort } from "./format";

const NBSP = " ";

// « 12,4 % » ; la variation nulle s'écrit « 0 % », sans décimale inutile.
const formatPercent = (value) =>
  value === 0 ? `0${NBSP}%` : `${Math.abs(value).toFixed(1).replace(".", ",")}${NBSP}%`;

// Le sens (hausse / baisse / stable) se lit sur la valeur ARRONDIE à une
// décimale : une variation qui s'affiche « 0 % » n'est ni verte ni rouge.
const Delta = ({ changePercent }) => {
  if (changePercent == null) return null;
  const rounded = Math.round(changePercent * 10) / 10;
  const direction = rounded > 0 ? "is-up" : rounded < 0 ? "is-down" : "is-flat";
  return (
    <span
      className={`kpi__delta ${direction}`}
      title="Par rapport à la période équivalente précédente"
    >
      {rounded > 0 ? <FiTrendingUp aria-hidden="true" /> : null}
      {rounded < 0 ? <FiTrendingDown aria-hidden="true" /> : null}
      {formatPercent(rounded)}
    </span>
  );
};

// T-PagesVues : libellé en tête, grand chiffre + pastille, note de comparaison.
export const HeroKpi = ({ totals, days, className }) => {
  const changePercent = totals?.changePercent ?? null;
  return (
    <Tile
      className={`tile--hero${className ? ` ${className}` : ""}`}
      title={<span className="kpi__label">Pages vues</span>}
      bodyKey={days}
    >
      <div className="kpi">
        <div className="kpi__row">
          <span className="kpi__value">{totals ? nf.format(totals.pageviews ?? 0) : "—"}</span>
          <Delta changePercent={changePercent} />
        </div>
        <p className="kpi__note">
          {changePercent != null ? comparisonLabel(days) : "pas de période de comparaison"}
        </p>
      </div>
    </Tile>
  );
};

// T-Paire : deux cellules côte à côte à toutes les largeurs. La sous-ligne du
// meilleur jour est vide (hauteur réservée) si aucun point n'égale le pic.
export const KpiPair = ({ totals, series, days, className }) => {
  const peak = totals ? peakDay(series, totals.peak) : null;
  const peakDate = peak ? new Date(`${peak.day}T00:00:00`) : null;
  const peakLabel =
    peakDate && !Number.isNaN(peakDate.getTime()) ? weekdayShort.format(peakDate) : "";

  return (
    <Tile className={`tile--pair${className ? ` ${className}` : ""}`} bodyKey={days}>
      <dl className="kpi-pair">
        <div className="kpi-pair__cell">
          <dt className="kpi-pair__label">Moyenne / jour</dt>
          <dd className="kpi-pair__value">{totals ? nf.format(totals.average ?? 0) : "—"}</dd>
          <dd className="kpi-pair__sub">sur {days} jours</dd>
        </div>
        <div className="kpi-pair__cell">
          <dt className="kpi-pair__label">Meilleur jour</dt>
          <dd className="kpi-pair__value">{totals ? nf.format(totals.peak ?? 0) : "—"}</dd>
          <dd className="kpi-pair__sub" title={peakLabel || undefined}>
            {peakLabel}
          </dd>
        </div>
      </dl>
    </Tile>
  );
};
