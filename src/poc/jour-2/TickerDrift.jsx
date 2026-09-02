// src/poc/jour-2/TickerDrift.jsx
// Le bandeau de cartes défilantes de l'accueil, importé TEL QUEL (ses icônes ne
// sont pas exportées : le redéclarer serait la seule vraie duplication de ce
// POC). Il est simplement posé dans un horizon qui s'ouvre, et poussé d'un
// bloc par le défilement — les deux rangées ensemble, ±2 %. La boucle CSS
// existante (46 s / 55 s, pause au survol) n'est pas touchée.

import React, { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import ProTicker from "../../pro/ProTicker";
import HorizonBand from "./HorizonBand";
import useScrollRatio from "../shared/useScrollRatio";

const TickerDrift = ({ reduced }) => {
  const ref = useRef(null);
  const p = useScrollRatio(ref, {
    start: "start end",
    end: "end start",
    enabled: !reduced,
    frozen: 0.5,
  });
  const x = useTransform(p, [0, 1], ["2%", "-2%"]);

  return (
    <div className="j2-drift-wrap" ref={ref}>
      <HorizonBand trackRef={ref} reduced={reduced} />
      <motion.div className="j2-drift" style={reduced ? undefined : { x }}>
        <ProTicker />
      </motion.div>
    </div>
  );
};

export default TickerDrift;
