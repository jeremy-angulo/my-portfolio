// src/stats/StatsPage.jsx — page privée /statistiques, habillée comme la
// facette jour : même navbar, mêmes tokens ivoire/encre/ambre (pro.scss).
//
// Volontairement non liée depuis le site et marquée noindex : elle n'est pas
// secrète au sens cryptographique, mais elle ne doit ni se trouver par
// navigation, ni remonter dans un moteur de recherche. La vraie protection est
// côté serveur, dans api/stats.js : sans la phrase, l'API ne répond rien.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCompass,
  FiFileText,
  FiGlobe,
  FiLock,
  FiMap,
  FiMonitor,
  FiRefreshCw,
  FiSliders,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { logo } from "../assets";
import ProFooter from "../pro/ProFooter";
import { rise } from "../pro/proMotion";
import TrendChart from "./TrendChart";
import HeatmapCard from "./HeatmapCard";
import "../pro/pro.scss";
import "./StatsPage.scss";

const STORAGE_KEY = "stats-key";

const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 31, label: "31 jours" },
  { days: 90, label: "90 jours" },
  { days: 365, label: "1 an" },
];

const nf = new Intl.NumberFormat("fr-FR");
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Catégories d'écran GoatCounter (/stats/sizes) : les ids sont stables,
// les noms anglais non — on francise sur l'id.
const DEVICE_LABELS = {
  phone: "Téléphone",
  tablet: "Tablette",
  desktop: "Ordinateur",
  desktophd: "Grand écran",
  unknown: "Inconnu",
};

// "FR" → "France" en français. Peut manquer sur de vieux navigateurs : dans ce
// cas on garde le nom anglais renvoyé par GoatCounter.
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["fr"], { type: "region" });
} catch {
  /* Intl.DisplayNames absent : repli sur le libellé serveur */
}

const countryRow = (row) => {
  const id = typeof row.id === "string" ? row.id.toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(id)) return { ...row, label: "Inconnu" };
  const flag = String.fromCodePoint(...[...id].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  let name = row.label;
  try {
    name = regionNames?.of(id) ?? row.label;
  } catch {
    /* code hors ISO : nom serveur */
  }
  return { ...row, label: `${flag} ${name}` };
};

const formatRange = (range) => {
  if (!range?.start || !range?.end) return null;
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return `${range.start} → ${range.end}`;
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(start)} → ${dayMonthYear.format(end)}`;
};

const messageForError = (payload, status) => {
  if (status === 401) return "Phrase incorrecte.";
  if (payload?.error === "not_configured")
    return "La variable STATS_PASSPHRASE n'est pas définie côté Vercel.";
  if (payload?.error === "token_missing")
    return "GOATCOUNTER_CODE ou GOATCOUNTER_API_TOKEN n'est pas défini côté Vercel.";
  if (payload?.error === "upstream")
    return `L'API GoatCounter a refusé la requête — ${payload.detail ?? "sans détail"}`;
  return "Erreur inattendue.";
};

const fetchStats = async (key, days) => {
  try {
    const response = await fetch(`/api/stats?days=${days}`, {
      headers: { "x-stats-key": key },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      return { ok: false, status: response.status, message: messageForError(payload, response.status) };
    return { ok: true, payload };
  } catch (networkError) {
    return { ok: false, status: 0, message: `Requête impossible — ${networkError.message}` };
  }
};

// Le header du site, à l'identique (mêmes classes que ProNavbar) ; seule la
// zone de droite change : rappel que la page est privée, et de quoi la
// re-verrouiller. Les liens centraux ramènent aux sections de l'accueil.
const StatsNavbar = ({ onLock }) => (
  <nav className="pro-nav">
    <div className="pro-container pro-nav__inner">
      <Link to="/" className="pro-nav__brand">
        <img src={logo} alt="Logo JA" />
        <span>jeremy.angulo</span>
      </Link>

      <div className="pro-nav__links">
        <Link to="/#expertises">Expertises</Link>
        <Link to="/#parcours">Parcours</Link>
        <Link to="/#contact">Contact</Link>
      </div>

      <div className="pro-nav__right">
        <span className="stats-nav-badge">
          <FiLock aria-hidden="true" />
          Page privée
        </span>
        {onLock ? (
          <button type="button" className="stats-nav-lock" onClick={onLock}>
            Verrouiller
          </button>
        ) : null}
      </div>
    </div>
  </nav>
);

// Un classement en barres horizontales. Les parts sont calculées sur le total
// des lignes affichées : chaque carte est cohérente avec elle-même, même quand
// les pipelines GoatCounter (hits vs breakdowns) ne sont pas synchrones.
const BarList = ({ rows: allRows }) => {
  // GoatCounter renvoie certaines catégories même à zéro (les tailles d'écran
  // notamment) : des lignes « 0 · 0 % » n'apprennent rien, on les tait.
  const rows = allRows?.filter((row) => (row.pageviews ?? 0) > 0);
  if (!rows?.length) return <p className="stats-empty">Aucune donnée sur la période.</p>;

  const max = Math.max(...rows.map((row) => row.pageviews ?? 0), 1);
  const sum = rows.reduce((acc, row) => acc + (row.pageviews ?? 0), 0);

  return (
    <ul className="stats-rows">
      {rows.map((row, index) => {
        const value = row.pageviews ?? 0;
        return (
          <li className="stats-row" key={`${row.label}-${index}`}>
            <div className="stats-row__line">
              <span className="stats-row__label" title={row.title ?? row.label}>
                {row.label}
              </span>
              <span className="stats-row__value">
                {nf.format(value)}
                {sum > 0 ? <em>{Math.round((value / sum) * 100)} %</em> : null}
              </span>
            </div>
            <span className="stats-row__track" aria-hidden="true">
              <span
                className="stats-row__fill"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const StatsCard = ({ icon, title, unit, controls, className, children }) => (
  <section className={`stats-card${className ? ` ${className}` : ""}`}>
    <header className="stats-card__head">
      <span className="stats-card__icon">{icon}</span>
      <h2 className="stats-card__title">{title}</h2>
      {unit || controls ? (
        <div className="stats-card__meta">
          {unit ? <span className="stats-card__unit">{unit}</span> : null}
          {controls}
        </div>
      ) : null}
    </header>
    {children}
  </section>
);

// Statut Better Stack : section bonus, absente de la réponse si les variables
// BETTERSTACK_* ne sont pas configurées côté Vercel — on ne l'affiche alors pas.
const UptimeCard = ({ uptime }) => {
  const up = uptime.status === "up";
  return (
    <StatsCard icon={<FiActivity />} title="Disponibilité" className="stats-uptime">
      <div className="stats-uptime__row">
        <span className={`stats-uptime__dot${up ? " is-up" : " is-down"}`} aria-hidden="true" />
        <span className="stats-uptime__status">
          {up ? "En ligne" : uptime.status === "unknown" ? "Statut inconnu" : "Interruption en cours"}
        </span>
      </div>
      <p className="stats-uptime__value">
        {uptime.availability != null ? `${uptime.availability.toFixed(2).replace(".", ",")} %` : "—"}
      </p>
      <p className="stats-uptime__label">
        Disponibilité sur la période
        {uptime.incidents != null
          ? ` · ${uptime.incidents === 0 ? "aucune interruption" : `${uptime.incidents} interruption${uptime.incidents > 1 ? "s" : ""}`}`
          : ""}
      </p>
      <p className="stats-uptime__source">Surveillance Better Stack, contrôle toutes les 3 minutes.</p>
    </StatsCard>
  );
};

// Ce que les gens lisent réellement (sections vues, profondeur de scroll) et
// les gestes à forte intention déjà suivis en évènements GoatCounter (voir
// src/analytics.jsx) mais jamais affichés jusqu'ici.
const MiniList = ({ label, rows }) => (
  <div className="stats-mini">
    <h3 className="stats-mini__title">{label}</h3>
    <BarList rows={rows} />
  </div>
);

const ContentCard = ({ content }) => (
  <StatsCard icon={<FiBookOpen />} title="Contenu" unit="évènements" className="stats-content">
    <div className="stats-mini-grid">
      <MiniList label="Sections lues" rows={content.sections} />
      <MiniList label="Profondeur de lecture" rows={content.scrollDepth} />
      <MiniList label="Temps passé par page" rows={content.timeOnPage} />
      <MiniList label="Intentions" rows={content.intents} />
    </div>
  </StatsCard>
);

// Langue d'affichage et bascule jour/nuit : deux gestes qui disent comment on
// se déplace entre les deux facettes du portfolio, suivis comme évènements
// GoatCounter (FacetToggle.jsx, useLanguageTracking dans analytics.jsx).
const LanguageCard = ({ content }) => (
  <StatsCard icon={<FiSliders />} title="Langue &amp; bascule jour/nuit" unit="évènements" className="stats-content">
    <div className="stats-mini-grid">
      <MiniList label="Langue" rows={content.languages} />
      <MiniList label="Bascule jour ↔ nuit" rows={content.facetSwitches} />
    </div>
  </StatsCard>
);

// Ce qui se passe dans le monde 3D au-delà d'où l'on va (la heatmap) : quels
// lieux nommés sont découverts, quels succès sont débloqués — voir
// folio/sources/Game/Telemetry.js (zone_enter) et Achievements.js
// (achievement_unlock). Aucune limite de rétention ici : ce sont des
// évènements GoatCounter, pas la source Better Stack à 3 jours de la heatmap.
const GameCard = ({ game }) => (
  <StatsCard icon={<FiAward />} title="Points d'intérêt &amp; succès (monde 3D)" unit="évènements" className="stats-content">
    <div className="stats-mini-grid">
      <MiniList label="Zones découvertes" rows={game.zones} />
      <MiniList label="Succès débloqués" rows={game.achievements} />
    </div>
  </StatsCard>
);

const pageEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

const StatsPage = () => {
  const [key, setKey] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState(31);
  const [tab, setTab] = useState("audience");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const forget = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : sans effet */
    }
  };

  const load = async (currentKey, currentDays) => {
    setBusy(true);
    setError(null);
    const result = await fetchStats(currentKey, currentDays);
    if (result.ok) {
      setData(result.payload);
    } else {
      setError(result.message);
      // Phrase révoquée entre-temps : retour à la grille d'entrée.
      if (result.status === 401) {
        forget();
        setKey("");
        setData(null);
      }
    }
    setBusy(false);
  };

  // Chargement au premier rendu si le navigateur a retenu la phrase.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (key) load(key, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La grille ne bascule vers le tableau de bord qu'une fois la phrase
  // acceptée par l'API : pas d'aller-retour visuel sur une phrase fausse.
  const unlock = async (event) => {
    event.preventDefault();
    const candidate = draft.trim();
    if (!candidate || busy) return;
    setBusy(true);
    setError(null);
    const result = await fetchStats(candidate, days);
    if (result.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, candidate);
      } catch {
        /* mode privé : la phrase ne sera pas retenue, la page marche quand même */
      }
      setKey(candidate);
      setData(result.payload);
      setDraft("");
    } else {
      setError(result.message);
    }
    setBusy(false);
  };

  const lock = () => {
    forget();
    setKey("");
    setData(null);
    setError(null);
    setDraft("");
  };

  const changeDays = (next) => {
    if (next === days || busy) return;
    setDays(next);
    load(key, next);
  };

  if (!key) {
    return (
      <motion.div className="pro-root stats-root" {...pageEnter}>
        <StatsNavbar />
        <main className="stats-gate">
          <div className="pro-container stats-gate__inner">
            <motion.form
              className="stats-gate__card"
              onSubmit={unlock}
              variants={rise}
              initial="hidden"
              animate="show"
            >
              <span className="stats-gate__icon" aria-hidden="true">
                <FiBarChart2 />
              </span>
              <p className="pro-section__eyebrow">Page privée</p>
              <h1 className="pro-display stats-gate__title">Statistiques du site</h1>
              <p className="stats-gate__text">
                Fréquentation, pages consultées, provenance et disponibilité de
                jeremyangulo.fr. La consultation demande la phrase d'accès.
              </p>
              <label className="stats-gate__field">
                Phrase d'accès
                <input
                  type="password"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                />
              </label>
              <button
                type="submit"
                className="pro-btn pro-btn--primary stats-gate__submit"
                disabled={busy}
              >
                {busy ? "Vérification…" : "Consulter"}
              </button>
              {error ? (
                <p className="stats-alert" role="alert">
                  {error}
                </p>
              ) : null}
            </motion.form>
          </div>
        </main>
        <ProFooter />
      </motion.div>
    );
  }

  const totals = data?.totals;

  const paths = data?.paths;
  const referrers = data?.referrers?.map((row) => {
    if (row.label === "(non renseigné)") return { ...row, label: "Accès direct ou inconnu" };
    return { ...row, label: row.label.replace(/^www\./, "") };
  });
  const countries = data?.countries?.map(countryRow);
  const devices = data?.devices?.map((row) => ({
    ...row,
    label: DEVICE_LABELS[row.id] ?? row.label,
  }));

  const TABS = [
    { id: "audience", label: "Audience", icon: <FiCompass /> },
    { id: "comportement", label: "Comportement", icon: <FiBookOpen /> },
    { id: "monde3d", label: "Monde 3D", icon: <FiMap /> },
    ...(data?.uptime ? [{ id: "infra", label: "Infrastructure", icon: <FiActivity /> }] : []),
  ];

  return (
    <motion.div className="pro-root stats-root" {...pageEnter}>
      <StatsNavbar onLock={lock} />
      <main className="stats-main">
        <div className="pro-container">
          <motion.header
            className="stats-head"
            variants={rise}
            initial="hidden"
            animate="show"
          >
            <div>
              <p className="pro-section__eyebrow">Page privée</p>
              <h1 className="pro-display stats-head__title">Audience du site</h1>
              <p className="stats-head__sub">
                jeremyangulo.fr · {formatRange(data?.range) ?? `${days} derniers jours`}
              </p>
            </div>
            <div className="stats-head__controls">
              <button
                type="button"
                className={`stats-refresh${busy ? " is-busy" : ""}`}
                onClick={() => load(key, days)}
                disabled={busy}
                aria-label="Rafraîchir"
                title="Rafraîchir"
              >
                <FiRefreshCw aria-hidden="true" />
              </button>
            </div>
          </motion.header>

          {error ? (
            <p className="stats-alert" role="alert">
              {error}
            </p>
          ) : null}

          {!data && busy ? (
            <p className="stats-loading">
              <FiRefreshCw aria-hidden="true" /> Chargement des données…
            </p>
          ) : null}

          {data ? (
            <motion.div
              className={`stats-body${busy ? " is-busy" : ""}`}
              variants={rise}
              initial="hidden"
              animate="show"
              custom={1}
            >
              <section className="stats-kpis" aria-label="Totaux de la période">
                <div className="stats-kpi">
                  <p className="stats-kpi__value">{totals ? nf.format(totals.pageviews) : "—"}</p>
                  <p className="stats-kpi__label">
                    Pages vues
                    {totals?.changePercent != null ? (
                      <span
                        className={`stats-kpi__delta${totals.changePercent < 0 ? " is-down" : " is-up"}`}
                        title="Par rapport à la période équivalente précédente"
                      >
                        {totals.changePercent > 0 ? <FiTrendingUp aria-hidden="true" /> : <FiTrendingDown aria-hidden="true" />}
                        {Math.abs(totals.changePercent).toFixed(1).replace(".", ",")} %
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="stats-kpi">
                  <p className="stats-kpi__value">
                    {totals ? nf.format(totals.average) : "—"}
                  </p>
                  <p className="stats-kpi__label">Moyenne par jour</p>
                </div>
                <div className="stats-kpi">
                  <p className="stats-kpi__value">{totals ? nf.format(totals.peak) : "—"}</p>
                  <p className="stats-kpi__label">Meilleur jour</p>
                </div>
              </section>

              <StatsCard
                icon={<FiTrendingUp />}
                title="Évolution"
                unit="pages vues / jour"
                className="stats-trend-card"
                controls={
                  <div
                    className="stats-seg stats-seg--chart"
                    role="group"
                    aria-label="Période affichée sur tout le tableau de bord"
                  >
                    {RANGES.map((range) => (
                      <button
                        key={range.days}
                        type="button"
                        className={range.days === days ? "is-active" : ""}
                        onClick={() => changeDays(range.days)}
                        disabled={busy}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                }
              >
                <TrendChart series={data.series ?? []} key={days} />
              </StatsCard>

              <nav className="stats-tabs" role="tablist" aria-label="Sections des statistiques">
                {TABS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === section.id}
                    className={`stats-tabs__item${tab === section.id ? " is-active" : ""}`}
                    onClick={() => setTab(section.id)}
                  >
                    <span className="stats-tabs__icon" aria-hidden="true">
                      {section.icon}
                    </span>
                    {section.label}
                  </button>
                ))}
              </nav>

              <div className="stats-grid">
                {tab === "audience" ? (
                  <>
                    <StatsCard icon={<FiFileText />} title="Pages" unit="pages vues">
                      <BarList rows={paths} />
                    </StatsCard>
                    <StatsCard icon={<FiCompass />} title="Provenance" unit="pages vues">
                      <BarList rows={referrers} />
                    </StatsCard>
                    <StatsCard icon={<FiGlobe />} title="Pays" unit="pages vues">
                      <BarList rows={countries} />
                    </StatsCard>
                    <StatsCard icon={<FiMonitor />} title="Appareils" unit="pages vues" className="stats-content">
                      <div className="stats-mini-grid">
                        <MiniList label="Taille d'écran" rows={devices} />
                        <MiniList label="Navigateur" rows={data.browsers} />
                        <MiniList label="Système" rows={data.systems} />
                      </div>
                    </StatsCard>
                  </>
                ) : null}
                {tab === "comportement" ? (
                  <>
                    <ContentCard content={data.content} />
                    <LanguageCard content={data.content} />
                  </>
                ) : null}
                {tab === "monde3d" ? (
                  <>
                    <GameCard game={data.game} />
                    {data.heatmap ? (
                      <StatsCard icon={<FiMap />} title="Exploration du monde 3D" unit="visites de zone" className="stats-heatmap-card">
                        <HeatmapCard heatmap={data.heatmap} />
                      </StatsCard>
                    ) : null}
                  </>
                ) : null}
                {tab === "infra" && data.uptime ? <UptimeCard uptime={data.uptime} /> : null}
              </div>

              <p className="stats-note">
                Audience : GoatCounter, historique conservé sans limite de durée. GoatCounter ne
                transmet que des pages vues, pas de visiteurs uniques — tous les chiffres
                ci-dessus, y compris les totaux, en comptent. Pages, Provenance, Pays et Appareils
                comptent des pages vues ; Contenu, Langue &amp; bascule et Points d'intérêt &amp;
                succès comptent des évènements distincts (une lecture de section, un changement de
                langue, une entrée dans une zone…). Les pourcentages se rapportent au total de
                chaque carte, et la variation sous « Pages vues » compare à la période équivalente
                juste avant celle affichée.
                {data?.truncated ? " Liste des pages limitée aux 100 premières." : ""}
                {data.uptime ? " Disponibilité : Better Stack, un contrôle toutes les 3 minutes depuis 4 régions." : ""}
                {data.heatmap ? " Exploration 3D (carte) : compteurs de zone anonymes (aucune position brute, aucun identifiant), rétention Better Stack limitée à 3 jours — elle ne montre donc que l'activité récente, contrairement aux zones et succès listés juste au-dessus (des évènements GoatCounter, sans limite de rétention)." : ""}
              </p>
            </motion.div>
          ) : null}
        </div>
      </main>
      <ProFooter />
    </motion.div>
  );
};

export default StatsPage;
