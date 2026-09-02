// src/poc/nuit-3/ciel/Poussiere.jsx
// Le système de points — le cœur du POC. UN seul nuage, trois états :
//   portrait (les pixels de la photo) → ciel (le fond de toute la page)
//   → globe (la sphère de Fibonacci qui remplace la planète du contact).
//
// Rien n'est animé côté React : la boucle lit le store mutable, intègre les
// ressorts et les rampes, et pousse des uniformes. Zéro re-render entre le
// montage et le démontage.

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { poussiereVert, poussiereFrag } from "./shaders";
import store from "./cielStore";
import { mesurerRects } from "./useRectRatios";

const CARTE_ROT = (2.5 * Math.PI) / 180;
const DEG = Math.PI / 180;

const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const borner = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
// Lissage indépendant du framerate : « lerp 0,08 par frame à 60 fps ».
const amorti = (dt, parFrame) => 1 - Math.pow(1 - parFrame, dt * 60);

/**
 * @param {{ donnees: object, mobile: boolean, survolPossible: boolean }} props
 */
const Poussiere = ({ donnees, mobile, survolPossible }) => {
  const points = useRef(null);
  const { size, gl } = useThree();

  // -------------------------------------------------- géométrie (une fois)
  const geometrie = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(donnees.ciel, 3));
    g.setAttribute("aPortrait", new THREE.BufferAttribute(donnees.portrait, 3));
    g.setAttribute("aSphere", new THREE.BufferAttribute(donnees.sphere, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(donnees.couleur, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(donnees.seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(donnees.taille, 1));
    return g;
  }, [donnees]);

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1440, 900) },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uDissolve: { value: 1 },
      uGather: { value: 0 },
      uCard: { value: new THREE.Vector4(0.78, 0.5, 0.1, 0.12) },
      uCardRot: { value: CARTE_ROT },
      uTilt: { value: new THREE.Vector2(0, 0) },
      uGlobe: { value: new THREE.Vector3(0.25, 0.5, 0.2) },
      uGlobeTilt: { value: new THREE.Vector2(0, 0) },
      uPointer: { value: new THREE.Vector2(0.5, 0.4) },
      uLens: { value: 0 },
      uScroll: { value: 0 },
      uOpacity: { value: 0 },
      uCull: { value: 1 },
      uText: { value: new THREE.Vector4(0, 0, 0, 0) },
      uTextMask: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    store.points = donnees.count;
    return () => {
      geometrie.dispose();
    };
  }, [donnees, geometrie]);

  // -------------------------------------------------- arrivée
  const arrivee = useRef({ debut: 0, duree: store.retour ? 900 : 1400, fini: false });
  useEffect(() => {
    const maintenant = performance.now();
    // t0 du ciel = son propre montage : il a lieu APRÈS la transition d'entrée
    // de la route, un `filter` résiduel ferait fuir le `position: fixed`.
    arrivee.current.debut = maintenant + 100;
    arrivee.current.duree = store.retour ? 900 : 1400;
    arrivee.current.fini = false;
    store.tCanvas = maintenant;
  }, []);

  const memo = useRef({ masqueTexte: 0, denom: 1, frame: 0 });

  useFrame((etat, dt) => {
    const d = Math.min(dt || 0.016, 1 / 30);
    const maintenant = performance.now();
    const f = memo.current;
    f.frame += 1;
    store.frames += 1;

    // ---------------------------------------------- défilement (sans layout)
    if (f.frame % 30 === 1) {
      const doc = document.documentElement;
      f.denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
    }
    store.scroll = borner(window.scrollY / f.denom);

    // ---------------------------------------------- rects du DOM
    mesurerRects(size, f.frame);

    // ---------------------------------------------- nébuleuse & opacité
    const depuisCanvas = maintenant - (store.tCanvas || maintenant);
    store.nebula = 1 - Math.pow(1 - borner(depuisCanvas / 900), 3);
    store.opacity = borner(depuisCanvas / 600);

    // ---------------------------------------------- dissolution
    const a = arrivee.current;
    if (!a.fini) {
      const u = borner((maintenant - a.debut) / a.duree);
      const valeurArrivee = 1 - expoOut(u);
      // Si l'on défile pendant l'arrivée, la cible du défilement l'emporte.
      const v = Math.max(valeurArrivee, store.dissolveCible);
      store.dissolve = v;
      store.dissolveVitesse = 0;
      if (u >= 1) a.fini = true;
    } else {
      // Ressort maison (raideur 60, amortissement 20), intégré au delta.
      const acc = 60 * (store.dissolveCible - store.dissolve) - 20 * store.dissolveVitesse;
      store.dissolveVitesse += acc * d;
      store.dissolve = borner(store.dissolve + store.dissolveVitesse * d);
    }

    // ---------------------------------------------- rassemblement (globe)
    if (store.gather !== store.gatherCible) {
      const monte = store.gatherCible > store.gather;
      const pas = d * 1000 / (monte ? 1200 : 900);
      const brut = borner((store.gatherBrut ?? store.gather) + (monte ? pas : -pas));
      store.gatherBrut = brut;
      store.gather = monte ? expoOut(brut) : easeInOutCubic(brut);
      if ((monte && brut >= 1) || (!monte && brut <= 0)) {
        store.gather = store.gatherCible;
        store.gatherBrut = store.gatherCible;
      }
    }

    // ---------------------------------------------- pointeur
    const actifVoulu =
      survolPossible && maintenant - store.derniereActivite < 2000 && store.pointeurActifBrut ? 1 : 0;
    store.pointeurActif += (actifVoulu - store.pointeurActif) * amorti(d, 0.1);
    store.pointeur.x += (store.pointeurBrut.x - store.pointeur.x) * amorti(d, 0.1);
    store.pointeur.y += (store.pointeurBrut.y - store.pointeur.y) * amorti(d, 0.1);

    // ---------------------------------------------- inclinaison du nuage
    let cibleX = 0;
    let cibleY = 0;
    if (survolPossible) {
      if (store.pointeurDansHero) {
        cibleY = (store.pointeurHero.x - 0.5) * 10 * DEG;
        cibleX = (0.5 - store.pointeurHero.y) * 6 * DEG;
      }
    } else {
      // Tactile : une respiration lente remplace l'inclinaison.
      cibleY = Math.sin((maintenant / 9000) * Math.PI * 2) * 3 * DEG;
    }
    store.tilt.x += (cibleX - store.tilt.x) * amorti(d, 0.08);
    store.tilt.y += (cibleY - store.tilt.y) * amorti(d, 0.08);

    // ---------------------------------------------- lueur de la nébuleuse
    let lx = store.lune.x;
    let ly = store.lune.y;
    if (survolPossible && store.pointeurDansHero) {
      lx = store.pointeur.x;
      ly = store.pointeur.y;
      store.sortieHero = maintenant;
    } else if (survolPossible && maintenant - store.sortieHero < 1200) {
      lx = store.pointeur.x;
      ly = store.pointeur.y;
    }
    store.lumiere.x += (lx - store.lumiere.x) * amorti(d, 0.08);
    store.lumiere.y += (ly - store.lumiere.y) * amorti(d, 0.08);

    // ---------------------------------------------- inclinaison du globe
    const gx = store.pointeurDansClairiere ? (0.5 - store.pointeurClairiere.y) * 12 * DEG : 0;
    const gy = store.pointeurDansClairiere ? (store.pointeurClairiere.x - 0.5) * 12 * DEG : 0;
    store.globeTilt.x += (gx - store.globeTilt.x) * amorti(d, 0.08);
    store.globeTilt.y += (gy - store.globeTilt.y) * amorti(d, 0.08);

    // ---------------------------------------------- masque de la colonne texte
    const masqueVoulu = store.heroVisible ? 1 : 0;
    f.masqueTexte += (masqueVoulu - f.masqueTexte) * amorti(d, 0.08);

    // ---------------------------------------------- uniformes
    const u = uniforms;
    u.uRes.value.set(size.width, size.height);
    u.uDpr.value = store.dpr;
    u.uTime.value = etat.clock.elapsedTime;
    u.uDissolve.value = store.dissolve;
    u.uGather.value = store.gather;
    u.uCard.value.set(store.carte.x, store.carte.y, store.carte.w, store.carte.h);
    u.uTilt.value.set(store.tilt.x, store.tilt.y);
    // Rayon du globe : 0,42 × la largeur de la clairière, en unités hauteur.
    const aspect = size.width / Math.max(1, size.height);
    u.uGlobe.value.set(
      store.clairiere.x,
      store.clairiere.y,
      0.42 * store.clairiere.w * 2 * aspect
    );
    u.uGlobeTilt.value.set(store.globeTilt.x, store.globeTilt.y);
    u.uPointer.value.set(store.pointeur.x, store.pointeur.y);
    u.uLens.value = store.pointeurActif;
    u.uScroll.value = store.scroll;
    u.uOpacity.value = store.opacity;
    u.uCull.value = store.cull;
    u.uText.value.set(store.texte.x0, store.texte.y0, store.texte.x1, store.texte.y1);
    u.uTextMask.value = f.masqueTexte;
  });

  useEffect(() => {
    store.dpr = gl.getPixelRatio();
  }, [gl]);

  return (
    <points ref={points} geometry={geometrie} frustumCulled={false} renderOrder={1}>
      <shaderMaterial
        vertexShader={poussiereVert}
        fragmentShader={poussiereFrag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  );
};

export default Poussiere;
