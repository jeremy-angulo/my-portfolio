// src/poc/nuit-3/ciel/echantillonnerPortrait.js
// Le portrait devient un nuage de points : on échantillonne
// `profile_picture.png` (import Vite, donc même origine — getImageData passe)
// dans un canvas 2D hors écran, on jette le fond blanc, et on génère d'un
// même coup les positions de ciel et la sphère de Fibonacci du globe.
//
// Un seul passage, après `img.decode()`, mémoïsé par pas d'échantillonnage :
// les ~30 ms de lecture de pixels sont couvertes par la photo encore affichée.

import jeremy from "../../../assets/profile_picture.png";

// Générateur déterministe : deux visites donnent le même ciel.
const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const LARGEUR = 360;
const HAUTEUR = 330;
const LAVANDE = [0.874, 0.851, 1.0];

const cache = new Map();

const charger = () =>
  new Promise((resoudre, rejeter) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (img.decode) img.decode().then(() => resoudre(img), () => resoudre(img));
      else resoudre(img);
    };
    img.onerror = rejeter;
    img.src = jeremy;
  });

/**
 * @param {{ pas?: number, max?: number }} options
 * @returns {Promise<{count:number, portrait:Float32Array, ciel:Float32Array,
 *   sphere:Float32Array, seed:Float32Array, couleur:Float32Array, taille:Float32Array}>}
 */
export const echantillonnerPortrait = async ({ pas = 2, max = 16000 } = {}) => {
  const cle = `${pas}|${max}`;
  if (cache.has(cle)) return cache.get(cle);

  const promesse = (async () => {
    const img = await charger();

    const c = document.createElement("canvas");
    c.width = LARGEUR;
    c.height = HAUTEUR;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, LARGEUR, HAUTEUR);
    const { data } = ctx.getImageData(0, 0, LARGEUR, HAUTEUR);

    // 1) Pixels retenus : tout sauf le fond blanc (luminance > .93).
    const bruts = [];
    for (let y = 0; y < HAUTEUR; y += pas) {
      for (let x = 0; x < LARGEUR; x += pas) {
        const i = (y * LARGEUR + x) * 4;
        if (data[i + 3] < 128) continue;
        const r = data[i] / 255;
        const v = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const lum = 0.299 * r + 0.587 * v + 0.114 * b;
        if (lum > 0.93) continue; // le fond blanc sert de détourage
        bruts.push(x / LARGEUR, y / HAUTEUR, lum, r, v, b);
      }
    }

    // 2) Mélange déterministe puis plafond : le sous-échantillonnage reste
    //    réparti sur toute la silhouette, jamais en bandes.
    const total = bruts.length / 6;
    const ordre = new Uint32Array(total);
    for (let i = 0; i < total; i += 1) ordre[i] = i;
    const rnd = mulberry32(0x51f5a7);
    for (let i = total - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      const t = ordre[i];
      ordre[i] = ordre[j];
      ordre[j] = t;
    }
    const count = Math.min(total, max);

    // 3) Attributs.
    const portrait = new Float32Array(count * 3);
    const ciel = new Float32Array(count * 3);
    const sphere = new Float32Array(count * 3);
    const couleur = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const taille = new Float32Array(count);

    const rndCiel = mulberry32(0x2b1c39);
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let k = 0; k < count; k += 1) {
      const s = ordre[k] * 6;
      portrait[k * 3] = bruts[s];
      portrait[k * 3 + 1] = bruts[s + 1];
      portrait[k * 3 + 2] = bruts[s + 2];

      // Couleur du pixel mêlée à 30 % de lavande : le nuage reste « nuit ».
      couleur[k * 3] = bruts[s + 3] * 0.7 + LAVANDE[0] * 0.3;
      couleur[k * 3 + 1] = bruts[s + 4] * 0.7 + LAVANDE[1] * 0.3;
      couleur[k * 3 + 2] = bruts[s + 5] * 0.7 + LAVANDE[2] * 0.3;

      // Ciel : trois couches pour la parallaxe.
      ciel[k * 3] = rndCiel();
      ciel[k * 3 + 1] = rndCiel();
      ciel[k * 3 + 2] = Math.floor(rndCiel() * 3);

      // Sphère de Fibonacci : répartition régulière, aucun pôle chargé.
      const uy = 1 - (k / Math.max(1, count - 1)) * 2;
      const rayon = Math.sqrt(Math.max(0, 1 - uy * uy));
      const theta = phi * k;
      sphere[k * 3] = Math.cos(theta) * rayon;
      sphere[k * 3 + 1] = uy;
      sphere[k * 3 + 2] = Math.sin(theta) * rayon;

      seed[k] = rndCiel();
      taille[k] = 1.6 + rndCiel() * 1.0;
    }

    return { count, portrait, ciel, sphere, seed, couleur, taille };
  })();

  cache.set(cle, promesse);
  return promesse;
};

export default echantillonnerPortrait;
