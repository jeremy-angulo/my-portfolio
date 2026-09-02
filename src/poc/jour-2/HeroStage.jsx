// src/poc/jour-2/HeroStage.jsx
// La scène d'ouverture : le hero ET la section Expertises sont la même scène.
// En défilant, le titre du site se démonte — « la technique » part à gauche,
// « le business. » à droite — un tablier ambre se tend entre les deux, et les
// trois cartes d'expertise viennent s'y poser. Le titre devient la structure.
//
// Deux composants distincts pour deux arbres de hooks stables :
//  · HeroPinned  : desktop, souris, hors mouvement réduit — la scène épinglée.
//  · HeroLinear  : mobile / mouvement réduit — hero classique + section linéaire.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { FiSun, FiBriefcase, FiAward, FiLinkedin, FiBox } from "react-icons/fi";
import { jeremy } from "../../assets";
import usePointerVars from "../shared/usePointerVars";
import useSceneProgress from "./useSceneProgress";
import SplitTitle from "./SplitTitle";
import Deck from "./Deck";
import { PillarCardsPinned, PillarCardsLinear } from "./PillarCards";
import { offsetIn, easeOutCubic, easeInOutCubic } from "./mesure";

const E = [0.22, 1, 0.36, 1];
const E_PORTRAIT = [0.16, 1, 0.3, 1];

// Arrivée « dans le temps » : opacité + petite montée. Sous mouvement réduit,
// aucune enveloppe animée n'est posée (le contenu est là, point).
const arrivee = (reduced, { delay = 0, y = 12, duration = 0.45 } = {}) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y },
        animate: { opacity: 1, y: 0, transition: { duration, delay, ease: E } },
      };

// --------------------------------------------------------------- morceaux du hero
// Chacun sépare l'arrivée (animate, dans le temps) de la sortie au défilement
// (style, MotionValue) : deux couches, jamais la même propriété deux fois.

const Fade = ({ style, children }) => (
  <motion.div className="j2-fade" style={style}>
    {children}
  </motion.div>
);

const Badge = ({ text, reduced }) => (
  <motion.span className="pro-hero__badge" {...arrivee(reduced, { delay: 0 })}>
    <FiSun />
    {text}
  </motion.span>
);

const Intro = ({ text, reduced }) => (
  <motion.p className="pro-hero__intro" {...arrivee(reduced, { delay: 0.42, y: 16, duration: 0.5 })}>
    {text}
  </motion.p>
);

const Sun = ({ reduced, style }) => (
  <motion.div
    className="j2-sun"
    aria-hidden="true"
    initial={reduced ? false : { opacity: 0, scale: 0.6 }}
    animate={reduced ? undefined : { opacity: 1, scale: 1, transition: { duration: 0.9, ease: E } }}
  >
    <motion.div className="j2-sun__scroll" style={style}>
      <div className="j2-sun__in" />
    </motion.div>
  </motion.div>
);

const Ctas = ({ proHero, proUi, reduced }) => (
  <div className="pro-hero__ctas">
    <motion.div className="j2-cta" {...arrivee(reduced, { delay: 0.52 })}>
      <a href="#contact" className="pro-btn pro-btn--primary">
        {proHero.ctaPrimary}
      </a>
    </motion.div>
    <motion.div className="j2-cta" {...arrivee(reduced, { delay: 0.58 })}>
      <a href={proHero.linkedin} target="_blank" rel="noreferrer" className="pro-btn pro-btn--ghost">
        <FiLinkedin />
        {proHero.ctaSecondary}
      </a>
    </motion.div>
    <motion.div className="j2-cta" {...arrivee(reduced, { delay: 0.64 })}>
      <Link to="/3d" className="pro-btn pro-btn--3d">
        <FiBox />
        {proUi.cta3d}
      </Link>
    </motion.div>
  </div>
);

const Portrait = ({ proUi, reduced, style }) => (
  <motion.div className="pro-hero__portrait" style={style}>
    <motion.div
      className="pro-hero__portrait-card"
      initial={reduced ? false : { opacity: 0, scale: 0.94, rotate: 6 }}
      animate={
        reduced
          ? { rotate: 2.5 }
          : { opacity: 1, scale: 1, rotate: 2.5, transition: { duration: 0.8, delay: 0.35, ease: E_PORTRAIT } }
      }
      // Le survol existant est reproduit ici : framer pose un transform en
      // ligne, qui l'emporterait sur la règle CSS `:hover` de pro.scss.
      whileHover={reduced ? undefined : { rotate: 0.5, y: -4, transition: { duration: 0.5, ease: "easeOut" } }}
    >
      <img src={jeremy} alt={proUi.heroAlt} />
    </motion.div>

    <span className="j2-chip j2-chip--top">
      <motion.span
        className="pro-hero__chip"
        initial={reduced ? false : { opacity: 0, y: 8, rotate: -3 }}
        animate={
          reduced
            ? { rotate: -3 }
            : { opacity: 1, y: 0, rotate: -3, transition: { duration: 0.3, delay: 0.7, ease: E } }
        }
      >
        <FiBriefcase />
        {proUi.chipTop}
      </motion.span>
    </span>

    <span className="j2-chip j2-chip--bottom">
      <motion.span
        className="pro-hero__chip"
        initial={reduced ? false : { opacity: 0, y: 8, rotate: 2 }}
        animate={
          reduced
            ? { rotate: 2 }
            : { opacity: 1, y: 0, rotate: 2, transition: { duration: 0.3, delay: 0.8, ease: E } }
        }
      >
        <FiAward />
        {proUi.chipBottom}
      </motion.span>
    </span>
  </motion.div>
);

// --------------------------------------------------------------- scène épinglée

const HeroPinned = ({ content, parts, ready, hint }) => {
  const { proHero, proPillars, proUi } = content;

  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const deckRef = useRef(null);
  const midRef = useRef(null);
  const emRef = useRef(null);

  // Mappage direct, réversible sous le doigt : aucun ressort sur la scène.
  const p = useSceneProgress(stageRef, { start: "start start", end: "end end" });

  // Le pointeur n'écrit que --mx / --my sur le pin (en %, donc insensible au
  // zoom 0,85). Seuls le soleil et les deux chips s'en servent.
  usePointerVars(pinRef);

  // Géométrie mesurée en pixels CSS de mise en page (offset*), réinjectée
  // telle quelle dans des translate() : le zoom 0,85 s'annule des deux côtés.
  const [geo, setGeo] = useState({ H: 900, mx: 0, my: 0, ex: 0, ey: 0 });

  const mesurer = useCallback(() => {
    const pin = pinRef.current;
    const deck = deckRef.current;
    const mid = midRef.current;
    const em = emRef.current;
    if (!pin || !deck || !mid || !em) return;

    const H = pin.offsetHeight;
    const d = offsetIn(deck, pin);
    const m = offsetIn(mid, pin);
    const e = offsetIn(em, pin);
    // Ligne de repos des deux morceaux : juste au-dessus du tablier (46 %).
    const cy = H * 0.44;

    const suivant = {
      H,
      // transform-origin left center : le point gauche survit au scale.
      mx: d.x - m.x,
      my: cy - (m.y + mid.offsetHeight / 2),
      // transform-origin right center : le point droit survit au scale.
      ex: d.x + deck.offsetWidth - (e.x + em.offsetWidth),
      ey: cy - (e.y + em.offsetHeight / 2),
    };

    setGeo((prec) =>
      Math.abs(prec.H - suivant.H) < 0.5 &&
      Math.abs(prec.mx - suivant.mx) < 0.5 &&
      Math.abs(prec.my - suivant.my) < 0.5 &&
      Math.abs(prec.ex - suivant.ex) < 0.5 &&
      Math.abs(prec.ey - suivant.ey) < 0.5
        ? prec
        : suivant
    );
  }, []);

  // Remesure : montage, resize, changement de langue (parts), arrivée du
  // contenu sous la ligne de flottaison, polices chargées.
  useEffect(() => {
    let annule = false;
    const differe = () => {
      if (!annule) mesurer();
    };
    differe();
    const id = requestAnimationFrame(differe);
    const t = setTimeout(differe, 280);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(differe) : null;
    if (ro && pinRef.current) ro.observe(pinRef.current);
    if (ro && deckRef.current) ro.observe(deckRef.current);
    window.addEventListener("resize", differe, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(differe).catch(() => {});

    return () => {
      annule = true;
      cancelAnimationFrame(id);
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", differe);
    };
  }, [mesurer, parts, ready]);

  // --------------------------------------------------- chronologie sur p
  const optOut = { ease: easeOutCubic };
  const optInOut = { ease: easeInOutCubic };

  const heroFade = {
    opacity: useTransform(p, [0, 0.18], [1, 0]),
    y: useTransform(p, [0, 0.18], [0, -0.04 * geo.H]),
  };

  const portraitStyle = {
    opacity: useTransform(p, [0.04, 0.22], [1, 0]),
    scale: useTransform(p, [0.04, 0.22], [1, 0.9]),
    y: useTransform(p, [0.04, 0.22], [0, 0.06 * geo.H]),
  };

  const headStyle = {
    scale: useTransform(p, [0.15, 0.4], [1, 0.6], optOut),
    opacity: useTransform(p, [0.15, 0.4], [1, 0]),
  };
  const linkStyle = { opacity: useTransform(p, [0.15, 0.25], [1, 0]) };
  const midStyle = {
    x: useTransform(p, [0.15, 0.5], [0, geo.mx], optInOut),
    y: useTransform(p, [0.15, 0.5], [0, geo.my], optInOut),
    scale: useTransform(p, [0.15, 0.5], [1, 0.55], optInOut),
  };
  const emStyle = {
    x: useTransform(p, [0.15, 0.5], [0, geo.ex], optInOut),
    y: useTransform(p, [0.15, 0.5], [0, geo.ey], optInOut),
    scale: useTransform(p, [0.15, 0.5], [1, 0.55], optInOut),
  };

  const deckScaleX = useTransform(p, [0.42, 0.56], [0, 1], optOut);
  const deckTicks = useTransform(p, [0.54, 0.58], [0, 1]);

  const expHeadStyle = {
    opacity: useTransform(p, [0.78, 0.92], [0, 1]),
    y: useTransform(p, [0.78, 0.92], ["3%", "0%"], optOut),
  };

  const sunStyle = {
    x: useTransform(p, [0, 0.6], [0, -0.18 * 640]),
    y: useTransform(p, [0, 0.6], [0, -0.14 * geo.H]),
    scale: useTransform(p, [0, 0.6], [1, 0.8]),
    opacity: useTransform(p, [0, 0.6], [1, 0.55]),
  };

  const hintStyle = { opacity: useTransform(p, [0, 0.05], [1, 0]) };

  // `will-change` et pointer-events pilotés par deux booléens seulement :
  // aucun état React par frame.
  const [live, setLive] = useState(false);
  const [built, setBuilt] = useState(false);
  useMotionValueEvent(p, "change", (v) => {
    const l = v > 0 && v < 1;
    setLive((prec) => (prec === l ? prec : l));
    const b = v > 0.45;
    setBuilt((prec) => (prec === b ? prec : b));
  });

  return (
    <section
      className={`j2-stage${live ? " j2-stage--live" : ""}${built ? " j2-stage--built" : ""}`}
      ref={stageRef}
    >
      <div className="j2-stage__pin" ref={pinRef}>
        <header className="pro-hero j2-hero">
          <Sun style={sunStyle} />

          <div className="pro-container pro-hero__inner">
            <div className="j2-hero__col">
              <Fade style={heroFade}>
                <Badge text={proHero.badge} />
              </Fade>

              <SplitTitle
                parts={parts}
                heroTitle={proUi.heroTitle}
                reduced={false}
                styles={{ head: headStyle, mid: midStyle, link: linkStyle, em: emStyle }}
                refs={{ mid: midRef, em: emRef }}
              />

              <Fade style={heroFade}>
                <Intro text={proHero.intro} />
              </Fade>

              <Fade style={heroFade}>
                <Ctas proHero={proHero} proUi={proUi} />
              </Fade>
            </div>

            <Portrait proUi={proUi} style={portraitStyle} />
          </div>
        </header>

        {/* Indice de défilement : une apparition, aucune boucle, éteint dès p > 0,05. */}
        <motion.div className="j2-layer j2-layer--hint" style={hintStyle} aria-hidden="true">
          <div className="pro-container">
            <motion.span
              className="j2-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4, delay: 1.4 } }}
            >
              <i className="j2-hint__dot" />
              {hint}
            </motion.span>
          </div>
        </motion.div>

        {/* En-tête de la section Expertises : le vrai contenu, pas un décor. */}
        {ready && (
          <motion.div className="j2-layer j2-layer--head" style={expHeadStyle}>
            <div className="pro-container">
              <div className="pro-section__head j2-exphead">
                <p className="pro-section__eyebrow">{proUi.expertise.eyebrow}</p>
                <h2 className="pro-section__title">{proUi.expertise.title}</h2>
                <p className="pro-section__sub">{proUi.expertise.sub}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Le tablier : la pièce sur laquelle tout vient se poser. */}
        <div className="j2-layer j2-layer--deck">
          <div className="pro-container">
            <Deck deckRef={deckRef} scaleX={deckScaleX} ticks={deckTicks} />
          </div>
        </div>

        {ready && (
          <div className="j2-layer j2-layer--cards">
            <div className="pro-container">
              <PillarCardsPinned pillars={proPillars} p={p} />
            </div>
          </div>
        )}
      </div>

      {/* Le lien « Expertises » et l'observateur analytics atterrissent sur le
          pont FINI : la sentinelle est placée à p ≈ 0,99, pas au bas du track. */}
      <div id="expertises" className="j2-sentinel" aria-hidden="true" />
    </section>
  );
};

// --------------------------------------------------------------- mode linéaire

const HeroLinear = ({ content, parts, ready, reduced }) => {
  const { proHero, proPillars, proUi } = content;
  const heroRef = useRef(null);
  usePointerVars(heroRef);

  return (
    <>
      <header className="pro-hero j2-hero j2-hero--linear" ref={heroRef}>
        <Sun reduced={reduced} />
        <div className="pro-container pro-hero__inner">
          <div className="j2-hero__col">
            <Badge text={proHero.badge} reduced={reduced} />
            <SplitTitle parts={parts} heroTitle={proUi.heroTitle} reduced={reduced} />
            <Intro text={proHero.intro} reduced={reduced} />
            <Ctas proHero={proHero} proUi={proUi} reduced={reduced} />
          </div>
          <Portrait proUi={proUi} reduced={reduced} />
        </div>
      </header>

      {ready && (
        <section id="expertises" className="pro-section pro-section--flush j2-exp">
          <div className="pro-container">
            <motion.div
              className="pro-section__head"
              initial={reduced ? false : { opacity: 0, y: 28 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <p className="pro-section__eyebrow">{proUi.expertise.eyebrow}</p>
              <h2 className="pro-section__title">{proUi.expertise.title}</h2>
              <p className="pro-section__sub">{proUi.expertise.sub}</p>
            </motion.div>

            {/* Le pont, en une ligne : le titre reste le motif de la section. */}
            {parts && (
              <div className="j2-expline" aria-hidden="true">
                <span className="j2-expline__word">{parts.mid}</span>
                <motion.span
                  className="j2-expline__deck"
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={reduced ? undefined : { scaleX: 1, transition: { duration: 0.7, ease: E } }}
                  viewport={{ once: true, amount: 0.4 }}
                />
                <span className="j2-expline__word">
                  <em>{parts.em}</em>
                  {parts.post}
                </span>
              </div>
            )}

            <PillarCardsLinear pillars={proPillars} />
          </div>
        </section>
      )}
    </>
  );
};

// --------------------------------------------------------------- aiguillage

const HeroStage = ({ pinned, ...props }) =>
  pinned ? <HeroPinned {...props} /> : <HeroLinear {...props} />;

export default HeroStage;
