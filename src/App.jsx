// src/App.jsx

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HomePage, ProjectDetail } from "./components";

const App = () => {
  const location = useLocation();

  return (
    <div className='relative z-0 bg-primary'>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

const AppWrapper = () => (
  <BrowserRouter basename="/my-portfolio">
    <App />
  </BrowserRouter>
);

export default AppWrapper;