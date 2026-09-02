# `src/poc/shared/` — utilitaires communs aux six POC

Ces modules sont **en lecture seule** pour les développeurs de POC : ils sont
partagés par les six pages et validés par un banc d'essai
(`shared-check.mjs`, 23 contrôles). S'il te manque une API, écris ta variante
**dans le dossier de ton POC** plutôt que de modifier un fichier d'ici.

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
import useReducedMotion from "../shared/useReducedMotion";
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

### `useWebGLSupport() → boolean`
```jsx
const webgl = useWebGLSupport();
return webgl ? <MonCanvas /> : <ReplStatique />;
```
Sonde mémoïsée au niveau du module, connue **dès le premier rendu** (pas de
canvas monté puis retiré). Le contexte de sonde est rendu immédiatement.
Ne couvre pas la perte de contexte en cours de route : garde ton écoute de
`webglcontextlost`.

---

## Mesure

### `useViewport(options?) → ref<{width, height}>`
```jsx
const racine = useRef(null);
const vp = useViewport({ el: racine });   // écrit --poc-vw / --poc-vh sur la racine
// …plus tard, dans un rAF ou un useFrame :
const h = vp.current.height;
```
Options : `{ el, varWidth = "--poc-vw", varHeight = "--poc-vh" }`. `el` accepte
un élément ou un ref ; omets-le si tu n'as pas besoin des variables CSS.

- La sonde est **unique pour tout le chantier**, comptée en références : tu ne
  rends rien, tu ne la démontes pas.
- Le ref est **muté sur place** : aucun re-render, lisible dans une boucle.
- ⚠️ `--poc-vh` vaut la **hauteur entière** du viewport, pas 1 %.
  Une scène de 2,6 écrans : `height: calc(var(--poc-vh) * 2.6)`.
  Six pour cent de viewport : `calc(var(--poc-vh) * 0.06)`.

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
import Reveal, { RevealWord } from "../shared/Reveal";

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

Classes : `.poc-reveal` (inline), `.poc-reveal__mask` (inline-block, overflow
caché, padding compensé pour ne pas couper les descendantes), `.poc-reveal__in`
(inline-block animé), `.poc-reveal__line` (block).

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

### `<PocBadge slug="jour-1" />`
Repère fixe en bas à gauche, jamais animé, qui ramène à `/poc`. Le thème
(jour / nuit) est déduit du slug. Si ton POC pose un dock en bas d'écran,
écris `--poc-badge-bottom: 84px` dans ta propre feuille — ne touche pas au
composant. Props : `{ slug, className }`.

### `kalam.scss`
La police du prénom côté nuit. Sur une arrivée directe en `/poc/nuit-N`,
`src/components/Hero.scss` n'est jamais chargée : les trois POC nuit doivent
donc écrire, en **toute première instruction** de leur `page.scss` :
```scss
@use "../shared/kalam";
```
(Un `@import url()` doit précéder toute autre instruction de la feuille émise,
et Sass interdit `@use` après une règle : les deux contraintes ne se concilient
qu'en isolant l'import.) Idempotent. N'y ajoute ni Poppins ni Fraunces, déjà
chargées globalement par `src/index.css`.

---

## Rappels de périmètre

- Les trois POC **jour** importent `../../pro/pro.scss` **en JS** depuis leur
  `Page.jsx` (jamais par `@use` : c'est une feuille globale non modulaire), et
  écrivent `.pro-root.jN-root { overflow-x: clip }` — à spécificité égale, un
  `.jN-root` seul ne battrait pas le `overflow-x: hidden` de `.pro-root`, et
  tous les `sticky` casseraient.
- Aucun POC n'appelle `useDocumentMeta` : `App` s'en charge, la clé `poc`
  couvre `/poc*` (titre neutre, noindex).
- Chaque POC embarque sa **propre** navbar dans son dossier (`ProNavbar` et
  `Navbar` ne prennent aucune prop et sont hors périmètre), avec
  `<FacetToggle mode="…" to="/poc/<homologue>" />`.
- Aucune dépendance npm nouvelle. Un seul contexte WebGL par page au maximum.
