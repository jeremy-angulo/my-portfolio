// src/experience/ExperiencePage.jsx
// La troisième facette : une expérience de conduite 3D à travers le parcours,
// construite en primitives (react-three-fiber + rapier), sans aucun asset externe.

import React, { Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import LangSwitch from "../i18n/LangSwitch";
import { useLang } from "../i18n/LanguageContext";
import { EXP_TEXT } from "./expText";
import { controls, useKeyboard } from "./useKeyboard";
import World from "./World";
import "./experience.scss";

const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

// Un bouton du d-pad tactile : presser = activer le contrôle correspondant.
const PadButton = ({ dir, label }) => (
  <button
    type="button"
    className={`exp-pad__btn exp-pad__btn--${dir}`}
    aria-label={dir}
    onPointerDown={(e) => {
      e.preventDefault();
      controls[dir] = true;
    }}
    onPointerUp={() => {
      controls[dir] = false;
    }}
    onPointerLeave={() => {
      controls[dir] = false;
    }}
    onContextMenu={(e) => e.preventDefault()}
  >
    {label}
  </button>
);

const ExperiencePage = () => {
  const { lang } = useLang();
  const t = EXP_TEXT[lang] || EXP_TEXT.fr;
  const [started, setStarted] = useState(false);

  useKeyboard();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Le site applique un zoom global de 0.85 sur le body : sur une page
    // canvas plein écran, ça fausse les dimensions. On le neutralise ici.
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
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 42, position: [-9, 12, 10] }}>
        <Suspense fallback={null}>
          <World t={t} />
        </Suspense>
      </Canvas>

      {/* ------------------------------------------------------------- HUD */}
      <Link to="/" className="exp-back">
        <FiArrowLeft />
        {t.back}
      </Link>

      {started && (
        <>
          <p className="exp-hint">{t.hint}</p>
          <button
            type="button"
            className="exp-reset"
            aria-label="Reset"
            onClick={() => {
              controls.reset = true;
            }}
          >
            <FiRefreshCw />
          </button>
          {isTouchDevice && (
            <div className="exp-pad">
              <PadButton dir="forward" label="▲" />
              <PadButton dir="left" label="◀" />
              <PadButton dir="back" label="▼" />
              <PadButton dir="right" label="▶" />
            </div>
          )}
        </>
      )}

      {/* ----------------------------------------------------------- Intro */}
      {!started && (
        <div className="exp-intro">
          <div className="exp-intro__card">
            <p className="exp-intro__eyebrow">Jérémy Angulo</p>
            <h1 className="exp-intro__title">{t.introTitle}</h1>
            <p className="exp-intro__sub">{t.introSub}</p>
            <p className="exp-intro__controls">{t.introControls}</p>
            <div className="exp-intro__actions">
              <button
                type="button"
                className="exp-intro__start"
                onClick={() => setStarted(true)}
              >
                {t.start}
              </button>
              <LangSwitch mode="night" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExperiencePage;
