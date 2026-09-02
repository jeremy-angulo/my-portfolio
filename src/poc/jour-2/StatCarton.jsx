// src/poc/jour-2/StatCarton.jsx
// Un chiffre clé qui passe en scène : carton de titre géant, compteur lié au
// défilement (donc réversible : on remonte, il décompte), puis rangement vers
// sa tuile de la rangée finale — le bandeau actuel, reconstruit sous les yeux.
//
// Les valeurs viennent des constants et ne sont jamais réécrites : on découpe
// « 80 k€ » / « €80k » / « 150+ » / « 3 » en préfixe / entier / suffixe et on
// n'anime que l'entier.

import React, { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import useCountUp from "../shared/useCountUp";
import { useWindow } from "./useSceneProgress";
import { easeOutCubic } from "./mesure";

/** « 80 k€ » → { pre: "", n: 80, post: " k€" } ; « €80k » → { pre: "€", n: 80, post: "k" } */
export const decouper = (valeur) => {
  const m = /^([^\d]*)(\d+)(.*)$/.exec(String(valeur ?? ""));
  return m ? { pre: m[1], n: parseInt(m[2], 10), post: m[3] } : { pre: "", n: 0, post: String(valeur ?? "") };
};

/**
 * Compteur rendu SANS re-render : la MotionValue écrit directement dans le
 * nœud texte. Aucun état React par frame.
 */
const Compteur = ({ valeur }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.textContent = String(Math.round(valeur.get()));
  }, [valeur]);
  useMotionValueEvent(valeur, "change", (v) => {
    if (ref.current) ref.current.textContent = String(Math.round(v));
  });
  return <span ref={ref} className="j2-carton__n" />;
};

/**
 * Un carton géant. `aria-hidden` : la rangée finale porte le contenu accessible.
 * @param {{ stat: object, index: number, p: MotionValue, dx: number, dy: number, rise: number }} props
 */
export const StatCarton = ({ stat, index, p, dx, dy, rise }) => {
  const u = useWindow(p, 0.06 + 0.2 * index, 0.26 + 0.2 * index);
  const { pre, n, post } = decouper(stat.value);

  const compte = useTransform(u, [0, 0.45], [0, n], { ease: easeOutCubic });

  const style = {
    opacity: useTransform(u, [0, 0.25, 0.85, 1], [0, 1, 1, 0]),
    scale: useTransform(u, [0.7, 1], [1, 0.32], { ease: easeOutCubic }),
    x: useTransform(u, [0.7, 1], [0, dx], { ease: easeOutCubic }),
    y: useTransform(u, [0, 0.25, 0.7, 1], [rise, 0, 0, dy], { ease: easeOutCubic }),
  };
  const labelStyle = { opacity: useTransform(u, [0.04, 0.29], [0, 1]) };

  return (
    <motion.div className="j2-carton" style={style} aria-hidden="true">
      <p className="j2-carton__value">
        {pre && <span className="j2-carton__fix">{pre}</span>}
        <Compteur valeur={compte} />
        {post && <span className="j2-carton__fix">{post}</span>}
      </p>
      <motion.p className="j2-carton__label" style={labelStyle}>
        {stat.label}
      </motion.p>
    </motion.div>
  );
};

/** La tuile finale : le markup `.pro-stat` de la page d'accueil, inchangé. */
export const StatTile = ({ stat, index, p }) => {
  const u = useWindow(p, 0.06 + 0.2 * index, 0.26 + 0.2 * index);
  const style = {
    opacity: useTransform(u, [0.8, 1], [0, 1]),
    y: useTransform(u, [0.8, 1], [6, 0]),
  };
  return (
    <motion.div className="pro-stat" style={style}>
      <p className="pro-stat__value">{stat.value}</p>
      <p className="pro-stat__label">{stat.label}</p>
    </motion.div>
  );
};

/** Mode non épinglé : le bandeau 2×2 classique, compteur à l'entrée. */
export const StatTileLinear = ({ stat, index, vu, reduced }) => {
  const { pre, n, post } = decouper(stat.value);
  const courant = useCountUp(n, { enabled: vu, duration: 900, delay: index * 90 });
  const fini = courant >= n;

  return (
    <motion.div
      className="pro-stat"
      initial={reduced ? false : { opacity: 0, scale: 1.3 }}
      animate={vu && !reduced ? { opacity: 1, scale: 1, transition: { duration: 0.4, delay: index * 0.09 } } : undefined}
    >
      <p className="pro-stat__value">
        {fini ? stat.value : `${pre}${courant}${post}`}
      </p>
      <p className="pro-stat__label">{stat.label}</p>
    </motion.div>
  );
};

export default StatCarton;
