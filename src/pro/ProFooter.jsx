// src/pro/ProFooter.jsx
// Le filet du pied de page se trace de gauche à droite, puis le « © »
// apparaît : le dernier trait de la page répond au premier, celui tracé sous
// « le business » dans le hero.

import React, { useRef } from "react";
import useInViewClass from "../hooks/useInViewClass";

const ProFooter = () => {
  const cadre = useRef(null);
  useInViewClass(cadre, { amount: 0.5 });

  return (
    <div ref={cadre} className="day-footer">
      <span className="day-rule day-rule--h day-rule--final" aria-hidden="true" />
      <footer className="pro-footer">
        <div className="pro-container pro-footer__inner">
          <p>© {new Date().getFullYear()} Jérémy Angulo · Toulouse</p>
        </div>
      </footer>
    </div>
  );
};

export default ProFooter;
