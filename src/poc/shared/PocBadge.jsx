// src/poc/shared/PocBadge.jsx
// Repère discret présent sur les six POC : rappelle où l'on est et ramène à la
// page de comparaison. Jamais animé.

import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../i18n/LanguageContext";
import "./PocBadge.scss";

const DICT = {
  fr: { compare: "← comparer" },
  en: { compare: "← compare" },
};

/**
 * @param {{ slug: string, className?: string }} props
 */
const PocBadge = ({ slug, className }) => {
  const { lang } = useLang();
  const dict = DICT[lang] ?? DICT.fr;
  // Thème déduit du slug : aucune prop de facette à tenir à jour.
  const nuit = String(slug ?? "").startsWith("nuit");

  return (
    <Link
      to="/poc"
      className={`poc-badge poc-badge--${nuit ? "night" : "day"}${className ? ` ${className}` : ""}`}
    >
      {`POC · ${slug} · ${dict.compare}`}
    </Link>
  );
};

export default PocBadge;
