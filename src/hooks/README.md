# `src/hooks/` — les hooks d'animation

Ces modules portent la couche animée des deux facettes : le jour (`src/pro/`)
et la nuit (`src/night/`). Ils ont été écrits ensemble, autour du même piège —
le zoom global — et se complètent : avant d'en écrire un nouveau, vérifie que
celui qu'il te faut n'est pas déjà là.

`Reveal` (révélation d'un texte mot à mot) vit à côté, dans
`src/components/Reveal.jsx`, parce que c'est un composant et non un hook.

## Le piège qui a dicté ces API : `body { zoom: 0.85 }`

`src/global.scss` applique un zoom global. Mesuré sur ce dépôt en 1440 × 900 :

| Grandeur | Repère | Valeur |
|---|---|---|
| `e.clientX` / `clientY` | viewport (après zoom) | ✅ utilisable |
| `el.getBoundingClientRect()` | viewport (après zoom) | ✅ utilisable |
| `window.innerWidth` / `innerHeight` | viewport | 1440 / 900 |
| `window.scrollY`, `documentElement.scrollHeight` | viewport | ✅ utilisable |
| `document.body.clientWidth` | **avant zoom** | 1694 ❌ |
| `el.offsetTop` / `offsetWidth` | **avant zoom** | ×1/0,85 ❌ |
| `ResizeObserver` → `contentRect` | **avant zoom** | 1694 × 1059 ❌ |

**Règles.** Un ratio issu de deux `getBoundingClientRect()` (ou d'un rect et
d'un `clientX`) est toujours juste. `offsetTop`, `offsetWidth` et
`contentRect` ne se mélangent jamais avec du rect ni du `scrollY`. Pour la
taille du viewport, utilise `useViewport` (sonde `position: fixed; inset: 0`,
mesurée au rect) et **pas** `window.innerHeight` ni `100vh` dans un calcul
comparé à des rects. `useScroll({ target, offset })` de framer-motion mélange
justement les deux repères : utilise `useScrollRatio` à la place.

---

## Hooks d'environnement

### `useReducedMotion() → boolean`
```jsx
import useReducedMotion from "../hooks/useReducedMotion";
const reduit = useReducedMotion();
```
Point de vérité unique de `prefers-reduced-motion: reduce`. Réactif à un
changement de réglage système. Les autres modules d'ici l'appellent
eux-mêmes et se neutralisent : tu n'as pas à les recâbler.

### `useHoverCapable() → boolean`
```jsx
const survolPossible = useHoverCapable();
```
`(hover: hover) and (pointer: fine)` — la garde unique de tous les effets de
pointeur du chantier. Volontairement stricte : un stylet ou un tactile qui
émule le survol renvoie `false`. Réévalué à chaud (souris branchée sur iPad).
En CSS, garde la **même** requête : `@media (hover: hover) and (pointer: fine)`.

### `useMediaQuery(query) → boolean`
```jsx
const grandEcran = useMediaQuery("(min-width: 900px)");
```
Une media query évaluée en JS, pour brancher/débrancher un effet exactement là
où le CSS le fait. Les media queries ne sont **pas** affectées par
`body { zoom: 0.85 }` : `(min-width: 900px)` s'évalue sur 1440 px comme la
feuille de styles. Réévalué à chaud.

---

## Mesure

### `useViewport(options?) → ref<{width, height}>`
```jsx
const racine = useRef(null);
const vp = useViewport({ el: racine });   // écrit --vp-w / --vp-h sur la racine
// …plus tard, dans un rAF ou un useFrame :
const h = vp.current.height;
```
Options : `{ el, varWidth = "--vp-w", varHeight = "--vp-h" }`. `el` accepte
un élément ou un ref ; omets-le si tu n'as pas besoin des variables CSS.

- La sonde est **unique pour tout le chantier**, comptée en références : tu ne
  rends rien, tu ne la démontes pas.
- Le ref est **muté sur place** : aucun re-render, lisible dans une boucle.
- ⚠️ `--vp-h` vaut la **hauteur entière** du viewport, pas 1 %.
  Une scène de 2,6 écrans : `height: calc(var(--vp-h) * 2.6)`.
  Six pour cent de viewport : `calc(var(--vp-h) * 0.06)`.

### `useRectRatio(targetRef, referenceRef?, options?) → ref<{x, y, w, h}>`
```jsx
const ratios = useRectRatio(luneRef, undefined, { live: true, deps: [lang] });
// ratios.current.x = centre de la cible, en ratio de la référence (0..1)
```
`x`, `y` = **centre** de la cible en ratio du rect de référence ; `w`, `h` =
taille de la cible en ratio de celle de la référence. Sans `referenceRef`, la
référence est le viewport réel (sonde partagée).

Options : `{ deps = [], live = false }`. `deps` est sérialisé (un tableau
littéral peut être passé sans risque de boucle). `live: true` relit à chaque
tour du rAF partagé — c'est une lecture de layout par frame, à n'activer que
tant que l'élément est à l'écran. Remesure automatique au resize, au
`ResizeObserver` et à `document.fonts.ready`.

---

## Défilement

### `useScrollRatio(ref, options?) → MotionValue<number>`
```jsx
const scene = useRef(null);
const p = useScrollRatio(scene, { start: "start start", end: "end end" });
const opacite = useTransform(p, [0, 0.4], [1, 0]);
```
Remplace `useScroll({ target, offset })`. Renvoie une `MotionValue` bornée à
`[0, 1]`, calculée uniquement à partir de rects et de la sonde partagée.

Options : `{ start = "start start", end = "end end", enabled = true, frozen = 1 }`.
Syntaxe des bornes identique à framer : `"<bord de l'élément> <bord du viewport>"`,
chaque jeton valant `start` | `center` | `end` | `<n>%`.

- `{ start: "start start", end: "end start" }` ≡ `clamp(-r.top / r.height, 0, 1)`.
- `enabled: false` (mouvement réduit, mobile, scène non épinglée) fige la
  valeur à `frozen` — **1 par défaut, c'est-à-dire « scène terminée, contenu en
  place »** — et n'abonne rien.
- Un seul écouteur `scroll`, un seul `resize` et une seule boucle rAF pour tout
  le chantier ; aucune lecture de layout dans le handler.
- Les extrêmes sont atteints exactement (une jauge finit à 1, pas à 0,9999).

Exports secondaires : `subscribeScrollFrame(fn) → () => void` (s'abonner au rAF
partagé) et `requestScrollFrame()` (forcer un tour après un changement de mise
en page).

---

## Animation

### `useCountUp(target, options?) → number`
```jsx
const bloc = useRef(null);
const vu = useInView(bloc, { once: true, amount: 0.4 });
const n = useCountUp(80, { enabled: vu, duration: 900, delay: 120 });
```
Options : `{ duration = 1200, delay = 0, enabled = true, ease = expoOut }` (ms).
Le hook **ne s'observe pas lui-même** : branche `enabled` sur ton `useInView`.
Il démarre une seule fois et ne se relance jamais sur un re-render.
Sous mouvement réduit, la valeur finale est rendue immédiatement.

Il **ne formate pas**. Pour « 80 k€ », « 150+ » ou « 3 », découpe la chaîne
d'origine et rends la valeur exacte des `constants` une fois le compte fini :
```js
const [, prefixe, entier, suffixe] = /^([^\d]*)(\d+)(.*)$/.exec(stat.value);
```
Export secondaire : `expoOut(t)`.

### `<Reveal>` et `<RevealWord>`
```jsx
import Reveal, { RevealWord } from "../components/Reveal";

<Reveal as="h2" by="word" variant="mask" stagger={70}>
  Trois métiers, un seul interlocuteur.
</Reveal>

<Reveal as="p" by="line" mode="inView">
  {["Première ligne", "Deuxième ligne"]}
</Reveal>
```
Props : `{ as = "span", by = "word" | "line", variant = "soft" | "mask",
mode = "inView" | "animate", delay = 0, stagger = 60, duration = 500, y = 18,
ease = [0.22, 1, 0.36, 1], amount = 0.2, className, style }`.
Retard d'un mot *i* : `delay + i * stagger` (ms). `mode="animate"` joue au
montage, `mode="inView"` à l'entrée dans le viewport (une seule fois).

⚠️ **`Reveal` ne parse pas les éléments inline** : `children` est une chaîne
(ou un tableau de chaînes / des `\n` pour `by="line"`). Pour garder un `<em>`
dans un titre, compose toi-même avec le primitif `RevealWord` :
```jsx
<h1>
  <RevealWord delay={0}>Le</RevealWord>{" "}
  <RevealWord delay={90}>pont</RevealWord>{" "}
  <em><RevealWord delay={180}>le business</RevealWord></em>
</h1>
```
`RevealWord` hérite de l'autorisation de jouer du `Reveal` qui l'englobe (via
contexte) ; utilisé seul, il s'anime au montage.

Accessibilité : de vrais nœuds texte espace entre les mots (retour à la ligne
et lecture d'écran corrects), aucune copie masquée. Sous mouvement réduit, le
texte est rendu **nu**, sans wrapper ni transition.

Classes : `.reveal` (inline), `.reveal__mask` (inline-block, overflow
caché, padding compensé pour ne pas couper les descendantes), `.reveal__in`
(inline-block animé), `.reveal__line` (block).

---

## Interface

### `usePointerVars(ref, options?) → void`
```jsx
const carte = useRef(null);
usePointerVars(carte, { varX: "--mx", varY: "--my" });
```
```scss
.ma-carte {
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), …);
  // état « pointeur à l'intérieur » : une variable, pas un re-render
  .halo { opacity: calc(var(--pv-active, 0) * 0.6); }
}
```
Options : `{ enabled = true, varX = "--mx", varY = "--my", unit = "%" | "ratio",
rest = { x: 50, y: 50 }, resetOnLeave = true, activeVar = "--pv-active" }`.
`rest` s'exprime dans la même unité que `unit`.

- **Ne retourne rien et ne provoque aucun re-render.** L'état actif passe par
  `--pv-active` (1 / 0) : ne cherche pas un `{ active }` en retour.
- Se neutralise tout seul sous mouvement réduit et hors `useHoverCapable`,
  en écrivant quand même les valeurs de repos (les reflets restent définis).
- `pointermove` passif, throttlé en rAF (une frame en attente au maximum).

---

## Rappels de périmètre

- `src/pro/pro.scss` et `src/pro/proAnim.scss` sont des feuilles **globales** :
  elles s'importent en JS depuis `ProPage.jsx`, jamais par `@use` (qui les
  dupliquerait). Toute la couche animée du jour est scopée sous `.day-root`.
  Côté nuit, `src/night/night.scss` suit la même règle, scopée sous
  `.night-root`.
- `.pro-root.day-root { overflow-x: clip }` : à spécificité égale, un
  `.day-root` seul ne battrait pas le `overflow-x: hidden` de `.pro-root`, la
  racine deviendrait un conteneur de défilement et tous les `sticky`
  casseraient. `.night-root` porte le même `clip`, pour la même raison.
- Aucune page n'appelle `useDocumentMeta` : `App` s'en charge pour toutes les
  routes.
- Chaque facette embarque sa **propre** navbar : `src/pro/ProNavbar.jsx` (jour,
  `.pro-nav`) et `src/night/NightNavbar.jsx` (nuit, `.night-nav`).
  `src/components/Navbar.jsx` (`.night-pagenav`) ne sert plus qu'aux pages nuit
  annexes — `/project/:id` et `/cv` — où il reste monté globalement par `App`,
  avec le ciel étoilé WebGL.
- `src/night/kalam.scss` est le seul endroit où Kalam (la police du prénom du
  hero nuit) est déclarée. Un fichier à part parce qu'un `@import url()` doit
  précéder toute autre instruction de la feuille émise et que Sass interdit
  `@use` après une règle : `@use "kalam";` est donc la **première** instruction
  de `night.scss`. N'y ajoute ni Poppins ni Fraunces, déjà chargées
  globalement par `src/index.css`.
- Un seul contexte WebGL par page au maximum ; `/tech` n'en ouvre aucun.
