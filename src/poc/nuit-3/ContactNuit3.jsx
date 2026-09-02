// src/poc/nuit-3/ContactNuit3.jsx
// Contact : la logique EmailJS est recopiée à l'identique (garde-fous, format
// d'adresse, libellés `nightUi.contactUi`, canaux mail / WhatsApp).
//
// `EarthCanvas` disparaît : un second contexte WebGL est interdit. À sa place,
// une « clairière » vide — un rectangle mesuré à chaque frame — dans laquelle
// les étoiles du ciel viennent se rassembler en globe de points dès que la
// section est visible à 40 %.

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import emailjs from "@emailjs/browser";
import { MdEmail, MdPhone } from "react-icons/md";
import { useNightContent } from "../../i18n/useContent";
import { useLang } from "../../i18n/LanguageContext";
import useReducedMotion from "../shared/useReducedMotion";
import GlobeStatique from "./GlobeStatique";
import { dicoNuit3 } from "./dictionnaire";
import store from "./ciel/cielStore";
import { usePoserElement } from "./ciel/useRectRatios";

// Identifiants EmailJS : Vite les remplace par leur valeur AU MOMENT DU BUILD.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailjsConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactNuit3 = ({ statique }) => {
  const { nightUi } = useNightContent();
  const { lang } = useLang();
  const ui = nightUi.contactUi;
  const dico = dicoNuit3(lang);
  const mouvementReduit = useReducedMotion();

  const sectionRef = useRef(null);
  const formRef = useRef(null);
  const clairiereRef = usePoserElement("clairiere");
  const vu = useInView(sectionRef, { once: true, amount: 0.15 });

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Déclencheur du rassemblement : au-delà de 40 % visible, les points
  // quittent le ciel ; ils y retournent quand la section sort.
  useEffect(() => {
    const noeud = sectionRef.current;
    if (!noeud || statique || typeof IntersectionObserver === "undefined") return undefined;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        const dedans = entree.isIntersecting && entree.intersectionRatio >= 0.4;
        store.contactVisible = entree.isIntersecting;
        store.gatherCible = dedans ? 1 : 0;
        store.derniereActivite = performance.now();
      },
      { threshold: [0, 0.4, 0.6, 1] }
    );
    observateur.observe(noeud);
    return () => {
      observateur.disconnect();
      store.contactVisible = false;
      store.gatherCible = 0;
    };
  }, [statique]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((actuel) => ({ ...actuel, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Garde-fou anti double-clic : un envoi est déjà en cours.
    if (loading) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      alert(ui.fillAll);
      return;
    }

    if (!EMAIL_RE.test(form.email.trim())) {
      alert(ui.invalidEmail || ui.fillAll);
      return;
    }

    // Sans identifiants, inutile d'appeler EmailJS : on prévient l'utilisateur
    // plutôt que de laisser le bouton bloqué sur « Envoi en cours ».
    if (!emailjsConfigured) {
      console.error(
        "EmailJS non configuré : VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY sont absents du build."
      );
      alert(ui.error);
      return;
    }

    setLoading(true);

    // emailjs.send() peut lever de façon SYNCHRONE : on passe par une promesse
    // pour que .catch() attrape aussi ce cas-là.
    Promise.resolve()
      .then(() =>
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            from_name: form.name,
            to_name: "Jérémy Angulo",
            from_email: form.email,
            reply_to: form.email,
            to_email: "jeremy.angulo@gmail.com",
            message: form.message,
            time: new Date().toLocaleString(),
          },
          EMAILJS_PUBLIC_KEY
        )
      )
      .then(() => {
        setLoading(false);
        alert(ui.success);
        setForm({ name: "", email: "", message: "" });
      })
      .catch((error) => {
        setLoading(false);
        console.error("Envoi EmailJS échoué :", error);
        alert(ui.error);
      });
  };

  return (
    <section id="contact" className="n3-contact" ref={sectionRef}>
      <div className="n3-contact__inner">
        <div className="n3-contact__clairiere" ref={clairiereRef} aria-hidden="true">
          {statique && <GlobeStatique label={dico.clairiere} />}
        </div>

        <motion.div
          className="n3-plateau n3-contact__plateau"
          initial={mouvementReduit ? false : { opacity: 0, y: 24 }}
          animate={
            mouvementReduit || vu
              ? { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              : { opacity: 0, y: 24 }
          }
        >
          <header className="n3-plateau__entete">
            <p className="n3-plateau__sous">{ui.sub}</p>
            <h2 className="n3-plateau__titre">{ui.title}</h2>
          </header>

          <form ref={formRef} onSubmit={handleSubmit} className="n3-form">
            <label>
              <span>{ui.nameLabel}</span>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder={ui.namePlaceholder}
              />
            </label>
            <label>
              <span>{ui.emailLabel}</span>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder={ui.emailPlaceholder}
              />
            </label>
            <label>
              <span>{ui.messageLabel}</span>
              <textarea
                rows={7}
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                placeholder={ui.messagePlaceholder}
              />
            </label>

            <button type="submit" disabled={loading} className="n3-btn n3-btn--primary">
              {loading ? ui.sending : ui.send}
            </button>
          </form>

          <div className="n3-contact__canaux">
            <article>
              <MdEmail />
              <a href="mailto:jeremy.angulo@gmail.com" className="blue-text-gradient">
                jeremy.angulo@gmail.com
              </a>
            </article>
            <article>
              <MdPhone />
              <a
                href="https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=en"
                target="_blank"
                rel="noreferrer"
                className="blue-text-gradient"
              >
                +33 7 82 21 77 88
              </a>
            </article>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactNuit3;
