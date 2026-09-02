// src/poc/jour-1/Navbar.jsx
// Copie locale de ProNavbar : mêmes classes, mêmes ancres, même CTA (largeur
// figée à 132 px pour que le toggle reste au même pixel d'une facette à
// l'autre). La copie est obligatoire — ProNavbar ne prend aucune prop et le
// brief interdit de la modifier — et la seule différence est la destination du
// toggle jour/nuit, qui vise l'homologue du POC.

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
    <nav className="pro-nav j1-nav">
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
          <FacetToggle mode="day" to="/poc/nuit-1" />
          <a href="#contact" className="pro-btn pro-btn--primary">
            {proUi.nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
