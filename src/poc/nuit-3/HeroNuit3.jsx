// src/poc/nuit-3/HeroNuit3.jsx
// Le hero garde EXACTEMENT la géométrie du hero nuit actuel (la bascule
// jour/nuit ne doit déplacer aucun bloc) et tout son contenu (`nightUi.hero`).
// Ce qui change : l'intérieur de la carte est transparent, la photo n'est plus
// que l'amorce, et le portrait est composé par les points du ciel.
//
// Le seul élément mesuré par le ciel est `.n3-portrait__mesure` : il reproduit
// exactement la boîte de l'image (inset 13px = padding 12 + bordure 1) SANS
// être tourné, ce qui évite le piège du rect d'une carte inclinée de 2,5° —
// la rotation est appliquée dans le shader (uCardRot).

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactTyped } from "react-typed";
import { FiMoon, FiCpu, FiBox } from "react-icons/fi";
import { AiOutlineGithub } from "react-icons/ai";
import { jeremy } from "../../assets";
import TypingBox from "../../components/TypingBox";
import { useLang } from "../../i18n/LanguageContext";
import { useNightContent } from "../../i18n/useContent";
import Reveal from "../shared/Reveal";
import { usePoserElement } from "./ciel/useRectRatios";
import { poserElement } from "./ciel/cielStore";

const monte = (delai, duree = 0.6) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duree, delay: delai, ease: "easeOut" },
});

const HeroNuit3 = ({ heroRef, statique, opaciteCarte, retour }) => {
  const { lang } = useLang();
  const { nightUi } = useNightContent();
  const ui = nightUi.hero;

  const photoRef = usePoserElement("photo");
  const luneRef = usePoserElement("lune");
  const texteRef = usePoserElement("texte");

  // Le hero sert de repère au pointeur (inclinaison du nuage) : il est déposé
  // dans le store comme les autres ancres.
  useEffect(() => {
    if (!heroRef?.current) return undefined;
    return poserElement("hero", heroRef.current);
  }, [heroRef]);

  const versProjets = () => {
    const cible = document.getElementById("project");
    if (cible) cible.scrollIntoView({ behavior: "smooth" });
  };

  // Sans mouvement, tout est là dès la première frame : pas de variants.
  const anim = (delai, duree) => (statique ? {} : monte(delai, duree));
  const fonduPhoto = statique
    ? { animate: { opacity: 1 } }
    : {
        // La photo ne s'efface qu'une fois ~98 % des points en place : aucun
        // trou visible entre l'amorce et le nuage.
        animate: { opacity: 0 },
        transition: { delay: retour ? 1.05 : 1.5, duration: 0.5, ease: "linear" },
      };

  return (
    <section className="n3-hero" ref={heroRef}>
      <div className="n3-container n3-hero__inner">
        <div className="n3-hero__texte" ref={texteRef}>
          <motion.span className="n3-hero__badge" {...anim(0.08)}>
            <FiMoon />
            {ui.badge}
          </motion.span>

          <h1 className="n3-hero__title">
            {statique ? (
              <span>{ui.titlePre}</span>
            ) : (
              <Reveal as="span" by="word" mode="animate" delay={160} stagger={60} duration={450}>
                {ui.titlePre}
              </Reveal>
            )}{" "}
            {/* Le prénom s'écrit : un clip-path, pas une découpe par lettre —
                les ligatures de Kalam l'interdisent. */}
            <motion.span
              className="n3-hero__name"
              initial={statique ? false : { clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0 0 0)" }}
              transition={{ delay: 0.38, duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            >
              {ui.name}
            </motion.span>
          </h1>

          <div className="n3-hero__typed">
            {statique ? (
              <span>{ui.typed[0]}</span>
            ) : (
              <ReactTyped
                key={lang}
                strings={ui.typed}
                typeSpeed={60}
                backSpeed={60}
                backDelay={1500}
                startDelay={700}
                loop
              />
            )}
          </div>

          <motion.div className="n3-hero__intro" {...anim(0.7, 0.5)}>
            {statique ? (
              // Même gabarit que TypingBox, sans la frappe.
              <div className="relative border border-[#915EFF] rounded-2xl max-w-3xl w-full">
                <div className="p-6">
                  <p
                    style={{ fontWeight: "250", fontSize: "1.4rem" }}
                    className="text-[#FFFFFF] text-base sm:text-lg leading-relaxed text-left"
                    dangerouslySetInnerHTML={{ __html: ui.intro }}
                  />
                </div>
              </div>
            ) : (
              <TypingBox key={lang} line={ui.intro} />
            )}
          </motion.div>

          <div className="n3-hero__ctas">
            <motion.button
              type="button"
              onClick={versProjets}
              className="n3-btn n3-btn--primary"
              {...anim(0.9)}
            >
              {ui.ctaProjects}
            </motion.button>
            <motion.a
              href="https://github.com/jeremy-angulo"
              target="_blank"
              rel="noreferrer"
              className="n3-btn n3-btn--ghost"
              {...anim(0.97)}
            >
              <AiOutlineGithub />
              GitHub
            </motion.a>
            <motion.div {...anim(1.04)}>
              <Link to="/3d" className="n3-btn n3-btn--3d">
                <FiBox />
                {ui.cta3d}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Le cadre, la lune et les chips s'effacent au défilement : ce sont
            des motion values, aucun re-render pendant le scroll. */}
        <motion.div className="n3-portrait" style={statique ? undefined : { opacity: opaciteCarte }}>
          <motion.span
            className="n3-portrait__lune"
            aria-hidden="true"
            ref={luneRef}
            {...anim(0.3, 0.55)}
          />
          <motion.div className="n3-portrait__carte" {...anim(0.3, 0.55)}>
            <motion.img
              src={jeremy}
              alt={ui.alt}
              initial={{ opacity: 1 }}
              {...fonduPhoto}
            />
          </motion.div>
          {/* Boîte de mesure : même rect que l'image, jamais tournée. */}
          <span className="n3-portrait__mesure" aria-hidden="true" ref={photoRef} />

          <motion.span className="n3-chip n3-chip--top" {...anim(1.1)}>
            <FiMoon />
            {ui.chipTop}
          </motion.span>
          <motion.span className="n3-chip n3-chip--bottom" {...anim(1.2)}>
            <FiCpu />
            {ui.chipBottom}
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroNuit3;
