// src/stats/WorldSection.jsx — le groupe « Monde 3D » de la mosaïque.
//
// Source : la mesure propre au site (api/world.js → base Postgres, mise en
// forme par api/_lib/world-report.js). Elle compte des balades — un
// chargement du monde 3D — et pas des pages vues. Elle a démarré le
// 17 octobre 2026 : avant, le monde 3D n'était suivi que par GoatCounter,
// que bloqueurs et filtres d'entreprise écartaient.
//
// Ordre de lecture : où ils vont (la carte et le nombre de balades, en
// tête), quand et sur quoi, le circuit, puis ce qu'ils ont fait.
//
// Rend un fragment : les tuiles doivent rester des enfants directs de la
// grille Bento.

import React from "react";
import { GroupLabel, Tile } from "./Bento";
import TrendChart from "./TrendChart";
import RankList from "./RankList";
import ColumnChart from "./ColumnChart";
import SplitBar from "./SplitBar";
import WorldMap from "./WorldMap";
import Empty from "./Empty";
import { formatDuration, nf } from "./format";

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

// « 39,8 s »
const lapTime = (ms) =>
  ms == null ? "—" : `${(ms / 1000).toFixed(1).replace(".", ",")}${NBSP}s`;

const MEASURE_NOTE = "Mesure du site depuis le 17 octobre 2026, sans cookie ni adresse IP";

const WorldSection = ({ world, heatmap, days }) => {
  // Base injoignable ou non configurée : le groupe se tait plutôt que
  // d'afficher des zéros trompeurs.
  if (!world) return null;

  const sessions = world.sessions ?? 0;
  const circuit = world.circuit ?? {};

  // Aucune balade sur la période : une phrase plutôt que des tuiles vides.
  // C'est l'état des premiers jours, la mesure n'ayant pas d'historique.
  if (!sessions) {
    return (
      <>
        <GroupLabel id="monde3d" label="Monde 3D" unit="balades" />
        <Tile className="span-12 md-6" bodyKey={days}>
          <Empty text="Aucune balade dans le monde 3D sur la période. La mesure du site a démarré le 17 octobre 2026." />
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

  const totalSeconds = heatmap?.total ?? null;
  const subParts = [
    world.activeMedianS != null ? `${formatDuration(world.activeMedianS)} en médiane` : null,
    totalSeconds ? `${formatDuration(totalSeconds)} au total` : null,
  ].filter(Boolean);

  return (
    <>
      <GroupLabel id="monde3d" label="Monde 3D" unit="balades" />

      {/* Où ils vont, et combien : la question qu'on pose en premier. */}
      <Tile className="span-12 md-6" title="Où ils se baladent" bodyKey={days} foot={MEASURE_NOTE}>
        <div className="world-hero">
          <WorldMap heatmap={heatmap} zones={world.zones} sessions={sessions} />

          <div className="world-hero__aside">
            <p className="world-hero__count">
              <span className="world-hero__value">{nf.format(sessions)}</span>
              <span className="world-hero__unit">{sessions === 1 ? "balade" : "balades"}</span>
            </p>
            {subParts.length ? <p className="world-hero__sub">{subParts.join(" · ")}</p> : null}

            <p className="tile__subtitle">Lieux les plus visités</p>
            <RankList rows={asRows(world.zones, "sessions")} max={8} total={sessions} />

            <p className="world-hero__note">
              Une balade, c’est un chargement du monde 3D : un visiteur qui revient compte deux fois.
              Les pourcentages disent la part des balades passées par chaque lieu.
            </p>
          </div>
        </div>
      </Tile>

      {/* Quand, et sur quoi. */}
      <Tile
        className="tile--chart span-8 md-6"
        title="Fréquentation"
        meta={`moy. ${nf.format(average)} · pic ${nf.format(peak)}`}
        bodyKey={days}
      >
        {/* Hauteur alignée sur la tuile voisine (deux chiffres, deux répartitions) :
            à 180 px, la courbe flottait au milieu d'un grand blanc. */}
        <TrendChart series={daily} average={average} peak={peak} height={300} unit={["balade", "balades"]} />
      </Tile>

      <Tile className="span-4 md-6" title="Chargement et appareils" bodyKey={days}>
        <dl className="kpi-pair">
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Chargement médian</dt>
            <dd className="kpi-pair__value">{world.loadMedianMs != null ? lapTime(world.loadMedianMs) : "—"}</dd>
            <dd className="kpi-pair__sub">jusqu’au monde prêt</dd>
          </div>
          <div className="kpi-pair__cell">
            <dt className="kpi-pair__label">Depuis le site</dt>
            <dd className="kpi-pair__value">{`${nf.format(Math.round(world.embeddedShare ?? 0))}${NBSP}%`}</dd>
            <dd className="kpi-pair__sub">le reste en lien direct</dd>
          </div>
        </dl>
        <div className="tile__stack world-devices">
          <div>
            <p className="tile__subtitle">Appareil</p>
            <SplitBar rows={asRows(world.devices, "sessions")} />
          </div>
          <div>
            <p className="tile__subtitle">Moteur de rendu</p>
            <SplitBar rows={asRows(world.renderers, "sessions")} />
          </div>
        </div>
      </Tile>

      {/* Le circuit : où un pilote décroche, et pourquoi un tour bouclé n'a
          pas été publié (jeton refusé au départ, nom refusé, hors ligne…). */}
      <Tile
        className="span-4 md-3"
        title="Circuit"
        meta="balades"
        foot={
          circuit.laps
            ? `${nf.format(circuit.starts ?? 0)} départs pour ${nf.format(circuit.laps)} ${circuit.laps === 1 ? "tour bouclé" : "tours bouclés"}`
            : null
        }
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

      <Tile className="tile--columns span-4 md-6" title="Chronos" meta="tours" bodyKey={days}>
        <ColumnChart
          rows={asRows(circuit.histogram, "count")}
          foot={circuit.bestMs != null ? `meilleur ${lapTime(circuit.bestMs)} · médiane ${lapTime(circuit.medianMs)}` : null}
        />
      </Tile>

      {/* Ce qu'ils ont fait. */}
      <Tile className="span-6 md-3" title="Interactions" meta="activations" bodyKey={days}>
        <RankList rows={asRows(world.interactions, "count")} max={8} />
      </Tile>

      <Tile className="span-6 md-3" title="Succès débloqués" meta="déblocages" bodyKey={days}>
        <RankList rows={asRows(world.achievements, "count")} max={8} />
      </Tile>
    </>
  );
};

export default WorldSection;
