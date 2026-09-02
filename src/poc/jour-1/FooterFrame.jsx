// src/poc/jour-1/FooterFrame.jsx
// Enveloppe de ProFooter, importé TEL QUEL. Le filet du pied de page se trace
// de gauche à droite, puis le « © » apparaît : le dernier trait de la page
// répond au premier, celui tracé sous « le business ».

import React, { useRef } from "react";
import ProFooter from "../../pro/ProFooter";
import useInViewClass from "./useInViewClass";

const FooterFrame = () => {
  const cadre = useRef(null);
  useInViewClass(cadre, { amount: 0.5 });

  return (
    <div ref={cadre} className="j1-footer">
      <span className="j1-rule j1-rule--h j1-rule--final" aria-hidden="true" />
      <ProFooter />
    </div>
  );
};

export default FooterFrame;
