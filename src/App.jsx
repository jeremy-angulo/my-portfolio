// src/App.jsx

import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HomePage, ProjectDetail, ResumePage, Navbar, StarsCanvas } from "./components";
import Gateway from "./components/gateway/Gateway";
import ProPage from "./pro/ProPage";
import { LanguageProvider } from "./i18n/LanguageContext";
import RouteFallback from "./components/RouteFallback";
import SiteAnalytics from "./analytics";

// L'expérience 3D embarque three + la physique rapier (WASM) : chargée en
// lazy pour que son chunk ne pèse pas sur le reste du site.
const ExperiencePage = lazy(() => import("./experience/ExperiencePage"));
// Page privée, non liée depuis le site : chargée à part pour ne rien peser sur
// le bundle que téléchargent les visiteurs.
const StatsPage = lazy(() => import("./stats/StatsPage"));
// Pages de comparaison (POC), privées et noindex comme /statistiques : chaque
// POC est son propre chunk, rien ne pèse sur le bundle des visiteurs.
const PocRouter = lazy(() => import("./poc/PocRouter"));
import { SpeedInsights } from "@vercel/speed-insights/react";
import useScrollRestorationOnResize from './hooks/useScrollRestorationOnResize'; // Import the hook
import useDocumentMeta from "./i18n/useDocumentMeta";

// Les routes "nuit" gardent l'univers sombre historique : navbar + ciel étoilé WebGL.
// La facette jour (/) a son propre univers ; /portfolio (split Jour/Nuit) et /cv
// sont volontairement accessibles uniquement par URL directe, sans lien entrant.
const NIGHT_PATHS = ["/tech", "/project", "/cv", "/resume"];

const App = () => {
  const location = useLocation();

  useScrollRestorationOnResize(); // Call the hook
  useDocumentMeta();

  const isNight = NIGHT_PATHS.some((path) => location.pathname.startsWith(path));
  const isPortfolio = location.pathname === "/portfolio";
  const is3d = location.pathname === "/3d";
  // Les POC nuit rendent leur propre navbar et leur propre ciel, mais le fond
  // du document doit être sombre comme /tech ; /poc et /poc/jour-* restent ivoire.
  const isPocNight = location.pathname.startsWith("/poc/nuit");

  // Le fond du document — visible en overscroll et sous les pages courtes —
  // suit la facette : ivoire le jour (dont /statistiques, habillée comme le
  // jour), nuit noire côté nuit, portfolio et 3D.
  // La couleur de la barre de défilement (color-scheme) suit aussi.
  useEffect(() => {
    const dark = isNight || isPortfolio || is3d || isPocNight;
    const color = dark ? "#050816" : "#faf6ee";
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [isNight, isPortfolio, is3d, isPocNight]);

  // Le champ d'étoiles WebGL n'est initialisé qu'une fois la transition
  // jour→nuit terminée (puis il apparaît en fondu) : son démarrage pendant
  // l'animation faisait perdre des frames.
  const [starsReady, setStarsReady] = useState(false);
  useEffect(() => {
    if (!isNight) {
      setStarsReady(false);
      return;
    }
    const timer = setTimeout(() => setStarsReady(true), 650);
    return () => clearTimeout(timer);
  }, [isNight]);

  return (
    // This main div provides the global background and star canvas
    <div className={`relative z-0 ${isNight ? "bg-primary" : ""}`}>
      {isNight && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<ProPage />} />
          <Route path="/pro" element={<Navigate to="/" replace />} />
          <Route path="/portfolio" element={<Gateway />} />
          <Route
            path="/3d"
            element={
              <Suspense
                fallback={<div style={{ position: "fixed", inset: 0, background: "#0b0a21" }} />}
              >
                <ExperiencePage />
              </Suspense>
            }
          />
          <Route path="/tech" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/cv" element={<ResumePage />} />
          {/* Privée : aucun lien entrant, noindex, et l'API refuse sans la phrase. */}
          <Route
            path="/statistiques"
            element={
              <Suspense fallback={<RouteFallback label="Statistiques" />}>
                <StatsPage />
              </Suspense>
            }
          />
          {/* Privées : aucun lien entrant, noindex. Le fond du repli suit la facette
              pour qu'un chunk lent ne fasse pas clignoter un écran ivoire côté nuit. */}
          <Route
            path="/poc/*"
            element={
              <Suspense
                fallback={
                  <div
                    aria-hidden="true"
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: isPocNight ? "#050816" : "#faf6ee",
                    }}
                  />
                }
              >
                <PocRouter />
              </Suspense>
            }
          />
          {/* Les anciens liens partagés vers /resume continuent de fonctionner. */}
          <Route path="/resume" element={<Navigate to="/cv" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {isNight && starsReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.9 } }}
        >
          <StarsCanvas />
        </motion.div>
      )}
    </div>
  );
}

const AppWrapper = () => (
  <BrowserRouter basename="/">
    <LanguageProvider>
      <SiteAnalytics />
      <SpeedInsights />
      <App />
    </LanguageProvider>
  </BrowserRouter>
);

export default AppWrapper;
