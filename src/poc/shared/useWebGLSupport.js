// src/poc/shared/useWebGLSupport.js
// WebGL est-il disponible ? Sonde unique, mémoïsée au niveau du module et
// exposée par un initialiseur paresseux : la réponse est connue dès le premier
// rendu, donc jamais de canvas monté puis retiré.
//
// Ne couvre PAS la perte de contexte en cours de route : les POC WebGL
// gardent leur écoute de `webglcontextlost` et leur bascule vers le repli CSS.

import { useState } from "react";

let cache = null;

const sonder = () => {
  if (cache !== null) return cache;
  if (typeof document === "undefined") return false; // sûr au rendu serveur
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (ctx) {
      // On rend le contexte tout de suite : les navigateurs en limitent le
      // nombre, et le chantier n'en autorise qu'un seul par page.
      const perte = ctx.getExtension("WEBGL_lose_context");
      if (perte) perte.loseContext();
    }
    cache = Boolean(ctx);
  } catch {
    cache = false;
  }
  return cache;
};

/** @returns {boolean} */
const useWebGLSupport = () => {
  const [supporte] = useState(sonder);
  return supporte;
};

export default useWebGLSupport;
