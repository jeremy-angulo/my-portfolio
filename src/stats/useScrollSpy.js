// src/stats/useScrollSpy.js — ancre courante et état « collé » de la barre
// d'outils, calculés par position (pas d'IntersectionObserver par ratio :
// le dernier groupe, court, ne deviendrait jamais courant).
//
// Un seul écouteur scroll + resize, throttlé par requestAnimationFrame.

import { useCallback, useEffect, useState } from "react";

// Hauteur de la navbar fixe : la barre est « collée » dès qu'elle la touche.
const NAV_HEIGHT = 66;
// Un libellé est courant dès qu'il passe au-dessus de 40 % du viewport.
const ACTIVE_LINE = 0.4;
// Tolérance en bas de page (arrondis de scrollHeight sur certains moteurs).
const BOTTOM_SLACK = 8;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {string[]} ids — ids des libellés de groupe, dans l'ordre du document
 * @param {{current: HTMLElement|null}} toolbarRef — la barre collante
 * @returns {{activeId: string|null, stuck: boolean, scrollTo: (id: string) => void}}
 */
const useScrollSpy = (ids, toolbarRef) => {
  const [activeId, setActiveId] = useState(null);
  const [stuck, setStuck] = useState(false);
  // Clé stable : l'appelant passe le plus souvent un tableau littéral.
  const idsKey = ids.join("|");

  useEffect(() => {
    const list = idsKey ? idsKey.split("|") : [];
    let frame = 0;

    const measure = () => {
      frame = 0;
      const toolbar = toolbarRef?.current;
      setStuck(toolbar ? toolbar.getBoundingClientRect().top <= NAV_HEIGHT : false);

      const line = window.innerHeight * ACTIVE_LINE;
      // En haut de page, aucune ancre — même si le document tient dans le
      // viewport (page courte) et qu'on est donc aussi « en bas ».
      const atBottom =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - BOTTOM_SLACK;

      let next = null;
      if (atBottom && list.length) {
        next = list[list.length - 1];
      } else {
        // Dernier id dont le haut est passé au-dessus de la ligne 40 % ; aucun
        // tant que le premier libellé est encore dessous (bloc de tête visible).
        for (const id of list) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) next = id;
        }
      }
      setActiveId((current) => (current === next ? current : next));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // La hauteur du document change sans défilement (squelette → mosaïque,
    // « Tout afficher ») : on remesure aussi quand il grandit ou rétrécit.
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    observer?.observe(document.documentElement);
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [idsKey, toolbarRef]);

  // Clic sur une ancre : défilement natif (pas de `navigate` react-router,
  // la route n'a pas de handler de hash) et hash posé sans nouvelle entrée
  // d'historique. Sert aussi au défilement initial sur hash, une fois la
  // mosaïque montée (à la charge de l'appelant).
  // `instant` et non `auto` : le site pose `scroll-behavior: smooth` sur tout
  // (index.css), et `auto` hériterait de ce lissage sous reduced-motion.
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth", block: "start" });
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      /* historique indisponible (iframe sandbox) : le défilement suffit */
    }
  }, []);

  return { activeId, stuck, scrollTo };
};

export default useScrollSpy;
