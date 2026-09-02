// src/i18n/useDocumentMeta.js
// Titre d'onglet et méta description suivant la route ET la langue active.
//
// Les balises statiques d'index.html restent la référence pour les robots
// sociaux (LinkedIn, WhatsApp… n'exécutent pas le JS) : ce hook ne les
// remplace pas, il corrige ce qu'eux ne voient pas — l'onglet du navigateur,
// les favoris, et l'indexation Google, qui elle exécute le JS.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "./LanguageContext";

const META = {
  home: {
    fr: {
      title: "Jérémy Angulo — Business Manager",
      description:
        "Business Manager chez ALTEN Toulouse. Ingénieur en informatique et IA de formation : développement commercial, recrutement d'ingénieurs et pilotage de prestations.",
    },
    en: {
      title: "Jérémy Angulo — Business Manager",
      description:
        "Business Manager at ALTEN Toulouse. Computer science and AI engineer by training: business development, engineer recruitment and project oversight.",
    },
  },
  tech: {
    fr: {
      title: "Jérémy Angulo — Ingénieur IT & Builder",
      description:
        "Projets d'ingénierie logicielle et d'IA de Jérémy Angulo : développement, données et expérimentations.",
    },
    en: {
      title: "Jérémy Angulo — IT Engineer & Builder",
      description:
        "Software engineering and AI projects by Jérémy Angulo: development, data and experiments.",
    },
  },
  experience: {
    fr: {
      title: "Portfolio 3D — Jérémy Angulo",
      description:
        "Un monde en trois dimensions à parcourir en voiture : parcours, projets et expérimentations de Jérémy Angulo.",
    },
    en: {
      title: "3D Portfolio — Jérémy Angulo",
      description:
        "A drivable 3D world: the career path, projects and experiments of Jérémy Angulo.",
    },
  },
  project: {
    fr: {
      title: "Projet — Jérémy Angulo",
      description: "Détail d'un projet mené par Jérémy Angulo.",
    },
    en: {
      title: "Project — Jérémy Angulo",
      description: "Details of a project led by Jérémy Angulo.",
    },
  },
  cv: {
    fr: {
      title: "CV — Jérémy Angulo",
      description:
        "Parcours, formations et expériences professionnelles de Jérémy Angulo.",
    },
    en: {
      title: "Resume — Jérémy Angulo",
      description:
        "Education, training and professional experience of Jérémy Angulo.",
    },
  },
  // Page privée : titre neutre et surtout noindex, pour qu'elle ne remonte
  // jamais dans un moteur de recherche même si l'URL fuite.
  stats: {
    fr: { title: "Statistiques", description: "", noindex: true },
    en: { title: "Statistics", description: "", noindex: true },
  },
  // Pages de comparaison privées : titre neutre, aucune description, et surtout
  // noindex — elles ne doivent jamais remonter dans un moteur de recherche.
  poc: {
    fr: { title: "POC — Jérémy Angulo", description: "", noindex: true },
    en: { title: "POC — Jérémy Angulo", description: "", noindex: true },
  },
  gateway: {
    fr: {
      title: "Jérémy Angulo — Jour ou nuit",
      description: "Deux facettes du portfolio de Jérémy Angulo : jour et nuit.",
    },
    en: {
      title: "Jérémy Angulo — Day or night",
      description: "Two facets of Jérémy Angulo's portfolio: day and night.",
    },
  },
};

const keyForPath = (pathname) => {
  if (pathname.startsWith("/tech")) return "tech";
  if (pathname.startsWith("/3d")) return "experience";
  if (pathname.startsWith("/project")) return "project";
  if (pathname.startsWith("/cv") || pathname.startsWith("/resume")) return "cv";
  if (pathname.startsWith("/portfolio")) return "gateway";
  if (pathname.startsWith("/statistiques")) return "stats";
  if (pathname.startsWith("/poc")) return "poc";
  return "home";
};

const useDocumentMeta = () => {
  const { pathname } = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    const entry = META[keyForPath(pathname)];
    // Une langue inattendue ne doit jamais vider le titre : repli sur le FR.
    const meta = (entry && (entry[lang] || entry.fr)) || META.home.fr;

    document.title = meta.title;

    const tag = document.querySelector('meta[name="description"]');
    if (tag && meta.description) tag.setAttribute("content", meta.description);

    // Le robots est ajouté puis retiré à la volée : laisser un noindex derrière
    // soi en revenant sur une page publique la ferait disparaître de Google.
    const existing = document.querySelector('meta[name="robots"]');
    if (meta.noindex) {
      const robots = existing ?? document.createElement("meta");
      robots.setAttribute("name", "robots");
      robots.setAttribute("content", "noindex, nofollow");
      if (!existing) document.head.appendChild(robots);
    } else if (existing) {
      existing.remove();
    }
  }, [pathname, lang]);
};

export default useDocumentMeta;
