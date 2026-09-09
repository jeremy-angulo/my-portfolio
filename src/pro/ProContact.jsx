// src/pro/ProContact.jsx
// Contact côté jour : mêmes clés EmailJS que la facette nuit, habillage clair.
// Le filet d'ambre, le titre révélé par clip-path, les canaux en cascade et le
// spotlight de la carte formulaire sont pilotés par la classe `.is-in` posée
// sur `.day-contact` (voir proAnim.scss).

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { MdEmail } from "react-icons/md";
import { FiLinkedin, FiPhone } from "react-icons/fi";
import { useProContent } from "../i18n/useContent";
import { rise, viewportOnce } from "./proMotion";
import useInViewClass from "../hooks/useInViewClass";
import useSpotlight from "../hooks/useSpotlight";

// Identifiants EmailJS : Vite les remplace par leur valeur AU MOMENT DU BUILD.
// Si une variable manque côté Vercel, la constante vaut undefined dans le bundle
// et emailjs.send() lève une exception synchrone : d'où le garde-fou plus bas.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailjsConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProContact = () => {
  const { proContact, proUi } = useProContent();
  const ui = proUi.contactUi;
  const formRef = useRef();
  // Habillage : `.is-in` à l'entrée dans le viewport, spotlight ambre sur la
  // carte formulaire. La décoration est purement descendante.
  const cadre = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  useInViewClass(cadre, { amount: 0.2 });
  useSpotlight(cadre, { selecteur: ".pro-contact__form" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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

    // emailjs.send() peut lever de façon SYNCHRONE (validation des identifiants) :
    // on passe par une promesse pour que .catch() attrape aussi ce cas-là.
    Promise.resolve()
      .then(() =>
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            from_name: form.name,
            to_name: "Jérémy Angulo",
            from_email: form.email,
            reply_to: form.email, // pour pouvoir répondre directement à l'expéditeur
            to_email: proContact.email,
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
    <div ref={cadre} className="day-contact">
      <section id="contact" className="pro-section pro-contact">
        <div className="pro-container pro-contact__grid">
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <div className="pro-section__head" style={{ marginBottom: 0 }}>
              <p className="pro-section__eyebrow">{ui.eyebrow}</p>
              <h2 className="pro-section__title">{proContact.title}</h2>
              <p className="pro-section__sub">{proContact.text}</p>
            </div>

            <div className="pro-contact__channels">
              <a href={`mailto:${proContact.email}`}>
                <MdEmail />
                {proContact.email}
              </a>
              <a href={proContact.whatsapp} target="_blank" rel="noreferrer">
                <FiPhone />
                {proContact.phoneLabel}
              </a>
              <a href={proContact.linkedin} target="_blank" rel="noreferrer">
                <FiLinkedin />
                linkedin.com/in/jeremy-angulo
              </a>
            </div>
          </motion.div>

          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="pro-contact__form"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            custom={1}
          >
            <label>
              {ui.nameLabel}
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
              {ui.emailLabel}
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
              {ui.messageLabel}
              <textarea
                rows={6}
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                placeholder={ui.messagePlaceholder}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="pro-btn pro-btn--primary"
            >
              {loading ? ui.sending : ui.send}
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
};

export default ProContact;
