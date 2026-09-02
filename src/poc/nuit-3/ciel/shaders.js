// src/poc/nuit-3/ciel/shaders.js
// GLSL du ciel. Aucune caméra three n'intervient : le vertex shader écrit
// directement gl_Position à partir de coordonnées en RATIOS du canvas
// (x 0..1 vers la droite, y 0..1 vers le bas), ce qui rend toute la chaîne
// DOM → GL insensible au `body { zoom: .85 }` du dépôt.
//
// Repère intermédiaire dit « unités hauteur » : x_h = x_ratio × aspect,
// y_h = y_ratio. Il est isotrope, donc les rotations et les distances y sont
// justes ; on ne revient en ratios qu'au moment d'écrire gl_Position.

// ---------------------------------------------------------------- nébuleuse

export const nebuleuseVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Quad plein écran : on court-circuite la caméra.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const nebuleuseFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;      // taille du canvas en px (pour l'aspect)
  uniform vec2  uLight;    // centre de la lueur violette, en ratios
  uniform float uNebula;   // 0..1, fondu d'arrivée
  uniform float uScroll;   // 0..1, parallaxe très lente
  uniform float uOctaves;  // 2.0, ou 1.0 en mode dégradé

  // Bruit de valeur : deux octaves suffisent, la fréquence est très basse.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float bruit(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y);          // y vers le bas
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 ph = vec2(p.x * aspect, p.y);

    // Dégradé #050816 → #1a0f3f, amplitude volontairement faible.
    vec3 nuit = vec3(0.0196, 0.0314, 0.0863);
    vec3 pourpre = vec3(0.1020, 0.0588, 0.2471);
    vec3 couleur = mix(nuit, pourpre, smoothstep(0.0, 1.0, p.y) * 0.55);

    float n = bruit(ph * 1.6 + vec2(uTime * 0.02, uScroll * 0.10));
    if (uOctaves > 1.5) {
      n = n * 0.66 + bruit(ph * 3.7 - vec2(uTime * 0.013, uScroll * 0.05)) * 0.34;
    }
    couleur += (n - 0.5) * 0.055;

    // Lueur violette : au repos sur la lune du portrait, sinon sur le pointeur.
    vec2 lh = vec2(uLight.x * aspect, uLight.y - uScroll * 0.10);
    float g1 = 1.0 - clamp(distance(ph, lh) / 0.55, 0.0, 1.0);
    couleur += vec3(0.569, 0.369, 1.0) * pow(g1, 2.2) * 0.22;

    // Lueur bleu-violet, en bas à gauche.
    vec2 l2 = vec2(0.15 * aspect, 0.95);
    float g2 = 1.0 - clamp(distance(ph, l2) / 0.62, 0.0, 1.0);
    couleur += vec3(0.106, 0.078, 0.251) * pow(g2, 2.0) * 0.35;

    gl_FragColor = vec4(mix(nuit, couleur, uNebula), 1.0);
  }
`;

// ---------------------------------------------------------------- poussière

export const poussiereVert = /* glsl */ `
  precision highp float;

  // L'attribut « position » porte l'état CIEL : x, y en ratios ; z = couche.
  attribute vec3  aPortrait;  // u, v dans l'image (y bas) ; z = luminance
  attribute vec3  aSphere;    // direction unitaire (sphère de Fibonacci)
  attribute float aSeed;      // 0..1, retard et scintillement propres au point
  attribute vec3  aColor;     // couleur du pixel, mêlée de lavande
  attribute float aSize;      // 1.6..2.6 px

  uniform vec2  uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform float uDissolve;    // 0 portrait → 1 ciel
  uniform float uGather;      // 0 ciel → 1 globe
  uniform vec4  uCard;        // centre x,y et demi-taille w,h de l'image (ratios)
  uniform float uCardRot;     // rotation de la carte (radians)
  uniform vec2  uTilt;        // inclinaison du nuage (rotX, rotY)
  uniform vec3  uGlobe;       // centre x,y (ratios) et rayon (unités hauteur)
  uniform vec2  uGlobeTilt;
  uniform vec2  uPointer;     // ratios
  uniform float uLens;        // 0..1, intensité de la lentille / lanterne
  uniform float uScroll;
  uniform float uOpacity;
  uniform float uCull;        // les graines > uCull ne sont pas dessinées
  uniform vec4  uText;        // rect de la colonne texte : x0,y0,x1,y1 (ratios)
  uniform float uTextMask;

  varying vec3  vCouleur;
  varying float vAlpha;

  vec3 rotX(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }
  vec3 rotY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }
  vec2 rot2(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    float r2 = fract(aSeed * 17.13);

    // ---------------------------------------------------- état PORTRAIT
    float hw = uCard.z * aspect;   // demi-largeur de l'image, unités hauteur
    float hh = uCard.w;            // demi-hauteur
    vec3 loc = vec3(
      (aPortrait.x - 0.5) * 2.0 * hw,
      (aPortrait.y - 0.5) * 2.0 * hh,
      (aPortrait.z - 0.5) * 0.70 * hh
    );
    loc = rotY(loc, uTilt.y);
    loc = rotX(loc, uTilt.x);
    loc.xy = rot2(loc.xy, uCardRot);   // les 2,5° de la carte
    vec2 pPortrait = vec2(uCard.x * aspect, uCard.y) + loc.xy;

    // ---------------------------------------------------- état CIEL
    float couche = position.z;
    float derive = uScroll * (0.15 + 0.25 * couche);
    vec2 ciel = vec2(position.x, fract(position.y - derive + 4.0));
    vec2 pCiel = vec2(ciel.x * aspect, ciel.y);

    // ---------------------------------------------------- état GLOBE
    vec3 dir = rotY(aSphere, uTime * 0.157 + uGlobeTilt.y);
    dir = rotX(dir, uGlobeTilt.x);
    vec2 pGlobe = vec2(uGlobe.x * aspect, uGlobe.y)
                + vec2(dir.x, -dir.y) * uGlobe.z;

    // ---------------------------------------------------- mélange
    // Retard propre à chaque point : le visage se défait par la périphérie.
    float d = smoothstep(aSeed * 0.35, aSeed * 0.35 + 0.35, uDissolve);
    float g = smoothstep(aSeed * 0.40, aSeed * 0.40 + 0.60, uGather);
    vec2 ph = mix(mix(pPortrait, pCiel, d), pGlobe, g);

    // ---------------------------------------------------- couleur & alpha
    float scint = 0.5 + 0.5 * sin(uTime * 5.0 + aSeed * 6.2831);
    float aPortraitA = 0.85;
    float aCiel = (0.10 + 0.55 * r2) * mix(0.55, 1.0, scint);
    float aGlobe = mix(0.25, 0.85, smoothstep(-0.25, 0.15, dir.z));

    vec3 cCiel = mix(vec3(0.874, 0.851, 1.0), vec3(0.569, 0.369, 1.0), r2 * 0.65);
    vec3 cGlobe = mix(vec3(0.569, 0.369, 1.0), vec3(0.874, 0.851, 1.0), dir.y * 0.5 + 0.5);

    vec3 col = mix(mix(aColor, cCiel, d), cGlobe, g);
    float alpha = mix(mix(aPortraitA, aCiel, d), aGlobe, g);

    // Masque de densité derrière la colonne texte du hero : on protège la
    // lecture sans jamais toucher au DOM.
    float mx = smoothstep(uText.x - 0.02, uText.x + 0.02, ciel.x)
             * (1.0 - smoothstep(uText.z - 0.02, uText.z + 0.02, ciel.x));
    float my = smoothstep(uText.y - 0.02, uText.y + 0.02, ciel.y)
             * (1.0 - smoothstep(uText.w - 0.02, uText.w + 0.02, ciel.y));
    alpha *= mix(1.0, 0.32, mx * my * uTextMask * d * (1.0 - g));

    // ---------------------------------------------------- lentille / lanterne
    // Une seule opération, paramétrée par l'état : rayon et poussée sont
    // exprimés en unités de carte tant qu'on est dans le portrait, en unités
    // de canvas une fois dans le ciel.
    if (uLens > 0.001) {
      float rayon = mix(0.16 * (hh * 2.0), 0.12, d) * uLens;
      float pousse = mix(0.015 * (hh * 2.0), 0.036, d) * uLens;
      float eclat = mix(0.35, 0.30, d) * uLens;
      vec2 ptr = vec2(uPointer.x * aspect, uPointer.y);
      vec2 delta = ph - ptr;
      float dd = length(delta);
      float f = 1.0 - smoothstep(0.0, max(rayon, 0.0001), dd);
      ph += (dd > 0.0001 ? delta / dd : vec2(0.0, 1.0)) * f * pousse;
      col = mix(col, vec3(1.0), f * eclat);
      alpha = min(0.95, alpha + f * eclat * 0.3);
    }

    vCouleur = col;
    vAlpha = alpha * uOpacity;

    float taille = aSize * uDpr * (uRes.y / 900.0) * mix(1.0, 1.3, g);
    if (aSeed > uCull) taille = 0.0;
    gl_PointSize = taille;

    gl_Position = vec4((ph.x / aspect) * 2.0 - 1.0, 1.0 - ph.y * 2.0, 0.0, 1.0);
  }
`;

export const poussiereFrag = /* glsl */ `
  precision mediump float;

  varying vec3  vCouleur;
  varying float vAlpha;

  void main() {
    // Disque doux : pas de texture, pas de fetch, un smoothstep suffit.
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(vCouleur, a);
  }
`;
