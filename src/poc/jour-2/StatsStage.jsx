// src/poc/jour-2/StatsStage.jsx
// « Les grands chiffres passent en scène » : quatre cartons de titre se
// succèdent au centre de l'écran, comptent au rythme du défilement, puis se
// rangent un par un pour reconstituer le bandeau de chiffres clés de l'accueil.
// À la fin de la scène, la rangée `.pro-stats__row` est exactement celle de la
// page d'accueil — c'est elle qui porte le contenu accessible.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useMotionValueEvent } from "framer-motion";
import HorizonBand from "./HorizonBand";
import useSceneProgress from "./useSceneProgress";
import { StatCarton, StatTile, StatTileLinear } from "./StatCarton";
import { offsetIn } from "./mesure";

// ------------------------------------------------------------------ épinglé

const StatsPinned = ({ stats, label }) => {
  const trackRef = useRef(null);
  const pinRef = useRef(null);
  const sceneRef = useRef(null);
  const rowRef = useRef(null);

  const p = useSceneProgress(trackRef, { start: "start start", end: "end end" });

  // Géométrie du rangement, en pixels CSS de mise en page (offset*) :
  // même repère que les translate() appliqués ensuite.
  const [geo, setGeo] = useState({ tw: 240, dy: 260, rise: 52 });

  const mesurer = useCallback(() => {
    const pin = pinRef.current;
    const scene = sceneRef.current;
    const row = rowRef.current;
    const tile = row && row.firstElementChild;
    if (!pin || !scene || !row || !tile) return;
    const s = offsetIn(scene, pin);
    const r = offsetIn(row, pin);
    const suivant = {
      tw: tile.offsetWidth,
      dy: r.y + row.offsetHeight / 2 - (s.y + scene.offsetHeight / 2),
      rise: pin.offsetHeight * 0.05,
    };
    setGeo((prec) =>
      Math.abs(prec.tw - suivant.tw) < 0.5 &&
      Math.abs(prec.dy - suivant.dy) < 0.5 &&
      Math.abs(prec.rise - suivant.rise) < 0.5
        ? prec
        : suivant
    );
  }, []);

  useEffect(() => {
    let annule = false;
    const differe = () => {
      if (!annule) mesurer();
    };
    differe();
    const id = requestAnimationFrame(differe);
    const t = setTimeout(differe, 280);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(differe) : null;
    if (ro && pinRef.current) ro.observe(pinRef.current);
    if (ro && rowRef.current) ro.observe(rowRef.current);
    window.addEventListener("resize", differe, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(differe).catch(() => {});
    return () => {
      annule = true;
      cancelAnimationFrame(id);
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", differe);
    };
  }, [mesurer, stats]);

  // Index « 01 / 04 » : un seul état, changé quatre fois sur toute la scène.
  const [actif, setActif] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const i = Math.max(0, Math.min(stats.length - 1, Math.floor((v - 0.06) / 0.2)));
    setActif((prec) => (prec === i ? prec : i));
  });

  const total = String(stats.length).padStart(2, "0");

  return (
    <section className="j2-stats" aria-label={label} ref={trackRef}>
      <div className="j2-stats__pin" ref={pinRef}>
        <HorizonBand trackRef={trackRef} />

        <div className="pro-container j2-stats__index" aria-hidden="true">
          {`${String(actif + 1).padStart(2, "0")} / ${total}`}
        </div>

        <div className="j2-stats__scene" ref={sceneRef}>
          {stats.map((stat, i) => (
            <StatCarton
              key={stat.label}
              stat={stat}
              index={i}
              p={p}
              dx={(i - (stats.length - 1) / 2) * geo.tw}
              dy={geo.dy}
              rise={geo.rise}
            />
          ))}
        </div>

        <div className="pro-container pro-stats__row j2-stats__row" ref={rowRef}>
          {stats.map((stat, i) => (
            <StatTile key={stat.label} stat={stat} index={i} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ------------------------------------------------------------ non épinglé

const StatsLinear = ({ stats, label, reduced }) => {
  const rowRef = useRef(null);
  const vu = useInView(rowRef, { once: true, amount: 0.4 });

  return (
    <section className="pro-stats j2-stats--linear" aria-label={label}>
      <div className="pro-container pro-stats__row" ref={rowRef}>
        {stats.map((stat, i) => (
          <StatTileLinear key={stat.label} stat={stat} index={i} vu={vu} reduced={reduced} />
        ))}
      </div>
    </section>
  );
};

const StatsStage = ({ pinned, stats, label, reduced }) =>
  pinned ? (
    <StatsPinned stats={stats} label={label} />
  ) : (
    <StatsLinear stats={stats} label={label} reduced={reduced} />
  );

export default StatsStage;
