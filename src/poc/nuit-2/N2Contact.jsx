// src/poc/nuit-2/N2Contact.jsx
// L'ATTERRISSAGE. La lune fixe termine sa course ici, à la place laissée libre
// par le globe WebGL (EarthCanvas n'est pas monté : zéro contexte WebGL sur la
// page). Le formulaire est celui de Contact.jsx — mêmes états, même EmailJS,
// mêmes garde-fous, mêmes libellés — réécrit en BEM.

import React, { useRef, useState } from "react";
import { motion, useTransform } from "framer-motion";
import emailjs from "@emailjs/browser";
import { MdEmail, MdPhone } from "react-icons/md";
import { useNightContent } from "../../i18n/useContent";
import { useN2Sky } from "./skyContext";
import N2SectionHeading from "./N2SectionHeading";

// Identifiants EmailJS : Vite les remplace par leur valeur AU MOMENT DU BUILD.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailjsConfigure = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const borner = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const N2Contact = () => {
  const { nightUi } = useNightContent();
  const ui = nightUi.contactUi;
  const { sectionRefs, contactMoonRef, c } = useN2Sky();

  const formRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Fondu croisé de fin de course : la lune fixe s'efface, celle-ci apparaît.
  const opaciteLune = useTransform(c, (v) => borner((v - 0.85) / 0.15));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prec) => ({ ...prec, [name]: value }));
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

    // Sans identifiants, inutile d'appeler EmailJS : on prévient plutôt que de
    // laisser le bouton bloqué sur « Envoi en cours ».
    if (!emailjsConfigure) {
      console.error(
        "EmailJS non configuré : VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY sont absents du build."
      );
      alert(ui.error);
      return;
    }

    setLoading(true);

    // emailjs.send() peut lever de façon SYNCHRONE : la promesse attrape aussi
    // ce cas-là.
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
    <section className="n2-contact" id="contact" ref={sectionRefs.contact}>
      <div className="n2-container n2-contact__inner">
        <div className="n2-contact__moonpad">
          <div className="n2-contact__moonwrap" aria-hidden="true">
            <motion.div className="n2-contact__halo" style={{ opacity: opaciteLune }} />
            <motion.div
              className="n2-contact__moon"
              ref={contactMoonRef}
              style={{ opacity: opaciteLune }}
            />
          </div>

          <div className="n2-contact__channels">
            <p className="n2-contact__channel">
              <MdEmail aria-hidden="true" />
              <a href="mailto:jeremy.angulo@gmail.com" className="blue-text-gradient">
                jeremy.angulo@gmail.com
              </a>
            </p>
            <p className="n2-contact__channel">
              <MdPhone aria-hidden="true" />
              <a
                href="https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=en"
                target="_blank"
                rel="noreferrer"
                className="blue-text-gradient"
              >
                +33 7 82 21 77 88
              </a>
            </p>
          </div>
        </div>

        <div className="n2-contact__form">
          <N2SectionHeading sub={ui.sub} title={ui.title} as="h3" />

          <form ref={formRef} onSubmit={handleSubmit} className="n2-form">
            <label className="n2-form__field">
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
            <label className="n2-form__field">
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
            <label className="n2-form__field">
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

            <button type="submit" disabled={loading} className="n2-form__send">
              {loading ? ui.sending : ui.send}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default N2Contact;
