// src/experience/useKeyboard.js
// État des contrôles partagé entre le clavier, le d-pad tactile et la voiture.
// On écoute e.code (position physique des touches) : WASD en QWERTY et ZQSD
// en AZERTY tombent sur les mêmes codes, plus les flèches pour tout le monde.

import { useEffect } from "react";

export const controls = {
  forward: false,
  back: false,
  left: false,
  right: false,
  reset: false,
};

const KEYMAP = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyR: "reset",
};

export const useKeyboard = () => {
  useEffect(() => {
    const onKey = (down) => (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      // Évite le scroll de la page avec les flèches / espace pendant la conduite.
      if (e.code.startsWith("Arrow")) e.preventDefault();
      controls[action] = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      Object.keys(controls).forEach((k) => { controls[k] = false; });
    };
  }, []);
};
