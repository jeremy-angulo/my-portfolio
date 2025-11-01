// AnimatedValueProposition.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const propositions = [
  "Je transforme la complexité en clarté.",
  "Je convertis les données en décisions stratégiques.",
  "Je construis le pont entre métier et technologie.",
  "J'optimise les processus pour booster la performance."
];

const AnimatedValueProposition = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % propositions.length);
    }, 4000); // Change de phrase toutes les 4 secondes

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, []);

  return (
    <div style={{ fontSize: '2rem', color: '#915EFF', minHeight: '80px' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {propositions[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedValueProposition;