// src/poc/jour-3/sun/skyShader.js
// Sources GLSL du ciel de « Plein soleil ».
//
// Un seul quad plein écran (planeGeometry 2×2) : le vertex shader ignore la
// caméra et écrit directement des coordonnées d'écran (clip-space), le fragment
// peint le ciel, le soleil et son voile. Un seul draw call, aucune texture,
// aucune lumière three, aucun post-processing.
//
// Repère : `st` = (0,0) en haut à gauche, (1,1) en bas à droite — le MÊME que
// celui des ratios écrits par le pilote (uSun.y augmente vers le bas).

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // Le quad couvre exactement l'écran : pas de projection, pas de caméra.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uRes;      // taille du canvas (px) — sert à corriger l'aspect
  uniform float uTime;     // secondes depuis le premier frame
  uniform vec2  uSun;      // position du soleil en ratio 0..1, y vers le bas
  uniform float uDay;      // heure de la journée 0..1 (course au défilement)
  uniform float uFloor;    // 1 dans le hero (plancher ivoire), 0 ailleurs
  uniform float uHalo;     // intensité du soleil (0 avant le lever)
  uniform float uSize;     // rayon du disque, en fraction de la hauteur
  uniform float uOctaves;  // 1 ou 2 octaves de bruit pour le voile

  // ------------------------------------------------------- clés de la journée
  // Deux couleurs par clé : le haut du ciel et la ligne d'horizon.
  const vec3 AUBE_HAUT   = vec3(0.8627, 0.9098, 0.9725); // #dce8f8
  const vec3 AUBE_HOR    = vec3(0.9529, 0.9255, 0.8667); // #f3ecdd
  const vec3 ZENITH_HAUT = vec3(0.8392, 0.9020, 0.9843); // #d6e6fb
  const vec3 ZENITH_HOR  = vec3(0.9333, 0.9529, 0.9725); // #eef3f8
  const vec3 APREM_HAUT  = vec3(0.8588, 0.9020, 0.9686); // #dbe6f7
  const vec3 APREM_HOR   = vec3(0.9647, 0.9176, 0.8314); // #f6ead4
  const vec3 DOREE_HAUT  = vec3(0.8645, 0.8881, 0.9856); // mix(#e3eefb, #915eff, .08)
  const vec3 DOREE_HOR   = vec3(0.9843, 0.8941, 0.7608); // #fbe4c2

  const vec3 IVOIRE    = vec3(0.9804, 0.9647, 0.9333); // #faf6ee
  const vec3 HALO_AUBE = vec3(0.9843, 0.8510, 0.7608); // #fbd9c2
  const vec3 HALO_OR   = vec3(0.9922, 0.9020, 0.5412); // #fde68a
  const vec3 CHAUD     = vec3(0.9608, 0.6196, 0.0431); // #f59e0b
  const vec3 COEUR     = vec3(1.0000, 0.9686, 0.8784); // #fff7e0

  // Bruit de valeur : hash + interpolation lissée. Deux octaves suffisent pour
  // un voile de cirrus ; une seule sous 700 px.
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float bruit(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    // y vers le bas, comme les ratios du pilote.
    vec2 st = vec2(vUv.x, 1.0 - vUv.y);
    float aspect = uRes.x / max(uRes.y, 1.0);

    // ------------------------------------------------------------ le ciel
    float d = clamp(uDay, 0.0, 1.0);
    vec3 haut;
    vec3 horizon;
    if (d < 0.35) {
      float t = d / 0.35;
      haut    = mix(AUBE_HAUT, ZENITH_HAUT, t);
      horizon = mix(AUBE_HOR,  ZENITH_HOR,  t);
    } else if (d < 0.75) {
      float t = (d - 0.35) / 0.40;
      haut    = mix(ZENITH_HAUT, APREM_HAUT, t);
      horizon = mix(ZENITH_HOR,  APREM_HOR,  t);
    } else {
      float t = (d - 0.75) / 0.25;
      haut    = mix(APREM_HAUT, DOREE_HAUT, t);
      horizon = mix(APREM_HOR,  DOREE_HOR,  t);
    }

    vec3 col = mix(haut, horizon, smoothstep(0.0, 1.0, st.y));

    // ------------------------------------------------- voile de cirrus
    vec2 np = vec2(st.x * aspect, st.y) * 3.0 + vec2(uTime * 0.015, 0.0);
    float n = bruit(np);
    if (uOctaves > 1.5) {
      n = n * 0.66 + bruit(np * 2.3 + 7.0) * 0.34;
    }
    // Le voile s'estompe vers le bas : les cirrus vivent en haut du ciel.
    float voile = smoothstep(0.42, 0.95, n) * 0.12 * (1.0 - smoothstep(0.45, 0.95, st.y));
    col = mix(col, vec3(1.0), voile);

    // ------------------------------------------------------------ le soleil
    vec2 v = st - uSun;
    v.x *= aspect;             // correction d'aspect : le disque reste rond
    float r = length(v);

    // Respiration : ±3 % du rayon de couronne sur 6 s.
    float resp = 1.0 + 0.03 * sin(uTime * 1.0472);
    float rayonHalo = uSize * 8.4 * resp;
    float sigma = max(rayonHalo * 0.40, 0.0001);
    float g = exp(-(r * r) / (2.0 * sigma * sigma));

    // Couronne : rose d'aube tant que uHalo est bas, or ensuite ; le bord
    // chaud (#f59e0b) apparaît là où la gaussienne s'éteint.
    vec3 teinteHalo = mix(HALO_AUBE, HALO_OR, smoothstep(0.0, 0.85, uHalo));
    vec3 couronne = mix(CHAUD, teinteHalo, smoothstep(0.0, 0.55, g));
    col = mix(col, couronne, clamp(g, 0.0, 1.0) * 0.92 * uHalo);

    // Disque : un bord doux d'un pixel ou deux, pas d'aliasing.
    float disque = 1.0 - smoothstep(uSize * 0.82, uSize * 1.06, r);
    col = mix(col, COEUR, disque * uHalo);

    // ------------------------------------------------- plancher ivoire
    // Uniquement dans le hero : le bas du ciel rejoint le mur des expertises.
    col = mix(col, IVOIRE, smoothstep(0.55, 0.92, st.y) * uFloor);

    // ------------------------------------------------- dithering ±1/255
    // Sans lui, un dégradé aussi plat que l'ivoire montre des bandes.
    col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default { vertexShader, fragmentShader };
