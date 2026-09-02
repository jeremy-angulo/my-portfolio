// src/poc/nuit-3/NavbarNuit3.jsx
// Navbar du POC : même squelette et mêmes cotes que `.night-nav` (recopiées
// dans page.scss pour que la page se suffise en navigation froide), mais
// transparente au sommet du hero — le ciel doit courir jusqu'en haut.
// Le verre n'arrive qu'après 40 px de défilement, par l'opacité d'une couche
// de fond : aucune variation de hauteur, rien qui bouge.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { logo } from "../../assets";
import FacetToggle from "../../components/FacetToggle";
import LangSwitch from "../../i18n/LangSwitch";
import { useNightContent } from "../../i18n/useContent";

const NavbarNuit3 = () => {
  const { nightUi } = useNightContent();
  const nav = nightUi.nav;
  const [verre, setVerre] = useState(false);

  useEffect(() => {
    // scrollY est dans le repère du viewport (comme les rects) : sûr sous le
    // zoom .85 du dépôt. Un seul booléen, donc au plus deux re-renders.
    const surDefilement = () => {
      const voulu = window.scrollY > 40;
      setVerre((actuel) => (actuel === voulu ? actuel : voulu));
    };
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  return (
    <nav className={`n3-nav ${verre ? "is-verre" : ""}`}>
      <span className="n3-nav__fond" aria-hidden="true" />
      <div className="n3-container n3-nav__inner">
        <Link to="/poc/nuit-3" className="n3-nav__brand" onClick={() => window.scrollTo(0, 0)}>
          <img src={logo} alt="Logo JA" />
          <span>jeremy.angulo</span>
        </Link>

        <div className="n3-nav__links">
          <a href="#project">{nav.projects}</a>
          <a href="#experience">{nav.experience}</a>
          <a href="#contact">{nav.contact}</a>
        </div>

        <div className="n3-nav__right">
          <LangSwitch mode="night" />
          {/* La bascule mène au POC jumeau du créneau, pas à l'accueil. */}
          <FacetToggle mode="night" to="/poc/jour-3" />
          <a href="#contact" className="n3-nav__cta">
            {nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
};

export default NavbarNuit3;
