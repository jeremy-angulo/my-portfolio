// src/pro/ProContact.jsx
// Contact côté jour : mêmes clés EmailJS que la facette nuit, habillage clair.

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { MdEmail } from "react-icons/md";
import { FiLinkedin, FiPhone } from "react-icons/fi";
import { useProContent } from "../i18n/useContent";
import { rise, viewportOnce } from "./proMotion";

const ProContact = () => {
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

    if (!form.name || !form.email || !form.message) {
      alert(ui.fillAll);
      return;
    }

    setLoading(true);

    emailjs
      .send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          to_name: "Jérémy Angulo",
          from_email: form.email,
          to_email: proContact.email,
          message: form.message,
          time: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setLoading(false);
          alert(ui.success);
          setForm({ name: "", email: "", message: "" });
        },
        (error) => {
          setLoading(false);
          console.error(error);
          alert(ui.error);
        }
      );
  };

  return (
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
              value={form.message}
              onChange={handleChange}
              placeholder={ui.messagePlaceholder}
            />
          </label>
          <button type="submit" className="pro-btn pro-btn--primary">
            {loading ? ui.sending : ui.send}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ProContact;
