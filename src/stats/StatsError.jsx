// src/stats/StatsError.jsx — écran d'erreur de /statistiques quand aucune
// donnée n'est à l'écran (premier chargement échoué) : une carte centrée,
// l'icône selon la nature de l'échec, le message brut de l'API, un conseil
// court et un seul bouton. Quand des chiffres sont déjà affichés, StatsPage
// préfère le bandeau (.stats-alert) au-dessus de la mosaïque.

import React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiCloudOff, FiRefreshCw, FiSettings, FiWifiOff } from "react-icons/fi";
import { rise } from "../pro/proMotion";
import { ERROR_COPY } from "./format";

const ICONS = {
  network: FiWifiOff,
  upstream: FiCloudOff,
  config: FiSettings,
};

// `entrance={false}` : pas de fondu d'entrée (prefers-reduced-motion).
const StatsError = ({ kind, message, onRetry, entrance = true }) => {
  const copy = ERROR_COPY[kind] ?? ERROR_COPY.unknown;
  const Icon = ICONS[kind] ?? FiAlertTriangle;

  return (
    <motion.section
      className="stats-error"
      role="alert"
      variants={rise}
      initial={entrance ? "hidden" : false}
      animate="show"
    >
      <span className="stats-error__icon" aria-hidden="true">
        <Icon />
      </span>
      <h2 className="stats-error__title">{copy.title}</h2>
      {message ? <p className="stats-error__message">{message}</p> : null}
      {copy.hint ? <p className="stats-error__hint">{copy.hint}</p> : null}
      <button
        type="button"
        className="pro-btn pro-btn--primary stats-error__retry"
        onClick={onRetry}
      >
        <FiRefreshCw aria-hidden="true" />
        Réessayer
      </button>
    </motion.section>
  );
};

export default StatsError;
