// src/poc/jour-3/HeroSoleil.jsx
// Le hero de « Plein soleil » : même grille que ProHero (la navbar, le toggle
// et le LangSwitch restent au pixel près), mais posé sur le ciel WebGL.
//
// Tout ce qui est ici est éclairé par le MÊME soleil que le shader : la dorure
// de l'italique suit `--sx`, la carte-portrait s'oriente par `--pdx/--pdy`, son
// ombre et celles des chips basculent par `--shx/--shy`.

import React, { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSun, FiBriefcase, FiAward, FiLinkedin, FiBox } from "react-icons/fi";
import { jeremy } from "../../assets";
import { useProContent } from "../../i18n/useContent";
import { RevealWord } from "../shared/Reveal";
import useReducedMotion from "../shared/useReducedMotion";
import CarteLumiere from "./CarteLumiere";
import { useSoleil } from "./sun/SunProvider";

// Découpage en mots qui conserve les espaces comme de vrais nœuds texte.
const mots = (texte) => String(texte ?? "").trim().split(/\s+/).filter(Boolean);

// Le CTA vers /3d est un <Link> du routeur : on l'anime tel quel plutôt que de
// l'envelopper (un wrapper en display:contents ne peut ni s'opacifier ni bouger).
const LienAnime = motion(Link);

const HeroSoleil = ({ heroRef, portraitRef, avecCanvas }) => {
  const { proHero, proUi } = useProContent();
  const { pret } = useSoleil();
  const mouvementReduit = useReducedMotion();

  const titre = proUi.heroTitle;
  const motsPre = useMemo(() => mots(titre.pre), [titre.pre]);
  const motsEm = useMemo(() => mots(titre.em), [titre.em]);

  // Retard d'un mot : t0 + 400 ms, puis 45 ms de décalage entre les mots.
  const retard = (i) => 400 + i * 45;

  const apparait = (delai, y = 18, duree = 0.5) =>
    mouvementReduit
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: pret ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: duree, delay: delai / 1000, ease: "easeOut" },
        };

  return (
    <header className="pro-hero j3-hero" ref={heroRef}>
      {/* Filet de sécurité : le ciel en CSS, aux mêmes couleurs que le shader.
          Il s'efface au premier frame du canvas et revient s'il disparaît. */}
      <span className="j3-hero__ciel" aria-hidden="true" />
      <span className="j3-hero__sol" aria-hidden="true" />

      <div className="pro-container pro-hero__inner">
        <div className="j3-hero__texte">
          <motion.span className="pro-hero__badge" {...apparait(250, 14)}>
            <FiSun />
            {proHero.badge}
          </motion.span>

          <h1 className="pro-hero__title j3-hero__titre">
            {motsPre.map((mot, i) => (
              <Fragment key={`p-${i}-${mot}`}>
                <RevealWord delay={retard(i)} duration={620} y={24} ease={[0.22, 0.61, 0.36, 1]}>
                  {mot}
                </RevealWord>{" "}
              </Fragment>
            ))}
            <em className="j3-em">
              {motsEm.map((mot, i) => (
                <Fragment key={`e-${i}-${mot}`}>
                  <RevealWord
                    delay={retard(motsPre.length + i)}
                    duration={620}
                    y={24}
                    ease={[0.22, 0.61, 0.36, 1]}
                  >
                    {mot}
                  </RevealWord>
                  {i < motsEm.length - 1 ? " " : null}
                </Fragment>
              ))}
            </em>
            {titre.post}
          </h1>

          <motion.p className="pro-hero__intro" {...apparait(700, 20)}>
            {proHero.intro}
          </motion.p>

          <div className="pro-hero__ctas">
            <motion.a href="#contact" className="pro-btn pro-btn--primary" {...apparait(850, 16, 0.45)}>
              {proHero.ctaPrimary}
            </motion.a>
            <motion.a
              href={proHero.linkedin}
              target="_blank"
              rel="noreferrer"
              className="pro-btn pro-btn--ghost"
              {...apparait(930, 16, 0.45)}
            >
              <FiLinkedin />
              {proHero.ctaSecondary}
            </motion.a>
            <LienAnime to="/3d" className="pro-btn pro-btn--3d" {...apparait(1010, 16, 0.45)}>
              <FiBox />
              {proUi.cta3d}
            </LienAnime>
          </div>
        </div>

        <motion.div
          className="pro-hero__portrait j3-portrait"
          ref={portraitRef}
          initial={mouvementReduit ? false : { opacity: 0, scale: 0.96, y: 30 }}
          animate={
            mouvementReduit || pret
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.96, y: 30 }
          }
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <CarteLumiere
            mode="sun"
            tilt={8}
            radius={26}
            className="j3-portrait__bloc"
            data-canvas={avecCanvas ? "1" : "0"}
          >
            <div className="pro-hero__portrait-card">
              <img src={jeremy} alt={proUi.heroAlt} />
            </div>

            {/* Le support porte la position et le translateZ (parallaxe 3D) ;
                la puce à l'intérieur reste libre pour l'animation d'entrée —
                sans quoi framer écraserait la transform du support. */}
            <span className="j3-chip j3-chip--haut">
              <motion.span
                className="pro-hero__chip"
                initial={mouvementReduit ? false : { opacity: 0, y: 10 }}
                animate={mouvementReduit || pret ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 1 }}
              >
                <FiBriefcase />
                {proUi.chipTop}
              </motion.span>
            </span>
            <span className="j3-chip j3-chip--bas">
              <motion.span
                className="pro-hero__chip"
                initial={mouvementReduit ? false : { opacity: 0, y: 10 }}
                animate={mouvementReduit || pret ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 1.15 }}
              >
                <FiAward />
                {proUi.chipBottom}
              </motion.span>
            </span>
          </CarteLumiere>
        </motion.div>
      </div>
    </header>
  );
};

export default HeroSoleil;
