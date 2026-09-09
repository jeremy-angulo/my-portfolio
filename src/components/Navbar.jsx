// src/components/Navbar.jsx
// Navbar des pages nuit annexes — /project/:id, /cv — accessibles par URL
// directe. La page /tech, elle, embarque la sienne (src/night/NightNavbar.jsx),
// qui se ferme au défilement.
//
// Même squelette que la navbar du jour (ProNavbar), pour que la bascule
// jour/nuit se fasse sans que rien ne bouge. Ses classes portent le préfixe
// `night-pagenav` : `night-nav` appartient à la navbar de /tech.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { logo } from "../assets";
import FacetToggle from "./FacetToggle";
import LangSwitch from "../i18n/LangSwitch";
import { useNightContent } from "../i18n/useContent";
import "./Navbar.scss";

const Navbar = () => {
  const location = useLocation();
  const isResumePage = location.pathname === "/cv";
  const { nightUi } = useNightContent();
  const nav = nightUi.nav;

  return (
    <nav className="night-pagenav">
      <div className="night-pagenav-container night-pagenav__inner">
        <Link
          to="/tech"
          className="night-pagenav__brand"
          onClick={() => { window.scrollTo(0, 0); }}
        >
          <img src={logo} alt="Logo JA" />
          <span>jeremy.angulo</span>
        </Link>

        <div className="night-pagenav__links">
          <Link to="/tech#project">{nav.projects}</Link>
          <Link to="/tech#experience">{nav.experience}</Link>
          <Link to="/tech#contact">{nav.contact}</Link>
        </div>

        <div className="night-pagenav__right">
          <LangSwitch mode="night" />
          <FacetToggle mode="night" />
          {/* Le CTA occupe la même place que "Me contacter" côté jour :
              le toggle ne bouge pas d'un pixel en basculant de facette. */}
          {isResumePage ? (
            <Link to="/tech" className="night-pagenav__back">
              {nav.back}
            </Link>
          ) : (
            <Link to="/tech#contact" className="night-pagenav__cta">
              {nav.cta}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
