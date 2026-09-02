// src/poc/jour-2/FooterFrame.jsx
// ProFooter rendue telle quelle. Aucun ornement : le dernier geste de la page
// est le tablier du filet de progression arrivé à 100 %, pas un astre.
// Simple fondu d'opacité à l'entrée (une fois), via une classe.

import React, { useEffect, useRef, useState } from "react";
import ProFooter from "../../pro/ProFooter";
import useReducedMotion from "../shared/useReducedMotion";

const FooterFrame = () => {
  const ref = useRef(null);
  const mouvementReduit = useReducedMotion();
  const [vu, setVu] = useState(mouvementReduit);

  useEffect(() => {
    if (mouvementReduit || vu) return undefined;
    const noeud = ref.current;
    if (!noeud || typeof IntersectionObserver === "undefined") {
      setVu(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setVu(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(noeud);
    return () => io.disconnect();
  }, [mouvementReduit, vu]);

  return (
    <div className={`j2-footer${vu ? " is-in" : ""}`} ref={ref}>
      <ProFooter />
    </div>
  );
};

export default FooterFrame;
