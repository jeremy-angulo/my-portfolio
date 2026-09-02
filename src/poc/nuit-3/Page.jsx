// src/poc/nuit-3/Page.jsx
// POC « Poussière d'étoiles » — facette nuit, créneau 3 (immersif).
//
// Un seul système de particules WebGL, trois états pilotés par le défilement :
//   1. il compose le portrait de Jérémy dans la carte du hero ;
//   2. il se défait par la périphérie et devient le ciel de toute la page ;
//   3. il se rassemble en globe de points dans la section contact.
// Rien n'est décoratif : tout ce qui brille finit par servir.
//
// La page se suffit en navigation froide : elle embarque sa navbar, ses
// boutons et sa police manuscrite ; elle n'appelle pas useDocumentMeta (App
// s'en charge via la clé `poc`, noindex).

import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, useMotionValueEvent } from "framer-motion";
import Content from "../../components/Content";
import Footer from "../../components/Footer";
import { useLang } from "../../i18n/LanguageContext";
import PocBadge from "../shared/PocBadge";
import useReducedMotion from "../shared/useReducedMotion";
import useWebGLSupport from "../shared/useWebGLSupport";
import useHoverCapable from "../shared/useHoverCapable";
import NavbarNuit3 from "./NavbarNuit3";
import HeroNuit3 from "./HeroNuit3";
import EducationNuit3 from "./EducationNuit3";
import ProjetsNuit3 from "./ProjetsNuit3";
import ExperienceNuit3 from "./ExperienceNuit3";
import SuccesNuit3 from "./SuccesNuit3";
import ContactNuit3 from "./ContactNuit3";
import useProgressionHero from "./ciel/useProgressionHero";
import store, { reinitialiser } from "./ciel/cielStore";
import echantillonnerPortrait from "./ciel/echantillonnerPortrait";
import { dicoNuit3 } from "./dictionnaire";
import "./page.scss";

// three + r3f ne sont chargés que si la page va réellement les utiliser.
const CielCanvas = lazy(() => import("./ciel/CielCanvas"));

const CLE_SESSION = "n3-vu";

const Page = () => {
  const location = useLocation();
  const { lang } = useLang();
  const dico = dicoNuit3(lang);
  const mouvementReduit = useReducedMotion();
  const webgl = useWebGLSupport();
  const survolPossible = useHoverCapable();

  const [perdu, setPerdu] = useState(false);
  const statique = mouvementReduit || !webgl || perdu;

  const heroRef = useRef(null);
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 760
  );

  // Comme /tech : seul le hero est monté pendant la transition de route, le
  // reste suit à 550 ms — sauf arrivée avec ancre, où tout doit être là.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));
  // Le ciel n'est monté qu'une fois la transition d'entrée terminée : pendant
  // les 500 ms de `filter: brightness()`, la racine est un bloc conteneur et
  // un enfant `position: fixed` s'y calerait sur toute la hauteur du document.
  const [cielPret, setCielPret] = useState(false);

  const [retour] = useState(() => {
    try {
      const vu = sessionStorage.getItem(CLE_SESSION) === "1";
      sessionStorage.setItem(CLE_SESSION, "1");
      return vu;
    } catch {
      return false;
    }
  });

  // Store remis à zéro au montage (et à chaud en développement).
  useEffect(() => {
    reinitialiser();
    store.retour = retour;
    // Échantillonnage lancé tout de suite : les ~30 ms de lecture de pixels
    // sont couvertes par la photo encore affichée, et le résultat est en cache
    // quand le canvas monte.
    if (!statique) {
      echantillonnerPortrait({ pas: mobile ? 3 : 2, max: mobile ? 8000 : 16000 }).catch(() => {});
    }
  }, [retour, statique, mobile]);

  useEffect(() => {
    const surResize = () => setMobile(window.innerWidth < 760);
    window.addEventListener("resize", surResize, { passive: true });
    return () => window.removeEventListener("resize", surResize);
  }, []);

  useEffect(() => {
    if (belowFoldReady) return undefined;
    const minuteur = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(minuteur);
  }, [belowFoldReady]);

  // Repli si l'animation d'entrée ne rend jamais la main (onglet caché…).
  useEffect(() => {
    if (cielPret) return undefined;
    const minuteur = setTimeout(() => setCielPret(true), 600);
    return () => clearTimeout(minuteur);
  }, [cielPret]);

  useEffect(() => {
    if (location.hash) {
      setBelowFoldReady(true);
      const cible = document.getElementById(location.hash.replace("#", ""));
      if (cible) cible.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location, belowFoldReady]);

  const { opaciteCarte, opaciteDock } = useProgressionHero(heroRef, { actif: !statique });

  // Le dock ne devient cliquable qu'une fois visible : un seul booléen, donc
  // au plus deux re-renders sur toute la page.
  const [dockActif, setDockActif] = useState(statique);
  useMotionValueEvent(opaciteDock, "change", (v) => {
    const voulu = v > 0.5;
    setDockActif((actuel) => (actuel === voulu ? actuel : voulu));
  });

  const surPerte = useCallback(() => setPerdu(true), []);

  // Sonde de développement : c'est elle que lisent les scripts de vérification.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    window.__n3 = {
      get dissolve() {
        return store.dissolve;
      },
      get gather() {
        return store.gather;
      },
      get frames() {
        return store.frames;
      },
      get points() {
        return store.points;
      },
      get dpr() {
        return store.dpr;
      },
      get cull() {
        return store.cull;
      },
      get statique() {
        return statique;
      },
    };
  }

  return (
    // La nuit tombe : même transition que HomePage, pour que la bascule reste
    // fluide. transitionEnd retire le filtre — un filter résiduel casserait le
    // position: fixed du ciel.
    <motion.div
      className={`n3-root${statique ? " n3-root--statique" : ""}`}
      initial={{ opacity: 0, filter: "brightness(0.4)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(1.6)", transition: { duration: 0.3, ease: "easeIn" } }}
      onAnimationComplete={() => setCielPret(true)}
    >
      {!statique && cielPret && (
        <Suspense fallback={null}>
          <CielCanvas
            mobile={mobile}
            survolPossible={survolPossible}
            label={dico.decor}
            onPerdu={surPerte}
          />
        </Suspense>
      )}

      <div className="n3-page">
        <header className="n3-entete">
          <NavbarNuit3 />
        </header>

        <main>
          <HeroNuit3
            heroRef={heroRef}
            statique={statique}
            opaciteCarte={opaciteCarte}
            retour={retour}
          />

          {belowFoldReady && (
            <motion.div
              className="n3-sections"
              initial={statique ? false : { opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.45 } }}
            >
              <motion.div
                className={`n3-dock${statique || dockActif ? "" : " is-inerte"}`}
                style={statique ? undefined : { opacity: opaciteDock }}
              >
                <Content />
              </motion.div>

              <EducationNuit3 />
              <ProjetsNuit3 />
              <ExperienceNuit3 />
              <SuccesNuit3 />
              <ContactNuit3 statique={statique} />
            </motion.div>
          )}
        </main>

        <footer className="n3-footer">
          <Footer />
        </footer>
      </div>

      <PocBadge slug="nuit-3" />
    </motion.div>
  );
};

export default Page;
