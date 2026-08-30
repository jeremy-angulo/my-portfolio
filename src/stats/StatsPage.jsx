// src/stats/StatsPage.jsx — page privée /statistiques.
//
// Volontairement non liée depuis le site et marquée noindex : elle n'est pas
// secrète au sens cryptographique, mais elle ne doit ni se trouver par
// navigation, ni remonter dans un moteur de recherche. La vraie protection est
// côté serveur, dans api/stats.js : sans la phrase, l'API ne répond rien.

import React, { useCallback, useEffect, useState } from "react";
import "./StatsPage.scss";

const STORAGE_KEY = "stats-key";
const RANGES = [7, 31, 90, 365];
const rangeLabel = (r) => (r === 365 ? "1 an" : `${r} jours`);

const nf = new Intl.NumberFormat("fr-FR");

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

const Bars = ({ rows, valueKey = "visitors", total }) => {
  if (!rows?.length) return <p className="stats-empty">Aucune donnée sur la période.</p>;

  const max = Math.max(...rows.map((r) => r[valueKey] ?? 0), 1);

  return (
    <div className="stats-bars">
      {rows.map((row, i) => {
        const value = row[valueKey] ?? 0;
        return (
          <div className="stats-bar-row" key={`${row.label}-${i}`}>
            <span className="stats-bar-label" title={row.label || "(non renseigné)"}>
              {row.label || "(non renseigné)"}
            </span>
            <span className="stats-bar-track">
              <span className="stats-bar-fill" style={{ width: `${(value / max) * 100}%` }} />
            </span>
            <span className="stats-bar-value">
              {nf.format(value)}
              {total ? <em> · {Math.round((value / total) * 100)} %</em> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
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
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (currentKey, currentDays) => {
      if (!currentKey) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stats?days=${currentDays}`, {
          headers: { "x-stats-key": currentKey },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setError(messageForError(payload, response.status));
          setData(null);
          if (response.status === 401) {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              /* stockage indisponible : sans effet */
            }
            setKey("");
          }
          return;
        }

        setData(payload);
      } catch (networkError) {
        setError(`Requête impossible — ${networkError.message}`);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(key, days);
  }, [key, days, load]);

  const submit = (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* mode privé : la phrase ne sera pas retenue, la page marche quand même */
    }
    setKey(value);
    setDraft("");
  };

  if (!key) {
    return (
      <main className="stats">
        <form className="stats-gate" onSubmit={submit}>
          <h1>Statistiques</h1>
          <p>Page privée. Saisis la phrase d'accès.</p>
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Phrase d'accès"
            autoFocus
          />
          <button type="submit">Entrer</button>
          {error ? <p className="stats-error">{error}</p> : null}
        </form>
      </main>
    );
  }

  const totals = data?.totals;

  return (
    <main className="stats">
      <header className="stats-head">
        <div>
          <h1>Statistiques</h1>
          <p className="stats-sub">
            jeremyangulo.fr · {data?.range ? `${data.range.start} → ${data.range.end}` : "…"}
          </p>
        </div>
        <div className="stats-actions">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={r === days ? "is-active" : ""}
              onClick={() => setDays(r)}
            >
              {rangeLabel(r)}
            </button>
          ))}
          <button type="button" onClick={() => load(key, days)} disabled={loading}>
            {loading ? "…" : "Rafraîchir"}
          </button>
        </div>
      </header>

      {error ? <p className="stats-error">{error}</p> : null}

      {totals ? (
        <div className="stats-figures">
          <div className="stats-figure">
            <span className="n">{nf.format(totals.visitors ?? 0)}</span>
            <span className="l">visiteurs</span>
          </div>
          <div className="stats-figure">
            <span className="n">{nf.format(totals.pageviews ?? 0)}</span>
            <span className="l">pages vues</span>
          </div>
          <div className="stats-figure">
            <span className="n">
              {totals.visitors ? (totals.pageviews / totals.visitors).toFixed(1) : "—"}
            </span>
            <span className="l">pages par visiteur</span>
          </div>
        </div>
      ) : null}

      <section>
        <h2>Pages</h2>
        <Bars rows={data?.paths} valueKey="pageviews" total={totals?.pageviews} />
      </section>

      <section>
        <h2>Appareils</h2>
        <Bars rows={data?.devices} valueKey="pageviews" total={totals?.pageviews} />
      </section>

      <section>
        <h2>Pays</h2>
        <Bars rows={data?.countries} valueKey="pageviews" total={totals?.pageviews} />
      </section>

      <section>
        <h2>Provenance</h2>
        <Bars rows={data?.referrers} valueKey="pageviews" total={totals?.pageviews} />
      </section>

      <footer className="stats-foot">
        <p>
          Source : GoatCounter, sans purge d'historique. Les répartitions par page, appareil,
          pays et provenance comptent des pages vues (une même personne peut apparaître
          plusieurs fois) ; seuls les totaux en haut de page comptent des visiteurs distincts.
        </p>
      </footer>
    </main>
  );
};

export default StatsPage;
