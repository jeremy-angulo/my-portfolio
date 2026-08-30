// src/stats/HeatmapCard.jsx — carte de chaleur de l'exploration du monde 3D.
//
// Réutilise l'image de la mini-carte du jeu (folio/sources/Game/Map.js) et la
// même normalisation de coordonnées (worldToMap) : les points dessinés ici
// tombent exactement là où le jeu affiche lui-même le joueur sur sa carte.

import React, { useEffect, useRef } from "react";

const MAP_SRC = "/folio3d/ui/map/map-day.webp";
const CANVAS_SIZE = 640;

const HeatmapCard = ({ heatmap }) => {
  const canvasRef = useRef(null);
  const cells = heatmap?.cells;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cells?.length) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const cellSize = CANVAS_SIZE / heatmap.gridSize;
    const max = Math.max(...cells.map((c) => c.n), 1);

    for (const cell of cells) {
      // Racine carrée plutôt que linéaire : sans elle, le point de spawn (de
      // loin le plus visité) écraserait visuellement tout le reste du monde.
      const intensity = Math.sqrt(cell.n / max);
      const cx = cell.x * cellSize + cellSize / 2;
      const cy = cell.z * cellSize + cellSize / 2;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 1.6);
      gradient.addColorStop(0, `rgba(180, 83, 9, ${0.6 * intensity})`);
      gradient.addColorStop(1, "rgba(180, 83, 9, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - cellSize * 2, cy - cellSize * 2, cellSize * 4, cellSize * 4);
    }
  }, [cells, heatmap?.gridSize]);

  if (!cells?.length) return <p className="stats-empty">Aucune donnée sur la période.</p>;

  return (
    <div className="heatmap">
      <img src={MAP_SRC} alt="" className="heatmap__map" />
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="heatmap__canvas" />
    </div>
  );
};

export default HeatmapCard;
