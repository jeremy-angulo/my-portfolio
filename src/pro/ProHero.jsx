// src/pro/ProHero.jsx

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSun, FiBriefcase, FiAward, FiLinkedin, FiBox } from "react-icons/fi";
import { jeremy } from "../assets";
import { useProContent } from "../i18n/useContent";
import { rise } from "./proMotion";

const ProHero = () => {
  const { proHero, proUi } = useProContent();

  return (
    <header className="pro-hero">
      <div className="pro-container pro-hero__inner">
        <motion.div variants={rise} initial="hidden" animate="show">
          <span className="pro-hero__badge">
            <FiSun />
            {proHero.badge}
          </span>

          <h1 className="pro-hero__title">
            {proUi.heroTitle.pre}
            <em>{proUi.heroTitle.em}</em>
            {proUi.heroTitle.post}
          </h1>

          <p className="pro-hero__intro">{proHero.intro}</p>

          <div className="pro-hero__ctas">
            <a href="#contact" className="pro-btn pro-btn--primary">
              {proHero.ctaPrimary}
            </a>
            <a
              href={proHero.linkedin}
              target="_blank"
              rel="noreferrer"
              className="pro-btn pro-btn--ghost"
            >
              <FiLinkedin />
              {proHero.ctaSecondary}
            </a>
            <Link to="/3d" className="pro-btn pro-btn--3d">
              <FiBox />
              {proUi.cta3d}
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="pro-hero__portrait"
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <div className="pro-hero__portrait-card">
            <img src={jeremy} alt={proUi.heroAlt} />
          </div>
          <span className="pro-hero__chip pro-hero__chip--top">
            <FiBriefcase />
            {proUi.chipTop}
          </span>
          <span className="pro-hero__chip pro-hero__chip--bottom">
            <FiAward />
            {proUi.chipBottom}
          </span>
        </motion.div>
      </div>
    </header>
  );
};

export default ProHero;
