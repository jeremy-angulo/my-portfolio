// src/poc/jour-3/Contact.jsx
// Copie fidèle de ProContact : mêmes clés EmailJS, mêmes messages, même id
// d'ancre. Le formulaire est enveloppé d'une CarteLumiere SANS inclinaison —
// un bloc qui contient des contrôles ne s'incline jamais ; il reçoit seulement
// l'ombre et le reflet chaud de l'heure dorée.

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { MdEmail } from "react-icons/md";
import { FiLinkedin, FiPhone } from "react-icons/fi";
import { useProContent } from "../../i18n/useContent";
import { rise, viewportOnce } from "../../pro/proMotion";
import CarteLumiere from "./CarteLumiere";

// Identifiants EmailJS : Vite les remplace par leur valeur AU MOMENT DU BUILD.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailjsConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const { proContact, proUi } = useProContent();
  const ui = proUi.contactUi;
  const formRef = useRef();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

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
    <section id="contact" className="pro-section pro-contact j3-mur">
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

        <CarteLumiere mode="fixe" tilt={0} radius={22} className="j3-lit--formulaire">
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
        </CarteLumiere>
      </div>
    </section>
  );
};

export default Contact;
