// src/stats/StatsPage.jsx — page privée /statistiques, habillée comme la
// facette jour : même navbar, mêmes tokens ivoire/encre/ambre (pro.scss).
//
// Volontairement non liée depuis le site et marquée noindex : elle n'est pas
// secrète au sens cryptographique, mais elle ne doit ni se trouver par
// navigation, ni remonter dans un moteur de recherche. La vraie protection est
// côté serveur, dans api/stats.js : sans la phrase, l'API ne répond rien.
//
// Coquille : toute la logique de données vit dans useStatsData, les tuiles
// dans Dashboard. Ici, seulement la grille d'entrée, l'en-tête, la barre
// d'outils, et le choix entre squelette, écran d'erreur, bandeau et mosaïque.

import React, { useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import ProFooter from "../pro/ProFooter";
import { rise } from "../pro/proMotion";
import useStatsData from "./useStatsData";
import StatsGate from "./StatsGate";
import StatsNavbar from "./StatsNavbar";
import StatsToolbar from "./StatsToolbar";
import Skeleton from "./Skeleton";
import Dashboard from "./Dashboard";
import StatsError from "./StatsError";
import { formatRange, loadingLabel, timeHM } from "./format";
import "../pro/pro.scss";
import "./StatsPage.scss";

// Entrée de page en opacité seule : aucune translation sur la racine, sinon
// la barre d'outils collante perdrait son conteneur de positionnement.
const pageEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

// Média query suivie en direct (plage sous le H1 < 900, hauteur de courbe).
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);

  return matches;
};

const StatsPage = () => {
  const {
    key,
    draft,
    setDraft,
    days,
    data,
    error,
    errorKind,
    busy,
    switching,
    loadingDays,
    loadedAt,
    changeDays,
    refresh,
    unlock,
    lock,
  } = useStatsData();

  const wide = useMediaQuery("(min-width: 900px)");
  const tablet = useMediaQuery("(max-width: 1023px)");
  const mobile = useMediaQuery("(max-width: 600px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const chartHeight = mobile ? 200 : tablet ? 240 : 232;

  // Une requête attendue à l'écran (premier chargement, bascule non cachée,
  // rafraîchissement de la période affichée) : c'est elle, et elle seule, qui
  // justifie squelette, spinner, filet et `aria-busy`.
  const loading = loadingDays != null;

  // Arrivée avec un hash (#lecture…) : un seul défilement, une fois la
  // mosaïque montée — les cibles n'existent pas avant. Les entrées `rise`
  // (translation) sont alors sautées : un scrollIntoView pendant la
  // translation alignerait la cible 28 px trop bas.
  const hashArrival = useRef(typeof window !== "undefined" && Boolean(window.location.hash));
  const hashDone = useRef(false);
  useEffect(() => {
    if (!data || hashDone.current) return;
    hashDone.current = true;
    const id = window.location.hash.slice(1);
    if (!id) return;
    // `instant` : un saut initial n'est jamais lissé, et `auto` hériterait
    // du `scroll-behavior: smooth` global du site (index.css).
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data]);

  // Une seule racine animée pour la grille ET le tableau de bord : le fondu
  // d'entrée ne se rejoue pas au déverrouillage (la racine n'est pas
  // remontée, seuls ses enfants changent). `MotionConfig reducedMotion="user"`
  // coupe les translations de `rise` sous prefers-reduced-motion — le bloc
  // CSS global ne peut pas atteindre ces animations pilotées en JS ; le fondu
  // de `rise` est lui aussi sauté (`entrance`), seul reste celui de la page.
  if (!key) {
    return (
      <MotionConfig reducedMotion="user">
        <motion.div className="pro-root stats-root" {...pageEnter}>
          <StatsGate draft={draft} setDraft={setDraft} busy={busy} error={error} onSubmit={unlock} />
        </motion.div>
      </MotionConfig>
    );
  }

  // Rien à l'écran et un échec : l'écran d'erreur, centré dans l'espace
  // restant. Avec des chiffres déjà affichés, un simple bandeau au-dessus.
  const errorPage = Boolean(error && !data && !loading);

  // Sous-titre : ≥ 900 px une phrase fixe (la plage est dans la barre) ;
  // < 900 px la plage et l'heure de chargement, ou l'état de chargement.
  let sub = "jeremyangulo.fr · pages vues et évènements, pas de visiteurs uniques";
  if (!wide) {
    let detail = null;
    if (loading) {
      detail = loadingLabel(loadingDays);
    } else {
      const range = formatRange(data?.range);
      if (range) detail = loadedAt ? `${range} · chargé à ${timeHM.format(loadedAt)}` : range;
    }
    sub = detail ? `jeremyangulo.fr · ${detail}` : "jeremyangulo.fr";
  }

  const entrance = !hashArrival.current && !reducedMotion;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="pro-root stats-root" {...pageEnter}>
        <StatsNavbar onLock={lock} />
        <main className="stats-main">
          <div className="pro-container">
            <motion.header
              className="stats-head"
              variants={rise}
              initial={entrance ? "hidden" : false}
              animate="show"
            >
              <p className="pro-section__eyebrow">Page privée</p>
              <h1 className="pro-display stats-head__title">Statistiques</h1>
              <p className="stats-head__sub">{sub}</p>
            </motion.header>
          </div>

          <StatsToolbar
            days={days}
            onChange={changeDays}
            onRefresh={refresh}
            busy={busy}
            switching={switching}
            loadingDays={loadingDays}
            data={data}
            loadedAt={loadedAt}
            showRange={wide}
          />

          <div className={`pro-container stats-body${errorPage ? " stats-body--center" : ""}`}>
            {error && data ? (
              <div className="stats-alert" role="alert">
                <FiAlertCircle className="stats-alert__icon" aria-hidden="true" />
                <span className="stats-alert__text">{error}</span>
                <button type="button" className="stats-alert__retry" onClick={refresh}>
                  <FiRefreshCw aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            ) : null}

            {errorPage ? (
              <StatsError kind={errorKind} message={error} onRetry={refresh} entrance={entrance} />
            ) : null}

            {/* Le squelette reste monté tant qu'aucune donnée n'est affichée et
                qu'une requête est attendue — y compris quand un clic pendant
                le squelette a changé la cible (la réponse des 7 jours est
                alors ignorée, celle de la nouvelle période est en route). */}
            {!data && loading ? <Skeleton chartHeight={chartHeight} /> : null}
            {data ? (
              <Dashboard
                data={data}
                days={days}
                chartHeight={chartHeight}
                busy={loading}
                entrance={entrance}
              />
            ) : null}
          </div>
        </main>
        <ProFooter />
      </motion.div>
    </MotionConfig>
  );
};

export default StatsPage;
