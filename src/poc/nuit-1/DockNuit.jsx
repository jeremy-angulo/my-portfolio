// src/poc/nuit-1/DockNuit.jsx
// Le dock du bas, héritier du `.nav` de `Content.jsx` : mêmes icônes, mais
// l'entrée active se déduit du défilement (IntersectionObserver) au lieu du
// dernier clic, et l'indicateur est un point qui fond — il ne glisse jamais.
//
// Le `<main>` réserve 96 px de padding bas : le dock ne recouvre jamais le
// pied de page ni le portrait sur mobile.

import React, { useEffect, useState } from "react";
import { AiOutlineFundProjectionScreen, AiOutlineHome } from "react-icons/ai";
import { BiBook } from "react-icons/bi";
import { BsPersonWorkspace } from "react-icons/bs";
import { MdMessage } from "react-icons/md";
import { useDict } from "./dictionnaire";

const SECTIONS = ["education", "project", "experience", "contact"];

const DockNuit = ({ labels }) => {
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
    { cle: "home", href: "/poc/nuit-1", label: labels.home, Icone: AiOutlineHome },
    { cle: "education", href: "#education", label: labels.education, Icone: BiBook },
    { cle: "project", href: "#project", label: labels.projects, Icone: AiOutlineFundProjectionScreen },
    { cle: "experience", href: "#experience", label: labels.experience, Icone: BsPersonWorkspace },
    { cle: "contact", href: "#contact", label: labels.contact, Icone: MdMessage },
  ];

  return (
    <nav className="nuit1-dock" aria-label={dict.dock}>
      {entrees.map(({ cle, href, label, Icone }) => (
        <a
          key={cle}
          href={href}
          title={label}
          aria-label={label}
          aria-current={actif === cle ? "true" : undefined}
          className={`nuit1-dock__lien${actif === cle ? " nuit1-dock__lien--actif" : ""}`}
        >
          <Icone aria-hidden="true" />
          <span className="nuit1-dock__point" aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
};

export default DockNuit;
