// src/poc/jour-1/ContactFrame.jsx
// Enveloppe de ProContact, importé TEL QUEL : la logique EmailJS n'est pas
// dupliquée d'une ligne. Tout l'habillage (filet d'ambre devant l'eyebrow, H2
// révélé par clip-path, canaux en cascade, spotlight et focus chaud sur la
// carte formulaire) est en CSS descendant, piloté par la classe `.is-in`.
//
// Contrat assumé : si le balisage de ProContact évolue (classes
// `.pro-section__eyebrow`, `.pro-section__title`, `.pro-contact__channels a`,
// `.pro-contact__form`), l'habillage tombe silencieusement — le formulaire
// reste fonctionnel, seule la décoration disparaît.

import React, { useRef } from "react";
import ProContact from "../../pro/ProContact";
import useInViewClass from "./useInViewClass";
import useSpotlight from "./useSpotlight";

const ContactFrame = () => {
  const cadre = useRef(null);
  useInViewClass(cadre, { amount: 0.2 });
  useSpotlight(cadre, { selecteur: ".pro-contact__form" });

  return (
    <div ref={cadre} className="j1-contact">
      <ProContact />
    </div>
  );
};

export default ContactFrame;
