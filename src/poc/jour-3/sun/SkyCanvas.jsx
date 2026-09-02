// src/poc/jour-3/sun/SkyCanvas.jsx
// L'UNIQUE contexte WebGL de la page : un conteneur fixe plein écran et un
// <Canvas> r3f qui ne dessine qu'un quad.
//
// Deux pièges de ce dépôt sont traités ici :
//  1. `body { zoom: .85 }` — `getBoundingClientRect()` rend 1440 px là où le
//     layout en compte 1694. r3f dimensionne le canvas en pixels CSS : on lui
//     demande donc la mesure NON zoomée (`resize: { offsetSize: true }`), sans
//     quoi le ciel ne couvrirait que 85 % de l'écran. Le dpr est corrigé du même
//     facteur pour ne pas rendre 1,4 fois trop de pixels.
//  2. Un `filter` sur un ancêtre ferait de lui le bloc conteneur du
//     `position: fixed` : le canvas n'est monté qu'une fois la transition de
//     route terminée (Page.jsx s'en charge).

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import SkyPlane from "./SkyPlane";
import { useSoleil } from "./SunProvider";

// Facteur du `zoom` global, mesuré une fois : rect (repère écran) / offset
// (repère de mise en page). Vaut 0,85 sur ce dépôt, 1 ailleurs.
let facteurZoom = null;
const mesurerZoom = () => {
  if (facteurZoom !== null) return facteurZoom;
  facteurZoom = 1;
  try {
    const sonde = document.createElement("div");
    sonde.setAttribute("aria-hidden", "true");
    sonde.style.cssText = "position:fixed;inset:0;visibility:hidden;pointer-events:none;z-index:-1;";
    document.body.appendChild(sonde);
    const rect = sonde.getBoundingClientRect().width;
    const offset = sonde.offsetWidth;
    sonde.remove();
    if (offset > 0 && rect > 0) facteurZoom = rect / offset;
  } catch {
    facteurZoom = 1;
  }
  return facteurZoom;
};

// Rendu logiciel (SwiftShader, llvmpipe, Mesa softpipe) : pas de GPU derrière
// WebGL. Le ciel reste identique, mais rendu deux fois moins finement et sans
// deuxième octave de voile — sinon la page rame sur la machine de l'utilisateur
// comme dans un navigateur headless.
let rendulLogiciel = null;
const sonderRenduLogiciel = () => {
  if (rendulLogiciel !== null) return rendulLogiciel;
  rendulLogiciel = false;
  try {
    const toile = document.createElement("canvas");
    const gl = toile.getContext("webgl2") || toile.getContext("webgl");
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const nom = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
      rendulLogiciel = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(nom);
      const perte = gl.getExtension("WEBGL_lose_context");
      if (perte) perte.loseContext();
    }
  } catch {
    rendulLogiciel = false;
  }
  return rendulLogiciel;
};

/**
 * @param {{ skyRef: React.RefObject<HTMLDivElement>,
 *           onPremierFrame?: () => void, onRepli?: () => void }} props
 */
const SkyCanvas = ({ skyRef, onPremierFrame, onRepli }) => {
  const { demarrerLever } = useSoleil();
  const [perdu, setPerdu] = useState(false);

  // Largeur réelle de l'écran (repère des rects) : décide du dpr et du nombre
  // d'octaves du voile.
  const [etroit, setEtroit] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 700px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 700px)");
    const onChange = (ev) => setEtroit(ev.matches);
    setEtroit(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  const dpr = useMemo(() => {
    const zoom = mesurerZoom();
    const brut = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, etroit ? 1 : 1.5);
    return Math.max(0.5, Math.min(2, brut * zoom));
  }, [etroit]);

  const premier = useCallback(() => {
    demarrerLever();
    if (onPremierFrame) onPremierFrame();
  }, [demarrerLever, onPremierFrame]);

  const onCreated = useCallback(
    (state) => {
      const toile = state.gl && state.gl.domElement;
      if (!toile) return;
      const onLost = (ev) => {
        // preventDefault autorise une restauration ; en attendant, le repli CSS.
        ev.preventDefault();
        setPerdu(true);
        if (onRepli) onRepli(true);
      };
      const onRestored = () => {
        setPerdu(false);
        if (onRepli) onRepli(false);
      };
      toile.addEventListener("webglcontextlost", onLost, false);
      toile.addEventListener("webglcontextrestored", onRestored, false);
    },
    [onRepli]
  );

  if (perdu) return null;

  return (
    <div className="j3-sky" ref={skyRef} aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={dpr}
        flat
        // Mesure NON zoomée : le canvas doit couvrir 1694 px de mise en page
        // pour occuper les 1440 px de l'écran.
        resize={{ offsetSize: true, scroll: false }}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        onCreated={onCreated}
        style={{ pointerEvents: "none" }}
      >
        <SkyPlane octaves={etroit ? 1 : 2} onPremierFrame={premier} />
      </Canvas>
    </div>
  );
};

export default SkyCanvas;
