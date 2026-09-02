// src/poc/nuit-3/GlobeStatique.jsx
// Repli de la clairière du contact : sans WebGL, ou en mouvement réduit, le
// globe de points cède la place à un disque CSS immobile — même palette, même
// place, aucun coût.

import React from "react";

const GlobeStatique = ({ label }) => (
  <div className="n3-globe" role="presentation" title={label}>
    <span className="n3-globe__disque" />
    <span className="n3-globe__anneau" />
  </div>
);

export default GlobeStatique;
