// src/stats/PeriodSwitch.jsx — sélecteur de période de la barre d'outils.
// Quatre <button> (pas de role="radio" : le harnais clique par nom accessible)
// aux libellés complets à toutes les largeurs, jamais désactivés : la file
// d'appels et activeDaysRef honorent toujours le dernier clic.

import { RANGES } from "./format";

const PeriodSwitch = ({ days, onChange }) => (
  <div
    className="stats-seg"
    role="group"
    aria-label="Période affichée sur tout le tableau de bord"
  >
    {RANGES.map((range) => {
      const active = range.days === days;
      return (
        <button
          key={range.days}
          type="button"
          className={active ? "is-active" : undefined}
          aria-pressed={active}
          onClick={() => onChange(range.days)}
        >
          {range.label}
        </button>
      );
    })}
  </div>
);

export default PeriodSwitch;
