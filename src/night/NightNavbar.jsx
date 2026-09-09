// src/night/NightNavbar.jsx
// Navbar de la page /tech : mêmes cotes que la navbar du jour (`.pro-nav`) et
// que celle des pages nuit annexes (`.night-pagenav`, src/components/Navbar.jsx),
// pour que la bascule jour/nuit ne déplace rien.
//
// Elle se ferme au défilement — le fond s'opacifie, le filet s'éclaire —
// sans jamais changer de hauteur ni de position.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logo } from "../assets";
import FacetToggle from "../components/FacetToggle";
import LangSwitch from "../i18n/LangSwitch";

const SEUIL_DEFILEMENT = 80;

const NightNavbar = ({ nav }) => {
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
      <nav className={`night-nav${defilee ? " night-nav--defilee" : ""}`}>
        <div className="night-container night-nav__inner">
          <Link
            to="/tech"
            className="night-nav__brand"
            onClick={() => window.scrollTo(0, 0)}
          >
            <img src={logo} alt="Logo JA" />
            <span>jeremy.angulo</span>
          </Link>

          <div className="night-nav__links">
            <Link to="/tech#project">{nav.projects}</Link>
            <Link to="/tech#experience">{nav.experience}</Link>
            <Link to="/tech#contact">{nav.contact}</Link>
          </div>

          <div className="night-nav__right">
            <LangSwitch mode="night" />
            <FacetToggle mode="night" />
            {/* Le CTA occupe la même place que « Me contacter » côté jour :
                le toggle ne bouge pas d'un pixel en basculant de facette. */}
            <Link to="/tech#contact" className="night-nav__cta">
              {nav.cta}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NightNavbar;
