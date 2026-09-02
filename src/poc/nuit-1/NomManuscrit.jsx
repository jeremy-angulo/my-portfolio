// src/poc/nuit-1/NomManuscrit.jsx
// « La lampe qu'on vous tend », premier temps : le prénom s'écrit tout seul.
//
// Un masque linéaire balaie le texte de gauche à droite (`--p`, en % de la
// boîte du span — donc insensible au `zoom: 0.85`), un point d'encre voyage sur
// le bord du masque, puis éclate : c'est cette lumière qui ira ensuite se poser
// sur la lune du portrait.
//
// Le composant attend Kalam (`document.fonts.load`, 600 ms au plus) : écrire à
// la plume avec la police de secours n'aurait aucun sens.

import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import useHoverCapable from "../shared/useHoverCapable";
import useReducedMotion from "../shared/useReducedMotion";
import { EASE_PLUME } from "./motion";

const DEPART = -2; // %
const ARRIVEE = 108; // %
const ECRIT = 200; // % : au-delà de la boîte, le masque est entièrement opaque
const DELAI_SIGNATURE = 450; // ms après le montage
const DUREE_SIGNATURE = 1000; // ms
const DUREE_REECRITURE = 900; // ms
const REPOS_SURVOL = 1500; // ms de battement entre deux ré-écritures
const TIMEOUT_POLICE = 600; // ms

/**
 * @param {{ texte: string, onSigne?: () => void, className?: string }} props
 */
const NomManuscrit = ({ texte, onSigne, className }) => {
  const reduit = useReducedMotion();
  const survolPossible = useHoverCapable();

  const p = useMotionValue(reduit ? ECRIT : DEPART);
  const pTexte = useTransform(p, (v) => `${Math.round(v * 100) / 100}%`);

  const [pointVisible, setPointVisible] = useState(false);
  const [flare, setFlare] = useState(false);

  const onSigneRef = useRef(onSigne);
  onSigneRef.current = onSigne;
  const dernierSurvol = useRef(0);
  const enCours = useRef(false);

  useEffect(() => {
    // Mouvement réduit : le prénom est là, entier, tout de suite.
    if (reduit) {
      p.set(ECRIT);
      if (onSigneRef.current) onSigneRef.current();
      return undefined;
    }

    let annule = false;
    let controle = null;
    const minuteurs = [];
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

    const maintenant = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

    // Kalam chargée ? Sinon on n'anime pas : la police de secours donnerait un
    // tracé qui n'est pas une signature.
    const attendrePolice = () => {
      if (typeof document === "undefined" || !document.fonts || !document.fonts.load) {
        return Promise.resolve(false);
      }
      return Promise.race([
        document.fonts.load("700 1em Kalam").then((faces) => Array.isArray(faces) && faces.length > 0),
        new Promise((resoudre) => {
          const id = setTimeout(() => resoudre(false), TIMEOUT_POLICE);
          minuteurs.push(id);
        }),
      ]).catch(() => false);
    };

    attendrePolice().then((policePrete) => {
      if (annule) return;

      const restant = Math.max(0, DELAI_SIGNATURE - (maintenant() - t0));

      minuteurs.push(
        setTimeout(() => {
          if (annule) return;

          if (!policePrete) {
            // Repli : le prénom s'affiche entier, la lampe éclot quand même.
            p.set(ECRIT);
            minuteurs.push(
              setTimeout(() => {
                if (!annule && onSigneRef.current) onSigneRef.current();
              }, DUREE_SIGNATURE)
            );
            return;
          }

          enCours.current = true;
          setPointVisible(true);
          p.set(DEPART);
          controle = animate(p, ARRIVEE, {
            duration: DUREE_SIGNATURE / 1000,
            ease: EASE_PLUME,
            onComplete: () => {
              if (annule) return;
              enCours.current = false;
              // Le flare : la lumière quitte la plume.
              setFlare(true);
              if (onSigneRef.current) onSigneRef.current();
              minuteurs.push(
                setTimeout(() => {
                  if (annule) return;
                  setPointVisible(false);
                  setFlare(false);
                  p.set(ECRIT);
                }, 340)
              );
            },
          });
        }, restant)
      );
    });

    return () => {
      annule = true;
      if (controle) controle.stop();
      minuteurs.forEach(clearTimeout);
    };
  }, [reduit, p]);

  // Ré-écriture au survol : 900 ms, avec un temps de repos de 1,5 s. Rien ne
  // se déplace, le curseur ne change pas.
  const onPointerEnter = () => {
    if (reduit || !survolPossible || enCours.current) return;
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (t - dernierSurvol.current < REPOS_SURVOL) return;
    dernierSurvol.current = t;
    enCours.current = true;
    setFlare(false);
    setPointVisible(true);
    p.set(DEPART);
    animate(p, ARRIVEE, {
      duration: DUREE_REECRITURE / 1000,
      ease: EASE_PLUME,
      onComplete: () => {
        enCours.current = false;
        setFlare(true);
        setTimeout(() => {
          setPointVisible(false);
          setFlare(false);
          p.set(ECRIT);
        }, 340);
      },
    });
  };

  return (
    <motion.span
      className={`nuit1-nom${className ? ` ${className}` : ""}`}
      style={{ "--p": pTexte }}
      onPointerEnter={onPointerEnter}
    >
      <span className="nuit1-nom__texte">{texte}</span>
      {pointVisible && (
        <motion.span
          className="nuit1-nom__point"
          aria-hidden="true"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: flare ? 0 : 1, scale: flare ? 2.2 : 1 }}
          transition={{ duration: flare ? 0.32 : 0.15, ease: "easeOut" }}
        />
      )}
    </motion.span>
  );
};

export default NomManuscrit;
