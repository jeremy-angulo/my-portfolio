// src/stats/StatsGate.jsx — écran de phrase d'accès de /statistiques.
//
// Rend l'écran (navbar sans « Verrouiller », soleil, carte, footer) DANS la
// racine animée que StatsPage possède : la racine reste la même au
// déverrouillage, son fondu d'entrée ne se rejoue donc pas. Il ne possède
// aucun état de données : draft/busy/error et la soumission viennent de
// useStatsData ; seul l'affichage de la phrase (œil) est local, et
// volontairement non mémorisé.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiBarChart2, FiEye, FiEyeOff, FiLoader } from "react-icons/fi";
import ProFooter from "../pro/ProFooter";
import { rise } from "../pro/proMotion";
import StatsNavbar from "./StatsNavbar";

// Pointeur grossier (téléphone, tablette) : pas d'autofocus, sinon le clavier
// recouvre la moitié de l'écran avant même que la page soit lue.
const wantsAutofocus = () =>
  typeof window === "undefined" || typeof window.matchMedia !== "function"
    ? true
    : !window.matchMedia("(pointer: coarse)").matches;

// Sous prefers-reduced-motion, la carte arrive en place : ni translation
// (MotionConfig) ni fondu (`initial={false}`).
const wantsEntrance = () =>
  typeof window === "undefined" || typeof window.matchMedia !== "function"
    ? true
    : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const StatsGate = ({ draft, setDraft, busy, error, onSubmit }) => {
  const [shown, setShown] = useState(false);
  const inputRef = useRef(null);
  const autoFocus = useMemo(wantsAutofocus, []);
  const entrance = useMemo(wantsEntrance, []);

  // Phrase refusée : la saisie reste, le champ reprend le focus pour corriger.
  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  return (
    <>
      <StatsNavbar />
      <main className="stats-gate">
        <div className="pro-container stats-gate__inner">
          {/* Le soleil se lève derrière la carte : le motif du jour. */}
          <div className="stats-gate__sky" aria-hidden="true">
            <span className="stats-gate__ring stats-gate__ring--outer" />
            <span className="stats-gate__ring stats-gate__ring--inner" />
            <span className="stats-gate__sun" />
          </div>

          <motion.form
            className={`stats-gate__card${error ? " is-invalid" : ""}`}
            onSubmit={onSubmit}
            variants={rise}
            initial={entrance ? "hidden" : false}
            animate="show"
          >
            <span className="stats-gate__icon" aria-hidden="true">
              <FiBarChart2 />
            </span>
            <p className="pro-section__eyebrow">Page privée</p>
            <h1 className="pro-display stats-gate__title">Statistiques</h1>
            <p className="stats-gate__text">
              Fréquentation et usage de jeremyangulo.fr. L'accès demande la phrase.
            </p>

            <label htmlFor="stats-pass" className="stats-gate__label">
              Phrase d'accès
            </label>
            <div className="stats-gate__input">
              <input
                id="stats-pass"
                ref={inputRef}
                type={shown ? "text" : "password"}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoComplete="current-password"
                autoFocus={autoFocus}
                enterKeyHint="go"
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "stats-pass-error" : undefined}
              />
              <button
                type="button"
                className="stats-gate__eye"
                onClick={() => setShown((value) => !value)}
                aria-label={shown ? "Masquer la phrase" : "Afficher la phrase"}
                aria-pressed={shown}
              >
                {shown ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>

            {error ? (
              <p id="stats-pass-error" className="stats-gate__error stats-alert" role="alert">
                <FiAlertCircle aria-hidden="true" />
                <span>{error}</span>
              </p>
            ) : null}

            <button
              type="submit"
              className="pro-btn pro-btn--primary stats-gate__submit"
              disabled={busy}
            >
              {busy ? <FiLoader className="stats-gate__spinner" aria-hidden="true" /> : null}
              {busy ? "Vérification…" : "Consulter"}
            </button>

            <p className="stats-gate__note">
              La phrase est mémorisée sur cet appareil jusqu'au verrouillage.
            </p>
          </motion.form>
        </div>
      </main>
      <ProFooter />
    </>
  );
};

export default StatsGate;
