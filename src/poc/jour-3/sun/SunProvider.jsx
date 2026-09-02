// src/poc/jour-3/sun/SunProvider.jsx
// Le pilote de lumière de « Plein soleil ».
//
// UNE seule source de vérité pour les deux rendus : le shader (uniformes) et le
// DOM (variables CSS). Un unique rAF calcule la position du soleil, l'intègre
// par un ressort, écrit huit variables sur `.j3-root` et prévient les abonnés
// (le canvas, qui demande alors une frame). Aucun re-render React, aucune
// lecture de layout par frame ni par carte.
//
// Zoom 0.85 : les ratios viennent de `e.clientX` rapporté à la sonde de
// viewport partagée (un rect `position:fixed; inset:0`), donc du MÊME repère —
// jamais de `window.inner*`, jamais de pixels absolus.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import useHoverCapable from "../../shared/useHoverCapable";
import useRectRatio from "../../shared/useRectRatio";
import useScrollRatio from "../../shared/useScrollRatio";
import { viewportSize } from "../../shared/useViewport";

const ContexteSoleil = createContext(null);

/** Accès au pilote de lumière (état du soleil, abonnement aux frames). */
export const useSoleil = () => useContext(ContexteSoleil);

// ------------------------------------------------------------------ réglages

const DUREE_LEVER = 1600; // ms
const DEPART_Y = 1.05; // le disque part sous la ligne d'horizon
const GAIN = 0.45; // le soleil ne suit le pointeur qu'à 45 %
const BORNES = { xMin: 0.42, xMax: 0.96, yMin: 0.05, yMax: 0.6 };
const RESSORT = { k: 60, c: 18, m: 1 };
const RESSORT_JOUR = { k: 40, c: 20, m: 1 };
const TAILLE_REPOS = 0.048;
const SECOURS_LEVER = 1400; // ms : si le canvas ne répond pas, on lève sans lui

// Repos du soleil : plus haut et plus à droite sur écran étroit, pour affleurer
// derrière le coin haut-droit du portrait.
const reposPour = (largeur) => (largeur && largeur < 900 ? { x: 0.82, y: 0.12 } : { x: 0.8, y: 0.2 });

// Course du jour : le soleil traverse le ciel pendant qu'on descend la page.
// (La clé p = 0 est remplacée par le repos courant.)
const COURSE = [
  { p: 0.0, x: 0.8, y: 0.2, size: TAILLE_REPOS },
  { p: 0.35, x: 0.55, y: 0.06, size: 0.036 },
  { p: 0.75, x: 0.25, y: 0.14, size: 0.044 },
  { p: 0.92, x: 0.12, y: 0.55, size: 0.05 },
  { p: 1.0, x: 0.1, y: 0.92, size: 0.056 },
];

// Dérive tactile : une ellipse lente autour du repos (40 s).
const DERIVE = { ax: 0.08, ay: 0.05, periode: 40000 };

// Valeurs figées sous mouvement réduit : lumière haut-droite, ombres courtes.
const FIGE = { sx: 0.8, sy: 0.2, ldx: -0.6, ldy: 0.6, pdx: -0.5, pdy: 0.6, shx: -1.2, shy: 2 };

// ------------------------------------------------------------------ utilitaires

const borner = (v, min, max) => (v < min ? min : v > max ? max : v);
const melange = (a, b, t) => a + (b - a) * t;

// Évaluateur de cubic-bezier (Newton) : cubic-bezier(.22,.61,.36,1).
const courbe = (p1x, p1y, p2x, p2y) => {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const enX = (t) => ((ax * t + bx) * t + cx) * t;
  const enY = (t) => ((ay * t + by) * t + cy) * t;
  const pente = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const err = enX(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = pente(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return enY(borner(t, 0, 1));
  };
};

const EASE_LEVER = courbe(0.22, 0.61, 0.36, 1);

// Interpolation linéaire entre les clés de la course du jour.
const courseA = (p, repos) => {
  if (p <= 0) return { x: repos.x, y: repos.y, size: COURSE[0].size };
  for (let i = 1; i < COURSE.length; i += 1) {
    if (p <= COURSE[i].p) {
      const a = COURSE[i - 1];
      const b = COURSE[i];
      const t = (p - a.p) / (b.p - a.p);
      const ax = i === 1 ? repos.x : a.x;
      const ay = i === 1 ? repos.y : a.y;
      return { x: melange(ax, b.x, t), y: melange(ay, b.y, t), size: melange(a.size, b.size, t) };
    }
  }
  const f = COURSE[COURSE.length - 1];
  return { x: f.x, y: f.y, size: f.size };
};

// ------------------------------------------------------------------ composant

/**
 * @param {{ rootRef, heroRef, portraitRef, reduit?: boolean,
 *           attendreCanvas?: boolean, reposImmediat?: boolean,
 *           children?: React.ReactNode }} props
 * `reposImmediat` : paramètre de debug `?sun=rest` — pas de lever, soleil posé.
 * `attendreCanvas` : le lever attend le premier frame WebGL (sinon il part seul).
 */
const SunProvider = ({
  rootRef,
  heroRef,
  portraitRef,
  reduit = false,
  attendreCanvas = false,
  reposImmediat = false,
  children,
}) => {
  const survolPossible = useHoverCapable();

  // Progression de page (course du jour) et sortie du hero, toutes deux
  // calculées sur des rects par le moteur partagé : insensibles au zoom.
  const ratioPage = useScrollRatio(rootRef, {
    start: "start start",
    end: "end end",
    enabled: !reduit,
    frozen: 0,
  });
  const ratioHero = useScrollRatio(heroRef, {
    start: "start start",
    end: "center start",
    enabled: !reduit,
    frozen: 0,
  });

  // Centre de la carte-portrait, en ratio du viewport : sert à orienter la
  // carte VERS le soleil (mesure au montage et aux redimensionnements, jamais
  // par frame).
  const ratioPortrait = useRectRatio(portraitRef, { live: false });

  // État mutable partagé avec le shader : aucun re-render.
  const etat = useRef({
    sx: 0.8,
    sy: DEPART_Y,
    halo: 0,
    day: 0,
    floor: 1,
    size: TAILLE_REPOS,
  });

  const abonnes = useRef(new Set());
  const declencheur = useRef(null); // appelé par le canvas à son premier frame
  const [t0, setT0] = useState(null); // top de départ des révélations du hero

  // ---------------------------------------------------------------- pilote
  useEffect(() => {
    const e = etat.current;
    const noeud = rootRef.current;

    const poser = (v) => {
      if (!noeud) return;
      noeud.style.setProperty("--sx", `${v.sx * 100}%`);
      noeud.style.setProperty("--sy", `${v.sy * 100}%`);
      noeud.style.setProperty("--ldx", `${v.ldx}`);
      noeud.style.setProperty("--ldy", `${v.ldy}`);
      noeud.style.setProperty("--pdx", `${v.pdx}`);
      noeud.style.setProperty("--pdy", `${v.pdy}`);
      noeud.style.setProperty("--shx", `${v.shx}%`);
      noeud.style.setProperty("--shy", `${v.shy}%`);
    };

    if (reduit) {
      // Mouvement réduit : aucune boucle, des valeurs de repos écrites une fois.
      e.sx = FIGE.sx;
      e.sy = FIGE.sy;
      e.halo = 1;
      e.day = 0;
      e.floor = 1;
      e.size = TAILLE_REPOS;
      poser(FIGE);
      return undefined;
    }

    let raf = 0;
    let dernier = performance.now();
    let debutLever = null;
    let leverFini = false;
    let vx = 0;
    let vy = 0;
    let vDay = 0;
    let dernierPointeur = -Infinity;
    let cadenceIdle = 0;
    let pointeur = null; // cible du pointeur (ratios viewport) ; null = repos
    let repos = reposPour(viewportSize.width);

    // Dernier jeu de variables écrites : l'écriture est sautée si rien ne bouge.
    const ecrit = { sx: NaN, sy: NaN, ldx: NaN, ldy: NaN, pdx: NaN, pdy: NaN, shx: NaN, shy: NaN };
    // Objet de debug muté sur place (aucune allocation par frame).
    const debug = import.meta.env.DEV ? { sun: { x: 0, y: 0 }, halo: 0, day: 0, floor: 1, size: 0, actif: true } : null;
    if (debug) window.__j3 = debug;

    e.sx = repos.x;
    e.sy = reposImmediat ? repos.y : DEPART_Y;
    e.halo = reposImmediat ? 1 : 0;
    if (reposImmediat) leverFini = true;

    const ecrireVars = () => {
      if (!noeud) return;
      const sx = e.sx;
      const sy = e.sy;
      const ldx = borner((0.5 - sx) * 2, -1, 1);
      const ldy = borner((0.5 - sy) * 2, -1, 1);
      // Plus le soleil est bas, plus les ombres s'allongent (2 % au repos,
      // 15 % quand il rase l'horizon).
      const bas = borner((sy - repos.y) / 0.8, 0, 1);
      const shx = ldx * (2 + 13 * bas);
      const shy = borner(4 - ldy * 5, 2, 9);
      // Orientation du portrait : mesurée depuis SA position, pas depuis le
      // centre de l'écran — la carte se tourne vraiment vers la lumière.
      const c = ratioPortrait.current;
      const pdx = borner((c.x - sx) * 5, -1, 1);
      const pdy = borner((c.y - sy) * 4, -1, 1);

      if (
        Math.abs(sx - ecrit.sx) < 1e-3 &&
        Math.abs(sy - ecrit.sy) < 1e-3 &&
        Math.abs(ldx - ecrit.ldx) < 1e-3 &&
        Math.abs(ldy - ecrit.ldy) < 1e-3 &&
        Math.abs(pdx - ecrit.pdx) < 1e-3 &&
        Math.abs(pdy - ecrit.pdy) < 1e-3 &&
        Math.abs(shx - ecrit.shx) < 1e-3 &&
        Math.abs(shy - ecrit.shy) < 1e-3
      ) {
        return;
      }

      noeud.style.setProperty("--sx", `${(sx * 100).toFixed(2)}%`);
      noeud.style.setProperty("--sy", `${(sy * 100).toFixed(2)}%`);
      noeud.style.setProperty("--ldx", ldx.toFixed(3));
      noeud.style.setProperty("--ldy", ldy.toFixed(3));
      noeud.style.setProperty("--pdx", pdx.toFixed(3));
      noeud.style.setProperty("--pdy", pdy.toFixed(3));
      noeud.style.setProperty("--shx", `${shx.toFixed(2)}%`);
      noeud.style.setProperty("--shy", `${shy.toFixed(2)}%`);

      ecrit.sx = sx;
      ecrit.sy = sy;
      ecrit.ldx = ldx;
      ecrit.ldy = ldy;
      ecrit.pdx = pdx;
      ecrit.pdy = pdy;
      ecrit.shx = shx;
      ecrit.shy = shy;
    };

    const tour = (maintenant) => {
      raf = requestAnimationFrame(tour);
      const dt = Math.min((maintenant - dernier) / 1000, 0.05);
      dernier = maintenant;

      repos = reposPour(viewportSize.width);
      const p = ratioPage.get();
      const tHero = ratioHero.get();
      let actif = false;

      // 1 — le lever de soleil, s'il est en cours.
      if (debutLever !== null && !leverFini) {
        const avance = borner((maintenant - debutLever) / DUREE_LEVER, 0, 1);
        const k = EASE_LEVER(avance);
        e.sx = repos.x;
        e.sy = melange(DEPART_Y, repos.y, k);
        e.halo = k;
        e.size = TAILLE_REPOS;
        vx = 0;
        vy = 0;
        actif = true;
        if (avance >= 1) leverFini = true;
      } else if (leverFini) {
        // 2 — cible : pointeur (ou dérive) dans le hero, course du jour ensuite.
        let cx;
        let cy;
        if (pointeur) {
          cx = borner(repos.x + (pointeur.x - repos.x) * GAIN, BORNES.xMin, BORNES.xMax);
          cy = borner(repos.y + (pointeur.y - repos.y) * GAIN, BORNES.yMin, BORNES.yMax);
        } else if (!survolPossible) {
          // Tactile : le soleil dérive seul sur une ellipse lente.
          const phase = (maintenant / DERIVE.periode) * Math.PI * 2;
          cx = borner(repos.x + Math.sin(phase) * DERIVE.ax, BORNES.xMin, BORNES.xMax);
          cy = borner(repos.y + Math.cos(phase) * DERIVE.ay, BORNES.yMin, BORNES.yMax);
        } else {
          cx = repos.x;
          cy = repos.y;
        }

        const jour = courseA(p, repos);
        const cibleX = melange(cx, jour.x, tHero);
        const cibleY = melange(cy, jour.y, tHero);
        e.size = melange(TAILLE_REPOS, jour.size, tHero);

        // 3 — ressort (mêmes équations que framer : raideur, amortissement, masse).
        const ax = (RESSORT.k * (cibleX - e.sx) - RESSORT.c * vx) / RESSORT.m;
        const ay = (RESSORT.k * (cibleY - e.sy) - RESSORT.c * vy) / RESSORT.m;
        vx += ax * dt;
        vy += ay * dt;
        e.sx += vx * dt;
        e.sy += vy * dt;

        if (
          Math.abs(cibleX - e.sx) < 2e-4 &&
          Math.abs(vx) < 2e-3 &&
          Math.abs(cibleY - e.sy) < 2e-4 &&
          Math.abs(vy) < 2e-3
        ) {
          e.sx = cibleX;
          e.sy = cibleY;
          vx = 0;
          vy = 0;
        } else {
          actif = true;
        }
      }

      // 4 — heure de la journée (ressort lent) et plancher ivoire.
      const aDay = (RESSORT_JOUR.k * (p - e.day) - RESSORT_JOUR.c * vDay) / RESSORT_JOUR.m;
      vDay += aDay * dt;
      e.day += vDay * dt;
      if (Math.abs(p - e.day) < 2e-4 && Math.abs(vDay) < 2e-3) {
        e.day = p;
        vDay = 0;
      } else {
        actif = true;
      }
      e.floor = 1 - tHero;

      if (maintenant - dernierPointeur < 150) actif = true;

      ecrireVars();

      if (debug) {
        debug.sun.x = e.sx;
        debug.sun.y = e.sy;
        debug.halo = e.halo;
        debug.day = e.day;
        debug.floor = e.floor;
        debug.size = e.size;
        debug.actif = actif;
      }

      // 5 — cadence : 60 Hz tant que ça bouge, ~22 Hz au repos (respiration du
      // halo et dérive du voile), 0 Hz onglet caché.
      if (!actif) {
        if (maintenant - cadenceIdle < 45) return;
        cadenceIdle = maintenant;
      } else {
        cadenceIdle = maintenant;
      }
      abonnes.current.forEach((fn) => fn());
    };

    const demarrer = () => {
      if (raf || document.hidden) return;
      dernier = performance.now();
      raf = requestAnimationFrame(tour);
    };
    const arreter = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibilite = () => (document.hidden ? arreter() : demarrer());

    const lever = () => {
      if (debutLever !== null || reposImmediat) return;
      debutLever = performance.now();
      demarrer();
    };
    // Le canvas déclenche le lever à son premier frame ; sans canvas (ou s'il
    // tarde), un filet de sécurité le lance tout seul.
    declencheur.current = lever;
    const secours = setTimeout(lever, attendreCanvas ? SECOURS_LEVER : 0);

    // -------------------------------------------------- pointeur dans le hero
    let detacherPointeur = null;
    const hero = heroRef.current;
    if (survolPossible && hero) {
      const onMove = (ev) => {
        const w = viewportSize.width;
        const h = viewportSize.height;
        if (!w || !h) return;
        // clientX/clientY et la sonde fixe sont dans le MÊME repère, zoom compris.
        pointeur = { x: ev.clientX / w, y: ev.clientY / h };
        dernierPointeur = performance.now();
        demarrer();
      };
      const onLeave = () => {
        pointeur = null;
        dernierPointeur = performance.now();
        demarrer();
      };
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", onLeave, { passive: true });
      detacherPointeur = () => {
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", onLeave);
      };
    }

    document.addEventListener("visibilitychange", onVisibilite);
    ecrireVars();
    demarrer();

    return () => {
      arreter();
      clearTimeout(secours);
      declencheur.current = null;
      document.removeEventListener("visibilitychange", onVisibilite);
      if (detacherPointeur) detacherPointeur();
      if (import.meta.env.DEV) delete window.__j3;
    };
  }, [
    reduit,
    reposImmediat,
    attendreCanvas,
    survolPossible,
    rootRef,
    heroRef,
    ratioPage,
    ratioHero,
    ratioPortrait,
  ]);

  // Départ des révélations du hero : dès le premier paint, sans attendre le
  // chunk WebGL (le contenu ne dépend jamais du canvas).
  useEffect(() => {
    const id = requestAnimationFrame(() => setT0(performance.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  const valeur = useMemo(
    () => ({
      etat,
      t0,
      pret: t0 !== null,
      /** Appelé par SkyCanvas à son premier frame : lance le lever. */
      demarrerLever: () => {
        if (declencheur.current) declencheur.current();
      },
      /** Abonnement du canvas : « une frame utile vient d'être calculée ». */
      abonnerFrame: (fn) => {
        abonnes.current.add(fn);
        return () => abonnes.current.delete(fn);
      },
    }),
    [t0]
  );

  return <ContexteSoleil.Provider value={valeur}>{children}</ContexteSoleil.Provider>;
};

export default SunProvider;
