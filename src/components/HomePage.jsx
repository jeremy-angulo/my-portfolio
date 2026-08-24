// src/components/HomePage.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Contact, Achievement, Experience, Education, Hero, Project, Content, Footer } from ".";

const HomePage = () => {
  const location = useLocation();

  // Pendant la bascule jour/nuit, seul le hero est monté : le reste de la page
  // (sections, images, globe WebGL) arrive une fois la transition d'entrée
  // terminée, pour ne pas faire chuter le framerate en fin d'animation.
  // Une arrivée avec ancre monte tout immédiatement pour pouvoir scroller.
  const [belowFoldReady, setBelowFoldReady] = useState(Boolean(location.hash));

  useEffect(() => {
    if (belowFoldReady) return;
    const timer = setTimeout(() => setBelowFoldReady(true), 550);
    return () => clearTimeout(timer);
  }, [belowFoldReady]);

  useEffect(() => {
    // This effect runs whenever the 'location' object changes (i.e., on navigation)
    if (location.hash) {
      setBelowFoldReady(true);
      // If there's a hash in the URL (e.g., "#project")
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // If the element is found, scroll to it smoothly
        element.scrollIntoView({ behavior: 'smooth' });
      }
      else {
        // If the element is not found, scroll to top as a fallback
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // belowFoldReady est dans les dépendances pour retenter le scroll
    // une fois les sections effectivement montées.
  }, [location, belowFoldReady]);

  return (
    // La nuit tombe : elle entre depuis l'obscurité et sort en s'éclaircissant
    // vers le jour — le miroir exact de la transition de ProPage.
    // transitionEnd retire le filtre une fois l'animation finie : un filter
    // résiduel casserait le position:fixed des éléments enfants.
    <motion.div
      initial={{ opacity: 0, filter: "brightness(0.4)" }}
      animate={{
        opacity: 1,
        filter: "brightness(1)",
        transition: { duration: 0.5, ease: "easeOut" },
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, filter: "brightness(1.6)", transition: { duration: 0.3, ease: "easeIn" } }}
    >
      <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
        <Hero />
      </div>
      {belowFoldReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.45 } }}
        >
          <Content />
          <Education />
          <Project />
          <Experience />
          <Achievement />
          <div className='relative z-0'>
            <Contact />
          </div>
          <Footer/>
        </motion.div>
      )}
    </motion.div>
  );
}

export default HomePage;
