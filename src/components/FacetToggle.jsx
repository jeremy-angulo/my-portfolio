// src/components/FacetToggle.jsx
// Interrupteur Jour / Nuit affiché dans les deux navbars : il emmène vers l'autre facette.
// Au clic, le knob glisse d'abord vers l'autre astre, puis la page bascule :
// la transition se lit sur le bouton lui-même.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSun, FiMoon } from "react-icons/fi";
import { trackEvent } from "../analytics";
import "./FacetToggle.scss";

const SWITCH_DELAY_MS = 260;

const FacetToggle = ({ mode }) => {
  const isNight = mode === "night";
  const to = isNight ? "/" : "/tech";
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const label = isNight
    ? "Passer côté jour — Business Manager"
    : "Passer côté nuit — Engineer & Builder";

  const handleClick = (e) => {
    // Laisse les ouvertures en nouvel onglet (ctrl/cmd+clic) se comporter normalement.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (switching) return;
    trackEvent("facet_switch", isNight ? "night_to_day" : "day_to_night");
    setSwitching(true);
    window.scrollTo(0, 0);
    setTimeout(() => navigate(to), SWITCH_DELAY_MS);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`facet-toggle facet-toggle--${isNight ? "night" : "day"}${
        switching ? " facet-toggle--switching" : ""
      }`}
      title={label}
      aria-label={label}
    >
      <span className="facet-toggle__icon facet-toggle__icon--sun">
        <FiSun />
      </span>
      <span className="facet-toggle__icon facet-toggle__icon--moon">
        <FiMoon />
      </span>
      <span className="facet-toggle__knob" aria-hidden="true" />
    </Link>
  );
};

export default FacetToggle;
