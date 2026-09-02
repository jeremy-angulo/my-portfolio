// src/poc/nuit-3/ciel/CielCanvas.jsx
// Le SEUL contexte WebGL de la page. Il est monté après la fin de la
// transition d'entrée de la route : pendant les 500 ms de `filter:
// brightness()`, la racine est un bloc conteneur et un enfant `position: fixed`
// s'y calerait sur toute la hauteur du document.
//
// Cadence : `always` tant qu'il se passe quelque chose (morph, pointeur,
// défilement récent, hero ou contact à l'écran), `demand` cadencé à 30 fps au
// repos (dérive de la nébuleuse et scintillement), `never` onglet caché.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import Nebuleuse from "./Nebuleuse";
import Poussiere from "./Poussiere";
import echantillonnerPortrait from "./echantillonnerPortrait";
import store from "./cielStore";

const calculerDpr = (mobile) => {
  if (typeof window === "undefined") return 1;
  const brut = window.devicePixelRatio || 1;
  const coeurs = navigator.hardwareConcurrency || 8;
  const plafond = mobile && coeurs <= 4 ? 1.25 : 1.5;
  return Math.min(brut, plafond);
};

/**
 * @param {{ mobile: boolean, survolPossible: boolean, label: string,
 *           onPerdu: () => void }} props
 */
const CielCanvas = ({ mobile, survolPossible, label, onPerdu }) => {
  const [donnees, setDonnees] = useState(null);
  const [mode, setMode] = useState("always");
  const [dpr, setDpr] = useState(() => calculerDpr(mobile));
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // ------------------------------------------------- échantillonnage
  useEffect(() => {
    let annule = false;
    echantillonnerPortrait({ pas: mobile ? 3 : 2, max: mobile ? 8000 : 16000 })
      .then((d) => {
        if (!annule) setDonnees(d);
      })
      .catch(() => {
        // Image illisible (canvas 2D indisponible) : on retombe sur le repli.
        if (!annule) onPerdu();
      });
    return () => {
      annule = true;
    };
  }, [mobile, onPerdu]);

  // ------------------------------------------------- pointeur (un listener)
  useEffect(() => {
    if (!survolPossible) return undefined;
    let rafId = 0;
    let dernier = null;

    const appliquer = () => {
      rafId = 0;
      if (!dernier) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Le canvas est fixed inset:0 : son rect est celui du viewport, et
      // clientX/clientY sont dans le même repère malgré le zoom .85.
      store.pointeurBrut.x = dernier.x / vw;
      store.pointeurBrut.y = dernier.y / vh;
      store.pointeurActifBrut = true;
      store.derniereActivite = performance.now();

      const hero = store.els.hero;
      if (hero) {
        const r = hero.getBoundingClientRect();
        const dedans =
          dernier.x >= r.left && dernier.x <= r.right && dernier.y >= r.top && dernier.y <= r.bottom;
        store.pointeurDansHero = dedans && r.height > 0;
        if (dedans) {
          store.pointeurHero.x = (dernier.x - r.left) / r.width;
          store.pointeurHero.y = (dernier.y - r.top) / r.height;
        }
      }

      const clairiere = store.els.clairiere;
      if (clairiere && store.contactVisible) {
        const r = clairiere.getBoundingClientRect();
        const dedans =
          dernier.x >= r.left && dernier.x <= r.right && dernier.y >= r.top && dernier.y <= r.bottom;
        store.pointeurDansClairiere = dedans;
        if (dedans) {
          store.pointeurClairiere.x = (dernier.x - r.left) / r.width;
          store.pointeurClairiere.y = (dernier.y - r.top) / r.height;
        }
      } else {
        store.pointeurDansClairiere = false;
      }
      if (modeRef.current === "demand") invalidate();
    };

    const onMove = (e) => {
      dernier = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(appliquer);
    };
    const onLeave = () => {
      store.pointeurActifBrut = false;
      store.pointeurDansHero = false;
      store.pointeurDansClairiere = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [survolPossible]);

  // ------------------------------------------------- cadence
  useEffect(() => {
    const evaluer = () => {
      if (document.hidden) return "never";
      const maintenant = performance.now();
      const morphe =
        Math.abs(store.dissolve - store.dissolveCible) > 0.002 ||
        Math.abs(store.gather - store.gatherCible) > 0.002 ||
        store.nebula < 0.999 ||
        store.opacity < 0.999;
      const interaction = maintenant - store.derniereActivite < 2000;
      if (morphe || interaction || store.heroVisible || store.contactVisible) return "always";
      return "demand";
    };

    const minuteur = setInterval(() => {
      const voulu = evaluer();
      setMode((actuel) => (actuel === voulu ? actuel : voulu));
    }, 200);

    // Au repos, un tour toutes les 33 ms suffit à faire vivre la nébuleuse.
    const pouls = setInterval(() => {
      if (modeRef.current === "demand") invalidate();
    }, 33);

    const onVisibilite = () => setMode(evaluer());
    const onScroll = () => {
      store.derniereActivite = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibilite);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearInterval(minuteur);
      clearInterval(pouls);
      document.removeEventListener("visibilitychange", onVisibilite);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // ------------------------------------------------- perte de contexte
  const onCree = useCallback(
    ({ gl }) => {
      store.dpr = gl.getPixelRatio();
      // `<Canvas>` répand ses props sur le div englobant, pas sur le canvas :
      // on pose l'attribut là où un lecteur d'écran le lira vraiment.
      gl.domElement.setAttribute("aria-hidden", "true");
      gl.domElement.setAttribute("role", "presentation");
      const perte = () => onPerdu();
      gl.domElement.addEventListener("webglcontextlost", perte, { passive: true });
    },
    [onPerdu]
  );

  const onDeclin = useCallback(() => {
    // Machine à la peine : on baisse la définition, la nébuleuse passe à une
    // octave et un point sur deux disparaît (le portrait reste lisible).
    setDpr(1);
    store.octaves = 1;
    store.cull = 0.5;
  }, []);

  const onMontee = useCallback(() => {
    setDpr(calculerDpr(mobile));
    store.octaves = 2;
    store.cull = 1;
  }, [mobile]);

  return (
    <div className="n3-ciel" role="presentation" title={label}>
      <Canvas
        aria-hidden="true"
        frameloop={mode}
        dpr={dpr}
        gl={{ antialias: false, alpha: true, depth: false, stencil: false, powerPreference: "default" }}
        onCreated={onCree}
      >
        <PerformanceMonitor
          ms={250}
          iterations={8}
          bounds={() => [22, 58]}
          onDecline={onDeclin}
          onIncline={onMontee}
        />
        <Nebuleuse />
        {donnees && (
          <Poussiere donnees={donnees} mobile={mobile} survolPossible={survolPossible} />
        )}
      </Canvas>
    </div>
  );
};

export default CielCanvas;
