// src/poc/nuit-2/N2ExperienceEntry.jsx
// Une entrée de la timeline : nœud (logo de l'employeur), date du côté opposé,
// carte de contenu. L'état `is-lit` est posé par le parent au passage du
// remplissage du rail — il n'y a donc aucun état React ici.

import React from "react";

/**
 * @param {{ experience: object, index: number, linkLabel: string,
 *           refCb: (el: HTMLElement|null) => void,
 *           nodeCb: (el: HTMLElement|null) => void }} props
 */
const N2ExperienceEntry = ({ experience, index, linkLabel, refCb, nodeCb }) => (
  <div className={`n2-tl__entry n2-tl__entry--${index % 2 === 0 ? "gauche" : "droite"}`} ref={refCb}>
    <div className="n2-tl__card">
      <h3 className="n2-tl__title">{experience.title}</h3>
      <p className="n2-tl__company">{experience.company_name}</p>
      <ul className="n2-tl__points">
        {experience.points.map((point, i) => (
          <li key={`${experience.company_name}-${i}`}>{point}</li>
        ))}
      </ul>
      {experience.link && (
        <a className="n2-tl__link blue-text-gradient" href={experience.link} target="_blank" rel="noreferrer">
          {linkLabel}
        </a>
      )}
    </div>

    <div className="n2-tl__node" ref={nodeCb} style={{ background: experience.iconBg }}>
      <img src={experience.icon} alt="" loading="lazy" decoding="async" />
    </div>

    <p className="n2-tl__date">{experience.date}</p>
  </div>
);

export default N2ExperienceEntry;
