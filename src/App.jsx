// src/App.jsx

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HomePage, ProjectDetail, ResumePage, Navbar, StarsCanvas } from "./components";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const App = () => {
  const location = useLocation();

  return (
    // This main div provides the global background and star canvas
    <div className='relative z-0 bg-primary'>
      {/* The Navbar is now outside the Routes, so it stays on every page */}
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/resume" element={<ResumePage />} />
        </Routes>
      </AnimatePresence>
      {/* The StarsCanvas is also outside, so it stays on every page */}
      <StarsCanvas />
    </div>
  );
}

const AppWrapper = () => (
  <BrowserRouter basename="/my-portfolio">
    <Analytics />
    <SpeedInsights />
    <App />
  </BrowserRouter>
);

export default AppWrapper;