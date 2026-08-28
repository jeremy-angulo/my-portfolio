import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

import { styles } from "../styles";
import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";
import { MdEmail, MdPhone } from "react-icons/md";
import { useNightContent } from "../i18n/useContent";
import "./Contact.scss";

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

const Contact = () => {
  const { nightUi } = useNightContent();
  const ui = nightUi.contactUi;
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { target } = e;
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // --- C'EST LA FONCTION QUE NOUS ACTIVONS ---
  const handleSubmit = (e) => {
    e.preventDefault();

    // Garde-fou anti double-clic : un envoi est déjà en cours.
    if (loading) return;

    // Ajout d'une validation simple
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
            to_name: "Jérémy Angulo", // Peut être n'importe quoi, ce n'est pas utilisé dans le template
            from_email: form.email,
            reply_to: form.email, // pour pouvoir répondre directement à l'expéditeur
            to_email: "jeremy.angulo@gmail.com", // Votre email de destination
            message: form.message,
            time: new Date().toLocaleString(),
          },
          EMAILJS_PUBLIC_KEY
        )
      )
      .then(() => {
        setLoading(false);
        alert(ui.success);

        setForm({
          name: "",
          email: "",
          message: "",
        });
      })
      .catch((error) => {
        setLoading(false);
        console.error("Envoi EmailJS échoué :", error);
        alert(ui.error);
      });
  };


  return (
    <div
      className={`xl:mt-12 flex gap-2 overflow-hidden contact`}
    >
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className='flex-[0.5] xl:h-auto md:h-[600px] h-[400px] earth'
      >
        <EarthCanvas />
      </motion.div>

      <motion.div
        variants={slideIn("right", "tween", 0.2, 1)}
        className='flex-[0.5] bg-black-100 p-8 rounded-2xl earth'
      >
        <p className={styles.sectionSubText}>{ui.sub}</p>
        <h3 className={styles.sectionHeadText}>{ui.title}</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='mt-3 flex flex-col gap-8 form1'
        >
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-3'>{ui.nameLabel}</span>
            <input
              type='text'
              name='name'
              required
              value={form.name}
              onChange={handleChange}
              placeholder={ui.namePlaceholder}
              className='bg-tertiary py-3 px-3 placeholder:text-secondary text-white rounded-lg border-none font-medium'
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-3'>{ui.emailLabel}</span>
            <input
              type='email'
              name='email'
              required
              value={form.email}
              onChange={handleChange}
              placeholder={ui.emailPlaceholder}
              className='bg-tertiary py-3 px-3 placeholder:text-secondary text-white rounded-lg border-none font-medium'
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-2'>{ui.messageLabel}</span>
            <textarea
              rows={7}
              name='message'
              required
              value={form.message}
              onChange={handleChange}
              placeholder={ui.messagePlaceholder}
              className='bg-tertiary py-3 px-3 placeholder:text-secondary text-white rounded-lg border-none font-medium'
            />
          </label>


          <button
            type='submit'
            disabled={loading}
            className='bg-tertiary py-3 px-5 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary disabled:opacity-60'
          >
            {loading ? ui.sending : ui.send}
          </button>
        </form>

        <div className="mt-5 contact__options">
          <article className="contact__option">
            <MdEmail />
            <a href="mailto:jeremy.angulo@gmail.com" target="_blank" className="blue-text-gradient">jeremy.angulo@gmail.com</a>
          </article>
          <article className="contact__option">
            <MdPhone />
            <a href="https://api.whatsapp.com/send/?phone=33782217788&text&app_absent=0&lang=en" target="_blank" className="blue-text-gradient">
              +33 7 82 21 77 88
            </a>
          </article>
        </div>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Contact, "contact");