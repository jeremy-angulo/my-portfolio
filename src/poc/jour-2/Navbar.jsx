// src/poc/jour-2/Navbar.jsx
// Copie locale de ProNavbar : mêmes classes `.pro-nav`, même géométrie (66 px,
// CTA min-width 132 px). Seule différence : le FacetToggle vise l'homologue
// nuit du POC. ProNavbar ne prend aucune prop et est hors périmètre.

import React from "react";
import { logo } from "../../assets";
import FacetToggle from "../../components/FacetToggle";
import LangSwitch from "../../i18n/LangSwitch";
import { useProContent } from "../../i18n/useContent";

const Navbar = () => {
  const { proUi } = useProContent();

  const scrollTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="pro-nav">
      <div className="pro-container pro-nav__inner">
        <a href="#top" className="pro-nav__brand" onClick={scrollTop}>
          <img src={logo} alt="Logo JA" />
          <span>jeremy.angulo</span>
        </a>

        <div className="pro-nav__links">
          <a href="#expertises">{proUi.nav.expertises}</a>
          <a href="#parcours">{proUi.nav.parcours}</a>
          <a href="#contact">{proUi.nav.contact}</a>
        </div>

        <div className="pro-nav__right">
          <LangSwitch mode="day" />
          <FacetToggle mode="day" to="/poc/nuit-2" />
          <a href="#contact" className="pro-btn pro-btn--primary">
            {proUi.nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
