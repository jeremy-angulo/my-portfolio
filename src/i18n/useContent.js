// src/i18n/useContent.js
// Chaque facette a ses contenus en deux langues, de forme identique :
// ces hooks renvoient le bon jeu selon la langue active.

import * as proFr from "../constants/pro";
import * as proEn from "../constants/proEn";
import * as nightEn from "../constants";
import * as nightFr from "../constants/nightFr";
import { useLang } from "./LanguageContext";

export const useProContent = () => {
  const { lang } = useLang();
  return lang === "en" ? proEn : proFr;
};

export const useNightContent = () => {
  const { lang } = useLang();
  return lang === "fr" ? nightFr : nightEn;
};
