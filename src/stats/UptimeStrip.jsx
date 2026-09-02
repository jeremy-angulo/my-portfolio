// src/stats/UptimeStrip.jsx — statut Better Stack en bandeau de 44 px sous
// le bloc de tête. Trois chiffres n'ont pas besoin d'une carte : le statut se
// lit en premier, et le bandeau n'est pas monté du tout si `data.uptime`
// manque (variables BETTERSTACK_* absentes côté Vercel).

import React from "react";

const NBSP = " ";
const SOURCE = "Better Stack · contrôle toutes les 3 min";

const STATUS = {
  up: { className: "is-up", label: "En ligne" },
  down: { className: "is-down", label: "Interruption en cours" },
  unknown: { className: "is-unknown", label: "Statut inconnu" },
};

const incidentsLabel = (incidents) => {
  if (incidents == null) return null;
  if (incidents === 0) return "aucune interruption";
  return `${incidents} interruption${incidents > 1 ? "s" : ""}`;
};

const UptimeStrip = ({ uptime }) => {
  if (!uptime) return null;
  const status = STATUS[uptime.status] ?? STATUS.unknown;
  const availability =
    uptime.availability != null
      ? `${uptime.availability.toFixed(2).replace(".", ",")}${NBSP}% de disponibilité`
      : "—";
  const incidents = incidentsLabel(uptime.incidents);

  return (
    <div className="uptime-strip span-12" title={SOURCE}>
      <span className="uptime-strip__state">
        <span className={`uptime-strip__dot ${status.className}`} aria-hidden="true" />
        <span className="uptime-strip__status">{status.label}</span>
      </span>
      {/* Chaque séparateur est soudé à ce qu'il introduit : à la ligne, le
          « · » part avec son élément, jamais seul en fin de ligne. */}
      <span className="uptime-strip__item">
        <span className="uptime-strip__sep" aria-hidden="true">
          ·
        </span>
        <span className="uptime-strip__value">{availability}</span>
      </span>
      {/* Sur mobile, les interruptions font la seconde ligne, sans « · »
          en tête de ligne. */}
      {incidents ? (
        <span className="uptime-strip__item uptime-strip__item--incidents">
          <span className="uptime-strip__sep" aria-hidden="true">
            ·
          </span>
          <span className="uptime-strip__incidents">{incidents}</span>
        </span>
      ) : null}
      <span className="uptime-strip__source">{SOURCE}</span>
    </div>
  );
};

export default UptimeStrip;
