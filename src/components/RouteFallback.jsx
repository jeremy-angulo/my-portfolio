// src/components/RouteFallback.jsx — écran d'attente de la route /statistiques,
// chargée à la demande : le temps que son chunk arrive, le fond ivoire de la
// facette jour, la marque et un filet de progression — plutôt qu'un aplat
// vide. Invisible les 150 premières ms (voir le .scss) : un chunk déjà en
// cache ne le fait jamais clignoter.

import React from "react";
import { logo } from "../assets";
import "./RouteFallback.scss";

const RouteFallback = ({ label, hint = "Chargement…" }) => (
  <div className="route-fallback" role="status" aria-live="polite">
    <div className="route-fallback__inner">
      <img className="route-fallback__mark" src={logo} alt="" />
      {label ? <p className="route-fallback__label">{label}</p> : null}
      <span className="route-fallback__track" aria-hidden="true">
        <span className="route-fallback__bar" />
      </span>
      <p className="route-fallback__hint">{hint}</p>
    </div>
  </div>
);

export default RouteFallback;
