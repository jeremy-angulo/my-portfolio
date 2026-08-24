// src/experience/zones.jsx
// Les zones du monde : chaque étape du parcours de Jérémy est un coin de la
// carte, avec son titre peint au sol et ses décors en primitives.

import React from "react";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  Tree,
  PineTree,
  Snowman,
  Building,
  Sign,
  TrafficCone,
  BrickWall,
  Ball,
  Ramp,
} from "./props";

// Texte "peint" au sol, lisible depuis la caméra en vue de dessus.
export const GroundText = ({
  position = [0, 0, 0],
  text = "",
  size = 1.6,
  color = "#16233a",
  maxWidth = 18,
}) => (
  <Text
    position={[position[0], 0.04, position[2]]}
    rotation={[-Math.PI / 2, 0, 0]}
    fontSize={size}
    color={color}
    anchorX="center"
    anchorY="middle"
    maxWidth={maxWidth}
    textAlign="center"
  >
    {text}
  </Text>
);

// Une pastille de sol colorée pour marquer une zone.
const Patch = ({ position = [0, 0, 0], radius = 9, color = "#ffffff", opacity = 1 }) => (
  <mesh position={[position[0], 0.015, position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <circleGeometry args={[radius, 40]} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
  </mesh>
);

// ------------------------------------------------------------- Zone : spawn

export const SpawnZone = ({ t }) => (
  <group>
    <GroundText position={[0, 0, -14]} text="JÉRÉMY ANGULO" size={2.6} color="#f5f0e6" maxWidth={30} />
    <GroundText position={[0, 0, -10.6]} text={t.spawnTag} size={0.85} color="#cabfe8" maxWidth={26} />
    <GroundText position={[0, 0, 4.5]} text={t.spawnDrive} size={0.7} color="#9d95c9" maxWidth={20} />
  </group>
);

// ------------------------------------------------- Zone : ALTEN (côté jour)

export const AltenZone = ({ t, position = [-28, 0, -26] }) => (
  <group>
    <Patch position={position} radius={11} color="#f3e3bd" />
    <GroundText position={[position[0], 0, position[2] + 6.5]} text={t.dayTitle} size={1.8} color="#b45309" />
    <GroundText position={[position[0], 0, position[2] + 9]} text={t.daySub} size={0.8} color="#43536e" />
    <GroundText position={[position[0], 0, position[2] + 10.8]} text={t.dayLine} size={0.6} color="#6b7689" />
    <Building position={[position[0] - 4.5, 0, position[2] - 3]} size={[3.4, 6.5, 3.4]} color="#ece2cd" />
    <Building position={[position[0], 0, position[2] - 5]} size={[3, 5, 3]} color="#e2d5ba" />
    <Building position={[position[0] + 4.5, 0, position[2] - 2.5]} size={[3.2, 4, 3.2]} color="#f0e6d2" />
    <Sign
      position={[position[0], 0, position[2] + 2.5]}
      rotationY={0.5}
      label="ALTEN · Toulouse"
      color="#16233a"
    />
    <Tree position={[position[0] - 8, 0, position[2] + 3]} />
    <Tree position={[position[0] + 8, 0, position[2] + 1]} scale={0.8} />
  </group>
);

// -------------------------------------------- Zone : ingénieur (côté jour)

export const EngineerZone = ({ t, position = [-18, 0, 26] }) => (
  <group>
    <Patch position={position} radius={9} color="#efe7f5" />
    <GroundText position={[position[0], 0, position[2] - 4]} text={t.engTitle} size={1.6} color="#5b3fa8" />
    <GroundText position={[position[0], 0, position[2] - 1.8]} text={t.engSub} size={0.7} color="#43536e" />
    {/* Une pile de livres */}
    {[
      ["#d95d4e", 0.28, 0], ["#2f6b8f", 0.62, 0.25], ["#d9a441", 0.96, -0.15],
    ].map(([color, y, dz], i) => (
      <mesh key={i} position={[position[0] - 3.5, y, position[2] + 2.5 + dz]} rotation={[0, i * 0.35, 0]} castShadow>
        <boxGeometry args={[2, 0.34, 1.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    ))}
    {/* Un chapeau de diplômé : calotte + plateau + pompon */}
    <group position={[position[0] + 3.2, 0, position[2] + 2.6]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.85, 0.9, 12]} />
        <meshStandardMaterial color="#1c1a33" />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2.4, 0.14, 2.4]} />
        <meshStandardMaterial color="#1c1a33" />
      </mesh>
      <mesh position={[1, 1.35, 1]} castShadow>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#f2c14e" />
      </mesh>
    </group>
  </group>
);

// ---------------------------------------------- Zone : escalade (côté jour)

export const ClimbZone = ({ t, position = [-34, 0, 6] }) => (
  <group>
    <Patch position={position} radius={8.5} color="#f6ddc8" />
    <GroundText position={[position[0] + 1, 0, position[2] + 5]} text={t.climbTitle} size={1.5} color="#b45309" />
    <GroundText position={[position[0] + 1, 0, position[2] + 7.2]} text={t.climbSub} size={0.65} color="#6b7689" />
    {/* Le mur d'escalade : un pan incliné constellé de prises */}
    <RigidBody type="fixed" colliders="cuboid" position={[position[0], 0, position[2] - 2.5]}>
      <mesh rotation={[-0.28, 0, 0]} position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[7, 5.6, 0.5]} />
        <meshStandardMaterial color="#8d8577" />
      </mesh>
    </RigidBody>
    {Array.from({ length: 14 }, (_, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      return (
        <mesh
          key={i}
          position={[
            position[0] - 2.4 + col * 1.2 + (row % 2) * 0.5,
            1 + row * 1.5 + (col % 3) * 0.3,
            position[2] - 2.5 + 0.35 + (1 + row * 1.5) * 0.29,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color={["#d95d4e", "#2f6b8f", "#d9a441", "#5da24a"][i % 4]} />
        </mesh>
      );
    })}
  </group>
);

// ------------------------------------------------ Zone : Suède (côté nuit)

export const SwedenZone = ({ t, position = [30, 0, -26] }) => (
  <group>
    <Patch position={position} radius={11} color="#e9edf6" />
    <GroundText position={[position[0], 0, position[2] + 6.5]} text={t.swedenTitle} size={1.5} color="#2f4a6b" />
    <GroundText position={[position[0], 0, position[2] + 8.8]} text={t.swedenSub} size={0.65} color="#5d6f8a" />
    <PineTree position={[position[0] - 6, 0, position[2] - 3]} />
    <PineTree position={[position[0] - 2.5, 0, position[2] - 6]} scale={0.85} />
    <PineTree position={[position[0] + 4, 0, position[2] - 4.5]} scale={1.1} />
    <PineTree position={[position[0] + 7, 0, position[2] + 1]} scale={0.75} />
    <Snowman position={[position[0] + 1, 0, position[2] - 1]} />
    {/* Deux skis plantés dans la neige */}
    {[0, 0.5].map((dx, i) => (
      <mesh key={i} position={[position[0] - 4 + dx, 0.9, position[2] + 2]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.22, 1.9, 0.08]} />
        <meshStandardMaterial color={i ? "#d95d4e" : "#2f6b8f"} />
      </mesh>
    ))}
  </group>
);

// -------------------------------------------- Zone : projets (côté nuit)

const PROJECTS = ["Storizzz", "CNES", "MAN-3D", "Boost", "Continent Phone"];

export const ProjectsZone = ({ t, position = [32, 0, 8] }) => (
  <group>
    <Patch position={position} radius={11} color="#241d47" />
    <GroundText position={[position[0], 0, position[2] + 6.8]} text={t.nightTitle} size={1.8} color="#dfd9ff" />
    <GroundText position={[position[0], 0, position[2] + 9.2]} text={t.nightSub} size={0.8} color="#9d95c9" />
    {PROJECTS.map((name, i) => {
      const angle = -Math.PI / 2 + (i - (PROJECTS.length - 1) / 2) * 0.52;
      const x = position[0] + Math.cos(angle) * 6.5;
      const z = position[2] + Math.sin(angle) * 6.5 + 1;
      return (
        <group key={name} position={[x, 0, z]} rotation={[0, -angle - Math.PI / 2, 0]}>
          <RigidBody type="fixed" colliders="cuboid">
            <mesh position={[0, 1.1, 0]} castShadow>
              <boxGeometry args={[2.3, 2.2, 0.7]} />
              <meshStandardMaterial color="#312a5e" emissive="#915eff" emissiveIntensity={0.12} />
            </mesh>
          </RigidBody>
          <Text
            position={[0, 1.35, 0.4]}
            fontSize={0.34}
            color="#dfd9ff"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.1}
            textAlign="center"
          >
            {name}
          </Text>
        </group>
      );
    })}
  </group>
);

// -------------------------------------------- Zone : récréation (côté nuit)

export const PlaygroundZone = ({ t, position = [12, 0, 30] }) => (
  <group>
    <Patch position={position} radius={10} color="#1c163b" />
    <GroundText position={[position[0], 0, position[2] - 6]} text={t.playTitle} size={1.4} color="#f2c14e" />
    <GroundText position={[position[0], 0, position[2] - 4]} text={t.playSub} size={0.7} color="#9d95c9" />
    <Ramp position={[position[0] - 5, 0, position[2] + 2]} rotationY={Math.PI / 2} />
    <BrickWall position={[position[0] + 4, 0, position[2] + 2]} rows={4} cols={5} />
    {Array.from({ length: 6 }, (_, i) => (
      <TrafficCone key={i} position={[position[0] - 2 + (i % 3) * 1.6, 0, position[2] + 6 + Math.floor(i / 3) * 1.6]} />
    ))}
    <Ball position={[position[0], 1, position[2] - 1]} />
  </group>
);
