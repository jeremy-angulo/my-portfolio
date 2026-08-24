// src/i18n/LanguageContext.jsx
// Langue du site (FR par défaut), mémorisée dans localStorage et partagée
// par les deux facettes : basculer de facette conserve la langue.

import React, { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext({ lang: "fr", setLang: () => {} });

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem("site-lang");
    return stored === "en" || stored === "fr" ? stored : "fr";
  });

  useEffect(() => {
    localStorage.setItem("site-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
