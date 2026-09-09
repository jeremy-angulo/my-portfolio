// src/night/NightLamp.jsx
// La lampe du hero : une lueur qui se pose sur la lune du portrait, puis passe
// dans la main du visiteur dès qu'il bouge le pointeur.
//
// GÉOMÉTRIE, ET POURQUOI ELLE EST JUSTE SOUS `body { zoom: 0.85 }` :
// tout est en RATIOS 0..1, obtenus en divisant deux grandeurs du même repère
// (`e.clientX` et `getBoundingClientRect()` sont dans le repère viewport, après
// zoom ; leur quotient est donc exact). Le halo est ensuite déplacé par un
// `translate` en POURCENTAGE d'un calque qui fait exactement la taille du
// hero : « ratio × taille du hero », sans qu'un seul pixel absolu ne circule.
// Aucun `window.inner*`, aucun `offsetTop`, aucun `contentRect`.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import useHoverCapable from "../hooks/useHoverCapable";
import useReducedMotion from "../hooks/useReducedMotion";
import useRectRatio from "../hooks/useRectRatio";
import { EASE } from "./nightMotion";

// Repli si la lune n'a pas pu être mesurée : à peu près sa place dans la grille.
const REPOS_DEFAUT = { x: 0.78, y: 0.22 };

const LampeContext = createContext(null);

export const useLampe = () => useContext(LampeContext);

/**
 * Fournit les valeurs de lumière à tout le hero.
 * @param {{ heroRef: React.RefObject<HTMLElement>, lang: string, children: React.ReactNode }} props
 */
export const FournisseurLampe = ({ heroRef, lang, children }) => {
  const reduit = useReducedMotion();
  const survolPossible = useHoverCapable();
  const actif = survolPossible && !reduit;

  // Refs attachées par NightPortrait : la lune (position de repos) et la carte
  // (centre depuis lequel on calcule l'angle d'éclairage).
  const luneRef = useRef(null);
  const carteRef = useRef(null);

  // Ratios remesurés au resize, au ResizeObserver et à `document.fonts.ready`.
  const ratiosLune = useRectRatio(luneRef, heroRef, { deps: [lang] });
  const ratiosCarte = useRectRatio(carteRef, heroRef, { deps: [lang] });

  const lxBrut = useMotionValue(REPOS_DEFAUT.x);
  const lyBrut = useMotionValue(REPOS_DEFAUT.y);
  const ressort = { stiffness: 70, damping: 22, mass: 1 };
  const lx = useSpring(lxBrut, ressort);
  const ly = useSpring(lyBrut, ressort);

  // Rapport largeur/hauteur du hero : il redresse l'angle d'éclairage, qui
  // serait faux si l'on comparait deux ratios d'axes de longueurs différentes.
  const aspect = useRef(1.6);

  const posiitonRepos = useCallback(() => {
    const r = ratiosLune.current;
    const valide = r && r.w > 0 && r.h > 0 && Number.isFinite(r.x) && Number.isFinite(r.y);
    return valide ? { x: r.x, y: r.y } : REPOS_DEFAUT;
  }, [ratiosLune]);

  // Angle de la lumière vue depuis le centre de la carte du portrait.
  const laNombre = useTransform([lx, ly], ([x, y]) => {
    const c = ratiosCarte.current;
    const cx = c && c.w > 0 ? c.x : REPOS_DEFAUT.x;
    const cy = c && c.h > 0 ? c.y : 0.5;
    const dx = (x - cx) * (aspect.current || 1.6);
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 225;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  });

  // Chaînes prêtes à l'emploi : on ne laisse jamais framer deviner une unité.
  const lxTexte = useTransform(lx, (v) => `${Math.round(v * 1000) / 1000}`);
  const lyTexte = useTransform(ly, (v) => `${Math.round(v * 1000) / 1000}`);
  const laTexte = useTransform(laNombre, (v) => `${Math.round(v * 10) / 10}deg`);

  // Mesure du rapport d'aspect du hero (rects seulement).
  useEffect(() => {
    const hero = heroRef && heroRef.current;
    if (!hero) return undefined;
    const mesurer = () => {
      const r = hero.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) aspect.current = r.width / r.height;
    };
    mesurer();
    const observateur = typeof ResizeObserver !== "undefined" ? new ResizeObserver(mesurer) : null;
    if (observateur) observateur.observe(hero);
    window.addEventListener("resize", mesurer, { passive: true });
    return () => {
      if (observateur) observateur.disconnect();
      window.removeEventListener("resize", mesurer);
    };
  }, [heroRef]);

  // Pose la lumière sur la lune, et l'y ramène quand le pointeur s'en va.
  useEffect(() => {
    let annule = false;
    const poser = () => {
      if (annule) return;
      const p = posiitonRepos();
      lxBrut.set(p.x);
      lyBrut.set(p.y);
    };
    poser();
    // La mesure de la lune arrive après le layout puis après les polices :
    // deux rappels suffisent à caler le repos avant l'éclosion (t0+1450).
    const t1 = setTimeout(poser, 80);
    const t2 = setTimeout(poser, 500);
    return () => {
      annule = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [posiitonRepos, lxBrut, lyBrut, lang]);

  // Suivi du pointeur : un seul écouteur passif sur la section, aucun state.
  useEffect(() => {
    const hero = heroRef && heroRef.current;
    if (!hero || !actif) return undefined;

    let rafId = 0;
    let dernier = null;

    const appliquer = () => {
      rafId = 0;
      if (!dernier) return;
      const r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      lxBrut.set((dernier.x - r.left) / r.width);
      lyBrut.set((dernier.y - r.top) / r.height);
    };

    const onMove = (e) => {
      dernier = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(appliquer);
    };

    const onLeave = () => {
      dernier = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      const p = posiitonRepos();
      lxBrut.set(p.x);
      lyBrut.set(p.y);
    };

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [heroRef, actif, lxBrut, lyBrut, posiitonRepos]);

  const valeur = useMemo(
    () => ({ luneRef, carteRef, lx, ly, lxTexte, lyTexte, laTexte, actif, reduit }),
    [lx, ly, lxTexte, lyTexte, laTexte, actif, reduit]
  );

  return <LampeContext.Provider value={valeur}>{children}</LampeContext.Provider>;
};

/**
 * Le halo lui-même. Il éclot depuis la lune une fois le prénom signé.
 * @param {{ eclose: boolean }} props
 */
const NightLamp = ({ eclose }) => {
  const contexte = useLampe();
  const reduit = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const onVisibilite = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilite);
    onVisibilite();
    return () => document.removeEventListener("visibilitychange", onVisibilite);
  }, []);

  const lx = contexte ? contexte.lx : null;
  const ly = contexte ? contexte.ly : null;
  const txSecours = useMotionValue(REPOS_DEFAUT.x);
  const tySecours = useMotionValue(REPOS_DEFAUT.y);
  const tx = useTransform(lx || txSecours, (v) => `${Math.round(v * 10000) / 100}%`);
  const ty = useTransform(ly || tySecours, (v) => `${Math.round(v * 10000) / 100}%`);
  const transform = useMotionTemplate`translate(${tx}, ${ty})`;

  const visible = eclose && pageVisible;

  return (
    <motion.div className="night-lampe" aria-hidden="true" style={{ transform }}>
      <motion.span
        className="night-lampe__disque"
        initial={reduit ? { opacity: 0, scale: 1 } : { opacity: 0, scale: 0.6 }}
        animate={
          visible
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: reduit ? 1 : 0.6 }
        }
        transition={
          reduit
            ? { duration: 0.2 }
            : { duration: visible ? 0.7 : 0.4, ease: visible ? EASE : "easeOut" }
        }
      />
    </motion.div>
  );
};

export default NightLamp;
