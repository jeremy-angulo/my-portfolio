// src/poc/nuit-2/N2Hero.jsx
// Le hero et son éclipse inversée.
//
// Bureau : une piste de 2 hauteurs de viewport, une scène collante d'une
// hauteur de viewport. La progression `h` de la piste pilote tout : le texte
// et le portrait reculent, la lune EN FLUX (derrière la carte, comme
// aujourd'hui) se fond dans la lune FIXE de la couche ciel — qui est DEVANT
// la carte : la moitié jusque-là masquée apparaît, la lune « se dégage ».
//
// Mobile : pas de piste ni de collage (le hero fait ~1,5 écran, l'épingler
// tronquerait le portrait) ; `h` devient la progression de sortie du hero et
// seule l'opacité du bloc texte bouge.
//
// RÈGLE DE COMPOSITION — l'arrivée est en CSS (classe `.n2-in`, propriétés
// `translate` + `opacity`), le défilement en MotionValues. Les deux ne se
// posent JAMAIS sur le même élément : une animation CSS en `fill: both`
// écrase un style inline, framer perdrait la main. D'où les enveloppes.

import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { ReactTyped } from "react-typed";
import { FiMoon, FiCpu, FiBox } from "react-icons/fi";
import { AiOutlineGithub } from "react-icons/ai";
import { jeremy } from "../../assets";
import TypingBox from "../../components/TypingBox";
import { useLang } from "../../i18n/LanguageContext";
import { useNightContent } from "../../i18n/useContent";
import usePointerVars from "../shared/usePointerVars";
import { useN2Sky } from "./skyContext";
import dict from "./dict";

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (v, a, b) => (b === a ? (v >= b ? 1 : 0) : borner((v - a) / (b - a)));
const melange = (a, b, t) => a + (b - a) * t;

const N2Hero = () => {
  const { lang } = useLang();
  const { nightUi } = useNightContent();
  const ui = nightUi.hero;
  const { heroTrackRef, heroMoonRef, h, epingle, viewportCss, reduit } = useN2Sky();

  const stageRef = useRef(null);
  // Halo et ondes du fond suivent le pointeur (bureau seulement) : le hook se
  // neutralise tout seul au tactile et en mouvement réduit.
  usePointerVars(stageRef, { varX: "--mx", varY: "--my" });

  // --- recul piloté par le défilement -----------------------------------
  const texteY = useTransform(h, (v) => (epingle ? -0.12 * viewportCss.current.h * seg(v, 0, 0.45) : 0));
  const texteOpacite = useTransform(h, (v) =>
    epingle ? 1 - seg(v, 0.25, 0.45) : melange(1, 0.6, seg(v, 0, 0.5))
  );
  const nomOpacite = useTransform(h, (v) => (epingle ? 1 - seg(v, 0.4, 0.5) : 1));
  const portraitY = useTransform(h, (v) => (epingle ? -0.28 * viewportCss.current.h * seg(v, 0.2, 0.55) : 0));
  const portraitRotation = useTransform(h, (v) => (epingle ? melange(2.5, -4, seg(v, 0.2, 0.55)) : 2.5));
  const portraitOpacite = useTransform(h, (v) => (epingle ? 1 - seg(v, 0.3, 0.55) : 1));
  const voileOpacite = useTransform(h, (v) => (epingle ? 0.5 * seg(v, 0.22, 0.6) : 0));
  // Fondu croisé avec la lune fixe : c'est le moment de l'éclipse inversée.
  const luneOpacite = useTransform(h, (v) => (reduit ? 1 : 1 - seg(v, 0.15, 0.22)));
  const indiceOpacite = useTransform(h, (v) => 1 - seg(v, 0, 0.1));

  // Sous le drap, la scène ne doit plus capter les clics.
  useMotionValueEvent(h, "change", (v) => {
    const el = stageRef.current;
    if (el) el.classList.toggle("is-inerte", v >= 0.8);
  });

  const versProjets = () => {
    const cible = document.getElementById("project");
    if (cible) cible.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="n2-hero">
      <div className="n2-hero__track" ref={heroTrackRef}>
        <div className="n2-hero__stage" ref={stageRef}>
          {/* Décor : dégradés seuls, aucune image (herobg.png n'est pas importé). */}
          <div className="n2-hero__bg" aria-hidden="true">
            <div className="n2-hero__glow" />
            <div className="n2-hero__waves" />
          </div>
          <motion.div className="n2-hero__veil" style={{ opacity: voileOpacite }} aria-hidden="true" />

          <div className="n2-container n2-hero__inner">
            <motion.div className="n2-hero__col" style={{ y: texteY }}>
              <div className="n2-in n2-in--ib" style={{ "--d": "0ms" }}>
                <motion.span className="n2-hero__badge" style={{ opacity: texteOpacite }}>
                  <FiMoon />
                  {ui.badge}
                </motion.span>
              </div>

              <h1 className="n2-hero__title">
                <span className="n2-in n2-in--ib" style={{ "--d": "120ms" }}>
                  <motion.span style={{ opacity: texteOpacite, display: "inline-block" }}>
                    {ui.titlePre}
                  </motion.span>
                </span>{" "}
                <span className="n2-in n2-in--ib n2-in--nom" style={{ "--d": "240ms" }}>
                  <motion.span className="n2-hero__name" style={{ opacity: nomOpacite }}>
                    {ui.name}
                  </motion.span>
                </span>
              </h1>

              <motion.div style={{ opacity: texteOpacite }}>
                <div className="n2-in" style={{ "--d": "360ms" }}>
                  <div className="n2-hero__typed">
                    {/* key={lang} : la frappe repart proprement au changement de langue */}
                    <ReactTyped
                      key={lang}
                      strings={ui.typed}
                      typeSpeed={60}
                      backSpeed={60}
                      backDelay={1500}
                      loop
                    />
                  </div>
                </div>

                <div className="n2-in" style={{ "--d": "480ms" }}>
                  <div className="n2-hero__typing">
                    <TypingBox key={lang} line={ui.intro} />
                  </div>
                </div>

                <div className="n2-hero__ctas">
                  <button
                    type="button"
                    onClick={versProjets}
                    className="n2-btn n2-btn--primary n2-in"
                    style={{ "--d": "600ms" }}
                  >
                    {ui.ctaProjects}
                  </button>
                  <a
                    href="https://github.com/jeremy-angulo"
                    target="_blank"
                    rel="noreferrer"
                    className="n2-btn n2-btn--ghost n2-in"
                    style={{ "--d": "680ms" }}
                  >
                    <AiOutlineGithub />
                    GitHub
                  </a>
                  <Link to="/3d" className="n2-btn n2-btn--3d n2-in" style={{ "--d": "760ms" }}>
                    <FiBox />
                    {ui.cta3d}
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            <div className="n2-hero__portrait">
              <div className="n2-in" style={{ "--d": "240ms" }}>
                <motion.div
                  className="n2-hero__portrait-move"
                  style={{ y: portraitY, rotate: portraitRotation, opacity: portraitOpacite }}
                >
                  <div className="n2-hero__portrait-card">
                    <img src={jeremy} alt={ui.alt} />
                  </div>
                  <span className="n2-hero__chip n2-hero__chip--top n2-in" style={{ "--d": "700ms" }}>
                    <FiMoon />
                    {ui.chipTop}
                  </span>
                  <span className="n2-hero__chip n2-hero__chip--bottom n2-in" style={{ "--d": "800ms" }}>
                    <FiCpu />
                    {ui.chipBottom}
                  </span>
                </motion.div>
              </div>

              {/* La lune en flux : elle vit derrière la carte (z-index -1),
                  exactement là où le hero d'aujourd'hui pose son ::before.
                  Sa ref est l'ancre de départ de la lune fixe. */}
              <div className="n2-hero__moon-in n2-in n2-in--lune" style={{ "--d": "300ms" }} aria-hidden="true">
                <motion.div className="n2-hero__moon" ref={heroMoonRef} style={{ opacity: luneOpacite }} />
              </div>
            </div>
          </div>

          <div className="n2-hero__hint n2-in" style={{ "--d": "1400ms" }} aria-hidden="true">
            <motion.div className="n2-hero__hint-in" style={{ opacity: indiceOpacite }}>
              <span className="n2-hero__hint-label">{dict.scrollHint[lang] ?? dict.scrollHint.fr}</span>
              <i className="n2-hero__hint-line" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default N2Hero;
