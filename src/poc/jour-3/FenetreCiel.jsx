// src/poc/jour-3/FenetreCiel.jsx
// Une « fenêtre » percée dans la page : son enfant devient transparent et le
// ciel du canvas fixe défile derrière, sous un voile de verre. Deux teintes :
// `sky` (bleu, chiffres clés et cartes défilantes) et `dusk` (ivoire, pied de
// page, là où le soleil se couche).

import React from "react";

/**
 * @param {{ tint?: "sky"|"dusk", className?: string, children?: React.ReactNode }} props
 */
const FenetreCiel = ({ tint = "sky", className, children }) => (
  <div className={["j3-fenetre", `j3-fenetre--${tint}`, className].filter(Boolean).join(" ")}>
    {children}
  </div>
);

export default FenetreCiel;
