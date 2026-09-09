// src/night/NightContact.jsx
// Section « Contact », sans globe : `EarthCanvas` n'est jamais monté — la
// facette nuit n'ouvre aucun contexte WebGL.
//
// L'envoi passe par EmailJS (`VITE_EMAILJS_*`), avec ses garde-fous : envoi
// déjà en cours, champs vides, format d'e-mail, identifiants absents du build.
// Les messages affichés viennent tous de `contactUi`.

import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { MdEmail, MdPhone } from "react-icons/md";
import NightSectionHead from "./NightSectionHead";
import NightCard from "./NightCard";
import { useDict } from "./nightLabels";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailjsConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NightContact = ({ contactUi }) => {
  const dict = useDict();
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((precedent) => ({ ...precedent, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Garde-fou anti double-clic : un envoi est déjà en cours.
    if (loading) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      alert(contactUi.fillAll);
      return;
    }

    if (!EMAIL_RE.test(form.email.trim())) {
      alert(contactUi.invalidEmail || contactUi.fillAll);
      return;
    }

    // Sans identifiants, inutile d'appeler EmailJS : on prévient plutôt que de
    // laisser le bouton bloqué sur « Envoi en cours ».
    if (!emailjsConfigured) {
      console.warn(
        "EmailJS non configuré : VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY sont absents du build."
      );
      alert(contactUi.error);
      return;
    }

    setLoading(true);

    // emailjs.send() peut lever de façon SYNCHRONE (validation des
    // identifiants) : la promesse fait que .catch() attrape aussi ce cas.
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
        alert(contactUi.success);
        setForm({ name: "", email: "", message: "" });
      })
      .catch((error) => {
        setLoading(false);
        console.error("Envoi EmailJS échoué :", error);
        alert(contactUi.error);
      });
  };

  return (
    <section id="contact" className="night-section night-contact">
      <div className="night-container night-contact__grille">
        <div className="night-contact__gauche">
          <NightSectionHead sub={contactUi.sub} title={contactUi.title} />

          <ul className="night-contact__canaux" aria-label={dict.canaux}>
            <li className="night-contact__canal">
              <span className="night-contact__pastille" aria-hidden="true">
                <MdEmail />
              </span>
              <a href="mailto:jeremy.angulo@gmail.com">jeremy.angulo@gmail.com</a>
            </li>
            <li className="night-contact__canal">
              <span className="night-contact__pastille" aria-hidden="true">
                <MdPhone />
              </span>
              <a
                href="https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=en"
                target="_blank"
                rel="noreferrer"
              >
                +33 7 82 21 77 88
              </a>
            </li>
          </ul>

          {/* Écho de fin de page : la lune revient, posée, sans parallaxe. */}
          <div className="night-contact__lune" aria-hidden="true" />
        </div>

        <NightCard variante="formulaire" levee={false}>
          <form ref={formRef} onSubmit={handleSubmit} className="night-contact__form">
            <label className="night-contact__champ">
              <span>{contactUi.nameLabel}</span>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder={contactUi.namePlaceholder}
              />
            </label>

            <label className="night-contact__champ">
              <span>{contactUi.emailLabel}</span>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder={contactUi.emailPlaceholder}
              />
            </label>

            <label className="night-contact__champ">
              <span>{contactUi.messageLabel}</span>
              <textarea
                rows={7}
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                placeholder={contactUi.messagePlaceholder}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="night-btn night-btn--primaire night-contact__envoyer"
            >
              {loading ? contactUi.sending : contactUi.send}
            </button>
          </form>
        </NightCard>
      </div>
    </section>
  );
};

export default NightContact;
