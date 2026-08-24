// src/App.jsx

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HomePage, ProjectDetail, ResumePage, Navbar, StarsCanvas } from "./components";
import Gateway from "./components/gateway/Gateway";
import ProPage from "./pro/ProPage";
import { LanguageProvider } from "./i18n/LanguageContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useScrollRestorationOnResize from './hooks/useScrollRestorationOnResize'; // Import the hook

// Les routes "nuit" gardent l'univers sombre historique : navbar + ciel étoilé WebGL.
// La facette jour (/) a son propre univers ; /portfolio (split Jour/Nuit) et /cv
// sont volontairement accessibles uniquement par URL directe, sans lien entrant.
const NIGHT_PATHS = ["/tech", "/project", "/cv", "/resume"];

const App = () => {
  const location = useLocation();

  useScrollRestorationOnResize(); // Call the hook

  const isNight = NIGHT_PATHS.some((path) => location.pathname.startsWith(path));
  const isPortfolio = location.pathname === "/portfolio";

  // Le fond du document — visible en overscroll et sous les pages courtes —
  // suit la facette : ivoire le jour, nuit noire côté nuit et portfolio.
  // La couleur de la barre de défilement (color-scheme) suit aussi.
  useEffect(() => {
    const dark = isNight || isPortfolio;
    const color = dark ? "#050816" : "#faf6ee";
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [isNight, isPortfolio]);

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
          <Route path="/tech" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/cv" element={<ResumePage />} />
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
      <Analytics />
      <SpeedInsights />
      <App />
    </LanguageProvider>
  </BrowserRouter>
);

export default AppWrapper;
