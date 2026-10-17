// src/stats/WorldMap.jsx — où les visiteurs se baladent dans le monde 3D.
//
// La mini-carte du jeu, passée en gris clair pour servir de fond, porte une
// carte de chaleur et le nom de chaque lieu avec la part des balades qui y
// sont passées. Le survol donne le temps passé à l'endroit pointé.
//
// Coordonnées : la même normalisation que la mini-carte du jeu (worldToMap,
// folio/sources/Game/Map.js) et que la grille de Telemetry.js. Les points de
// chaleur et les noms tombent exactement là où le jeu les montre lui-même.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDuration, nf } from "./format";

const MAP_SRC = "/folio3d/ui/map/map-day.webp";
const SIZE = 768; // résolution du canvas ; l'affichage suit la largeur de la tuile

// Une seule teinte, de l'ambre clair au brun : validée par le script du skill
// dataviz (--ordinal : clarté monotone, écarts visibles, extrémité claire
// lisible). Les deux pas du milieu sont --day-amber et --day-amber-deep.
const HEAT_RAMP = ["#f59e0b", "#d97706", "#b45309", "#78350f"];

// Position de chaque lieu sur la carte (0 à 1), relevée dans le jeu :
// worldToMap(point de réapparition) + le décalage que Map.js applique. Le jeu
// affiche sa carte en grand ; ici elle peut descendre à 330 px, et quatre
// lieux du centre se marchaient dessus (mesuré aux largeurs 360 à 1440) :
// leur étiquette passe sur le côté indiqué (`side`) au lieu d'au-dessus.
// La zone secrète n'a volontairement pas de place sur la carte.
const PLACES = {
  timeMachine: { x: 0.2058, y: 0.1628, short: "Machine temporelle" },
  circuit: { x: 0.3486, y: 0.5266, short: "Circuit" },
  altar: { x: 0.8895, y: 0.3767, short: "Autel" },
  social: { x: 0.6237, y: 0.3846, short: "Réseaux" },
  behindTheScene: { x: 0.7643, y: 0.4403, short: "Coulisses", side: "right" },
  career: { x: 0.6369, y: 0.4902, short: "Parcours" },
  projects: { x: 0.6864, y: 0.5715, short: "Projets" },
  achievements: { x: 0.8646, y: 0.596, short: "Succès", side: "below" },
  lab: { x: 0.5631, y: 0.5979, short: "Labo", side: "left" },
  cookie: { x: 0.5615, y: 0.6795, short: "Cookies", side: "left" },
  landing: { x: 0.7259, y: 0.697, short: "Arrivée" },
  bowling: { x: 0.5309, y: 0.8541, short: "Bowling" },
};

// Table de 256 couleurs : l'indice est l'intensité accumulée en un pixel.
const buildLut = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  HEAT_RAMP.forEach((color, index) => gradient.addColorStop(index / (HEAT_RAMP.length - 1), color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
};

// Deux passes, comme les cartes de chaleur classiques : on accumule d'abord
// l'intensité en niveaux de transparence (des taches qui se fondent entre
// elles), puis on colorise chaque pixel par la table. Le résultat est une
// nappe continue, pas une grille de pastilles.
const paintHeat = (canvas, cells, gridSize) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (!cells.length) return;

  const shadow = document.createElement("canvas");
  shadow.width = SIZE;
  shadow.height = SIZE;
  const sctx = shadow.getContext("2d");

  const cell = SIZE / gridSize;
  const radius = cell * 1.9;
  const max = Math.max(...cells.map((c) => c.n), 1);

  for (const { x, z, n } of cells) {
    // Racine carrée : sans elle, le point d'arrivée (où tout le monde
    // apparaît) écraserait visuellement le reste du monde.
    const intensity = Math.sqrt(n / max);
    const cx = (x + 0.5) * cell;
    const cy = (z + 0.5) * cell;
    const gradient = sctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    sctx.fillStyle = gradient;
    sctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  const image = sctx.getImageData(0, 0, SIZE, SIZE);
  const lut = buildLut();
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 6) {
      data[i + 3] = 0;
      continue;
    }
    const offset = alpha * 4;
    data[i] = lut[offset];
    data[i + 1] = lut[offset + 1];
    data[i + 2] = lut[offset + 2];
    // Les passages rares restent visibles sans recouvrir la carte.
    data[i + 3] = Math.min(225, 50 + alpha);
  }

  ctx.putImageData(image, 0, 0);
};

const WorldMap = ({ heatmap, zones, sessions }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [hover, setHover] = useState(null);

  const cells = useMemo(() => (Array.isArray(heatmap?.cells) ? heatmap.cells : []), [heatmap]);
  const gridSize = heatmap?.gridSize ?? 48;

  const byCell = useMemo(() => new Map(cells.map((c) => [`${c.x},${c.z}`, c.n])), [cells]);
  const maxCell = useMemo(() => cells.reduce((max, c) => Math.max(max, c.n), 0), [cells]);

  const byZone = useMemo(
    () => new Map((Array.isArray(zones) ? zones : []).map((zone) => [zone.key, zone])),
    [zones]
  );

  useEffect(() => {
    if (canvasRef.current) paintHeat(canvasRef.current, cells, gridSize);
  }, [cells, gridSize]);

  // Survol : un lieu proche l'emporte ; sinon, le temps passé dans la case.
  const onPointerMove = (event) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return setHover(null);

    let place = null;
    let best = 0.035;
    for (const [key, spot] of Object.entries(PLACES)) {
      const distance = Math.hypot(spot.x - nx, spot.y - ny);
      if (distance < best) {
        best = distance;
        place = key;
      }
    }

    const x = Math.min(gridSize - 1, Math.floor(nx * gridSize));
    const z = Math.min(gridSize - 1, Math.floor(ny * gridSize));
    const seconds = byCell.get(`${x},${z}`) ?? 0;

    if (!place && !seconds) return setHover(null);
    setHover({ nx, ny, place, seconds });
  };

  const top = [...byZone.values()].filter((zone) => PLACES[zone.key]).slice(0, 3);
  const summary = top.length
    ? `Carte de chaleur du monde 3D. Lieux les plus visités : ${top
        .map((zone) => `${zone.label} (${nf.format(zone.share)} %)`)
        .join(", ")}.`
    : "Carte de chaleur du monde 3D, sans passage sur la période.";

  const hovered = hover?.place ? byZone.get(hover.place) : null;

  return (
    <figure className="world-map">
      <div
        ref={stageRef}
        className="world-map__stage"
        role="img"
        aria-label={summary}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <img src={MAP_SRC} alt="" className="world-map__base" draggable="false" />
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="world-map__heat" />

        {Object.entries(PLACES).map(([key, spot]) => {
          const zone = byZone.get(key);
          const visited = (zone?.sessions ?? 0) > 0;
          return (
            <span
              key={key}
              className={`world-map__place${spot.side ? ` is-${spot.side}` : ""}${visited ? "" : " is-quiet"}${hover?.place === key ? " is-active" : ""}`}
              style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
              aria-hidden="true"
            >
              <span className="world-map__name">
                {spot.short}
                {visited ? <span className="world-map__share">{nf.format(Math.round(zone.share))}&nbsp;%</span> : null}
              </span>
              <span className="world-map__pin" />
            </span>
          );
        })}

        {hover ? (
          <span
            className={`world-map__tip${hover.nx > 0.62 ? " is-left" : ""}`}
            style={{ left: `${hover.nx * 100}%`, top: `${hover.ny * 100}%` }}
            role="status"
          >
            {hover.place ? (
              <>
                <strong>{hovered?.label ?? PLACES[hover.place].short}</strong>
                {hovered?.sessions
                  ? ` · ${nf.format(hovered.sessions)} ${hovered.sessions === 1 ? "balade" : "balades"} sur ${nf.format(sessions)}`
                  : " · pas encore visité"}
              </>
            ) : (
              <>
                <strong>{formatDuration(hover.seconds)}</strong> de présence ici
              </>
            )}
          </span>
        ) : null}
      </div>

      {maxCell ? (
        <figcaption className="world-map__legend">
          <span className="world-map__legend-label">Présence cumulée par case</span>
          <span className="world-map__ramp" aria-hidden="true" />
          <span className="world-map__legend-ends">
            <span>quelques secondes</span>
            <span>{formatDuration(maxCell)}</span>
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
};

export default WorldMap;
