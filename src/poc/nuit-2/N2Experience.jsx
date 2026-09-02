// src/poc/nuit-2/N2Experience.jsx
// LA TIMELINE QUI S'ALLUME. Un rail à deux calques : le fond lavande et un
// remplissage lavande→violet dont le scaleY suit la progression de la section.
// Chaque nœud connaît sa position sur le rail (un ratio mesuré au rect) : il
// s'allume quand le remplissage l'atteint, et s'éteint si l'on remonte.
//
// Ni react-vertical-timeline-component ni sa feuille de style ne sont importés.

import React, { useCallback, useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import { useLang } from "../../i18n/LanguageContext";
import { useN2Sky } from "./skyContext";
import useSectionProgress from "./useSectionProgress";
import N2SectionHeading from "./N2SectionHeading";
import N2ExperienceEntry from "./N2ExperienceEntry";
import N2Horizon from "./N2Horizon";

const N2Experience = () => {
  const { lang } = useLang();
  const { experiences, nightUi } = useNightContent();
  const { sectionRefs } = useN2Sky();

  const corpsRef = useRef(null);
  const railRef = useRef(null);
  const entreesRef = useRef([]);
  const noeudsRef = useRef([]);
  const ratios = useRef([]);
  const allumes = useRef(-1);

  const t = useSectionProgress(corpsRef, { start: "start 60%", end: "end 60%", frozen: 1 });
  const remplissage = useSpring(t, { stiffness: 120, damping: 28 });

  // Position de chaque nœud SUR LE RAIL, en ratio : deux rects, donc juste
  // sous body { zoom: 0.85 }. Mesurée au montage, au resize, aux polices et au
  // changement de langue — jamais pendant le défilement.
  const mesurer = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    if (!r.height) return;
    ratios.current = noeudsRef.current.map((el) => {
      if (!el) return 1;
      const n = el.getBoundingClientRect();
      return (n.top + n.height / 2 - r.top) / r.height;
    });
  }, []);

  const appliquer = useCallback((v) => {
    let compte = 0;
    for (let i = 0; i < ratios.current.length; i += 1) {
      if (v >= ratios.current[i]) compte += 1;
    }
    if (compte === allumes.current) return;
    entreesRef.current.forEach((el, i) => {
      if (el) el.classList.toggle("is-lit", i < compte);
    });
    allumes.current = compte;
  }, []);

  useEffect(() => {
    mesurer();
    appliquer(remplissage.get());
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      mesurer();
      appliquer(remplissage.get());
    }) : null;
    if (ro && railRef.current) ro.observe(railRef.current);
    window.addEventListener("resize", mesurer, { passive: true });
    let annule = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (annule) return;
        mesurer();
        appliquer(remplissage.get());
      });
    }
    return () => {
      annule = true;
      if (ro) ro.disconnect();
      window.removeEventListener("resize", mesurer);
    };
  }, [mesurer, appliquer, remplissage, lang, experiences]);

  useMotionValueEvent(remplissage, "change", appliquer);

  return (
    <section className="n2-tl" id="experience" ref={sectionRefs.experience}>
      <div className="n2-container">
        <N2SectionHeading sub={nightUi.sections.experienceSub} title={nightUi.sections.experienceTitle} />

        <div className="n2-tl__body" ref={corpsRef}>
          <div className="n2-tl__rail" ref={railRef} aria-hidden="true">
            <motion.i className="n2-tl__fill" style={{ scaleY: remplissage }} />
          </div>

          {experiences.map((experience, index) => (
            <N2ExperienceEntry
              key={`${experience.company_name}-${index}`}
              experience={experience}
              index={index}
              linkLabel={nightUi.sections.link}
              refCb={(el) => {
                entreesRef.current[index] = el;
              }}
              nodeCb={(el) => {
                noeudsRef.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
      <N2Horizon />
    </section>
  );
};

export default N2Experience;
