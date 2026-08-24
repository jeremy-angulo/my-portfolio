// src/components/Hero.jsx
// Hero de la facette nuit : la structure est calquée sur ProHero (facette jour)
// pour une bascule fluide — badge, titre, intro, CTAs à gauche ; portrait à droite.

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactTyped } from "react-typed";
import { FiMoon, FiCpu, FiBox } from "react-icons/fi";
import { AiOutlineGithub } from "react-icons/ai";
import { jeremy } from "../assets";
import TypingBox from "./TypingBox";
import { rise } from "../pro/proMotion";
import { useLang } from "../i18n/LanguageContext";
import { useNightContent } from "../i18n/useContent";
import "./Hero.scss";

const Hero = () => {
  const { lang } = useLang();
  const { nightUi } = useNightContent();
  const ui = nightUi.hero;

  const handleScrollToProjects = () => {
    const projectSection = document.getElementById('project');
    if (projectSection) {
      projectSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="night-hero">
      <div className="night-container night-hero__inner">
        <motion.div variants={rise} initial="hidden" animate="show">
          <span className="night-hero__badge">
            <FiMoon />
            {ui.badge}
          </span>

          <h1 className="night-hero__title">
            {ui.titlePre} <span className="night-hero__name">{ui.name}</span>
          </h1>

          <div className="night-hero__typed">
            {/* key={lang} force un re-montage des animations de frappe au changement de langue */}
            <ReactTyped
              key={lang}
              strings={ui.typed}
              typeSpeed={60}
              backSpeed={60}
              backDelay={1500}
              loop
            />
          </div>

          <div className="night-hero__typing">
            <TypingBox key={lang} line={ui.intro} />
          </div>

          <div className="night-hero__ctas">
            <button
              type="button"
              onClick={handleScrollToProjects}
              className="night-btn night-btn--primary"
            >
              {ui.ctaProjects}
            </button>
            <a
              href="https://github.com/jeremy-angulo"
              target="_blank"
              rel="noreferrer"
              className="night-btn night-btn--ghost"
            >
              <AiOutlineGithub />
              GitHub
            </a>
            <Link to="/3d" className="night-btn night-btn--3d">
              <FiBox />
              {ui.cta3d}
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="night-hero__portrait"
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <div className="night-hero__portrait-card">
            <img src={jeremy} alt={ui.alt} />
          </div>
          <span className="night-hero__chip night-hero__chip--top">
            <FiMoon />
            {ui.chipTop}
          </span>
          <span className="night-hero__chip night-hero__chip--bottom">
            <FiCpu />
            {ui.chipBottom}
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
