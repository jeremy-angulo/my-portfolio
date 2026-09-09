// src/pro/ProHero.jsx
// Le hero de la facette jour : rien n'est imprimé d'avance, tout se compose
// sous les yeux du visiteur.
//
// Le geste signature : les mots du H1 montent un à un hors de leur ligne
// masquée, puis un trait d'ambre se dessine sous les mots de l'<em> et la
// couleur ambre le suit, comme un surligneur. Ce même trait revient ensuite à
// chaque tête de section, entre les chiffres, dans la colonne du parcours et
// au pied de page.
//
// Tout est en transform / opacity / clip-path / stroke-dashoffset. Aucune
// mesure en pixels absolus : les effets de pointeur passent par des ratios de
// rects poussés en variables CSS (`body { zoom: 0.85 }` oblige).

import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { FiSun, FiBriefcase, FiAward, FiBox } from "react-icons/fi";
import { jeremy } from "../assets";
import { useProContent } from "../i18n/useContent";
import { RevealWord } from "../components/Reveal";
import usePointerVars from "../hooks/usePointerVars";
import useScrollRatio from "../hooks/useScrollRatio";
import ProAmberStroke from "./ProAmberStroke";

// --------------------------------------------------------------- Timings
// Tout est exprimé en ms APRÈS t0. t0 laisse le « lever de soleil » de la
// transition de route s'installer avant que la composition commence.
const TIMINGS = {
  t0: 350,
  soleil: { delai: 0, duree: 1100 },
  badge: { delai: 0, duree: 450 },
  mots: { delai: 120, pas: 80, duree: 640 },
  trait: { delai: 1000, total: 620 },
  intro: { delai: 700, dureeClip: 700, dureeOpacite: 300 },
  cta: 900,
  portrait: { delai: 900, duree: 800 },
  chips: [1150, 1270],
};

// Easing des entrées (sortie douce). Celui des tracés — cubic-bezier(0.65, 0,
// 0.35, 1) — vit en CSS, dans proAnim.scss, avec les transitions qu'il pilote.
const SORTIE = [0.22, 1, 0.36, 1];
const CLE_REJOUE = "day-hero-played";

// Une deuxième visite dans la même session ne rejoue pas la séquence en
// entier : mêmes gestes, 40 % plus court.
const dejaJoue = () => {
  try {
    return window.sessionStorage.getItem(CLE_REJOUE) === "1";
  } catch {
    return false;
  }
};

// -------------------------------------------------- Découpe du titre en mots
// `pre` et `em` sont découpés en mots ; `post` (« . ») est collé au dernier mot
// de l'<em> dans un wrapper insécable, pour qu'aucun retour à la ligne ne
// puisse l'isoler et pour que le trait d'ambre ne souligne QUE le mot.
const decouper = (heroTitle) => {
  const mots = (s) => String(s ?? "").split(/\s+/).filter(Boolean);
  const post = String(heroTitle?.post ?? "");
  const queue = post && !/\s/.test(post) ? post : "";
  return {
    motsPre: mots(heroTitle?.pre),
    motsEm: mots(heroTitle?.em),
    queue,
    reste: queue ? "" : post,
  };
};

// ---------------------------------------------------- Mot du titre (encre)
const Mot = ({ mot, delai, duree, statique }) => {
  if (statique) return <span className="day-word">{mot}</span>;
  return (
    <span className="day-word">
      <RevealWord variant="mask" delay={delai} duration={duree} ease={SORTIE} className="day-word__mask">
        {mot}
      </RevealWord>
    </span>
  );
};

// ------------------------------------------- Mot de l'<em> (encre → ambre)
// La copie ambre est superposée au mot et révélée par clip-path, sur la même
// durée et le même easing que le trait : la couleur suit la pointe du trait.
const MotEm = ({ mot, delai, duree, trait, statique }) => {
  const interieur = (
    <>
      {mot}
      <span className="day-word__amber" aria-hidden="true" style={statique ? undefined : trait.style}>
        {mot}
      </span>
    </>
  );

  return (
    <span className="day-word day-word--em">
      {statique ? (
        <span className="day-word__mask">{interieur}</span>
      ) : (
        <RevealWord variant="mask" delay={delai} duration={duree} ease={SORTIE} className="day-word__mask">
          {interieur}
        </RevealWord>
      )}
      <ProAmberStroke delay={trait.delai} duration={trait.duree} statique={statique} />
    </span>
  );
};

// -------------------------------------------------------- Largeur d'écran
// Le seuil des 900 px de pro.scss : sous cette largeur la grille du hero passe
// en une colonne et la parallaxe de défilement est débranchée.
const useLarge = () => {
  const lire = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 901px)").matches
      : true;
  const [large, setLarge] = useState(lire);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia("(min-width: 901px)");
    const onChange = (e) => setLarge(e.matches);
    setLarge(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return large;
};

const ProHero = ({ statique = false }) => {
  const { proHero, proUi } = useProContent();
  const hero = useRef(null);
  const large = useLarge();

  // Deuxième visite : mêmes gestes, 40 % plus court. Lu une fois au montage.
  const [facteur] = useState(() => (dejaJoue() ? 0.6 : 1));
  const ms = useMemo(() => (v) => Math.round(v * facteur), [facteur]);
  const t0 = ms(TIMINGS.t0);

  const { motsPre, motsEm, queue, reste } = useMemo(
    () => decouper(proUi.heroTitle),
    [proUi.heroTitle]
  );

  // Retard de montée de chaque mot, dans l'ordre de lecture (pre puis em,
  // le « . » monte avec le dernier mot de l'<em>).
  const retardMot = (i) => t0 + ms(TIMINGS.mots.delai + i * TIMINGS.mots.pas);
  const dureeMot = ms(TIMINGS.mots.duree);

  // Les traits s'enchaînent, chacun au prorata du nombre de caractères de son
  // mot (« le » va vite, « business » prend le temps).
  const traits = useMemo(() => {
    const poids = motsEm.map((m) => m.length + 1);
    const total = poids.reduce((a, b) => a + b, 0) || 1;
    let cumul = 0;
    return poids.map((p) => {
      const duree = Math.round((ms(TIMINGS.trait.total) * p) / total);
      const delai = t0 + ms(TIMINGS.trait.delai) + cumul;
      cumul += duree;
      return {
        delai,
        duree,
        style: { transitionDelay: `${delai}ms`, transitionDuration: `${duree}ms` },
      };
    });
  }, [motsEm, ms, t0]);

  // `.is-drawn` déclenche les transitions du trait et de la copie ambre :
  // posée après deux frames pour que l'état initial soit bien peint.
  const [dessine, setDessine] = useState(statique);
  useEffect(() => {
    if (statique) {
      setDessine(true);
      return undefined;
    }
    let second = 0;
    const premier = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setDessine(true));
    });
    return () => {
      cancelAnimationFrame(premier);
      if (second) cancelAnimationFrame(second);
    };
  }, [statique]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CLE_REJOUE, "1");
    } catch {
      /* mode privé : la séquence se rejouera en entier, sans conséquence */
    }
  }, []);

  // -------------------------------------------------------- Pointeur
  // --mx / --my en % du rect du hero : trois plans de parallaxe en CSS
  // (propriété `translate`, qui se compose avec les `transform: rotate`).
  usePointerVars(hero, { varX: "--mx", varY: "--my" });

  // -------------------------------------------------------- Défilement
  // Rect-only : insensible au zoom global. Débranché sous 900 px et en
  // mouvement réduit — figé à 0, c'est-à-dire « rien n'a encore bougé ».
  const progression = useScrollRatio(hero, {
    start: "start start",
    end: "end start",
    enabled: large && !statique,
    frozen: 0,
  });
  const portraitBrut = useTransform(progression, [0, 1], [0, 12]);
  const soleilBrut = useTransform(progression, [0, 1], [0, -8]);
  const portraitDoux = useSpring(portraitBrut, { stiffness: 90, damping: 24 });
  const soleilDoux = useSpring(soleilBrut, { stiffness: 90, damping: 24 });
  const portraitY = useTransform(portraitDoux, (v) => `${v}%`);
  const soleilY = useTransform(soleilDoux, (v) => `${v}%`);

  // -------------------------------------------------------- Variants
  // `initial={false}` (mouvement réduit) fait sauter framer directement à
  // l'état final : aucune animation ne se joue, les délais sont sans effet.
  const montee = (delai) => ({
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: delai / 1000, ease: "easeOut" } },
  });

  return (
    <header className="pro-hero" ref={hero}>
      {/* Le halo solaire : une div plutôt que le ::before de pro.scss, pour
          qu'il puisse se lever et suivre le pointeur. */}
      <motion.div
        className="day-hero__sun"
        aria-hidden="true"
        style={{ y: soleilY }}
        initial={statique ? false : { opacity: 0.4, scale: 0.85 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            duration: TIMINGS.soleil.duree / 1000,
            delay: (t0 + ms(TIMINGS.soleil.delai)) / 1000,
            ease: SORTIE,
          },
        }}
      />

      <div className="pro-container pro-hero__inner">
        <div>
          <motion.span
            className="pro-hero__badge"
            initial={statique ? false : { opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: TIMINGS.badge.duree / 1000,
                delay: (t0 + ms(TIMINGS.badge.delai)) / 1000,
                ease: "easeOut",
              },
            }}
          >
            <FiSun />
            {proHero.badge}
          </motion.span>

          <h1 className={`pro-hero__title day-hero__title${dessine ? " is-drawn" : ""}`}>
            {motsPre.map((mot, i) => (
              <Fragment key={`pre-${i}`}>
                <Mot mot={mot} delai={retardMot(i)} duree={dureeMot} statique={statique} />{" "}
              </Fragment>
            ))}
            <em>
              {motsEm.map((mot, i) => {
                const index = motsPre.length + i;
                const dernier = i === motsEm.length - 1;
                const noeud = (
                  <MotEm
                    mot={mot}
                    delai={retardMot(index)}
                    duree={dureeMot}
                    trait={traits[i]}
                    statique={statique}
                  />
                );
                return (
                  <Fragment key={`em-${i}`}>
                    {i > 0 ? " " : null}
                    {dernier && queue ? (
                      // Insécable : le point ne peut pas se retrouver seul en
                      // début de ligne, et le trait ne le souligne pas.
                      <span className="day-nowrap">
                        {noeud}
                        <Mot
                          mot={queue}
                          delai={retardMot(index)}
                          duree={dureeMot}
                          statique={statique}
                        />
                      </span>
                    ) : (
                      noeud
                    )}
                  </Fragment>
                );
              })}
            </em>
            {reste}
          </h1>

          <motion.p
            className="pro-hero__intro"
            initial={statique ? false : { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              transition: {
                delay: (t0 + ms(TIMINGS.intro.delai)) / 1000,
                clipPath: { duration: TIMINGS.intro.dureeClip / 1000, ease: SORTIE },
                opacity: { duration: TIMINGS.intro.dureeOpacite / 1000, ease: "easeOut" },
              },
            }}
          >
            {proHero.intro}
          </motion.p>

          {/* Un seul appel à l'action : l'expérience 3D. Le contact reste à un
              clic — « Me contacter » dans la navbar, la section plus bas — et
              LinkedIn vit avec les autres canaux dans cette même section. */}
          <div className="pro-hero__ctas">
            <motion.div
              variants={montee(t0 + ms(TIMINGS.cta))}
              initial={statique ? false : "hidden"}
              animate="show"
              style={{ display: "inline-flex" }}
            >
              <Link to="/3d" className="pro-btn pro-btn--3d day-cta3d">
                <FiBox />
                {proUi.cta3d}
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div className="pro-hero__portrait" style={{ y: portraitY }}>
          {/* La carte se pose : elle arrive plus inclinée, plus petite, et
              vient trouver son angle de repos (2,5°). */}
          <motion.div
            className="pro-hero__portrait-card"
            initial={statique ? false : { opacity: 0, rotate: 6, scale: 0.96, y: "4%" }}
            animate={{
              opacity: 1,
              rotate: 2.5,
              scale: 1,
              y: "0%",
              transition: {
                duration: TIMINGS.portrait.duree / 1000,
                delay: (t0 + ms(TIMINGS.portrait.delai)) / 1000,
                ease: SORTIE,
              },
            }}
            whileHover={
              statique
                ? undefined
                : { rotate: 0.5, y: -4, transition: { duration: 0.5, ease: "easeOut" } }
            }
          >
            <img src={jeremy} alt={proUi.heroAlt} />
          </motion.div>

          <motion.span
            className="pro-hero__chip pro-hero__chip--top"
            initial={statique ? false : { opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.38, delay: (t0 + ms(TIMINGS.chips[0])) / 1000, ease: SORTIE },
            }}
          >
            <FiBriefcase />
            {proUi.chipTop}
          </motion.span>
          <motion.span
            className="pro-hero__chip pro-hero__chip--bottom"
            initial={statique ? false : { opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.38, delay: (t0 + ms(TIMINGS.chips[1])) / 1000, ease: SORTIE },
            }}
          >
            <FiAward />
            {proUi.chipBottom}
          </motion.span>
        </motion.div>
      </div>
    </header>
  );
};

export default ProHero;
