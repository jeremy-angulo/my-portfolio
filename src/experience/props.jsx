// src/experience/props.jsx
// Petite bibliothèque d'éléments low-poly construits uniquement avec des
// primitives Three.js : aucun modèle externe, tout est fait maison.

import React, { useMemo } from "react";
import { RigidBody, CuboidCollider, BallCollider, CylinderCollider } from "@react-three/rapier";
import { Text } from "@react-three/drei";

// ---------------------------------------------------------------- Végétation

export const Tree = ({ position = [0, 0, 0], scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
      <meshStandardMaterial color="#8a5a33" />
    </mesh>
    <mesh position={[0, 1.9, 0]} castShadow>
      <sphereGeometry args={[0.95, 12, 10]} />
      <meshStandardMaterial color="#5da24a" />
    </mesh>
    <mesh position={[0.45, 1.45, 0.25]} castShadow>
      <sphereGeometry args={[0.55, 10, 8]} />
      <meshStandardMaterial color="#6fb356" />
    </mesh>
  </group>
);

export const PineTree = ({ position = [0, 0, 0], scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.14, 0.2, 1, 6]} />
      <meshStandardMaterial color="#6e4b2a" />
    </mesh>
    {[
      [1.1, 1.05, 0],
      [1.75, 0.85, 1],
      [2.3, 0.6, 2],
    ].map(([y, r], i) => (
      <mesh key={i} position={[0, y, 0]} castShadow>
        <coneGeometry args={[r, 0.95, 8]} />
        <meshStandardMaterial color="#2f6b4f" />
      </mesh>
    ))}
    {/* Un chapeau de neige */}
    <mesh position={[0, 2.85, 0]} castShadow>
      <coneGeometry args={[0.28, 0.35, 8]} />
      <meshStandardMaterial color="#f5f7fb" />
    </mesh>
  </group>
);

export const Snowman = ({ position = [0, 0, 0] }) => (
  <group position={position}>
    {[
      [0.55, 0.55],
      [1.35, 0.4],
      [1.95, 0.28],
    ].map(([y, r], i) => (
      <mesh key={i} position={[0, y, 0]} castShadow>
        <sphereGeometry args={[r, 12, 10]} />
        <meshStandardMaterial color="#f5f7fb" />
      </mesh>
    ))}
    {/* Le nez carotte */}
    <mesh position={[0, 1.95, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.06, 0.3, 8]} />
      <meshStandardMaterial color="#e8762c" />
    </mesh>
  </group>
);

// ----------------------------------------------------------------- Bâtiments

export const Building = ({ position = [0, 0, 0], size = [3, 5, 3], color = "#e7ddc8" }) => (
  <group position={position}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={[0, size[1] / 2, 0]} />
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
    {/* Quelques fenêtres émissives, en façade sud */}
    {Array.from({ length: 6 }, (_, i) => (
      <mesh
        key={i}
        position={[((i % 2) - 0.5) * (size[0] * 0.42), size[1] * (0.3 + Math.floor(i / 2) * 0.22), size[2] / 2 + 0.02]}
      >
        <boxGeometry args={[0.5, 0.4, 0.04]} />
        <meshStandardMaterial color="#ffd98a" emissive="#ffb84d" emissiveIntensity={0.6} />
      </mesh>
    ))}
  </group>
);

// Un panneau sur pied avec du texte (utilisé pour les étiquettes du monde).
export const Sign = ({ position = [0, 0, 0], rotationY = 0, label = "", color = "#16233a", panel = "#ffffff" }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
      <meshStandardMaterial color="#7c6a4f" />
    </mesh>
    <mesh position={[0, 1.55, 0]} castShadow>
      <boxGeometry args={[2.6, 0.9, 0.12]} />
      <meshStandardMaterial color={panel} />
    </mesh>
    <Text
      position={[0, 1.55, 0.08]}
      fontSize={0.3}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={2.3}
      textAlign="center"
    >
      {label}
    </Text>
  </group>
);

// ------------------------------------------------------- Objets à bousculer

export const TrafficCone = ({ position = [0, 0, 0] }) => (
  <RigidBody colliders={false} position={position} friction={0.8}>
    <CylinderCollider args={[0.45, 0.3]} position={[0, 0.45, 0]} />
    <mesh position={[0, 0.08, 0]} castShadow>
      <cylinderGeometry args={[0.34, 0.38, 0.16, 10]} />
      <meshStandardMaterial color="#e8762c" />
    </mesh>
    <mesh position={[0, 0.55, 0]} castShadow>
      <coneGeometry args={[0.28, 0.85, 10]} />
      <meshStandardMaterial color="#e8762c" />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.225, 0.25, 0.16, 10]} />
      <meshStandardMaterial color="#f5f0e6" />
    </mesh>
  </RigidBody>
);

export const Brick = ({ position = [0, 0, 0], color = "#d95d4e" }) => (
  <RigidBody colliders="cuboid" position={position} friction={0.9}>
    <mesh castShadow>
      <boxGeometry args={[1.1, 0.55, 0.6]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </RigidBody>
);

// Un mur de briques à défoncer.
export const BrickWall = ({ position = [0, 0, 0], rows = 4, cols = 5 }) => {
  const bricks = useMemo(() => {
    const list = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols - (r % 2); c += 1) {
        list.push({
          key: `${r}-${c}`,
          pos: [
            position[0] + (c - (cols - 1 - (r % 2)) / 2) * 1.16 + (r % 2) * 0.58,
            position[1] + 0.3 + r * 0.58,
            position[2],
          ],
          color: ["#d95d4e", "#e0745f", "#c9503f"][(r + c) % 3],
        });
      }
    }
    return list;
  }, [position, rows, cols]);

  return bricks.map((b) => <Brick key={b.key} position={b.pos} color={b.color} />);
};

export const Ball = ({ position = [0, 0, 0], color = "#915eff", radius = 0.6 }) => (
  <RigidBody colliders={false} position={position} restitution={0.75} friction={0.6}>
    <BallCollider args={[radius]} />
    <mesh castShadow>
      <sphereGeometry args={[radius, 16, 14]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </RigidBody>
);

// Un tremplin fixe.
export const Ramp = ({ position = [0, 0, 0], rotationY = 0 }) => (
  <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
    <mesh rotation={[-0.32, 0, 0]} position={[0, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 0.3, 6]} />
      <meshStandardMaterial color="#b9a6d9" />
    </mesh>
  </RigidBody>
);
