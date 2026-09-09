// src/night/nightMotion.js
// Variants framer partagés de la facette nuit — l'homologue de proMotion.js.
//
// Chaque fabrique prend `reduit` (prefers-reduced-motion) en premier argument :
// sous mouvement réduit, aucun déplacement, un simple fondu très court — la
// page reste lisible d'emblée, jamais figée dans un état invisible.

export const EASE = [0.22, 1, 0.36, 1];
export const EASE_PLUME = [0.65, 0, 0.35, 1];

/** Entrée « qui monte » ; `custom` = index pour l'échelonnement. */
export const rise = (reduit, { y = 24, duration = 600, stagger = 90, delay = 0 } = {}) => ({
  hidden: reduit ? { opacity: 0 } : { opacity: 0, y },
  show: (i = 0) =>
    reduit
      ? { opacity: 1, transition: { duration: 0.2 } }
      : {
          opacity: 1,
          y: 0,
          transition: { duration: duration / 1000, delay: (delay + i * stagger) / 1000, ease: EASE },
        },
});

/** Variante douce (petits déplacements : chips, CTA, lignes). */
export const riseSoft = (reduit, options = {}) =>
  rise(reduit, { y: 12, duration: 500, stagger: 80, ...options });

/** H2 révélé par un volet qui remonte (clip-path) plutôt qu'un simple fondu. */
export const clipReveal = (reduit, { delay = 200, duration = 600 } = {}) => ({
  hidden: reduit
    ? { opacity: 0 }
    : { opacity: 0, y: 12, clipPath: "inset(0 0 100% 0)" },
  show: reduit
    ? { opacity: 1, transition: { duration: 0.2 } }
    : {
        opacity: 1,
        y: 0,
        clipPath: "inset(0 0 0% 0)",
        transition: { duration: duration / 1000, delay: delay / 1000, ease: EASE },
      },
});

/** Filet horizontal qui se trace de la gauche vers la droite. */
export const traitTrace = (reduit, { delay = 80, duration = 700 } = {}) => ({
  hidden: reduit ? { opacity: 1, scaleX: 1 } : { scaleX: 0 },
  show: reduit
    ? { opacity: 1, scaleX: 1, transition: { duration: 0 } }
    : { scaleX: 1, transition: { duration: duration / 1000, delay: delay / 1000, ease: EASE } },
});

/** Point violet de l'en-tête de section. */
export const pointEntete = (reduit) => ({
  hidden: reduit ? { scale: 1 } : { scale: 0 },
  show: reduit
    ? { scale: 1, transition: { duration: 0 } }
    : { scale: 1, transition: { duration: 0.25, ease: EASE } },
});

/** Segment vertical du parcours : se trace du haut vers le bas. */
export const segmentTrace = (reduit) => ({
  hidden: reduit ? { scaleY: 1 } : { scaleY: 0 },
  show: reduit
    ? { scaleY: 1, transition: { duration: 0 } }
    : { scaleY: 1, transition: { duration: 0.5, ease: EASE } },
});

/** Réglage `whileInView` commun : une seule fois, dès 20 % visible. */
export const vuUneFois = { once: true, amount: 0.2 };
