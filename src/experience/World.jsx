// src/experience/World.jsx
// Le monde : une carte coupée en deux, le jour à l'ouest et la nuit à l'est,
// avec la route qui court sur la ligne de séparation.

import React, { useMemo, useRef } from "react";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Car, CameraRig } from "./Car";
import {
  SpawnZone,
  AltenZone,
  EngineerZone,
  ClimbZone,
  SwedenZone,
  ProjectsZone,
  PlaygroundZone,
} from "./zones";
import { Tree } from "./props";

const WORLD = 60; // demi-taille de la carte

// Étoiles au-dessus de la moitié nuit (dispersion déterministe).
const NightStars = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        x: 6 + ((i * 61.803) % (WORLD - 8)),
        y: 10 + ((i * 37.508) % 18),
        z: -WORLD + ((i * 23.61) % (WORLD * 2)),
        r: 0.06 + ((i * 7) % 3) * 0.04,
      })),
    []
  );
  return stars.map((s, i) => (
    <mesh key={i} position={[s.x, s.y, s.z]}>
      <sphereGeometry args={[s.r, 6, 6]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  ));
};

// Pointillés blancs de la route centrale.
const RoadDashes = () => {
  const dashes = useMemo(
    () => Array.from({ length: 20 }, (_, i) => -WORLD + 4 + i * 6),
    []
  );
  return dashes.map((z, i) => (
    <mesh key={i} position={[0, 0.045, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.35, 2.2]} />
      <meshStandardMaterial color="#f5f0e6" />
    </mesh>
  ));
};

const World = ({ t }) => {
  const carRef = useRef(null);

  return (
    <>
      <color attach="background" args={["#f2dcb3"]} />
      <fog attach="fog" args={["#f2dcb3", 70, 160]} />

      {/* Lumières : un soleil chaud à l'ouest, une lueur violette à l'est */}
      <ambientLight intensity={0.55} color="#fff2dd" />
      <directionalLight
        position={[-30, 40, 10]}
        intensity={1.15}
        color="#ffe6b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />
      <pointLight position={[35, 18, 0]} intensity={220} color="#8b6dff" />

      {/* Soleil et lune, posés au-dessus de leur moitié */}
      <mesh position={[-45, 17, -45]}>
        <sphereGeometry args={[4, 20, 16]} />
        <meshBasicMaterial color="#ffd35c" />
      </mesh>
      <mesh position={[45, 19, -45]}>
        <sphereGeometry args={[3, 20, 16]} />
        <meshBasicMaterial color="#e6e0ff" />
      </mesh>
      <NightStars />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Le sol : collider unique, visuel en deux moitiés */}
        <RigidBody type="fixed" colliders={false} friction={1}>
          <CuboidCollider args={[WORLD, 0.5, WORLD]} position={[0, -0.5, 0]} />
          {/* Murs d'enceinte invisibles */}
          <CuboidCollider args={[WORLD, 3, 1]} position={[0, 3, -WORLD]} />
          <CuboidCollider args={[WORLD, 3, 1]} position={[0, 3, WORLD]} />
          <CuboidCollider args={[1, 3, WORLD]} position={[-WORLD, 3, 0]} />
          <CuboidCollider args={[1, 3, WORLD]} position={[WORLD, 3, 0]} />
        </RigidBody>

        <mesh position={[-WORLD / 2, -0.1, 0]} receiveShadow>
          <boxGeometry args={[WORLD, 0.2, WORLD * 2]} />
          <meshStandardMaterial color="#f0e3c0" />
        </mesh>
        <mesh position={[WORLD / 2, -0.1, 0]} receiveShadow>
          <boxGeometry args={[WORLD, 0.2, WORLD * 2]} />
          <meshStandardMaterial color="#171233" />
        </mesh>

        {/* La route du terminateur, entre jour et nuit */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7, WORLD * 2]} />
          <meshStandardMaterial color="#2b2440" />
        </mesh>
        <RoadDashes />

        {/* Les bords du monde, marqués par un liseré */}
        <mesh position={[-WORLD / 2, 0.35, -WORLD + 0.5]}>
          <boxGeometry args={[WORLD, 0.7, 1]} />
          <meshStandardMaterial color="#e2cfa4" />
        </mesh>
        <mesh position={[WORLD / 2, 0.35, -WORLD + 0.5]}>
          <boxGeometry args={[WORLD, 0.7, 1]} />
          <meshStandardMaterial color="#241d47" />
        </mesh>
        <mesh position={[-WORLD / 2, 0.35, WORLD - 0.5]}>
          <boxGeometry args={[WORLD, 0.7, 1]} />
          <meshStandardMaterial color="#e2cfa4" />
        </mesh>
        <mesh position={[WORLD / 2, 0.35, WORLD - 0.5]}>
          <boxGeometry args={[WORLD, 0.7, 1]} />
          <meshStandardMaterial color="#241d47" />
        </mesh>
        <mesh position={[-WORLD + 0.5, 0.35, 0]}>
          <boxGeometry args={[1, 0.7, WORLD * 2]} />
          <meshStandardMaterial color="#e2cfa4" />
        </mesh>
        <mesh position={[WORLD - 0.5, 0.35, 0]}>
          <boxGeometry args={[1, 0.7, WORLD * 2]} />
          <meshStandardMaterial color="#241d47" />
        </mesh>

        {/* Les étapes du parcours */}
        <SpawnZone t={t} />
        <AltenZone t={t} />
        <EngineerZone t={t} />
        <ClimbZone t={t} />
        <SwedenZone t={t} />
        <ProjectsZone t={t} />
        <PlaygroundZone t={t} />

        {/* Un peu de végétation éparse côté jour */}
        <Tree position={[-12, 0, -12]} scale={0.9} />
        <Tree position={[-45, 0, 20]} />
        <Tree position={[-20, 0, 42]} scale={0.8} />
        <Tree position={[-48, 0, -8]} scale={1.1} />

        <Car bodyRef={carRef} />
        <CameraRig bodyRef={carRef} />
      </Physics>
    </>
  );
};

export default World;
