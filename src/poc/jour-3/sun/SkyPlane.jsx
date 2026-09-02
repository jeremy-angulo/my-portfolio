// src/poc/jour-3/sun/SkyPlane.jsx
// Le quad plein écran qui porte le ciel. Il ne fait que deux choses :
// recopier l'état du pilote dans les uniformes, et demander une frame quand le
// pilote signale qu'il a bougé (frameloop « demand »).

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useSoleil } from "./SunProvider";
import { vertexShader, fragmentShader } from "./skyShader";

const SkyPlane = ({ octaves = 2, onPremierFrame }) => {
  const { etat, abonnerFrame } = useSoleil();
  const taille = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const materiau = useRef(null);
  const debut = useRef(0);
  const premierFait = useRef(false);

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector2(0.8, 1.05) },
      uDay: { value: 0 },
      uFloor: { value: 1 },
      uHalo: { value: 0 },
      uSize: { value: 0.048 },
      uOctaves: { value: 2 },
    }),
    []
  );

  // Le pilote prévient : « une frame utile vient d'être calculée ».
  useEffect(() => abonnerFrame(() => invalidate()), [abonnerFrame, invalidate]);

  useEffect(() => {
    uniforms.uOctaves.value = octaves;
    invalidate();
  }, [octaves, uniforms, invalidate]);

  // La taille vient du ResizeObserver de r3f (contentRect du conteneur fixe) :
  // seul son RAPPORT sert, pour que le disque reste rond.
  useEffect(() => {
    uniforms.uRes.value.set(taille.width || 1, taille.height || 1);
    invalidate();
  }, [taille.width, taille.height, uniforms, invalidate]);

  useFrame(() => {
    const e = etat.current;
    if (!debut.current) debut.current = performance.now();
    uniforms.uTime.value = (performance.now() - debut.current) / 1000;
    uniforms.uSun.value.set(e.sx, e.sy);
    uniforms.uDay.value = e.day;
    uniforms.uFloor.value = e.floor;
    uniforms.uHalo.value = e.halo;
    uniforms.uSize.value = e.size;
    if (!premierFait.current) {
      premierFait.current = true;
      if (onPremierFrame) onPremierFrame();
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materiau}
        args={[{ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false }]}
      />
    </mesh>
  );
};

export default SkyPlane;
