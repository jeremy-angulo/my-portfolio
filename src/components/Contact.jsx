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

    // Ajout d'une validation simple
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
          to_name: "Jérémy Angulo", // Peut être n'importe quoi, ce n'est pas utilisé dans le template
          from_email: form.email,
          to_email: "jeremy.angulo@gmail.com", // Votre email de destination
          message: form.message,
          time: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setLoading(false);
          alert(ui.success);

          setForm({
            name: "",
            email: "",
            message: "",
          });
        },
        (error) => {
          setLoading(false);
          console.error(error);
          alert(ui.error);
        }
      );
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
              value={form.message}
              onChange={handleChange}
              placeholder={ui.messagePlaceholder}
              className='bg-tertiary py-3 px-3 placeholder:text-secondary text-white rounded-lg border-none font-medium'
            />
          </label>


          <button
            type='submit'
            className='bg-tertiary py-3 px-5 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary'
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