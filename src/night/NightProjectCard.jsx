// src/night/NightProjectCard.jsx
// Carte de projet à hauteur naturelle : aucune hauteur imposée, aucun tilt.
// Le visuel garde son ratio 16/10 réservé d'avance, donc la grille ne saute
// pas au chargement des images.
// Ni overlay ni clic sur l'image : deux boutons explicites en pied de carte,
// rendus seulement si le lien existe.

import React from "react";
import { AiOutlineGithub } from "react-icons/ai";
import { FiArrowUpRight } from "react-icons/fi";
import NightCard from "./NightCard";
import { useDict } from "./nightLabels";

const NightProjectCard = ({ projet, variants, index }) => {
  const dict = useDict();
  const { name, description, tags, image, source_link: lien, source_code_link: code } = projet;

  return (
    <NightCard
      as="article"
      variante="colonne"
      variants={variants}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="night-projet__visuel">
        <img src={image} alt={name} loading="lazy" decoding="async" />
      </div>

      <h3 className="night-projet__titre">{name}</h3>
      <p className="night-projet__hook">{description.hook}</p>

      <ul className="night-projet__points">
        {description.highlights.map((point) => (
          <li key={point.title} className="night-projet__point">
            <strong>{point.title}</strong> {point.text}
          </li>
        ))}
      </ul>

      <div className="night-projet__tags">
        {tags.map((tag) => (
          <span key={tag.name} className="night-projet__tag">
            #{tag.name}
          </span>
        ))}
      </div>

      {(lien || code) && (
        <div className="night-projet__pied">
          {lien && (
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="night-projet__lien"
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
              className="night-projet__lien"
              aria-label={`${dict.code} — ${name}`}
              title={dict.code}
            >
              <AiOutlineGithub aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </NightCard>
  );
};

export default NightProjectCard;
