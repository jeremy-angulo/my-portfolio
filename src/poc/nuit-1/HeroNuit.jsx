// src/poc/nuit-1/HeroNuit.jsx
// Le hero « Veilleuse ». Mêmes cotes que `.night-hero` (le toggle jour/nuit ne
// déplace rien), mais `herobg.png` (930 Ko) est remplacé par deux dégradés CSS
// et la lumière devient un objet de la page.
//
// Chronologie (t0 = montage, sous le fondu de route de 500 ms) :
//   t0      badge
//   t0+120  ligne 1 du H1, mot à mot
//   t0+300  carte du portrait
//   t0+450  le prénom s'écrit (→ t0+1450)
//   t0+900  la lune apparaît
//   t0+1300 l'intro, mot à mot
//   t0+1400 la ligne typée
//   t0+1450 le point d'encre éclate, le halo éclot depuis la lune
//   t0+1500 / 1650  les chips
//   t0+1700 les CTA
//   t0+2200 le reflet unique du bouton 3D
// Tout est lisible vers 1,6 s, terminé vers 3,1 s. Rien n'affecte la mise en
// page (transform / opacity seulement) : CLS 0, LCP = le H1 texte.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useTransform } from "framer-motion";
import { ReactTyped } from "react-typed";
import { FiBox, FiMoon } from "react-icons/fi";
import { AiOutlineGithub } from "react-icons/ai";
import Reveal from "../shared/Reveal";
import useReducedMotion from "../shared/useReducedMotion";
import useScrollRatio from "../shared/useScrollRatio";
import useMediaQuery from "./useMediaQuery";
import Lampe, { FournisseurLampe } from "./Lampe";
import NomManuscrit from "./NomManuscrit";
import CartePortrait from "./CartePortrait";
import { riseSoft } from "./motion";

const SEPARATEUR_PARAGRAPHE = /<br\s*\/?>\s*<br\s*\/?>/i;

const HeroNuit = ({ ui, lang }) => {
  const reduit = useReducedMotion();
  const heroRef = useRef(null);
  const grandEcran = useMediaQuery("(min-width: 900px)");

  // La lampe éclot quand la signature du prénom est terminée.
  const [signe, setSigne] = useState(false);

  // Sortie du hero au défilement. `useScrollRatio` ne mélange que des rects et
  // la sonde de viewport partagée : juste sous `body { zoom: 0.85 }`, là où
  // `useScroll({ target, offset })` de framer se décale de ~18 %.
  const sortieActive = grandEcran && !reduit;
  const progression = useScrollRatio(heroRef, {
    start: "start start",
    end: "end start",
    enabled: sortieActive,
    frozen: 0,
  });
  const opaciteCol = useTransform(progression, [0, 0.7], [1, 0.35]);
  const yCol = useTransform(progression, [0, 0.7], [0, -24]);

  // Reflet unique du bouton 3D, à la toute fin de l'arrivée.
  const [reflet, setReflet] = useState(false);
  useEffect(() => {
    if (reduit) return undefined;
    const id = setTimeout(() => setReflet(true), 2200);
    return () => clearTimeout(id);
  }, [reduit]);

  const versProjets = () => {
    const cible = document.getElementById("project");
    if (cible) cible.scrollIntoView({ behavior: reduit ? "auto" : "smooth" });
  };

  // L'intro des `constants` porte un double <br/> : deux paragraphes.
  const paragraphes = String(ui.intro || "").split(SEPARATEUR_PARAGRAPHE);
  const introDecoupee = paragraphes.length > 1;
  const cadence = grandEcran ? 14 : 10;

  const transitionArrivee = (delai) =>
    reduit ? { duration: 0.2 } : { duration: 0.4, delay: delai, ease: "easeOut" };

  return (
    <section className="nuit1-hero" ref={heroRef}>
      <span className="nuit1-hero__ondes" aria-hidden="true" />

      <FournisseurLampe heroRef={heroRef} lang={lang}>
        <Lampe eclose={signe} />

        <div className="nuit1-container nuit1-hero__inner">
          <motion.div
            className="nuit1-hero__col"
            style={sortieActive ? { opacity: opaciteCol, y: yCol } : undefined}
          >
            <motion.span
              className="nuit1-hero__badge"
              initial={reduit ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={reduit ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={transitionArrivee(0)}
            >
              <FiMoon />
              {ui.badge}
            </motion.span>

            <h1 className="nuit1-hero__titre">
              <span className="nuit1-hero__titre-ligne">
                <Reveal
                  as="span"
                  by="word"
                  variant="mask"
                  mode="animate"
                  delay={120}
                  stagger={60}
                  duration={500}
                >
                  {ui.titlePre}
                </Reveal>
              </span>
              <span className="nuit1-hero__titre-ligne">
                {/* key={lang} : seul le prénom se ré-écrit au changement FR/EN. */}
                <NomManuscrit key={lang} texte={ui.name} onSigne={() => setSigne(true)} />
              </span>
            </h1>

            <div className="nuit1-hero__typed">
              {reduit ? (
                <span className="nuit1-hero__typed-fixe">{ui.typed[0]}</span>
              ) : (
                <motion.span
                  style={{ display: "inline-block" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.4 }}
                >
                  <ReactTyped
                    key={lang}
                    strings={ui.typed}
                    typeSpeed={60}
                    backSpeed={60}
                    backDelay={1500}
                    startDelay={1400}
                    loop
                  />
                </motion.span>
              )}
            </div>

            <div className="nuit1-hero__intro">
              {introDecoupee ? (
                paragraphes.map((texte, i) => (
                  <Reveal
                    key={`intro-${i}`}
                    as="p"
                    by="word"
                    mode="animate"
                    y={8}
                    duration={400}
                    stagger={cadence}
                    delay={1300 + i * 420}
                  >
                    {texte.trim()}
                  </Reveal>
                ))
              ) : (
                // Repli : si le séparateur venait à disparaître des constants,
                // on rend le texte tel quel plutôt que de le découper à tort.
                <p dangerouslySetInnerHTML={{ __html: ui.intro }} />
              )}
            </div>

            <div className="nuit1-hero__ctas">
              {[
                <button
                  key="projets"
                  type="button"
                  onClick={versProjets}
                  className="nuit1-btn nuit1-btn--primaire"
                >
                  {ui.ctaProjects}
                </button>,
                <a
                  key="github"
                  href="https://github.com/jeremy-angulo"
                  target="_blank"
                  rel="noreferrer"
                  className="nuit1-btn nuit1-btn--fantome"
                >
                  <AiOutlineGithub />
                  GitHub
                </a>,
                <Link
                  key="3d"
                  to="/3d"
                  className="nuit1-btn nuit1-btn--3d"
                  style={
                    reduit
                      ? undefined
                      : {
                          backgroundPosition: reflet ? "0% 0" : "100% 0",
                          transition: reflet ? "background-position 0.9s ease-in-out" : "none",
                        }
                  }
                >
                  <FiBox />
                  {ui.cta3d}
                </Link>,
              ].map((enfant, i) => (
                <motion.span
                  key={enfant.key}
                  style={{ display: "inline-flex" }}
                  variants={riseSoft(reduit, { y: 12, duration: 500, stagger: 80, delay: 1700 })}
                  custom={i}
                  initial="hidden"
                  animate="show"
                >
                  {enfant}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <CartePortrait ui={ui} reduit={reduit} />
        </div>
      </FournisseurLampe>
    </section>
  );
};

export default HeroNuit;
