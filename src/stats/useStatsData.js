// src/stats/useStatsData.js — toute la logique de données de /statistiques
// (phrase mémorisée, cache par période, file d'appels, verrouillage,
// préchargement de l'année), extraite telle quelle de StatsPage.jsx pour que
// la page ne soit plus qu'une composition de tuiles.
//
// La vraie protection est côté serveur, dans api/stats.js : sans la phrase,
// l'API ne répond rien.

import { useEffect, useRef, useState } from "react";
import { kindForError, messageForError } from "./format";

const STORAGE_KEY = "stats-key";

const fetchStats = async (key, days) => {
  try {
    const response = await fetch(`/api/stats?days=${days}`, {
      headers: { "x-stats-key": key },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      return {
        ok: false,
        status: response.status,
        message: messageForError(payload, response.status),
        kind: kindForError(payload, response.status),
      };
    return { ok: true, payload };
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      message: `Requête impossible — ${networkError.message}`,
      kind: "network",
    };
  }
};

const useStatsData = () => {
  const [key, setKey] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // Nature de l'erreur (network / upstream / config / auth / unknown) : choisit
  // l'icône et le conseil de l'écran d'erreur, le message reste `error`.
  const [errorKind, setErrorKind] = useState(null);
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  // Période dont la requête en cours est attendue À L'ÉCRAN (null sinon) :
  // c'est elle que la barre d'outils nomme (« Chargement des 31 jours… »)
  // et qui justifie spinner, filet et `aria-busy`. Une réponse pour une
  // période abandonnée (bascule vers le cache entre-temps) n'y touche plus.
  const [loadingDays, setLoadingDays] = useState(null);

  // Cache mémoire par période (7/31/90/365) : évite de re-solliciter l'API
  // GoatCounter (7 appels séquentiels, ~9 s) à chaque bascule de bouton une
  // fois qu'une période a déjà été chargée une fois dans la session.
  const cacheRef = useRef({});
  // Heure de réception de chaque période cachée (ms) : affichée dans la barre
  // d'outils en « chargé à hh:mm ». Vidée en même temps que le cache.
  const loadedAtRef = useRef({});
  // Période réellement affichée « en ce moment » : une bascule rapide entre
  // deux périodes non cachées ne doit pas laisser une réponse arrivée en
  // retard écraser un choix plus récent.
  const activeDaysRef = useRef(7);
  // Sérialise les appels à /api/stats : deux requêtes concurrentes (ex. le
  // préchargement de fond et un clic utilisateur) déclencheraient chacune
  // leurs 7 appels GoatCounter séquentiels côté serveur, avec un risque de
  // 429 si elles se chevauchent dans le temps.
  const queueRef = useRef(Promise.resolve());
  // Requêtes en vol par période : re-demander une période déjà en route
  // (clic pendant le squelette, aller-retour rapide, préchargement de
  // l'année) attend la même réponse au lieu de refaire 7 appels GoatCounter.
  const inflightRef = useRef({});
  // Incrémenté à chaque verrouillage : une réponse partie sous une phrase
  // depuis oubliée n'affiche rien et ne remplit pas le cache.
  const sessionRef = useRef(0);

  const forget = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : sans effet */
    }
  };

  const showError = (result) => {
    setError(result.message);
    setErrorKind(result.kind ?? "unknown");
  };

  const clearError = () => {
    setError(null);
    setErrorKind(null);
  };

  const enqueue = (task) => {
    const run = () => Promise.resolve().then(task);
    const result = queueRef.current.then(run, run);
    queueRef.current = result;
    return result;
  };

  // `background: true` alimente juste le cache, sans jamais toucher l'écran —
  // utilisé pour le préchargement silencieux de l'année complète.
  const loadDays = async (currentKey, currentDays, { showBusy = false, background = false } = {}) => {
    const session = sessionRef.current;
    if (showBusy) {
      setBusy(true);
      clearError();
    }
    if (!background && activeDaysRef.current === currentDays) setLoadingDays(currentDays);
    // Une requête déjà en vol pour cette période est partagée ; sinon elle
    // prend sa place dans la file.
    const request =
      inflightRef.current[currentDays] ?? enqueue(() => fetchStats(currentKey, currentDays));
    inflightRef.current[currentDays] = request;
    const result = await request;
    if (inflightRef.current[currentDays] === request) delete inflightRef.current[currentDays];
    // Verrouillé entre-temps : la réponse est simplement ignorée.
    if (sessionRef.current !== session) return result;
    setLoadingDays((current) => (current === currentDays ? null : current));
    if (result.ok) {
      cacheRef.current[currentDays] = result.payload;
      loadedAtRef.current[currentDays] = Date.now();
      if (!background && activeDaysRef.current === currentDays) {
        setData(result.payload);
        clearError();
      }
    } else {
      if (!background && activeDaysRef.current === currentDays) {
        showError(result);
      }
      // Phrase révoquée entre-temps : retour à la grille d'entrée avec le
      // message de l'API (« Phrase incorrecte. »), même en tâche de fond.
      if (result.status === 401) {
        forget();
        setKey("");
        setData(null);
        cacheRef.current = {};
        loadedAtRef.current = {};
        inflightRef.current = {};
        showError(result);
      }
    }
    if (showBusy) setBusy(false);
    return result;
  };

  // Chargement au premier rendu si le navigateur a retenu la phrase : 7 jours
  // d'abord (rapide à l'écran), puis l'année complète en tâche de fond dès
  // que ce premier chargement se termine — elle alimente le cache pour que
  // basculer plus tard sur une période déjà préchargée soit instantané.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (key) {
      activeDaysRef.current = days;
      const session = sessionRef.current;
      loadDays(key, days, { showBusy: true }).then(() => {
        if (days !== 365 && sessionRef.current === session) loadDays(key, 365, { background: true });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La grille ne bascule vers le tableau de bord qu'une fois la phrase
  // acceptée par l'API : pas d'aller-retour visuel sur une phrase fausse.
  const unlock = async (event) => {
    event.preventDefault();
    const candidate = draft.trim();
    if (!candidate || busy) return;
    setBusy(true);
    clearError();
    activeDaysRef.current = days;
    const result = await enqueue(() => fetchStats(candidate, days));
    if (result.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, candidate);
      } catch {
        /* mode privé : la phrase ne sera pas retenue, la page marche quand même */
      }
      cacheRef.current = { [days]: result.payload };
      loadedAtRef.current = { [days]: Date.now() };
      setKey(candidate);
      setData(result.payload);
      setDraft("");
      if (days !== 365) loadDays(candidate, 365, { background: true });
    } else {
      showError(result);
    }
    setBusy(false);
  };

  // Verrouiller ne laisse aucun état en suspens : une requête encore en vol
  // (squelette initial, bascule) est ignorée à son retour, la grille est
  // utilisable tout de suite, et le prochain déverrouillage repart comme une
  // première visite (7 jours, puis l'année en tâche de fond).
  const lock = () => {
    sessionRef.current += 1;
    forget();
    setKey("");
    setData(null);
    clearError();
    setDraft("");
    setBusy(false);
    setSwitching(false);
    setLoadingDays(null);
    setDays(7);
    activeDaysRef.current = 7;
    cacheRef.current = {};
    loadedAtRef.current = {};
    inflightRef.current = {};
  };

  const changeDays = (next) => {
    if (next === days) return;
    setDays(next);
    activeDaysRef.current = next;
    const cached = cacheRef.current[next];
    if (cached) {
      // Instantané ; une bascule encore en vol vers une autre période est
      // abandonnée à l'écran (sa réponse ne fera qu'alimenter le cache), la
      // barre d'outils revient donc au repos dès maintenant.
      setData(cached);
      clearError();
      setSwitching(false);
      setLoadingDays(null);
      return;
    }
    setSwitching(true);
    loadDays(key, next).finally(() => {
      if (activeDaysRef.current === next) setSwitching(false);
    });
  };

  // Bouton « Rafraîchir » : invalide le cache de la période affichée et la
  // recharge ; le contenu reste lisible pendant l'appel, seule la barre
  // d'outils signale l'activité.
  const refresh = () => {
    delete cacheRef.current[days];
    delete loadedAtRef.current[days];
    activeDaysRef.current = days;
    loadDays(key, days, { showBusy: true });
  };

  // Lu à chaque rendu, sur la période des chiffres À L'ÉCRAN (`data.range`) :
  // après une bascule échouée, `days` est la période demandée mais la plage
  // et son heure de chargement restent celles des chiffres affichés.
  const loadedAt = loadedAtRef.current[data?.range?.days ?? days] ?? null;

  return {
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
  };
};

export default useStatsData;
