// src/analytics.jsx
//
// Point d'entrée unique de la mesure d'audience (Vercel Web Analytics).
//
// Deux rôles :
//
//  1. <SiteAnalytics /> monte le traceur Vercel en lui passant le *motif* de
//     route react-router (ex. "/project/:projectId") en plus du chemin réel.
//     Sans ça la dimension « Route » du tableau de bord reste vide — c'est le
//     cas aujourd'hui, les 45 pages vues du dernier mois ont toutes une route
//     nulle — et chaque projet consulté crée sa propre ligne au lieu d'être
//     agrégé.
//
//  2. Un écouteur de clic délégué remonte les deux gestes à forte intention
//     (téléchargement du CV, départ vers un profil externe). Il est posé une
//     seule fois sur le document : aucun composant porteur de lien n'a besoin
//     d'être modifié, et le suivi survit aux refontes de ces composants.
//
// ⚠️ PLAN HOBBY : les évènements personnalisés (`track`) sont réservés aux
// plans Pro/Enterprise — voir vercel.com/docs/analytics/limits-and-pricing.
// Sur le plan actuel ces appels ne remonteront pas dans le tableau de bord ;
// ils sont sans effet de bord et deviendront actifs le jour d'un passage en
// Pro, sans redéploiement de code. Les *pages vues*, elles, fonctionnent déjà.

import { useEffect } from "react";
import { useLocation, matchRoutes } from "react-router-dom";
import { Analytics, track } from "@vercel/analytics/react";

// Les motifs déclarés dans App.jsx, dans le même ordre. À tenir à jour si une
// route y est ajoutée : une route absente d'ici retombe sur le catch-all "*".
const ROUTE_PATTERNS = [
  { path: "/" },
  { path: "/pro" },
  { path: "/portfolio" },
  { path: "/3d" },
  { path: "/tech" },
  { path: "/project/:projectId" },
  { path: "/cv" },
  { path: "/statistiques" },
  { path: "/resume" },
  { path: "*" },
];

// Doit TOUJOURS renvoyer une chaîne non vide : quand la prop `route` est
// fournie, le paquet Vercel coupe le suivi automatique des changements d'URL
// et n'émet la page vue que si `route` ET `path` sont non nuls. Une valeur
// vide ferait donc disparaître toute la mesure.
const computeRoute = (pathname) => {
  const matches = matchRoutes(ROUTE_PATTERNS, pathname);
  const matched = matches?.[matches.length - 1]?.route?.path;
  return matched || pathname || "/";
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
        track("cv_download");
        return;
      }

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.hostname && url.hostname !== window.location.hostname) {
        track("outbound_click", { host: url.hostname });
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

  return <Analytics route={computeRoute(pathname)} path={pathname} />;
};

export default SiteAnalytics;
