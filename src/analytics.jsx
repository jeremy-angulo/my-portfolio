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
// Les deux gestes à forte intention (téléchargement du CV, départ vers un
// profil externe) remontent en tant qu'évènements GoatCounter — à la
// différence de Vercel Analytics, ce n'est pas réservé à un plan payant.

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

// À monter à l'intérieur du <BrowserRouter> : useLocation en dépend.
const SiteAnalytics = () => {
  const { pathname } = useLocation();
  useIntentTracking();

  useEffect(() => {
    sendPageview(pathname);
  }, [pathname]);

  return null;
};

export default SiteAnalytics;
