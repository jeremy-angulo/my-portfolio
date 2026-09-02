// src/poc/nuit-1/CarteProjet.jsx
// Carte de projet à HAUTEUR NATURELLE (fin des 680–900 px imposés) et sans
// `react-parallax-tilt`. Le visuel garde son ratio 16/10 réservé d'avance :
// la grille ne saute pas au chargement des images.
// Plus d'overlay ni de clic sur l'image : deux boutons explicites en pied de
// carte, rendus seulement si le lien existe.

import React from "react";
import { AiOutlineGithub } from "react-icons/ai";
import { FiArrowUpRight } from "react-icons/fi";
import CarteLumiere from "./CarteLumiere";
import { useDict } from "./dictionnaire";

const CarteProjet = ({ projet, variants, index }) => {
  const dict = useDict();
  const { name, description, tags, image, source_link: lien, source_code_link: code } = projet;

  return (
    <CarteLumiere
      as="article"
      variante="colonne"
      variants={variants}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="nuit1-projet__visuel">
        <img src={image} alt={name} loading="lazy" decoding="async" />
      </div>

      <h3 className="nuit1-projet__titre">{name}</h3>
      <p className="nuit1-projet__hook">{description.hook}</p>

      <ul className="nuit1-projet__points">
        {description.highlights.map((point) => (
          <li key={point.title} className="nuit1-projet__point">
            <strong>{point.title}</strong> {point.text}
          </li>
        ))}
      </ul>

      <div className="nuit1-projet__tags">
        {tags.map((tag) => (
          <span key={tag.name} className="nuit1-projet__tag">
            #{tag.name}
          </span>
        ))}
      </div>

      {(lien || code) && (
        <div className="nuit1-projet__pied">
          {lien && (
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="nuit1-projet__lien"
              aria-label={`${dict.demo} — ${name}`}
              title={dict.demo}
            >
              <FiArrowUpRight aria-hidden="true" />
            </a>
          )}
          {code && (
            <a
              href={code}
              target="_blank"
              rel="noreferrer"
              className="nuit1-projet__lien"
              aria-label={`${dict.code} — ${name}`}
              title={dict.code}
            >
              <AiOutlineGithub aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </CarteLumiere>
  );
};

export default CarteProjet;
