// src/stats/Bento.jsx — la mosaïque de /statistiques : la grille 12 colonnes
// (`Bento`), la tuile blanche de base (`Tile`) et les libellés de groupe
// (`GroupLabel`) qui portent l'unité une seule fois et servent de cibles aux
// ancres de la barre d'outils. Styles dans _tiles.scss.

import React from "react";

// `ready` pose `data-stats-ready` (le harnais attend cet attribut) ; `busy`
// pose `aria-busy` pendant une bascule ou un rafraîchissement, sans jamais
// estomper ni bloquer le contenu déjà affiché.
export const Bento = ({ ready, busy, children }) => (
  <div
    className="bento"
    data-stats-ready={ready ? "" : undefined}
    aria-busy={busy ? "true" : undefined}
  >
    {children}
  </div>
);

// Tuile : tête (titre, puce, méta), sous-titre optionnel, corps, pied.
// Seul le corps porte `key={bodyKey}` : il est remonté à chaque changement de
// période (fondu `stats-fade`), jamais l'enveloppe, pour ne pas rejouer les
// animations d'entrée ni perdre la position de défilement.
export const Tile = ({ title, chip, meta, foot, subtitle, className, bodyKey, children }) => (
  <section className={`tile${className ? ` ${className}` : ""}`}>
    {title || chip || meta ? (
      <header className="tile__head">
        {title ? <h2 className="tile__title">{title}</h2> : null}
        {chip ? <span className="tile__chip">{chip}</span> : null}
        {meta ? <span className="tile__meta">{meta}</span> : null}
      </header>
    ) : null}
    {subtitle ? <p className="tile__subtitle">{subtitle}</p> : null}
    <div className="tile__body" key={bodyKey}>
      {children}
    </div>
    {foot ? <p className="tile__foot">{foot}</p> : null}
  </section>
);

// « AUDIENCE · pages vues » : l'unité n'est dite qu'ici, pas sur les tuiles.
export const GroupLabel = ({ id, label, unit }) => (
  <h2 id={id} className="group-label span-12">
    {label}
    {unit ? <span className="group-label__unit"> · {unit}</span> : null}
  </h2>
);
