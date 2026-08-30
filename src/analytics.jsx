// src/analytics.jsx
//
// Point d'entrée unique de la mesure d'audience (GoatCounter).
//
// GoatCounter ne pose ni cookie ni identifiant persistant côté client :
// l'unicité d'un visiteur est calculée côté serveur à partir de l'IP et du
// user-agent, avec un sel qui change chaque jour. Rien à consentir, donc rien
// à faire ici pour ça.
//
// Le script est chargé avec `no_onload` : le laisser mesurer tout seul ferait
// une page vue en double au premier chargement — une fois automatiquement,
// une fois via l'effet ci-dessous qui suit les changements de route de
// react-router. C'est cet effet qui envoie chaque page vue, y compris la
// première.
//
// Trois familles d'évènements GoatCounter, à la différence de Vercel
// Analytics ce n'est pas réservé à un plan payant :
//  - intentions fortes : téléchargement du CV, départ vers un profil externe.
//  - lecture de contenu : quelles sections d'une page sont vraiment vues,
//    jusqu'où on descend dans la page.
// Les deux servent le tableau de bord /statistiques (carte "Contenu").

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GOATCOUNTER_CODE = import.meta.env.VITE_GOATCOUNTER_CODE;
const configured = Boolean(GOATCOUNTER_CODE);

let loadPromise = null;

// Un seul <script> quel que soit le nombre de montages du composant.
const loadScript = () => {
  if (!configured) return Promise.resolve(false);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "//gc.zgo.at/count.js";
    script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loadPromise;
};

const sendPageview = async (pathname) => {
  const ready = await loadScript();
  if (!ready || typeof window.goatcounter?.count !== "function") return;
  window.goatcounter.count({ path: pathname, title: document.title });
};

// `event: true` fait apparaître l'appel dans le tableau de bord comme un
// évènement nommé plutôt que comme une page — pas de vraie URL à donner.
const trackEvent = async (name, detail) => {
  const ready = await loadScript();
  if (!ready || typeof window.goatcounter?.count !== "function") return;
  window.goatcounter.count({
    path: detail ? `${name}: ${detail}` : name,
    title: name,
    event: true,
  });
};

// Les seuls clics qui disent quelque chose d'une intention : repartir avec le
// CV, ou aller vérifier le profil ailleurs. Le reste (entrée dans le monde 3D,
// consultation d'un projet) est déjà couvert par les pages vues.
const useIntentTracking = () => {
  useEffect(() => {
    const onClick = (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;

      // Le CV est le seul livrable téléchargeable du site.
      if ((anchor.getAttribute("href") || "").endsWith(".pdf")) {
        trackEvent("cv_download");
        return;
      }

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.hostname && url.hostname !== window.location.hostname) {
        trackEvent("outbound_click", url.hostname);
      }
    };

    // En capture : certains liens arrêtent la propagation ou naviguent aussitôt.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
};

// Sections identifiables par ancre sur les deux facettes (jour : ProNavbar ;
// nuit : ancien menu, conservées comme ancres directes). Un id absent de la
// page courante est simplement ignoré — pas besoin de connaître la route ici.
const SECTION_IDS = [
  "expertises",
  "parcours",
  "contact",
  "project",
  "experience",
  "education",
  "achievement",
];
const SCROLL_MILESTONES = [25, 50, 75, 100];

// Ce que les gens lisent vraiment : quelles sections passent à l'écran, et
// jusqu'où on descend dans la page. Un délai avant d'observer laisse le temps
// aux sections "below the fold" (montées après l'animation d'entrée) d'exister
// dans le DOM ; sans lui, ProPage et HomePage n'auraient encore rien à observer.
const useContentTracking = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seenSections = new Set();
    const seenMilestones = new Set();
    let sectionObserver;

    const bootTimer = setTimeout(() => {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || seenSections.has(entry.target.id)) continue;
            seenSections.add(entry.target.id);
            trackEvent("section_view", entry.target.id);
          }
        },
        { threshold: 0.5 }
      );

      for (const id of SECTION_IDS) {
        const element = document.getElementById(id);
        if (element) sectionObserver.observe(element);
      }
    }, 800);

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Page plus courte que l'écran : personne ne "descend", rien à mesurer.
      if (scrollable <= 0) return;

      const percent = (doc.scrollTop / scrollable) * 100;
      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !seenMilestones.has(milestone)) {
          seenMilestones.add(milestone);
          trackEvent("scroll_depth", String(milestone));
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(bootTimer);
      sectionObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
};

// À monter à l'intérieur du <BrowserRouter> : useLocation en dépend.
const SiteAnalytics = () => {
  const { pathname } = useLocation();
  useIntentTracking();
  useContentTracking();

  useEffect(() => {
    sendPageview(pathname);
  }, [pathname]);

  return null;
};

export default SiteAnalytics;
