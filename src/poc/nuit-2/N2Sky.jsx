// src/poc/nuit-2/N2Sky.jsx
// La couche « ciel » : une seule surface fixe (inset: 0) sous la navbar, qui
// porte la lune du POC et son orbite. Elle est aussi l'ESPACE DE COORDONNÉES
// de toute la page : chaque position est un ratio 0..1 de son rect, converti
// en pixels CSS par sa taille CSS (offsetWidth/offsetHeight). Deux repères,
// jamais mélangés — voir useCssViewport.js.
//
// Trois états, tous dérivés du défilement :
//   HERO         h 0 → 1   la lune se dégage du portrait, grandit, se range
//   PARQUÉE      h = 1     coin haut-droit, l'orbite affiche la progression
//   ATTERRISSAGE c 0 → 1   elle rejoint la lune en flux de la section contact
//
// Aucun re-render pendant le défilement : positions et opacités sont des
// MotionValues, les ticks sont allumés par un `classList.toggle`.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import useRectRatio from "../shared/useRectRatio";
import { subscribeScrollFrame } from "../shared/useScrollRatio";
import { useLang } from "../../i18n/LanguageContext";
import { useN2Sky } from "./skyContext";
import useSectionProgress from "./useSectionProgress";

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (v, a, b) => (b === a ? (v >= b ? 1 : 0) : borner((v - a) / (b - a)));
const melange = (a, b, t) => a + (b - a) * t;

// Cotes de la lune parquée, en pixels CSS (voir la spec du POC).
const PARK = {
  desktop: { taille: 40, marge: 26, haut: 84 },
  mobile: { taille: 32, marge: 21, haut: 80 },
};

// Les cinq jalons de l'orbite, dans l'ordre de la page.
const JALONS = ["education", "project", "experience", "achievement", "contact"];

const N2Sky = () => {
  const { lang } = useLang();
  const { skyRef, heroMoonRef, contactMoonRef, sectionRefs, h, c, P, epingle, reduit } = useN2Sky();

  const moonRef = useRef(null);
  const tickRefs = useRef([]);
  const [pretRM, setPretRM] = useState(false); // mouvement réduit : hero sorti ?

  // --- ancres mesurées ---------------------------------------------------
  // Centre (et taille) des deux lunes en flux, en ratio de la couche. `live`
  // relit à chaque tour du rAF partagé : la scène du hero est collante, donc
  // l'ancre est stable, mais une arrivée sur une page déjà défilée (rechargement)
  // ou un changement de langue sont ainsi couverts sans cas particulier.
  const ancreHero = useRectRatio(heroMoonRef, skyRef, { live: true, deps: [lang] });
  const ancreContact = useRectRatio(contactMoonRef, skyRef, { live: true, deps: [lang] });

  // Taille CSS de la couche et taille de base de la lune (non transformée).
  const cotes = useRef({ w: 0, hh: 0, base: 1 });
  useEffect(() => {
    const mesurer = () => {
      const couche = skyRef.current;
      const lune = moonRef.current;
      if (!couche) return;
      cotes.current.w = couche.offsetWidth;
      cotes.current.hh = couche.offsetHeight;
      if (lune && lune.offsetWidth) cotes.current.base = lune.offsetWidth;
    };
    mesurer();
    window.addEventListener("resize", mesurer, { passive: true });
    let annule = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!annule) mesurer();
      });
    }
    return () => {
      annule = true;
      window.removeEventListener("resize", mesurer);
    };
  }, [skyRef, lang]);

  // --- position et taille ------------------------------------------------
  const brutX = useMotionValue(0);
  const brutY = useMotionValue(0);
  const brutS = useMotionValue(1);

  const cible = useCallback(
    (hv, cv) => {
      const { w, hh, base } = cotes.current;
      if (!w || !hh) return null;
      const cotesPark = epingle ? PARK.desktop : PARK.mobile;
      // Marge du conteneur : clamp(20px, 4vw, 32px). Les `vw` se calculent sur
      // le viewport non zoomé — c'est bien window.innerWidth qu'il faut lire.
      const pad = Math.min(Math.max(20, 0.04 * (window.innerWidth || 1440)), 32);
      const demi = cotesPark.taille / 2;
      const park = {
        x: (w - pad - cotesPark.marge) / w,
        y: (cotesPark.haut + cotesPark.marge) / hh,
        s: cotesPark.taille / base,
      };
      const A = ancreHero.current;
      const sHero = (A.w * w) / base || 1;

      let x;
      let y;
      let s;
      if (epingle) {
        // Bureau : dégagement → centre (50 %, 36 %) → coin.
        if (hv < 0.22) {
          x = A.x;
          y = A.y;
          s = sHero;
        } else if (hv < 0.6) {
          const t = seg(hv, 0.22, 0.6);
          x = melange(A.x, 0.5, t);
          y = melange(A.y, 0.36, t);
          s = melange(sHero, 1.9, t);
        } else {
          const t = seg(hv, 0.6, 1);
          x = melange(0.5, park.x, t);
          y = melange(0.36, park.y, t);
          s = melange(1.9, park.s, t);
        }
      } else {
        // Mobile : trajet direct vers le coin, par un point intermédiaire.
        if (hv < 0.22) {
          x = A.x;
          y = A.y;
          s = sHero;
        } else if (hv < 0.46) {
          const t = seg(hv, 0.22, 0.46);
          x = melange(A.x, 0.5, t);
          y = melange(A.y, 0.28, t);
          s = melange(sHero, 1.3, t);
        } else {
          const t = seg(hv, 0.46, 0.7);
          x = melange(0.5, park.x, t);
          y = melange(0.28, park.y, t);
          s = melange(1.3, park.s, t);
        }
      }

      // L'atterrissage prend la main dès que la section contact approche.
      if (cv > 0) {
        const t = seg(cv, 0, 0.85);
        const C = ancreContact.current;
        const sContact = C.w ? (C.w * w) / base : park.s;
        x = melange(park.x, C.x, t);
        y = melange(park.y, C.y, t);
        s = melange(park.s, sContact, t);
      }

      return { x: x * w, y: y * hh, s };
    },
    [ancreHero, ancreContact, epingle]
  );

  const maj = useCallback(() => {
    const t = cible(h.get(), c.get());
    if (!t) return;
    if (Math.abs(t.x - brutX.get()) > 0.05) brutX.set(t.x);
    if (Math.abs(t.y - brutY.get()) > 0.05) brutY.set(t.y);
    if (Math.abs(t.s - brutS.get()) > 0.0005) brutS.set(t.s);
  }, [cible, h, c, brutX, brutY, brutS]);

  useEffect(() => {
    if (reduit) return undefined;
    maj();
    // Un seul abonnement au rAF partagé : il couvre le défilement, le
    // redimensionnement et l'arrivée tardive des ancres (sections différées).
    return subscribeScrollFrame(maj);
  }, [maj, reduit]);

  const ressort = { stiffness: 90, damping: 26, mass: 0.5 };
  const x = useSpring(brutX, ressort);
  const y = useSpring(brutY, ressort);
  const echelle = useSpring(brutS, ressort);

  // --- opacités ----------------------------------------------------------
  // Fondu croisé avec la lune en flux du hero, puis avec celle du contact.
  const opaciteGroupe = useTransform([h, c], ([hv, cv]) =>
    Math.min(seg(hv, 0.15, 0.22), 1 - seg(cv, 0.85, 1))
  );
  const opaciteHalo = useTransform([h, c], ([hv, cv]) =>
    cv > 0 ? melange(0.25, 0.5, seg(cv, 0, 0.85)) : melange(0.35, 0.55, seg(hv, 0.22, 0.6)) - 0.3 * seg(hv, 0.6, 1)
  );
  const echelleHalo = useTransform([h, c], ([hv, cv]) =>
    cv > 0 ? 1.2 : melange(1, 2.4, seg(hv, 0.22, 0.6)) - 1.4 * seg(hv, 0.6, 1)
  );
  const opaciteOrbite = useTransform([h, c], ([hv, cv]) =>
    Math.min(seg(hv, 0.85, 1), 1 - seg(cv, 0, 0.25))
  );

  const Plissee = useSpring(P, { stiffness: 120, damping: 30 });

  // --- ticks -------------------------------------------------------------
  // Une progression par jalon : 0 quand le haut de la section entre par le bas
  // du viewport, 1 quand il franchit 60 % de la hauteur. Le tick s'allume au
  // franchissement et s'éteint en remontant — sans aucun re-render React.
  const pEducation = useSectionProgress(sectionRefs.education, { start: "start end", end: "start 60%", frozen: 0 });
  const pProject = useSectionProgress(sectionRefs.project, { start: "start end", end: "start 60%", frozen: 0 });
  const pExperience = useSectionProgress(sectionRefs.experience, { start: "start end", end: "start 60%", frozen: 0 });
  const pAchievement = useSectionProgress(sectionRefs.achievement, { start: "start end", end: "start 60%", frozen: 0 });
  const pContact = useSectionProgress(sectionRefs.contact, { start: "start end", end: "start 60%", frozen: 0 });

  const allumer = (i) => (v) => {
    const el = tickRefs.current[i];
    if (el) el.classList.toggle("is-passed", v >= 1);
  };
  useMotionValueEvent(pEducation, "change", allumer(0));
  useMotionValueEvent(pProject, "change", allumer(1));
  useMotionValueEvent(pExperience, "change", allumer(2));
  useMotionValueEvent(pAchievement, "change", allumer(3));
  useMotionValueEvent(pContact, "change", allumer(4));

  // --- mouvement réduit : la lune ne voyage pas -------------------------
  // Elle est parquée d'emblée, mais ne se montre qu'une fois le hero sorti de
  // l'écran (sinon deux lunes à la fois). IntersectionObserver, aucun listener
  // de défilement.
  useEffect(() => {
    if (!reduit) return undefined;
    const cible2 = document.querySelector(".n2-hero");
    if (!cible2 || typeof IntersectionObserver === "undefined") {
      setPretRM(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setPretRM(!e.isIntersecting), { threshold: 0 });
    io.observe(cible2);
    return () => io.disconnect();
  }, [reduit]);

  const cotesPark = epingle ? PARK.desktop : PARK.mobile;
  const styleParkRM = {
    right: `calc(clamp(20px, 4vw, 32px) + ${cotesPark.marge - cotesPark.taille / 2}px)`,
    top: `${cotesPark.haut + cotesPark.marge - cotesPark.taille / 2}px`,
    width: `${cotesPark.taille}px`,
    height: `${cotesPark.taille}px`,
  };

  const orbite = (
    <>
      <circle className="n2-sky__orbit-bg" cx="26" cy="26" r="23" />
      <motion.circle
        className="n2-sky__orbit-fill"
        cx="26"
        cy="26"
        r="23"
        style={reduit ? { pathLength: P } : { pathLength: Plissee }}
      />
      {JALONS.map((id, i) => {
        const a = ((-90 + i * 72) * Math.PI) / 180;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        return (
          <line
            key={id}
            ref={(el) => {
              tickRefs.current[i] = el;
            }}
            className="n2-sky__tick"
            x1={26 + 20.5 * cos}
            y1={26 + 20.5 * sin}
            x2={26 + 25 * cos}
            y2={26 + 25 * sin}
          />
        );
      })}
    </>
  );

  if (reduit) {
    // Pas de lune voyageuse : un repère fixe qui affiche la progression.
    return (
      <div className="n2-sky n2-sky--reduit" ref={skyRef} aria-hidden="true">
        <div className={`n2-sky__parked${pretRM ? " is-visible" : ""}`} style={styleParkRM}>
          <div className="n2-sky__moon n2-sky__moon--parked" ref={moonRef} />
          <svg className="n2-sky__orbit" viewBox="0 0 52 52">
            <g transform="rotate(-90 26 26)">{orbite}</g>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="n2-sky" ref={skyRef} aria-hidden="true">
      <motion.div className="n2-sky__mover" style={{ x, y, opacity: opaciteGroupe }}>
        <motion.div
          className="n2-sky__halo"
          style={{ x: "-50%", y: "-50%", scale: echelleHalo, opacity: opaciteHalo }}
        />
        <motion.div
          className="n2-sky__moon"
          ref={moonRef}
          style={{ x: "-50%", y: "-50%", scale: echelle }}
        />
        <motion.svg
          className="n2-sky__orbit"
          viewBox="0 0 52 52"
          style={{ x: "-50%", y: "-50%", opacity: opaciteOrbite }}
        >
          <g transform="rotate(-90 26 26)">{orbite}</g>
        </motion.svg>
      </motion.div>
    </div>
  );
};

export default N2Sky;
