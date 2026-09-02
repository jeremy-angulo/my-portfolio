// src/poc/nuit-2/N2Navbar.jsx
// Navbar propre au POC (les navbars du site ne prennent aucune prop et sont
// hors périmètre). Même géométrie que `.night-nav` : 66 px, brand à gauche,
// liens au centre, LangSwitch + FacetToggle + CTA à droite — la bascule vers
// /poc/jour-2 ne déplace rien.
//
// Aucune barre de progression ici : c'est l'orbite de la lune, juste dessous,
// qui dit où l'on en est.

import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useMotionValueEvent } from "framer-motion";
import { logo } from "../../assets";
import FacetToggle from "../../components/FacetToggle";
import LangSwitch from "../../i18n/LangSwitch";
import { useNightContent } from "../../i18n/useContent";
import { useN2Sky } from "./skyContext";

const N2Navbar = () => {
  const { nightUi } = useNightContent();
  const nav = nightUi.nav;
  const { P } = useN2Sky();
  const barreRef = useRef(null);

  // Passé 4 % de la page, le bord bas s'accentue. Couleur seulement : rien ne
  // se déplace, et aucun re-render (classe posée à la volée).
  useMotionValueEvent(P, "change", (v) => {
    const el = barreRef.current;
    if (el) el.classList.toggle("is-scrolled", v > 0.04);
  });

  const versSection = (e, id) => {
    const cible = document.getElementById(id);
    if (!cible) return; // sections encore différées : on laisse l'ancre native agir
    e.preventDefault();
    cible.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="n2-nav" ref={barreRef}>
      <div className="n2-container n2-nav__inner">
        <Link
          to="/poc/nuit-2"
          className="n2-nav__brand"
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <img src={logo} alt="Logo JA" />
          <span>jeremy.angulo</span>
        </Link>

        <div className="n2-nav__links">
          <a href="#project" onClick={(e) => versSection(e, "project")}>
            {nav.projects}
          </a>
          <a href="#experience" onClick={(e) => versSection(e, "experience")}>
            {nav.experience}
          </a>
          <a href="#contact" onClick={(e) => versSection(e, "contact")}>
            {nav.contact}
          </a>
        </div>

        <div className="n2-nav__right">
          <LangSwitch mode="night" />
          <FacetToggle mode="night" to="/poc/jour-2" />
          <a href="#contact" className="n2-nav__cta" onClick={(e) => versSection(e, "contact")}>
            {nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default N2Navbar;
