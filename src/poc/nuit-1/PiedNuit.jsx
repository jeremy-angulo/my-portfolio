// src/poc/nuit-1/PiedNuit.jsx
// Pied de page : le composant `Footer` existant, réutilisé tel quel (le texte
// « </> by Jérémy ANGULO » et son lien ne sont pas touchés), posé sous un filet
// et dans une balise <footer> sémantique.

import React from "react";
import Footer from "../../components/Footer";

const PiedNuit = () => (
  <footer className="nuit1-pied">
    <div className="nuit1-container">
      <Footer />
    </div>
  </footer>
);

export default PiedNuit;
