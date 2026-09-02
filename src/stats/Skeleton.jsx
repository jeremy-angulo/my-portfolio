// src/stats/Skeleton.jsx — mosaïque squelette du chargement initial : EXACTEMENT
// la grille finale (mêmes spans, mêmes hauteurs minimales) sans les tuiles
// optionnelles (disponibilité, exploration), avec les vrais libellés de groupe.
// À l'arrivée des données, rien ne saute.

import React from "react";
import { Bento, GroupLabel } from "./Bento";

const WIDTHS = ["90%", "70%", "55%", "40%", "65%", "50%"];

// Tuile squelette : même cadre que `Tile` (tête + corps), contenu purement
// décoratif — le statut est annoncé une seule fois, en texte masqué.
const SkeletonTile = ({ className, lines = 4, children }) => (
  <section className={`tile tile--skeleton${className ? ` ${className}` : ""}`} aria-hidden="true">
    <header className="tile__head">
      <span className="skeleton__line skeleton__line--title" />
    </header>
    <div className="tile__body">
      {children ??
        WIDTHS.slice(0, lines).map((width) => (
          <span className="skeleton__line" style={{ width }} key={width} />
        ))}
    </div>
  </section>
);

// `chartHeight` : la même hauteur que TrendChart recevra (200 sur mobile,
// 240 sur tablette, 232 au-delà), pour que la tuile courbe ne bouge pas.
// Un seul bloc plein : une silhouette en colonnes annoncerait un autre type
// de graphique que la courbe qui arrive.
const Skeleton = ({ chartHeight = 232 }) => (
  <Bento ready={false} busy>
    <p className="sr-only" role="status">
      Chargement
    </p>

    <SkeletonTile className="tile--chart span-8 row-2">
      <span className="skeleton__block" style={{ width: "100%", height: chartHeight }} />
    </SkeletonTile>
    <SkeletonTile className="tile--hero span-4 md-3">
      <span className="skeleton__block" style={{ width: 120, height: 40 }} />
    </SkeletonTile>
    <SkeletonTile className="tile--pair span-4 md-3">
      <span className="skeleton__block" style={{ width: 80, height: 26 }} />
      <span className="skeleton__block" style={{ width: 80, height: 26 }} />
    </SkeletonTile>

    <GroupLabel id="audience" label="Audience" unit="pages vues" />
    <SkeletonTile className="span-5 md-6" lines={6} />
    <SkeletonTile className="span-4 md-3" lines={4} />
    <SkeletonTile className="span-3 md-3" lines={6} />
    <SkeletonTile className="span-12 md-6">
      <div className="tile__cols">
        {[0, 1, 2].map((column) => (
          <div key={column}>
            {WIDTHS.slice(0, 5).map((width) => (
              <span className="skeleton__line" style={{ width }} key={width} />
            ))}
          </div>
        ))}
      </div>
    </SkeletonTile>

    <GroupLabel id="lecture" label="Lecture" unit="évènements" />
    <SkeletonTile className="span-4 md-3" lines={6} />
    <SkeletonTile className="span-4 md-3" lines={4} />
    <SkeletonTile className="span-4 md-3" lines={4} />
    <SkeletonTile className="span-4 md-3" lines={3} />
    <SkeletonTile className="span-8 md-6" lines={3} />

    <GroupLabel id="monde3d" label="Monde 3D" unit="évènements" />
    <SkeletonTile className="span-6 md-3" lines={5} />
    <SkeletonTile className="span-6 md-3" lines={5} />
  </Bento>
);

export default Skeleton;
