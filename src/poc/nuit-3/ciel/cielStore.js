// src/poc/nuit-3/ciel/cielStore.js
// Store MUTABLE, sans état React : le DOM y dépose des éléments à mesurer et
// des cibles, la boucle WebGL y lit ses uniformes. Aucun setState pendant
// l'animation, donc aucun re-render entre le montage et le démontage.
//
// Toutes les positions sont exprimées en RATIOS du rect du canvas (lui-même
// `position: fixed; inset: 0`, donc du viewport) : c'est la seule façon
// zoom-proof d'écrire ces effets sur ce dépôt (`body { zoom: .85 }`).
// Un seul POC nuit-3 peut être monté à la fois : un singleton de module suffit
// et évite de faire descendre le store en props dans toute la page.

const store = {
  // --- horloge -----------------------------------------------------------
  t0: 0, // performance.now() au montage de la racine
  retour: false, // deuxième visite dans la session : séquence raccourcie

  // --- morphs ------------------------------------------------------------
  dissolve: 1, // 0 = portrait, 1 = ciel
  dissolveCible: 1,
  dissolveVitesse: 0,
  gather: 0, // 0 = ciel, 1 = globe de contact
  gatherCible: 0,
  gatherBrut: 0, // avance linéaire, avant courbe
  tCanvas: 0, // montage du canvas (t0 des rampes WebGL)
  nebula: 0,
  opacity: 0,

  // --- pointeur ----------------------------------------------------------
  pointeur: { x: 0.5, y: 0.4 }, // lissé, ratio du canvas
  pointeurBrut: { x: 0.5, y: 0.4 },
  pointeurActif: 0, // lissé 0..1
  pointeurActifBrut: false,
  pointeurDansHero: false,
  pointeurHero: { x: 0.5, y: 0.5 }, // ratio du rect du hero
  pointeurClairiere: { x: 0.5, y: 0.5 },
  pointeurDansClairiere: false,
  derniereActivite: 0,

  // --- inclinaisons ------------------------------------------------------
  tilt: { x: 0, y: 0 }, // radians, lissés
  globeTilt: { x: 0, y: 0 },

  // --- lueur de la nébuleuse --------------------------------------------
  lumiere: { x: 0.78, y: 0.3 }, // lissée
  lune: { x: 0.78, y: 0.3 }, // position de repos (la lune du portrait)
  sortieHero: 0, // horodatage de la sortie du pointeur

  // --- rects mesurés (ratios du canvas) ----------------------------------
  carte: { x: 0.78, y: 0.5, w: 0.14, h: 0.2 },
  texte: { x0: 0, y0: 0, x1: 0, y1: 0 },
  clairiere: { x: 0.25, y: 0.5, w: 0.28, h: 0.35 },

  // --- éléments à mesurer (déposés par le DOM) ---------------------------
  els: { photo: null, lune: null, texte: null, clairiere: null, hero: null },

  // --- visibilité --------------------------------------------------------
  heroVisible: true,
  contactVisible: false,
  scroll: 0, // 0..1 sur la hauteur de page

  // --- qualité -----------------------------------------------------------
  cull: 1, // les points de graine > cull passent à taille 0
  octaves: 2,

  // --- instrumentation (DEV) --------------------------------------------
  frames: 0,
  points: 0,
  dpr: 1,
};

/** Remet le store à son état de départ (montage / HMR). */
export const reinitialiser = () => {
  store.t0 = typeof performance !== "undefined" ? performance.now() : 0;
  store.dissolve = 1;
  store.dissolveCible = 1;
  store.dissolveVitesse = 0;
  store.gather = 0;
  store.gatherCible = 0;
  store.gatherBrut = 0;
  store.tCanvas = 0;
  store.nebula = 0;
  store.opacity = 0;
  store.pointeur = { x: 0.5, y: 0.4 };
  store.pointeurBrut = { x: 0.5, y: 0.4 };
  store.pointeurActif = 0;
  store.pointeurActifBrut = false;
  store.pointeurDansHero = false;
  store.pointeurDansClairiere = false;
  store.derniereActivite = 0;
  store.tilt = { x: 0, y: 0 };
  store.globeTilt = { x: 0, y: 0 };
  store.lumiere = { x: 0.78, y: 0.3 };
  store.lune = { x: 0.78, y: 0.3 };
  store.sortieHero = 0;
  store.els = { photo: null, lune: null, texte: null, clairiere: null, hero: null };
  store.heroVisible = true;
  store.contactVisible = false;
  store.scroll = 0;
  store.cull = 1;
  store.octaves = 2;
  store.frames = 0;
  store.points = 0;
};

/** Enregistre un élément mesurable ; renvoie la fonction de retrait. */
export const poserElement = (cle, noeud) => {
  store.els[cle] = noeud;
  return () => {
    if (store.els[cle] === noeud) store.els[cle] = null;
  };
};

export default store;
