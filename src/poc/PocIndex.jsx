// src/poc/PocIndex.jsx
// /poc — la page de comparaison. Elle sert à choisir, pas à vendre : ton
// factuel, aucune capture, aucune note, aucun classement.
// Privée et noindex par la clé `poc` de useDocumentMeta (appelée par App).

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LangSwitch from "../i18n/LangSwitch";
import { useLang } from "../i18n/LanguageContext";
import useReducedMotion from "./shared/useReducedMotion";
import registry from "./registry";
import logo from "../assets/Logo_JA.png";
import "./PocIndex.scss";

// Seule source des libellés d'interface de cette page. Les `name` et les
// `tagline` viennent de registry.js, jamais réécrits ici.
const DICT = {
  fr: {
    eyebrow: "Comparaison",
    title: "Six pages à comparer",
    lede: "Six variantes complètes des deux pages du site, trois par facette, sur une échelle d'intensité croissante. Les pages publiques ne sont pas touchées ; ces adresses ne sont liées nulle part.",
    slots: { 1: "Éditorial+ · sans WebGL", 2: "Scroll cinématique · sans WebGL", 3: "Immersif · WebGL" },
    day: { title: "Facette jour", route: "Décline /" },
    night: { title: "Facette nuit", route: "Décline /tech" },
    open: "Ouvrir",
    currentLabel: "Pages actuelles, pour comparer",
    currentDay: "Version actuelle — jour (/)",
    currentNight: "Version actuelle — nuit (/tech)",
  },
  en: {
    eyebrow: "Comparison",
    title: "Six pages to compare",
    lede: "Six complete variants of the site's two pages, three per facet, on a rising scale of intensity. The public pages are untouched; these addresses are not linked anywhere.",
    slots: { 1: "Editorial+ · no WebGL", 2: "Scroll-driven · no WebGL", 3: "Immersive · WebGL" },
    day: { title: "Day facet", route: "Variant of /" },
    night: { title: "Night facet", route: "Variant of /tech" },
    open: "Open",
    currentLabel: "Current pages, for comparison",
    currentDay: "Current version — day (/)",
    currentNight: "Current version — night (/tech)",
  },
};

const Colonne = ({ facet, titre, route, dict, lang }) => (
  <section className={`poc-index__col poc-index__col--${facet === "day" ? "day" : "night"}`}>
    <h2 className="poc-index__col-title">
      <span className="poc-index__dot" aria-hidden="true" />
      {titre}
    </h2>
    <p className="poc-index__route">{route}</p>
    <ol className="poc-index__list">
      {registry
        .filter((poc) => poc.facet === facet)
        .sort((a, b) => a.slot - b.slot)
        .map((poc) => (
          <li key={poc.slug}>
            <Link to={`/poc/${poc.slug}`} className="poc-index__card">
              <span className="poc-index__num">{String(poc.slot).padStart(2, "0")}</span>
              <span className="poc-index__name">{poc.name}</span>
              <span className="poc-index__slot">{dict.slots[poc.slot]}</span>
              <span className="poc-index__tagline">{poc.tagline[lang] ?? poc.tagline.fr}</span>
              <span className="poc-index__open">
                {dict.open}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </li>
        ))}
    </ol>
  </section>
);

const PocIndex = () => {
  const { lang } = useLang();
  const dict = DICT[lang] ?? DICT.fr;
  const mouvementReduit = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mêmes valeurs que ProPage : l'aller-retour /poc <-> POC est aussi fluide
  // que la bascule jour/nuit du site. Sous mouvement réduit, une simple
  // opacité de 200 ms, sans filter.
  const transitions = mouvementReduit
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }
    : {
        initial: { opacity: 0, filter: "brightness(1.5)" },
        animate: {
          opacity: 1,
          filter: "brightness(1)",
          transition: { duration: 0.5, ease: "easeOut" },
          transitionEnd: { filter: "none" },
        },
        exit: {
          opacity: 0,
          filter: "brightness(0.5)",
          transition: { duration: 0.3, ease: "easeIn" },
        },
      };

  return (
    <motion.div className="poc-index" {...transitions}>
      <div className="poc-index__container">
        <header className="poc-index__head">
          <div className="poc-index__top">
            <span className="poc-index__brand">
              <img src={logo} alt="" width="28" height="28" />
              <span>jeremy.angulo</span>
            </span>
            <LangSwitch mode="day" />
          </div>
          <p className="poc-index__eyebrow">{dict.eyebrow}</p>
          <h1 className="poc-index__title">{dict.title}</h1>
          <p className="poc-index__lede">{dict.lede}</p>
        </header>

        <main className="poc-index__grid">
          <Colonne
            facet="day"
            titre={dict.day.title}
            route={dict.day.route}
            dict={dict}
            lang={lang}
          />
          <Colonne
            facet="night"
            titre={dict.night.title}
            route={dict.night.route}
            dict={dict}
            lang={lang}
          />
        </main>

        <footer className="poc-index__foot">
          <p className="poc-index__foot-label">{dict.currentLabel}</p>
          <p className="poc-index__foot-links">
            <Link to="/">{dict.currentDay}</Link>
            <Link to="/tech">{dict.currentNight}</Link>
          </p>
        </footer>
      </div>
    </motion.div>
  );
};

export default PocIndex;
