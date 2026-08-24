// src/experience/ExperiencePage.jsx
// La facette 3D : l'app "folio" (voir /folio et public/folio3d — base
// brunosimon/folio-2025, licence MIT, en cours d'adaptation) est servie en
// statique et montée ici dans un shell plein écran avec un retour vers le site.

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useLang } from "../i18n/LanguageContext";
import "./experience.scss";

const ExperiencePage = () => {
  const { lang } = useLang();
  const frameRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Le zoom global (0.85) du site fausserait les dimensions de l'app 3D.
    const previousZoom = document.body.style.zoom;
    document.body.style.zoom = 1;
    return () => {
      document.body.style.zoom = previousZoom;
    };
  }, []);

  return (
    <motion.div
      className="exp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.45 } }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <iframe
        ref={frameRef}
        src="/folio3d/index.html"
        title={lang === "fr" ? "Expérience 3D" : "3D experience"}
        className="exp__frame"
        allow="autoplay; fullscreen; gamepad"
        onLoad={() => frameRef.current && frameRef.current.focus()}
      />
      <Link to="/" className="exp-back">
        <FiArrowLeft />
        {lang === "fr" ? "Retour au site" : "Back to the site"}
      </Link>
    </motion.div>
  );
};

export default ExperiencePage;
