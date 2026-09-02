// src/poc/nuit-2/N2ProjectCard.jsx
// Carte projet du rail : 340 px de large, hauteur libre (les 680/850 px fixes
// du site actuel imposaient des cartes plus hautes que l'écran), sans
// react-parallax-tilt. Les liens démo / code sont de VRAIS <a> : ils sont
// atteignables au clavier, et sous 900 px ils restent visibles sans survol.

import React from "react";
import { demo, github } from "../../assets";

/**
 * @param {{ project: object, refCb?: (el: HTMLElement|null) => void,
 *           onFocusCard?: () => void, index: number }} props
 */
const N2ProjectCard = ({ project, refCb, onFocusCard, index }) => {
  const { name, description, tags, image, source_link: lien, source_code_link: code } = project;

  return (
    <article className="n2-card" ref={refCb} data-index={index} onFocus={onFocusCard}>
      <div className="n2-card__visual">
        <img src={image} alt={name} loading="lazy" decoding="async" />
        <div className="n2-card__veil">
          <h3 className="n2-card__name">{name}</h3>
          <div className="n2-card__links">
            {lien && (
              <a className="n2-card__link" href={lien} target="_blank" rel="noreferrer" aria-label={name}>
                <img src={demo} alt="" />
              </a>
            )}
            {code && (
              <a className="n2-card__link" href={code} target="_blank" rel="noreferrer" aria-label={name}>
                <img src={github} alt="" />
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="n2-card__hook">{description.hook}</p>

      <ul className="n2-card__points">
        {description.highlights.map((point, i) => (
          <li key={`${name}-h-${i}`}>
            <span className="n2-card__bullet" aria-hidden="true" />
            <p>
              <strong>{point.title}</strong> {point.text}
            </p>
          </li>
        ))}
      </ul>

      <div className="n2-card__tags">
        {tags.map((tag) => (
          <span key={`${name}-${tag.name}`} className={tag.color}>
            #{tag.name}
          </span>
        ))}
      </div>
    </article>
  );
};

export default N2ProjectCard;
