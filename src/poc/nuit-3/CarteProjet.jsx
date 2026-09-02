// src/poc/nuit-3/CarteProjet.jsx
// Carte projet : même contenu et mêmes liens qu'aujourd'hui (image, voile au
// survol, démo / GitHub, accroche, points forts, tags), mais à hauteur
// automatique dans une carte lunaire — fin des 680 à 900 px fixes.

import React from "react";
import { github, demo } from "../../assets";
import CarteLunaire from "./CarteLunaire";

const ouvrir = (url) => (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.open(url, "_blank", "noopener,noreferrer");
};

const CarteProjet = ({ name, description, tags, image, source_code_link, source_link }) => (
  <CarteLunaire className="n3-projet">
    <div className="n3-projet__visuel">
      <img src={image} alt="" aria-hidden="true" />
      <div className="n3-projet__voile">
        <h3 className="n3-projet__titre">{name}</h3>
      </div>
      <div className="n3-projet__liens">
        {source_link && (
          <button type="button" onClick={ouvrir(source_link)} aria-label={`${name} — demo`}>
            <img src={demo} alt="" aria-hidden="true" />
          </button>
        )}
        {source_code_link && (
          <button type="button" onClick={ouvrir(source_code_link)} aria-label={`${name} — GitHub`}>
            <img src={github} alt="" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>

    <p className="n3-projet__accroche">{description.hook}</p>

    <ul className="n3-projet__points">
      {description.highlights.map((point, i) => (
        <li key={`${name}-${i}`}>
          <span className="n3-projet__puce" aria-hidden="true" />
          <span>
            <strong>{point.title}</strong> {point.text}
          </span>
        </li>
      ))}
    </ul>

    <p className="n3-projet__tags">
      {tags.map((tag) => (
        <span key={`${name}-${tag.name}`} className={tag.color}>
          #{tag.name}
        </span>
      ))}
    </p>
  </CarteLunaire>
);

export default CarteProjet;
