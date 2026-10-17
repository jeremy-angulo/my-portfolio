// src/stats/WorldSection.jsx — le groupe « Monde 3D » de la mosaïque.
//
// Source : la mesure propre au site (api/world.js → base Postgres, mise en
// forme par api/_lib/world-report.js). Contrairement au reste de la page,
// elle compte des sessions — un chargement du monde — et pas des pages vues.
// Elle a démarré le 17 octobre 2026 : avant, le monde 3D n'était suivi que
// par GoatCounter, que bloqueurs et filtres d'entreprise écartaient.
//
// Rend un fragment : les tuiles doivent rester des enfants directs de la
// grille Bento.

import React from "react";
import { GroupLabel, Tile } from "./Bento";
import TrendChart from "./TrendChart";
import RankList from "./RankList";
import ColumnChart from "./ColumnChart";
import SplitBar from "./SplitBar";
import HeatmapCard from "./HeatmapCard";
import Empty from "./Empty";
import { nf } from "./format";

const NBSP = " ";

const list = (rows) => (Array.isArray(rows) ? rows : []);

// Les primitives lisent `pageviews` : on y range la valeur, quelle qu'elle soit.
const asRows = (rows, field) =>
  list(rows).map((row) => ({ label: row.label, pageviews: row[field] ?? 0 }));

// Même principe que dans Dashboard.jsx : un ordre fixe garde aux couleurs de
// la barre le même sens d'une période à l'autre.
const byOrder = (rows, order) =>
  [...rows].sort((a, b) => (order.indexOf(a.label) + 1 || 99) - (order.indexOf(b.label) + 1 || 99));

const START_ORDER = ["Jeton obtenu", "Quota atteint", "Serveur en erreur", "Sans réseau"];
const SUBMIT_ORDER = ["Publié", "Gardé sur l’appareil", "Nom refusé", "Nom invalide", "Quota atteint"];

// « 45 s », « 4 min 12 », « 1 h 05 ».
const duration = (seconds) => {
  if (seconds == null) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}${NBSP}s`;
  if (s < 3600) return `${Math.floor(s / 60)}${NBSP}min${NBSP}${String(s % 60).padStart(2, "0")}`;
  return `${Math.floor(s / 3600)}${NBSP}h${NBSP}${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
};

// « 39,8 s »
const lapTime = (ms) =>
  ms == null ? "—" : `${(ms / 1000).toFixed(1).replace(".", ",")}${NBSP}s`;

const percent = (part, whole) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}${NBSP}%` : "—";

const WorldSection = ({ world, heatmap, days }) => {
  // Base injoignable ou non configurée : le groupe se tait plutôt que
  // d'afficher des zéros trompeurs.
  if (!world) return null;

  const sessions = world.sessions ?? 0;
  const circuit = world.circuit ?? {};

  // Aucune session sur la période : une phrase plutôt que dix tuiles vides.
  // C'est l'état des premiers jours, la mesure n'ayant pas d'historique.
  if (!sessions) {
    return (
      <>
        <GroupLabel id="monde3d" label="Monde 3D" unit="sessions" />
        <Tile className="span-12 md-6" bodyKey={days}>
          <Empty text="Aucune session du monde 3D sur la période. La mesure du site a démarré le 17 octobre 2026." />
        </Tile>
      </>
    );
  }
  const daily = list(world.daily).map((row) => ({ day: row.day, pageviews: row.sessions }));
  const peak = daily.reduce((max, row) => Math.max(max, row.pageviews), 0);
  const average = daily.length ? Math.round((sessions / daily.length) * 10) / 10 : 0;

  // L'entonnoir garde son ordre si un compteur dépasse l'étape d'avant
  // (une entrée de zone manquée, par exemple) : la base des parts est le
  // plus grand des quatre.
  const funnel = [
    { label: "Zone du circuit atteinte", pageviews: circuit.reached ?? 0 },
    { label: "Départ pris", pageviews: circuit.started ?? 0 },
    { label: "Tour bouclé", pageviews: circuit.finished ?? 0 },
    { label: "Temps publié", pageviews: circuit.published ?? 0 },
  ];
  const funnelBase = Math.max(...funnel.map((row) => row.pageviews));

  const lapFoot =
    circuit.bestMs != null
      ? `meilleur ${lapTime(circuit.bestMs)} · médiane ${lapTime(circuit.medianMs)}`
      : null;

  return (
    <>
      <GroupLabel id="monde3d" label="Monde 3D" unit="sessions" />

      <Tile
        className="span-12 md-6"
        bodyKey={days}
        foot="Mesure du site depuis le 17 octobre 2026, sans cookie ni adresse IP"
      >
        <dl className="kpi-pair kpi-pair--four">
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Sessions</dt>
            <dd className="kpi-pair__value">{nf.format(sessions)}</dd>
            <dd className="kpi-pair__sub">
              {world.embeddedShare != null ? `${nf.format(world.embeddedShare)}${NBSP}% depuis le site` : ""}
            </dd>
          </div>
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Temps médian</dt>
            <dd className="kpi-pair__value">{duration(world.activeMedianS)}</dd>
            <dd className="kpi-pair__sub">
              {world.activeP75S != null ? `¼ au-delà de ${duration(world.activeP75S)}` : ""}
            </dd>
          </div>
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Chargement médian</dt>
            <dd className="kpi-pair__value">
              {world.loadMedianMs != null ? lapTime(world.loadMedianMs) : "—"}
            </dd>
            <dd className="kpi-pair__sub">jusqu’au monde prêt</dd>
          </div>
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Ont pris le départ</dt>
            <dd className="kpi-pair__value">{percent(circuit.started ?? 0, sessions)}</dd>
            <dd className="kpi-pair__sub">
              {nf.format(circuit.laps ?? 0)} {circuit.laps === 1 ? "tour bouclé" : "tours bouclés"}
            </dd>
          </div>
        </dl>
      </Tile>

      {/* Quand, puis où : la courbe et la carte côte à côte. La carte vit
          dans la même base que le reste du groupe et suit donc la période
          choisie, au lieu des trois derniers jours. */}
      <Tile
        className={`tile--chart ${heatmap ? "span-8" : "span-12"} md-6`}
        title="Fréquentation"
        meta={sessions ? `moy. ${nf.format(average)} · pic ${nf.format(peak)}` : null}
        bodyKey={days}
      >
        {sessions ? (
          <TrendChart series={daily} average={average} peak={peak} height={180} unit={["session", "sessions"]} />
        ) : (
          <Empty />
        )}
      </Tile>

      {heatmap ? (
        <Tile className="tile--explore span-4 md-6" title="Exploration" bodyKey={days}>
          <HeatmapCard heatmap={heatmap} />
          <div className="tile__aside">
            <p className="tile__stat">
              <span className="tile__stat-value">{duration(heatmap.total ?? 0)}</span>
              <span className="tile__stat-label">de présence cumulée</span>
            </p>
            <div className="heat-legend" aria-hidden="true">
              <span>moins</span>
              <span className="heat-legend__ramp" />
              <span>plus</span>
            </div>
          </div>
        </Tile>
      ) : null}

      {/* Le circuit : où un pilote décroche, et pourquoi un tour bouclé n'a
          pas été publié (jeton refusé au départ, nom refusé, hors ligne…). */}
      <Tile
        className="span-4 md-3"
        title="Circuit"
        meta="sessions"
        foot={circuit.laps ? `${nf.format(circuit.starts ?? 0)} départs pour ${nf.format(circuit.laps)} ${circuit.laps === 1 ? "tour bouclé" : "tours bouclés"}` : null}
        bodyKey={days}
      >
        {funnelBase ? <RankList rows={funnel} max={4} total={funnelBase} /> : <Empty />}
      </Tile>

      <Tile className="span-4 md-3" title="Départs et dépôts" bodyKey={days}>
        <div className="tile__stack">
          <div>
            <p className="tile__subtitle">Jeton de course au départ</p>
            <SplitBar rows={byOrder(asRows(circuit.tokens, "count"), START_ORDER)} />
          </div>
          <div>
            <p className="tile__subtitle">Issue du dépôt</p>
            <SplitBar rows={byOrder(asRows(circuit.outcomes, "count"), SUBMIT_ORDER)} />
          </div>
        </div>
      </Tile>

      <Tile className="tile--columns span-4 md-3" title="Chronos" meta="tours" bodyKey={days}>
        <ColumnChart rows={asRows(circuit.histogram, "count")} foot={lapFoot} />
      </Tile>

      {/* Ce qu'ils ont fait. Les zones se lisent en part des sessions : une
          session en visite plusieurs. */}
      <Tile className="span-4 md-3" title="Zones découvertes" bodyKey={days}>
        <RankList rows={asRows(world.zones, "sessions")} max={8} total={sessions} />
      </Tile>

      <Tile className="span-4 md-3" title="Interactions" meta="activations" bodyKey={days}>
        <RankList rows={asRows(world.interactions, "count")} max={8} />
      </Tile>

      <Tile className="span-4 md-3" title="Succès débloqués" meta="déblocages" bodyKey={days}>
        <RankList rows={asRows(world.achievements, "count")} max={8} />
      </Tile>

      <Tile className="span-12 md-6" title="Appareils et rendu" bodyKey={days}>
        <div className="tile__halves">
          <div className="tile__half">
            <p className="tile__subtitle">Appareil</p>
            <SplitBar rows={asRows(world.devices, "sessions")} />
          </div>
          <hr className="tile__rule" />
          <div className="tile__half">
            <p className="tile__subtitle">Moteur de rendu</p>
            <SplitBar rows={asRows(world.renderers, "sessions")} />
          </div>
        </div>
      </Tile>
    </>
  );
};

export default WorldSection;
