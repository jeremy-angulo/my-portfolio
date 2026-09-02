// src/stats/TrendChart.jsx — courbe d'évolution des pages vues, en SVG pur
// (pas de dépendance de graphique : le site n'en a aucun, et la courbe reste
// simple — une aire, une ligne, un axe Y « nice », la moyenne en pointillés,
// l'anneau du pic et un curseur qui suit le pointeur).
//
// Le viewBox reprend la largeur MESURÉE du conteneur (ResizeObserver) : les
// textes et les traits sont donc toujours rendus à l'échelle 1, quelle que
// soit la largeur de la tuile — sans cela, les ticks tombaient à ~6 px sur
// mobile avec un viewBox fixe de 720.

import React, { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { nf, niceScale, peakDay, shortDate, weekdayShort } from "./format";
import Empty from "./Empty";

const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_LEFT = 36; // étiquettes Y
const PAD_LEFT_NARROW = 32; // mobile : l'axe Y est conservé, un peu plus serré
const PAD_RIGHT = 30; // étiquette « moy. »
const NARROW_WIDTH = 480; // sous cette largeur : ≤ 4 ticks X, PAD_LEFT réduit
const DENSE_POINTS = 120; // au-delà (1 an) : ligne plus fine
const TOOLTIP_EDGE = 80; // marge de bascule du tooltip vers un ancrage à gauche/droite
const FALLBACK_WIDTH = 720;

// Largeur du conteneur, suivie par ResizeObserver ; `fallback` tant que rien
// n'est mesuré (SSR, navigateur sans ResizeObserver, élément non monté).
const useMeasuredWidth = (ref, fallback = FALLBACK_WIDTH) => {
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const apply = (value) => {
      const next = Math.round(value);
      if (next > 0) setWidth((prev) => (prev === next ? prev : next));
    };

    apply(node.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
};

// Étiquettes sous l'axe : tous les jours tant qu'ils tiennent (≤ maxTicks + 1,
// donc les 7 jours sur desktop), sinon un pas constant depuis le premier jour,
// dernier jour toujours inclus (un avant-dernier tick trop proche est retiré).
// Un arrondi par tick laissait un trou visible (25, 26, 27, 29… sans le 28).
const pickTicks = (count, maxTicks = 6) => {
  if (count <= 1) return [0];
  if (count <= maxTicks + 1) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil((count - 1) / (maxTicks - 1));
  const ticks = [];
  for (let i = 0; i < count - 1; i += step) ticks.push(i);
  if (count - 1 - ticks[ticks.length - 1] < step / 2) ticks.pop();
  ticks.push(count - 1);
  return ticks;
};

// Hauteur du tooltip (deux lignes, trois avec « meilleur jour ») et marge :
// sans la place au-dessus, il est placé sous le point pour ne pas couvrir la
// tête de la tuile — la hauteur réelle compte, un tooltip de deux lignes ne
// bascule pas pour la place qu'en prendrait un de trois.
const TOOLTIP_HEIGHT = 49;
const TOOLTIP_HEIGHT_PEAK = 64;
const TOOLTIP_GAP = 10;

const toDate = (day) => new Date(`${day}T00:00:00`);

const TrendChart = ({ series, average, peak, height = 232 }) => {
  const rootRef = useRef(null);
  const width = useMeasuredWidth(rootRef, FALLBACK_WIDTH);
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);

  const narrow = width < NARROW_WIDTH;
  const padLeft = narrow ? PAD_LEFT_NARROW : PAD_LEFT;

  const { points, linePath, areaPath, ticks, scale, yOf, peakIndex } = useMemo(() => {
    const innerW = Math.max(1, width - padLeft - PAD_RIGHT);
    const innerH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);
    const list = Array.isArray(series) ? series : [];
    const max = Math.max(0, ...list.map((d) => d.pageviews));
    // L'échelle verticale utilise le sommet « nice », pas le max brut.
    const scale = niceScale(max, 3);
    const yOf = (value) => PAD_TOP + innerH - (Math.min(value, scale.top) / scale.top) * innerH;
    const stepX = list.length > 1 ? innerW / (list.length - 1) : 0;

    const points = list.map((d, i) => ({
      ...d,
      x: padLeft + i * stepX,
      y: yOf(d.pageviews),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    const base = height - PAD_BOTTOM;
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${base} L ${points[0].x.toFixed(2)} ${base} Z`
      : "";

    const peakPoint = peakDay(list, peak);
    const peakIndex = peakPoint ? list.indexOf(peakPoint) : -1;

    return {
      points,
      linePath,
      areaPath,
      ticks: pickTicks(list.length, narrow ? 4 : 6),
      scale,
      yOf,
      peakIndex,
    };
  }, [series, peak, width, height, padLeft, narrow]);

  const hasTraffic = Array.isArray(series) && series.some((d) => d.pageviews > 0);
  if (!hasTraffic) return <Empty />;

  const baseY = height - PAD_BOTTOM;
  const showAverage = typeof average === "number" && average > 0;
  const averageY = showAverage ? yOf(average) : null;

  // Le viewBox est à l'échelle 1 : les coordonnées SVG sont des pixels CSS.
  // Le rect mesuré est en pixels de viewport (le site applique `zoom: .85`
  // sur body, et tout ancêtre pourrait être transformé) : on ramène l'offset
  // du pointeur à l'échelle du viewBox via le rapport width / rect.width.
  const indexFromPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width > 0 ? width / rect.width : 1;
    const localX = (event.clientX - rect.left) * scale;
    const innerW = Math.max(1, width - padLeft - PAD_RIGHT);
    const ratio = (localX - padLeft) / innerW;
    return Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
  };

  const handlePointer = (event) => setHoverIndex(indexFromPointer(event));
  // Au tactile, le navigateur émet pointerleave dès que le doigt se lève : on
  // garde alors le curseur affiché pour que la valeur reste lisible.
  const clearPointer = (event) => {
    if (event.pointerType === "touch") return;
    setHoverIndex(null);
  };

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeIsPeak = active !== null && hoverIndex === peakIndex;

  // Tooltip clampé : ancré à gauche près du bord gauche, à droite près du bord
  // droit ; sous le point quand il n'y a pas la place au-dessus (pic haut).
  const tooltipSide =
    active === null ? "" : active.x < TOOLTIP_EDGE ? "left" : active.x > width - TOOLTIP_EDGE ? "right" : "";
  const tooltipNeeded = activeIsPeak ? TOOLTIP_HEIGHT_PEAK : TOOLTIP_HEIGHT;
  const tooltipBelow = active !== null && active.y - TOOLTIP_GAP - tooltipNeeded < 0;
  const tooltipClass = [
    "trend-chart__tooltip",
    tooltipSide ? `trend-chart__tooltip--${tooltipSide}` : "",
    tooltipBelow ? "trend-chart__tooltip--below" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const tooltipTop = active === null ? 0 : tooltipBelow ? active.y + TOOLTIP_GAP + 2 : active.y - TOOLTIP_GAP;

  const chartClass = `trend-chart${points.length > DENSE_POINTS ? " trend-chart--dense" : ""}`;

  return (
    <div className={chartClass} ref={rootRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="trend-chart__svg"
        style={{ height: `${height}px` }}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={clearPointer}
        onPointerCancel={clearPointer}
        role="img"
        aria-label="Pages vues par jour sur la période sélectionnée"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines à chaque pas nice + ligne de base */}
        {scale.ticks.map((value) => (
          <line
            key={value}
            className="trend-chart__grid"
            x1={padLeft}
            x2={width - PAD_RIGHT}
            y1={yOf(value)}
            y2={yOf(value)}
          />
        ))}
        <line className="trend-chart__grid" x1={padLeft} x2={width - PAD_RIGHT} y1={baseY} y2={baseY} />

        {scale.ticks.map((value) => (
          <text
            key={value}
            className="trend-chart__ylabel"
            x={padLeft - 8}
            y={yOf(value)}
            textAnchor="end"
          >
            {nf.format(value)}
          </text>
        ))}

        <path d={areaPath} className="trend-chart__area" fill={`url(#${gradientId})`} />
        <path d={linePath} className="trend-chart__line" />

        {showAverage ? (
          <>
            <line
              className="trend-chart__avg"
              x1={padLeft}
              x2={width - PAD_RIGHT}
              y1={averageY}
              y2={averageY}
            />
            <text className="trend-chart__avg-label" x={width - PAD_RIGHT + 6} y={averageY}>
              moy.
            </text>
          </>
        ) : null}

        {peakIndex >= 0 ? (
          <circle
            className="trend-chart__peak"
            cx={points[peakIndex].x}
            cy={points[peakIndex].y}
            r="5"
          />
        ) : null}

        {active ? (
          <>
            <line className="trend-chart__cursor" x1={active.x} x2={active.x} y1={PAD_TOP} y2={baseY} />
            <circle className="trend-chart__dot" cx={active.x} cy={active.y} r="4" />
          </>
        ) : null}

        {ticks.map((i) => (
          <text
            key={i}
            className="trend-chart__tick"
            x={points[i].x}
            y={height - 8}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          >
            {shortDate.format(toDate(points[i].day))}
          </text>
        ))}
      </svg>

      {active ? (
        <div className={tooltipClass} style={{ left: `${active.x}px`, top: `${tooltipTop}px` }}>
          <strong>{weekdayShort.format(toDate(active.day))}</strong>
          <span>
            {nf.format(active.pageviews)} {active.pageviews === 1 ? "page vue" : "pages vues"}
          </span>
          {activeIsPeak ? <span className="trend-chart__tooltip-peak">meilleur jour</span> : null}
        </div>
      ) : null}
    </div>
  );
};

export default TrendChart;
