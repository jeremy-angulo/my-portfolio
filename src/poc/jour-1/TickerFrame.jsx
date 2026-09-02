// src/poc/jour-1/TickerFrame.jsx
// Enveloppe de ProTicker, importé TEL QUEL : rien de sa logique n'est
// dupliqué. À l'entrée dans le viewport, les deux rangées se mettent en marche
// depuis des positions opposées et les bords du bandeau s'ouvrent depuis le
// centre — tout est en CSS descendant, piloté par la classe `.is-in`.
//
// Pas de spotlight ici : les cartes défilent déjà, deux effets ensemble
// feraient du bruit.

import React, { useRef } from "react";
import ProTicker from "../../pro/ProTicker";
import useInViewClass from "./useInViewClass";

const TickerFrame = () => {
  const cadre = useRef(null);
  useInViewClass(cadre, { amount: 0.2 });

  return (
    <div ref={cadre} className="j1-ticker">
      <span className="j1-rule j1-rule--h j1-rule--haut" aria-hidden="true" />
      <ProTicker />
      <span className="j1-rule j1-rule--h j1-rule--bas" aria-hidden="true" />
    </div>
  );
};

export default TickerFrame;
