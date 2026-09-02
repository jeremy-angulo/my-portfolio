// src/stats/StatsToolbar.jsx — barre d'outils collante sous la navbar :
// ancres de groupe, plage + heure de chargement, sélecteur de période,
// emplacement fixe du mini-spinner, Rafraîchir et filet de progression.
// Elle s'affiche aussi pendant le squelette initial (`data` peut être null).

import { useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { formatRange, loadingLabel, timeHM } from "./format";
import PeriodSwitch from "./PeriodSwitch";
import useScrollSpy from "./useScrollSpy";

const ANCHORS = [
  { id: "audience", label: "Audience" },
  { id: "lecture", label: "Lecture" },
  { id: "monde3d", label: "Monde 3D" },
];

const StatsToolbar = ({
  days,
  onChange,
  onRefresh,
  busy,
  switching,
  loadingDays,
  data,
  loadedAt,
  showRange = true,
}) => {
  const ref = useRef(null);
  const { activeId, stuck, scrollTo } = useScrollSpy(
    ANCHORS.map((anchor) => anchor.id),
    ref
  );
  // `loadingDays` (période dont la requête est attendue à l'écran) pilote
  // l'état de chargement quand le hook le fournit : une bascule vers une
  // période en cache pendant qu'une autre charge revient au repos, et le
  // libellé nomme la période réellement en route. Repli sur busy/switching.
  const loading = loadingDays !== undefined ? loadingDays != null : Boolean(switching || busy);
  const loadingFor = loadingDays ?? days;

  // Plage affichée : celle des chiffres à l'écran (data.range), pas celle
  // demandée — après un échec de bascule, l'écart reste visible.
  let rangeText = null;
  if (loading) {
    rangeText = loadingLabel(loadingFor);
  } else {
    const range = formatRange(data?.range);
    if (range) rangeText = loadedAt ? `${range} · chargé à ${timeHM.format(loadedAt)}` : range;
  }

  const handleAnchor = (event, id) => {
    event.preventDefault();
    scrollTo(id);
  };

  return (
    <div ref={ref} className={`stats-toolbar${stuck ? " is-stuck" : ""}`}>
      <div className="stats-toolbar__inner pro-container">
        <nav className="stats-toolbar__anchors" aria-label="Groupes du tableau de bord">
          {ANCHORS.map((anchor) => (
            <a
              key={anchor.id}
              href={`#${anchor.id}`}
              className={`stats-toolbar__anchor${activeId === anchor.id ? " is-active" : ""}`}
              aria-current={activeId === anchor.id ? "true" : undefined}
              onClick={(event) => handleAnchor(event, anchor.id)}
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        <div className="stats-toolbar__controls">
          {showRange && rangeText ? (
            <span className="stats-toolbar__range">{rangeText}</span>
          ) : null}

          <PeriodSwitch days={days} onChange={onChange} />

          <span className="stats-toolbar__slot" aria-hidden="true">
            {loading && switching ? <FiRefreshCw className="stats-toolbar__spinner" /> : null}
          </span>

          {/* Inactif aussi pendant une bascule : un second appel identique
              relancerait les 7 requêtes GoatCounter côté serveur. */}
          <button
            type="button"
            className={`stats-refresh${loading && busy ? " is-busy" : ""}`}
            onClick={onRefresh}
            disabled={loading}
            aria-label="Rafraîchir"
            title="Recharger la période affichée"
          >
            <FiRefreshCw aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? <div className="stats-toolbar__progress" aria-hidden="true" /> : null}
    </div>
  );
};

export default StatsToolbar;
