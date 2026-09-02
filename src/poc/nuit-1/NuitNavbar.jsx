// src/poc/nuit-1/NuitNavbar.jsx
// Navbar locale au POC : même squelette et mêmes cotes que `.night-nav`
// (66 px, fixe, flou 14 px), mais les liens visent /poc/nuit-1 et le toggle
// jour/nuit emmène vers l'homologue /poc/jour-1.
//
// `Navbar.jsx` du site ne prend aucune prop : chaque POC embarque la sienne.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logo } from "../../assets";
import FacetToggle from "../../components/FacetToggle";
import LangSwitch from "../../i18n/LangSwitch";

const SEUIL_DEFILEMENT = 80;

const NuitNavbar = ({ nav }) => {
  const [defilee, setDefilee] = useState(false);

  // Écouteur passif, throttlé en rAF : aucune lecture de layout, un seul
  // changement de classe (fond et filet), jamais un déplacement.
  useEffect(() => {
    let rafId = 0;
    const evaluer = () => {
      rafId = 0;
      setDefilee(window.scrollY > SEUIL_DEFILEMENT);
    };
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(evaluer);
    };
    evaluer();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <header>
      <nav className={`nuit1-nav${defilee ? " nuit1-nav--defilee" : ""}`}>
        <div className="nuit1-container nuit1-nav__inner">
          <Link
            to="/poc/nuit-1"
            className="nuit1-nav__brand"
            onClick={() => window.scrollTo(0, 0)}
          >
            <img src={logo} alt="Logo JA" />
            <span>jeremy.angulo</span>
          </Link>

          <div className="nuit1-nav__links">
            <Link to="/poc/nuit-1#project">{nav.projects}</Link>
            <Link to="/poc/nuit-1#experience">{nav.experience}</Link>
            <Link to="/poc/nuit-1#contact">{nav.contact}</Link>
          </div>

          <div className="nuit1-nav__right">
            <LangSwitch mode="night" />
            {/* `to` : prop optionnelle de FacetToggle, comportement par défaut
                inchangé sur le site. */}
            <FacetToggle mode="night" to="/poc/jour-1" />
            <Link to="/poc/nuit-1#contact" className="nuit1-nav__cta">
              {nav.cta}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NuitNavbar;
