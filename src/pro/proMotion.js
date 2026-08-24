// src/pro/proMotion.js
// Variants d'animation partagés par la facette jour : des révélations douces.

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" },
  }),
};

const viewportOnce = { once: true, amount: 0.2 };

export { rise, viewportOnce };
