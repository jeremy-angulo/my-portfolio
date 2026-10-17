// src/stats/Dashboard.jsx — composition de la mosaïque de /statistiques dans
// l'ordre DOM = ordre visuel : bloc de tête (courbe, Pages vues, paire),
// bandeau de disponibilité, puis les trois groupes Audience / Lecture /
// Monde 3D (ce dernier dans WorldSection.jsx). Les tuiles optionnelles
// (disponibilité, monde 3D) ne sont pas montées quand la donnée manque.
//
// Seul le corps des tuiles porte `key={days}` (via `bodyKey`) : les
// enveloppes ne sont jamais rekeyées, l'entrée `rise` ne se rejoue pas.

import React from "react";
import { motion } from "framer-motion";
import { rise } from "../pro/proMotion";
import { Bento, GroupLabel, Tile } from "./Bento";
import { HeroKpi, KpiPair } from "./KpiTiles";
import UptimeStrip from "./UptimeStrip";
import TrendChart from "./TrendChart";
import RankList from "./RankList";
import ColumnChart from "./ColumnChart";
import SplitBar from "./SplitBar";
import WorldSection from "./WorldSection";
import { cleanReferrer, countryRow, DEVICE_LABELS, nf } from "./format";

const NBSP = " ";

const list = (rows) => (Array.isArray(rows) ? rows : []);

// SplitBar colore ses segments par position (ambre puis encre) : les lignes
// binaires sont remises dans un ordre fixe par libellé pour que la couleur
// garde le même sens d'une période à l'autre, quel que soit le tri serveur
// (libellés inconnus à la fin, dans l'ordre reçu).
const byOrder = (rows, order) =>
  [...list(rows)].sort(
    (a, b) => (order.indexOf(a.label) + 1 || 99) - (order.indexOf(b.label) + 1 || 99)
  );
const LANGUAGE_ORDER = ["Français", "English"];
const SWITCH_ORDER = ["Jour → Nuit", "Nuit → Jour"];

// `busy` (bascule ou rafraîchissement en cours) ne fait que poser `aria-busy`
// sur la mosaïque : rien n'est estompé ni bloqué. `entrance={false}` saute
// la translation d'entrée (arrivée avec un hash : le défilement initial doit
// viser une mosaïque déjà en place).
const Dashboard = ({
  data,
  days: requestedDays,
  chartHeight = 232,
  busy = false,
  entrance = true,
}) => {
  // Période des chiffres à l'écran (`range.days`), pas celle demandée :
  // pendant une bascule non cachée, les notes « vs 7 jours précédents » et le
  // remontage des corps (fondu) suivent l'arrivée des données, pas le clic.
  const days = data?.range?.days ?? requestedDays;
  const totals = data?.totals ?? {};
  const series = list(data?.series);
  const content = data?.content ?? {};

  // Préparation des classements avec les aides de format.js.
  const referrers = list(data?.referrers).map(cleanReferrer);
  const countries = list(data?.countries).map(countryRow);
  const devices = list(data?.devices).map((row) => ({
    ...row,
    label: DEVICE_LABELS[row.id] ?? row.label,
  }));

  // Pied factuel de « Profondeur de lecture » : dernier bucket / premier.
  const scrollDepth = list(content.scrollDepth);
  const first = scrollDepth[0];
  const last = scrollDepth[scrollDepth.length - 1];
  const depthFoot =
    first && last && (first.pageviews ?? 0) > 0
      ? `${nf.format(last.pageviews ?? 0)} sur ${nf.format(first.pageviews)} atteignent 100${NBSP}%`
      : null;

  const chartMeta =
    totals.average != null && totals.peak != null
      ? `moy. ${nf.format(totals.average)} · pic ${nf.format(totals.peak)}`
      : null;

  return (
    <motion.div variants={rise} initial={entrance ? "hidden" : false} animate="show" custom={1}>
      <Bento ready busy={busy}>
        {/* Bloc de tête : courbe sur deux rangées, deux tuiles KPI à droite. */}
        <Tile className="tile--chart span-8 row-2" title="Évolution" meta={chartMeta} bodyKey={days}>
          <TrendChart
            series={series}
            average={totals.average}
            peak={totals.peak}
            height={chartHeight}
          />
        </Tile>
        <HeroKpi totals={totals} days={days} className="span-4 md-3" />
        <KpiPair totals={totals} series={series} days={days} className="span-4 md-3" />

        {data?.uptime ? <UptimeStrip uptime={data.uptime} /> : null}

        {/* ------------------------------------------------------ Audience */}
        <GroupLabel id="audience" label="Audience" unit="pages vues" />

        <Tile className="span-5 md-6" title="Pages" bodyKey={days}>
          <RankList rows={data?.paths} max={8} />
        </Tile>
        <Tile className="span-4 md-3" title="Provenance" bodyKey={days}>
          <RankList rows={referrers} max={8} />
        </Tile>
        <Tile className="span-3 md-3" title="Pays" bodyKey={days}>
          <RankList rows={countries} max={6} />
        </Tile>

        <Tile className="span-12 md-6" title="Appareils" bodyKey={days}>
          <div className="tile__cols">
            <div>
              <p className="tile__subtitle">Écran</p>
              <RankList rows={devices} max={6} />
            </div>
            <div>
              <p className="tile__subtitle">Navigateur</p>
              <RankList rows={data?.browsers} max={6} />
            </div>
            <div>
              <p className="tile__subtitle">Système</p>
              <RankList rows={data?.systems} max={6} />
            </div>
          </div>
        </Tile>

        {/* ------------------------------------------------------- Lecture */}
        <GroupLabel id="lecture" label="Lecture" unit="évènements" />

        <Tile className="span-4 md-3" title="Sections lues" bodyKey={days}>
          <RankList rows={content.sections} max={8} />
        </Tile>
        {/* `tile--columns` : la zone de tracé des colonnes prend la hauteur
            que la rangée lui donne (Sections lues, plus haute, la fixe). */}
        <Tile className="tile--columns span-4 md-3" title="Profondeur de lecture" bodyKey={days}>
          <ColumnChart rows={scrollDepth} foot={depthFoot} />
        </Tile>
        <Tile className="tile--columns span-4 md-3" title="Temps passé par page" bodyKey={days}>
          <ColumnChart rows={content.timeOnPage} />
        </Tile>

        {/* Intentions 4 / Langue 8 : les deux SplitBar tiennent côte à côte
            dans la tuile large, dont la hauteur rejoint celle du classement
            court d'à côté (une moitié de rangée blanche sinon). */}
        <Tile className="span-4 md-3" title="Intentions" bodyKey={days}>
          <RankList rows={content.intents} max={8} />
        </Tile>
        <Tile className="span-8 md-6" title="Langue & bascule" bodyKey={days}>
          <div className="tile__halves">
            <div className="tile__half">
              <p className="tile__subtitle">Langue</p>
              <SplitBar rows={byOrder(content.languages, LANGUAGE_ORDER)} />
            </div>
            <hr className="tile__rule" />
            <div className="tile__half">
              <p className="tile__subtitle">Bascule jour ↔ nuit</p>
              <SplitBar rows={byOrder(content.facetSwitches, SWITCH_ORDER)} />
            </div>
          </div>
        </Tile>

        {/* ------------------------------------------------------ Monde 3D */}
        <WorldSection world={data?.world} heatmap={data?.heatmap} days={days} />
      </Bento>
    </motion.div>
  );
};

export default Dashboard;
