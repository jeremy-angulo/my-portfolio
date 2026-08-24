// src/pro/ProTicker.jsx
// Deux rangées de cartes qui défilent en sens inverse, sans titre de section :
// des expériences variées, simplement posées là. Survol = pause.

import React from "react";
import {
  FiSmile,
  FiCpu,
  FiBookOpen,
  FiAward,
  FiGlobe,
  FiActivity,
  FiHeart,
  FiClipboard,
  FiZap,
  FiMap,
} from "react-icons/fi";
import { useProContent } from "../i18n/useContent";

const ICONS = {
  smile: <FiSmile />,
  cpu: <FiCpu />,
  book: <FiBookOpen />,
  award: <FiAward />,
  globe: <FiGlobe />,
  activity: <FiActivity />,
  heart: <FiHeart />,
  clipboard: <FiClipboard />,
  zap: <FiZap />,
  map: <FiMap />,
};

// Le set est dupliqué (le clone est aria-hidden) pour un défilement en boucle sans couture.
const TickerRow = ({ items, reverse }) => (
  <div className={`pro-ticker__row ${reverse ? "pro-ticker__row--reverse" : ""}`}>
    <div className="pro-ticker__track">
      {[false, true].map((isClone) => (
        <ul
          key={isClone ? "clone" : "set"}
          className="pro-ticker__set"
          aria-hidden={isClone}
        >
          {items.map((item) => (
            <li key={item.title} className="pro-ticker__card">
              <span className="pro-ticker__icon">{ICONS[item.icon]}</span>
              <span className="pro-ticker__text">
                <strong>{item.title}</strong>
                {item.detail && <em>{item.detail}</em>}
              </span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  </div>
);

const ProTicker = () => {
  const { proTicker, proUi } = useProContent();
  const mid = Math.ceil(proTicker.length / 2);

  return (
    <section className="pro-ticker" aria-label={proUi.tickerLabel}>
      <TickerRow items={proTicker.slice(0, mid)} />
      <TickerRow items={proTicker.slice(mid)} reverse />
    </section>
  );
};

export default ProTicker;
