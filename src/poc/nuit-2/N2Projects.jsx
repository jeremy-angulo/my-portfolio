// src/poc/nuit-2/N2Projects.jsx
// LE RAIL ÉPINGLÉ. Une scène collante d'une hauteur de viewport ; le
// défilement vertical devient un déplacement horizontal du rail. Les quatre
// catégories sont annoncées par des « gares » verticales, et l'index en haut à
// droite suit la position du rail (il ne se déplace jamais : halo seulement).
//
// GÉOMÉTRIE. Largeurs, positions et hauteur de piste sont calculées dans un
// seul repère, celui des pixels CSS (offsetLeft / offsetWidth / clientWidth),
// et la hauteur de viewport vient de `--n2-vh` (même repère). Le défilement
// programmé, lui, se fait dans le repère des rects (getBoundingClientRect +
// window.scrollY), jamais mélangé au premier.
//
// Mobile et mouvement réduit : plus d'épinglage du tout, le rail redevient un
// défilement horizontal natif avec accroche (scroll-snap).

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useNightContent } from "../../i18n/useContent";
import { useLang } from "../../i18n/LanguageContext";
import { viewportSize } from "../shared/useViewport";
import { subscribeScrollFrame, requestScrollFrame } from "../shared/useScrollRatio";
import { useN2Sky } from "./skyContext";
import useSectionProgress from "./useSectionProgress";
import N2SectionHeading from "./N2SectionHeading";
import N2ProjectCard from "./N2ProjectCard";
import N2Horizon from "./N2Horizon";

const N2Projects = () => {
  const { lang } = useLang();
  const {
    list,
    entrepreneurshipProjects,
    aiAndDeepTechProjects,
    itConsultingProjects,
    leadershipAndInitiativesProjects,
    nightUi,
  } = useNightContent();
  const { sectionRefs, epingle, viewportCss } = useN2Sky();

  const trackRef = useRef(null);
  const vueRef = useRef(null);
  const rowRef = useRef(null);
  const itemsRef = useRef([]);
  const gareRefs = useRef([]);
  const ongletRefs = useRef([]);
  const mesures = useRef({ overflow: 0, vueW: 0, items: [], gares: [], actif: -1, allume: -1 });

  // Même dataMap que Project.jsx : l'ordre et le contenu ne changent pas.
  const groupes = useMemo(
    () => [
      { id: "entrepreneurship", data: entrepreneurshipProjects },
      { id: "ai_deep_tech", data: aiAndDeepTechProjects },
      { id: "it_consulting", data: itConsultingProjects },
      { id: "leadership_initiatives", data: leadershipAndInitiativesProjects },
    ],
    [entrepreneurshipProjects, aiAndDeepTechProjects, itConsultingProjects, leadershipAndInitiativesProjects]
  );

  const titreDe = useCallback((id) => (list.find((c) => c.id === id) || {}).title || "", [list]);

  // Rail à plat : gares et cartes dans l'ordre, index stable = index de mesure.
  const elements = useMemo(() => {
    const out = [];
    groupes.forEach((groupe, gi) => {
      out.push({ type: "gare", cat: gi, cle: `gare-${groupe.id}` });
      groupe.data.forEach((project, pi) => {
        out.push({ type: "carte", cat: gi, project, cle: `${groupe.id}-${pi}` });
      });
    });
    return out;
  }, [groupes]);

  const r = useSectionProgress(trackRef, {
    start: "start start",
    end: "end end",
    enabled: epingle,
    frozen: 0,
  });

  const brutX = useMotionValue(0);
  const x = useSpring(brutX, { stiffness: 80, damping: 24, mass: 0.4 });

  // --- mesures (montage, resize, polices, langue) ------------------------
  const mesurer = useCallback(() => {
    const row = rowRef.current;
    const vue = vueRef.current;
    const piste = trackRef.current;
    if (!row || !vue) return;

    const vueW = vue.clientWidth;
    const overflow = Math.max(0, row.scrollWidth - vueW);
    mesures.current.vueW = vueW;
    mesures.current.overflow = overflow;
    mesures.current.items = itemsRef.current
      .map((el) => (el ? { centre: el.offsetLeft + el.offsetWidth / 2, cat: Number(el.dataset.cat) } : null))
      .filter(Boolean);
    mesures.current.gares = gareRefs.current.map((el) =>
      el ? { gauche: el.offsetLeft, centre: el.offsetLeft + el.offsetWidth / 2 } : null
    );

    if (piste) {
      if (epingle) {
        // Hauteur de piste = un écran + 0,9 px de vertical par px d'horizontal,
        // bornée entre 2,6 et 4,2 écrans pour ne jamais devenir un tunnel.
        const V = viewportCss.current.h || 900;
        const brut = V + overflow * 0.9;
        piste.style.height = `${Math.min(Math.max(brut, 2.6 * V), 4.2 * V)}px`;
      } else {
        piste.style.height = "";
      }
    }
    requestScrollFrame();
  }, [epingle, viewportCss]);

  useEffect(() => {
    mesurer();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(mesurer) : null;
    if (ro && rowRef.current) ro.observe(rowRef.current);
    if (ro && vueRef.current) ro.observe(vueRef.current);
    window.addEventListener("resize", mesurer, { passive: true });
    let annule = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!annule) mesurer();
      });
    }
    return () => {
      annule = true;
      if (ro) ro.disconnect();
      window.removeEventListener("resize", mesurer);
    };
  }, [mesurer, lang]);

  // --- boucle de défilement : x, onglet actif, carte « sous la lune » ----
  useEffect(() => {
    if (!epingle) {
      brutX.set(0);
      return undefined;
    }
    const maj = () => {
      const m = mesures.current;
      const rv = r.get();
      const cible = -m.overflow * rv;
      if (Math.abs(cible - brutX.get()) > 0.05) brutX.set(cible);

      // Élément le plus proche du centre de la scène : il donne à la fois la
      // carte allumée et la catégorie active. Aucun setState : on pose la
      // classe directement, donc zéro re-render pendant le défilement.
      const centreVue = m.vueW / 2;
      let meilleur = -1;
      let ecartMin = Infinity;
      for (let i = 0; i < m.items.length; i += 1) {
        const ecart = Math.abs(m.items[i].centre + cible - centreVue);
        if (ecart < ecartMin) {
          ecartMin = ecart;
          meilleur = i;
        }
      }
      if (meilleur !== m.allume) {
        const ancien = itemsRef.current[m.allume];
        if (ancien) ancien.classList.remove("is-lit");
        const nouveau = itemsRef.current[meilleur];
        if (nouveau) nouveau.classList.add("is-lit");
        m.allume = meilleur;
      }
      const cat = meilleur >= 0 ? m.items[meilleur].cat : -1;
      if (cat !== m.actif) {
        ongletRefs.current.forEach((el, i) => {
          if (el) el.classList.toggle("is-active", i === cat);
        });
        m.actif = cat;
      }
    };
    maj();
    return subscribeScrollFrame(maj);
  }, [epingle, r, brutX]);

  // --- navigation -------------------------------------------------------
  // Ratio de piste auquel une position du rail est centrée.
  const ratioPour = useCallback((centre) => {
    const m = mesures.current;
    if (!m.overflow) return 0;
    const brut = (centre - m.vueW / 2) / m.overflow;
    return brut < 0 ? 0 : brut > 1 ? 1 : brut;
  }, []);

  const allerAuRatio = useCallback((ratio) => {
    const piste = trackRef.current;
    if (!piste) return;
    // Repère des rects : rect + window.scrollY + hauteur de la sonde partagée.
    const rect = piste.getBoundingClientRect();
    const haut = window.scrollY + rect.top;
    const course = Math.max(0, rect.height - (viewportSize.height || window.innerHeight));
    window.scrollTo({ top: haut + ratio * course, behavior: "smooth" });
  }, []);

  const versGare = useCallback(
    (index) => {
      const m = mesures.current;
      const gare = m.gares[index];
      if (!gare) return;
      if (epingle) {
        allerAuRatio(ratioPour(gare.centre));
      } else if (vueRef.current) {
        vueRef.current.scrollTo({ left: Math.max(0, gare.gauche - 16), behavior: "smooth" });
      }
    },
    [epingle, allerAuRatio, ratioPour]
  );

  // Tabuler jusqu'à une carte hors champ ramène le rail sur elle.
  const surFocusCarte = useCallback(
    (index) => () => {
      const el = itemsRef.current[index];
      if (!el) return;
      if (epingle) {
        allerAuRatio(ratioPour(el.offsetLeft + el.offsetWidth / 2));
      } else if (vueRef.current) {
        vueRef.current.scrollTo({ left: Math.max(0, el.offsetLeft - 16), behavior: "smooth" });
      }
    },
    [epingle, allerAuRatio, ratioPour]
  );

  return (
    <section className="n2-rail" id="project" ref={sectionRefs.project}>
      <div className="n2-rail__track" ref={trackRef}>
        <div className="n2-rail__stage">
          <div className="n2-container n2-rail__head">
            <N2SectionHeading
              sub={nightUi.sections.projectsSub}
              title={nightUi.sections.projectsTitle}
              className="n2-heading--inline"
            />
            <div className="n2-rail__tabs">
              {list.map((cat, i) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`n2-rail__tab${i === 0 ? " is-active" : ""}`}
                  ref={(el) => {
                    ongletRefs.current[i] = el;
                  }}
                  onClick={() => versGare(i)}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          <div className="n2-rail__viewport" ref={vueRef}>
            <motion.div className="n2-rail__row" ref={rowRef} style={epingle ? { x } : undefined}>
              {elements.map((el, idx) =>
                el.type === "gare" ? (
                  <div
                    key={el.cle}
                    className="n2-rail__station"
                    ref={(noeud) => {
                      itemsRef.current[idx] = noeud;
                      gareRefs.current[el.cat] = noeud;
                      if (noeud) noeud.dataset.cat = String(el.cat);
                    }}
                  >
                    <span className="n2-rail__station-num">{String(el.cat + 1).padStart(2, "0")}</span>
                    <span className="n2-rail__station-title">{titreDe(groupes[el.cat].id)}</span>
                  </div>
                ) : (
                  <N2ProjectCard
                    key={el.cle}
                    index={idx}
                    project={el.project}
                    onFocusCard={surFocusCarte(idx)}
                    refCb={(noeud) => {
                      itemsRef.current[idx] = noeud;
                      if (noeud) noeud.dataset.cat = String(el.cat);
                    }}
                  />
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <N2Horizon />
    </section>
  );
};

export default N2Projects;
