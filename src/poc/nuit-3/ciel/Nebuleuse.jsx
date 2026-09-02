// src/poc/nuit-3/ciel/Nebuleuse.jsx
// Le fond du ciel : un quad plein écran, un fragment shader. Il remplace à la
// fois `herobg.png` (930 Ko) et le halo lunaire CSS du hero — donc une image
// lourde en moins et un `filter` animé en moins.

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { nebuleuseVert, nebuleuseFrag } from "./shaders";
import store from "./cielStore";

const Nebuleuse = () => {
  const materiau = useRef(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1440, 900) },
      uLight: { value: new THREE.Vector2(0.78, 0.3) },
      uNebula: { value: 0 },
      uScroll: { value: 0 },
      uOctaves: { value: 2 },
    }),
    []
  );

  useFrame((etat) => {
    const u = uniforms;
    u.uTime.value = etat.clock.elapsedTime;
    u.uRes.value.set(size.width, size.height);
    u.uLight.value.set(store.lumiere.x, store.lumiere.y);
    u.uNebula.value = store.nebula;
    u.uScroll.value = store.scroll;
    u.uOctaves.value = store.octaves;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materiau}
        vertexShader={nebuleuseVert}
        fragmentShader={nebuleuseFrag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

export default Nebuleuse;
