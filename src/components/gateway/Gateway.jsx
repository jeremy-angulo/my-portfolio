// src/components/gateway/Gateway.jsx
// L'écran split Jour / Nuit. Il vit sur /portfolio, sans aucun lien entrant :
// une page pour ceux qui connaissent l'adresse.

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AiOutlineGithub } from "react-icons/ai";
import { ImLinkedin } from "react-icons/im";
import { MdEmail } from "react-icons/md";
import LangSwitch from "../../i18n/LangSwitch";
import { useLang } from "../../i18n/LanguageContext";
import "./Gateway.scss";

// Semis d'étoiles déterministe (dispersion par nombre d'or) : pas de WebGL ici,
// le gateway doit s'afficher instantanément.
const STARS = Array.from({ length: 110 }, (_, i) => ({
  left: (i * 61.803) % 100,
  top: (i * 37.508) % 100,
  size: 1 + ((i * 7) % 3) * 0.6,
  delay: ((i * 13) % 47) / 10,
  opacity: 0.35 + ((i * 17) % 60) / 100,
}));

const GW_TEXT = {
  fr: {
    dayAria: "Entrer côté jour — Business Manager chez ALTEN",
    dayEyebrow: "Le jour",
    dayTitle: "Business Manager",
    daySub1: "Développement commercial · Recrutement · Pilotage de projets",
    daySub2: "chez ALTEN, à Toulouse.",
    dayCta: "Entrer côté jour →",
    nightAria: "Entrer côté nuit — le portfolio d'ingénieur",
    nightEyebrow: "La nuit",
    nightTitle: "Engineer & Builder",
    nightSub1: "IA · Full-stack · Produits",
    nightSub2: "le portfolio d'un ingénieur qui n'a jamais arrêté de coder.",
    nightCta: "Entrer côté nuit →",
    tagline: "Business le jour · Entrepreneur la nuit",
  },
  en: {
    dayAria: "Enter the day side — Business Manager at ALTEN",
    dayEyebrow: "By day",
    dayTitle: "Business Manager",
    daySub1: "Business development · Recruitment · Project oversight",
    daySub2: "at ALTEN, in Toulouse.",
    dayCta: "Enter the day →",
    nightAria: "Enter the night side — the engineering portfolio",
    nightEyebrow: "By night",
    nightTitle: "Engineer & Builder",
    nightSub1: "AI · Full-stack · Products",
    nightSub2: "the portfolio of an engineer who never stopped coding.",
    nightCta: "Enter the night →",
    tagline: "Business by day · Entrepreneur by night",
  },
};

const Gateway = () => {
  const { lang } = useLang();
  const t = GW_TEXT[lang] || GW_TEXT.fr;

  // À l'arrivée, la facette correspondant à l'heure locale du visiteur
  // est légèrement mise en avant.
  const favor = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? "day" : "night";
  }, []);

  return (
    <motion.main
      className={`gateway gateway--favor-${favor}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.22 } }}
    >
      {/* ------------------------------ LE JOUR ------------------------------ */}
      <Link to="/" className="gw-panel gw-panel--day" aria-label={t.dayAria}>
        <div className="gw-day__sun" aria-hidden="true" />
        <div className="gw-day__cloud gw-day__cloud--1" aria-hidden="true" />
        <div className="gw-day__cloud gw-day__cloud--2" aria-hidden="true" />

        <div className="gw-panel__content">
          <p className="gw-panel__eyebrow">{t.dayEyebrow}</p>
          <h2 className="gw-panel__title">{t.dayTitle}</h2>
          <p className="gw-panel__sub">
            {t.daySub1}
            <br />
            {t.daySub2}
          </p>
          <span className="gw-panel__cta">{t.dayCta}</span>
        </div>
      </Link>

      {/* ------------------------------ LA NUIT ------------------------------ */}
      <Link to="/tech" className="gw-panel gw-panel--night" aria-label={t.nightAria}>
        <div className="gw-night__stars" aria-hidden="true">
          {STARS.map((s, i) => (
            <span
              key={i}
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.opacity,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="gw-night__moon" aria-hidden="true" />

        <div className="gw-panel__content">
          <p className="gw-panel__eyebrow">{t.nightEyebrow}</p>
          <h2 className="gw-panel__title">{t.nightTitle}</h2>
          <p className="gw-panel__sub">
            {t.nightSub1}
            <br />
            {t.nightSub2}
          </p>
          <span className="gw-panel__cta">{t.nightCta}</span>
        </div>
      </Link>

      {/* --------------------- LE NOM, À CHEVAL SUR LES DEUX --------------------- */}
      <div className="gw-center">
        <h1 className="gw-center__name">Jérémy Angulo</h1>
        <p className="gw-center__tag">{t.tagline}</p>
      </div>

      <div className="gw-lang">
        <LangSwitch mode="gateway" />
      </div>

      <div className="gw-social">
        <a
          href="https://www.linkedin.com/in/jeremy-angulo/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <ImLinkedin />
        </a>
        <a
          href="https://github.com/jeremy-angulo"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <AiOutlineGithub />
        </a>
        <a href="mailto:jeremy.angulo@gmail.com" aria-label="Email">
          <MdEmail />
        </a>
      </div>
    </motion.main>
  );
};

export default Gateway;
