// src/night/NightDock.jsx
// Le dock du bas : cinq icônes vers les sections de la page. L'entrée active
// se déduit du défilement (IntersectionObserver) et non du dernier clic, et
// l'indicateur est un point qui fond — il ne glisse jamais.
//
// Le pied de page réserve 96 px sous son dernier texte (et le hero autant sur
// mobile) : le dock, fixe, ne recouvre jamais un contenu lisible.

import React, { useEffect, useState } from "react";
import { AiOutlineFundProjectionScreen, AiOutlineHome } from "react-icons/ai";
import { BiBook } from "react-icons/bi";
import { BsPersonWorkspace } from "react-icons/bs";
import { MdMessage } from "react-icons/md";
import { useDict } from "./nightLabels";

const SECTIONS = ["education", "project", "experience", "contact"];

const NightDock = ({ labels }) => {
  const dict = useDict();
  const [actif, setActif] = useState("home");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const visibles = new Set();
    const observateur = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((entree) => {
          if (entree.isIntersecting) visibles.add(entree.target.id);
          else visibles.delete(entree.target.id);
        });
        // On garde la première section de la page présente dans la bande :
        // l'ordre de lecture prime sur l'ordre des callbacks.
        const premiere = SECTIONS.find((id) => visibles.has(id));
        setActif(premiere || "home");
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    const noeuds = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
    noeuds.forEach((n) => observateur.observe(n));

    return () => observateur.disconnect();
  }, []);

  const entrees = [
    { cle: "home", href: "/tech", label: labels.home, Icone: AiOutlineHome },
    { cle: "education", href: "#education", label: labels.education, Icone: BiBook },
    { cle: "project", href: "#project", label: labels.projects, Icone: AiOutlineFundProjectionScreen },
    { cle: "experience", href: "#experience", label: labels.experience, Icone: BsPersonWorkspace },
    { cle: "contact", href: "#contact", label: labels.contact, Icone: MdMessage },
  ];

  return (
    <nav className="night-dock" aria-label={dict.dock}>
      {entrees.map(({ cle, href, label, Icone }) => (
        <a
          key={cle}
          href={href}
          title={label}
          aria-label={label}
          aria-current={actif === cle ? "true" : undefined}
          className={`night-dock__lien${actif === cle ? " night-dock__lien--actif" : ""}`}
        >
          <Icone aria-hidden="true" />
          <span className="night-dock__point" aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
};

export default NightDock;
