// src/stats/TrendChart.jsx — courbe d'évolution des pages vues, en SVG pur
// (pas de dépendance de graphique : le site n'en a aucune, et la courbe reste
// simple — une aire, une ligne, un curseur au survol).

import React, { useMemo, useState } from "react";

const WIDTH = 720;
const HEIGHT = 220;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_X = 4;

const nf = new Intl.NumberFormat("fr-FR");
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

// Jusqu'à 6 étiquettes sous l'axe, régulièrement espacées, premier et dernier
// jour toujours inclus — au-delà, l'axe devient illisible (365 points sur 1 an).
const pickTicks = (count) => {
  if (count <= 1) return [0];
  const target = Math.min(6, count);
  const step = (count - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => Math.round(i * step));
};

const TrendChart = ({ series }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const { points, linePath, areaPath, ticks } = useMemo(() => {
    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    const max = Math.max(...series.map((d) => d.pageviews), 1);
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

    const points = series.map((d, i) => ({
      ...d,
      x: PAD_X + i * stepX,
      y: PAD_TOP + innerH - (d.pageviews / max) * innerH,
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    const base = HEIGHT - PAD_BOTTOM;
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${base} L ${points[0].x.toFixed(2)} ${base} Z`
      : "";

    return { points, linePath, areaPath, ticks: pickTicks(series.length) };
  }, [series]);

  const hasTraffic = series.some((d) => d.pageviews > 0);
  if (!hasTraffic) return <p className="stats-empty">Aucune donnée sur la période.</p>;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
    setHoverIndex(index);
  };

  const active = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="trend-chart__svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Pages vues par jour sur la période sélectionnée"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            className="trend-chart__grid"
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f}
            y2={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f}
          />
        ))}

        <path d={areaPath} className="trend-chart__area" />
        <path d={linePath} className="trend-chart__line" />

        {active ? (
          <>
            <line
              className="trend-chart__cursor"
              x1={active.x}
              x2={active.x}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
            />
            <circle className="trend-chart__dot" cx={active.x} cy={active.y} r="4" />
          </>
        ) : null}

        {ticks.map((i) => (
          <text
            key={i}
            className="trend-chart__tick"
            x={points[i].x}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          >
            {shortDate.format(new Date(`${points[i].day}T00:00:00`))}
          </text>
        ))}
      </svg>

      {active ? (
        <div
          className="trend-chart__tooltip"
          style={{ left: `${(active.x / WIDTH) * 100}%` }}
        >
          <strong>{shortDate.format(new Date(`${active.day}T00:00:00`))}</strong>
          <span>{nf.format(active.pageviews)} pages vues</span>
        </div>
      ) : null}
    </div>
  );
};

export default TrendChart;
