// src/night/NightFooter.jsx
// Pied de page : le composant partagé `Footer` (le texte « </> by Jérémy
// ANGULO » et son lien), posé sous un filet et dans une balise <footer>
// sémantique. Ses décalages propres sont neutralisés dans `_sections.scss`,
// sous `.night-pied` seulement.

import React from "react";
import Footer from "../components/Footer";

const NightFooter = () => (
  <footer className="night-pied">
    <div className="night-container">
      <Footer />
    </div>
  </footer>
);

export default NightFooter;
