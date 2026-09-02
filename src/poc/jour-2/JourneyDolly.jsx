// src/poc/jour-2/JourneyDolly.jsx
// Le parcours se traverse latéralement : un travelling épinglé où 1 px de
// défilement = 1 px de déplacement (mappage direct, sans ressort, réversible).
// Sept stations : les trois étapes du parcours, un séparateur « Formation »,
// les trois écoles. Un rail ambre se dessine au-dessus et allume ses points
// au passage.
//
// Mobile : le même ruban, en défilement natif avec scroll-snap.
// Mouvement réduit : la section ProJourney de l'accueil, telle quelle.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import ProJourney from "../../pro/ProJourney";
import { rise, viewportOnce } from "../../pro/proMotion";
import useSceneProgress from "./useSceneProgress";

const TimelineCard = ({ step }) => (
  <article className="j2-card">
    <p className="pro-timeline__date">{step.date}</p>
    <h3 className="j2-card__title">{step.title}</h3>
    <p className="pro-timeline__company">
      <img src={step.icon} alt="" aria-hidden="true" />
      {step.company}
    </p>
    <p className="j2-card__text">{step.text}</p>
  </article>
);

const EduCard = ({ edu }) => (
  <div className="pro-edu__card j2-edu">
    <img src={edu.image} alt={edu.school} />
    <div>
      <strong>{edu.school}</strong>
      <span>{edu.degree}</span>
      <span>{edu.year}</span>
    </div>
  </div>
);

// ------------------------------------------------------------------ épinglé

const JourneyPinned = ({ timeline, educations, ui }) => {
  const trackRef = useRef(null);
  const headRef = useRef(null);
  const viewRef = useRef(null);
  const dollyRef = useRef(null);

  const p = useSceneProgress(trackRef, { start: "start start", end: "end end" });

  // D = largeur du ruban − largeur visible. Tout est en pixels CSS de mise en
  // page (offset*), comme le translate() qu'on en tire : le zoom s'annule.
  const [geo, setGeo] = useState({ d: 0, gut: 32, ratios: [] });

  const mesurer = useCallback(() => {
    const head = headRef.current;
    const view = viewRef.current;
    const dolly = dollyRef.current;
    if (!head || !view || !dolly) return;

    const gut = head.offsetLeft + (parseFloat(getComputedStyle(head).paddingLeft) || 0);
    const largeurRuban = dolly.offsetWidth;
    const d = Math.max(0, largeurRuban - view.offsetWidth);

    // Abscisse relative de chaque point, pour savoir quand il s'allume.
    const ratios = Array.from(dolly.querySelectorAll(".j2-station")).map((el) =>
      largeurRuban ? (el.offsetLeft + el.offsetWidth / 2) / largeurRuban : 0
    );

    setGeo((prec) =>
      Math.abs(prec.d - d) < 0.5 && Math.abs(prec.gut - gut) < 0.5 && prec.ratios.length === ratios.length
        ? prec
        : { d, gut, ratios }
    );
  }, []);

  useEffect(() => {
    let annule = false;
    const differe = () => {
      if (!annule) mesurer();
    };
    differe();
    const id = requestAnimationFrame(differe);
    const t = setTimeout(differe, 300);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(differe) : null;
    if (ro && viewRef.current) ro.observe(viewRef.current);
    if (ro && dollyRef.current) ro.observe(dollyRef.current);
    window.addEventListener("resize", differe, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(differe).catch(() => {});
    return () => {
      annule = true;
      cancelAnimationFrame(id);
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", differe);
    };
  }, [mesurer, timeline, educations, ui]);

  const x = useTransform(p, [0, 1], [0, -geo.d]);

  // Points allumés : un seul entier d'état, incrémenté sept fois au plus.
  const [allumes, setAllumes] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    let n = 0;
    for (const r of geo.ratios) if (v >= r) n += 1;
    setAllumes((prec) => (prec === n ? prec : n));
  });

  const stations = [
    ...timeline.map((step) => ({ key: step.title, node: <TimelineCard step={step} /> })),
    {
      key: "__sep",
      node: (
        <div className="j2-sep" aria-hidden="true">
          <span className="j2-sep__label">{ui.journey.eduLabel}</span>
        </div>
      ),
    },
    ...educations.map((edu) => ({ key: edu.school, node: <EduCard edu={edu} /> })),
  ];

  return (
    <section
      id="parcours"
      className="j2-journey"
      ref={trackRef}
      style={{ height: `calc(var(--j2-vh) + ${Math.round(geo.d)}px)` }}
    >
      <div className="j2-journey__pin">
        <div className="pro-container j2-journey__head" ref={headRef}>
          <div className="pro-section__head">
            <p className="pro-section__eyebrow">{ui.journey.eyebrow}</p>
            <h2 className="pro-section__title">{ui.journey.title}</h2>
            <p className="pro-section__sub">{ui.journey.sub}</p>
          </div>
        </div>

        <div className="j2-journey__viewport" ref={viewRef}>
          <motion.div
            className="j2-dolly"
            ref={dollyRef}
            style={{ x, paddingLeft: `${Math.round(geo.gut)}px` }}
          >
            <div className="j2-rail" aria-hidden="true">
              <motion.div className="j2-rail__line" style={{ scaleX: p }} />
            </div>

            {stations.map((station, i) => (
              <div key={station.key} className={`j2-station${i < allumes ? " is-on" : ""}`}>
                <span className="j2-station__dot" aria-hidden="true" />
                {station.node}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ------------------------------------------------------------ non épinglé

const JourneyLinear = ({ timeline, educations, ui }) => (
  <section id="parcours" className="pro-section j2-journey--linear">
    <div className="pro-container">
      <motion.div
        className="pro-section__head"
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        <p className="pro-section__eyebrow">{ui.journey.eyebrow}</p>
        <h2 className="pro-section__title">{ui.journey.title}</h2>
        <p className="pro-section__sub">{ui.journey.sub}</p>
      </motion.div>
    </div>

    {/* Défilement natif au doigt : scroll-snap, jamais de capture du scroll. */}
    <div className="j2-swipe-wrap">
      <div className="j2-swipe__rail" aria-hidden="true" />
      <div className="j2-swipe">
        {timeline.map((step) => (
          <div key={step.title} className="j2-swipe__item">
            <TimelineCard step={step} />
          </div>
        ))}
      </div>
    </div>

    <div className="pro-container">
      <motion.aside
        className="pro-edu j2-journey__edu"
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        custom={1}
      >
        <p className="pro-edu__label">{ui.journey.eduLabel}</p>
        {educations.map((edu) => (
          <EduCard key={edu.school} edu={edu} />
        ))}
      </motion.aside>
    </div>
  </section>
);

const JourneyDolly = ({ pinned, reduced, timeline, educations, ui }) => {
  // Mouvement réduit : la timeline verticale de l'accueil, sans rien inventer.
  if (reduced) return <ProJourney />;
  return pinned ? (
    <JourneyPinned timeline={timeline} educations={educations} ui={ui} />
  ) : (
    <JourneyLinear timeline={timeline} educations={educations} ui={ui} />
  );
};

export default JourneyDolly;
