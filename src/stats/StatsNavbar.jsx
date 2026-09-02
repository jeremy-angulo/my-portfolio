// src/stats/StatsNavbar.jsx — le header du site, à l'identique (mêmes classes
// que ProNavbar) ; seule la zone de droite change : rappel que la page est
// privée, et de quoi la re-verrouiller. Les liens centraux ramènent aux
// sections de l'accueil. Sans `onLock` (grille d'entrée), pas de bouton.

import React from "react";
import { Link } from "react-router-dom";
import { FiLock } from "react-icons/fi";
import { logo } from "../assets";

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
        {/* Sur petit écran, le badge se réduit au cadenas (texte masqué). */}
        <span className="stats-nav-badge" title="Page privée">
          <FiLock aria-hidden="true" />
          <span className="stats-nav-badge__text">Page privée</span>
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

export default StatsNavbar;
