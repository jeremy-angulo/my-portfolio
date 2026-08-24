// src/components/Navbar.jsx
// Navbar de la facette nuit : même squelette que la navbar du jour (ProNavbar),
// pour que la bascule jour/nuit se fasse sans que rien ne bouge.

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
    <nav className="night-nav">
      <div className="night-container night-nav__inner">
        <Link
          to="/tech"
          className="night-nav__brand"
          onClick={() => { window.scrollTo(0, 0); }}
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
          {/* Le CTA occupe la même place que "Me contacter" côté jour :
              le toggle ne bouge pas d'un pixel en basculant de facette. */}
          {isResumePage ? (
            <Link to="/tech" className="night-nav__back">
              {nav.back}
            </Link>
          ) : (
            <Link to="/tech#contact" className="night-nav__cta">
              {nav.cta}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
