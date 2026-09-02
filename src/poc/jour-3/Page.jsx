// src/poc/jour-3/Page.jsx
// POC « Plein soleil » — facette jour, créneau 3 (immersif).
//
// Une seule lumière pour deux mondes : un quad WebGL fixe rend le ciel derrière
// TOUTE la page, et le même soleil (position, hauteur, intensité) éclaire le
// DOM par des variables CSS. La page alterne des murs ivoires opaques
// (expertises, parcours, contact) et des fenêtres percées sur le ciel réel
// (chiffres clés, cartes défilantes, pied de page), chacune à une autre heure.
//
// Pièges traités : `body { zoom: .85 }` (aucun pixel absolu, ratios seulement),
// `overflow-x: clip` sur la racine, et le `filter` de la transition de route qui
// deviendrait le bloc conteneur du canvas fixe (monté après la transition).

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ProStats from "../../pro/ProStats";
import ProTicker from "../../pro/ProTicker";
import ProFooter from "../../pro/ProFooter";
import PocBadge from "../shared/PocBadge";
import useReducedMotion from "../shared/useReducedMotion";
import useWebGLSupport from "../shared/useWebGLSupport";
import SunProvider from "./sun/SunProvider";
import Navbar from "./Navbar";
import HeroSoleil from "./HeroSoleil";
import Expertises from "./Expertises";
import Parcours from "./Parcours";
import Contact from "./Contact";
import FenetreCiel from "./FenetreCiel";
import "../../pro/pro.scss";
import "./page.scss";

// three + r3f ne sont chargés que si le ciel est réellement rendu : ni sous
// mouvement réduit, ni sans WebGL.
const SkyCanvas = lazy(() => import("./sun/SkyCanvas"));

// Un shader qui ne compile pas, ou un chunk qui ne se charge pas, ne doit pas
// emporter la page : on retombe sur le ciel CSS.
class GardeCiel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { casse: false };
  }

  static getDerivedStateFromError() {
    return { casse: true };
  }

  componentDidCatch(erreur) {
    if (this.props.onErreur) this.props.onErreur(erreur);
  }

  render() {
    if (this.state.casse) return null;
    return this.props.children;
  }
}

const Page = () => {
  const location = useLocation();
  const mouvementReduit = useReducedMotion();
  const webgl = useWebGLSupport();

  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const portraitRef = useRef(null);
  const skyRef = useRef(null);

  // Paramètre de debug des captures : `?sun=rest` pose le soleil au repos.
  const reposImmediat = new URLSearchParams(location.search).get("sun") === "rest";

  const [replisCss, setRepliCss] = useState(false); // WebGL perdu / indisponible
  const [transitionFinie, setTransitionFinie] = useState(false);
  const [cielRendu, setCielRendu] = useState(false); // premier frame du canvas
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  const avecCanvas = !mouvementReduit && webgl && !replisCss;

  // Le reste de la page arrive juste après la transition d'entrée, comme sur
  // ProPage : la bascule jour/nuit reste fluide.
  useEffect(() => {
    if (belowFoldReady) return undefined;
    const t = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(t);
  }, [belowFoldReady]);

  useEffect(() => {
    if (location.hash) {
      setBelowFoldReady(true);
      const cible = document.getElementById(location.hash.slice(1));
      if (cible) cible.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo(0, 0);
  }, [location.hash]);

  // Filet : si le `transitionEnd` de framer ne se produit pas (navigation
  // interrompue), le canvas est quand même monté.
  useEffect(() => {
    if (transitionFinie) return undefined;
    const t = setTimeout(() => setTransitionFinie(true), 700);
    return () => clearTimeout(t);
  }, [transitionFinie]);

  const classes = [
    "pro-root",
    "j3-root",
    avecCanvas ? "" : "j3-root--css",
    cielRendu && avecCanvas ? "j3-root--gl" : "",
    mouvementReduit ? "j3-root--fige" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      ref={rootRef}
      className={classes}
      id="top"
      initial={{ opacity: 0, filter: "brightness(1.5)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        // Un filter résiduel ferait de la racine le bloc conteneur du canvas
        // fixe : il DOIT disparaître avant que le ciel soit monté.
        transitionEnd: { filter: "none" },
      }}
      onAnimationComplete={() => setTransitionFinie(true)}
      exit={{ opacity: 0, filter: "brightness(0.5)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <SunProvider
        rootRef={rootRef}
        heroRef={heroRef}
        portraitRef={portraitRef}
        reduit={mouvementReduit}
        attendreCanvas={avecCanvas}
        reposImmediat={reposImmediat}
      >
        {avecCanvas && transitionFinie && (
          <GardeCiel onErreur={() => setRepliCss(true)}>
            <Suspense fallback={null}>
              <SkyCanvas
                skyRef={skyRef}
                onPremierFrame={() => setCielRendu(true)}
                onRepli={(perdu) => setRepliCss(perdu)}
              />
            </Suspense>
          </GardeCiel>
        )}

        <Navbar />

        <main>
          <HeroSoleil heroRef={heroRef} portraitRef={portraitRef} avecCanvas={avecCanvas} />

          {belowFoldReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.45 } }}
            >
              <Expertises />
              <FenetreCiel tint="sky">
                <ProStats />
              </FenetreCiel>
              <Parcours />
              <FenetreCiel tint="sky">
                <ProTicker />
              </FenetreCiel>
              <Contact />
            </motion.div>
          )}
        </main>

        {belowFoldReady && (
          <FenetreCiel tint="dusk">
            <ProFooter />
          </FenetreCiel>
        )}

        <PocBadge slug="jour-3" />
      </SunProvider>
    </motion.div>
  );
};

export default Page;
