// src/i18n/LangSwitch.jsx
// Sélecteur FR / EN affiché en haut de chaque page.

import React from "react";
import { useLang } from "./LanguageContext";
import "./LangSwitch.scss";

const LangSwitch = ({ mode = "day" }) => {
  const { lang, setLang } = useLang();

  return (
    <div
      className={`lang-switch lang-switch--${mode}`}
      role="group"
      aria-label="Langue / Language"
    >
      {["fr", "en"].map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn${lang === code ? " lang-switch__btn--active" : ""}`}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LangSwitch;
