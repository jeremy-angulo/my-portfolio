// src/experience/Car.jsx
// La voiture : un corps rigide arcade (rotations X/Z verrouillées pour ne
// jamais se retourner), des impulsions pour accélérer, une vitesse angulaire
// directe pour braquer, et un amorti latéral pour un grip jouable.

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { controls } from "./useKeyboard";

export const SPAWN = { x: 0, y: 1.1, z: -2 };
const MAX_SPEED = 16;
const ACCEL = 34;
const TURN = 2.6;

const _q = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _v = new THREE.Vector3();

const Wheel = ({ position, steerRef }) => {
  const group = useRef();
  useFrame(() => {
    if (group.current && steerRef) {
      group.current.rotation.y = steerRef.current;
    }
  });
  return (
    <group ref={group} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.34, 14]} />
        <meshStandardMaterial color="#241f36" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.36, 10]} />
        <meshStandardMaterial color="#8f87b8" />
      </mesh>
    </group>
  );
};

export const Car = ({ bodyRef }) => {
  const steer = useRef(0);

  useFrame((_, rawDelta) => {
    const body = bodyRef.current;
    if (!body) return;
    const delta = Math.min(rawDelta, 1 / 30);

    // Repères locaux de la voiture
    const rot = body.rotation();
    _q.set(rot.x, rot.y, rot.z, rot.w);
    _forward.set(0, 0, -1).applyQuaternion(_q);
    _right.set(1, 0, 0).applyQuaternion(_q);

    const vel = body.linvel();
    _v.set(vel.x, vel.y, vel.z);
    const speedAlong = _v.dot(_forward);

    // 1. Grip : on résorbe la glisse latérale AVANT d'accélérer — l'ordre
    // compte, un setLinvel après l'impulsion écraserait l'accélération.
    const lateral = _v.dot(_right);
    const keep = Math.pow(0.015, delta);
    body.setLinvel(
      {
        x: vel.x + _right.x * (lateral * keep - lateral),
        y: vel.y,
        z: vel.z + _right.z * (lateral * keep - lateral),
      },
      true
    );

    // 2. Accélération / marche arrière
    const throttle = (controls.forward ? 1 : 0) - (controls.back ? 1 : 0);
    if (throttle !== 0 && Math.abs(speedAlong) < MAX_SPEED) {
      const strength = throttle * ACCEL * body.mass() * delta;
      body.applyImpulse(
        { x: _forward.x * strength, y: 0, z: _forward.z * strength },
        true
      );
    }

    // 3. Direction : on ne braque qu'en roulant, sens inversé en marche arrière
    const steerInput = (controls.left ? 1 : 0) - (controls.right ? 1 : 0);
    const turn = steerInput * TURN * THREE.MathUtils.clamp(speedAlong / 5, -1, 1);
    body.setAngvel({ x: 0, y: turn, z: 0 }, true);
    steer.current = THREE.MathUtils.lerp(steer.current, steerInput * 0.42, 0.2);

    // Reset : touche R, bouton mobile, ou chute hors du monde
    const pos = body.translation();
    if (controls.reset || pos.y < -8) {
      controls.reset = false;
      body.setTranslation({ ...SPAWN }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={[SPAWN.x, SPAWN.y, SPAWN.z]}
      enabledRotations={[false, true, false]}
      linearDamping={0.9}
      angularDamping={5}
      canSleep={false}
      friction={0.9}
    >
      <CuboidCollider args={[0.95, 0.45, 1.7]} position={[0, 0.45, 0]} />

      {/* Châssis ambre, cabine bleu nuit : la voiture porte les deux facettes */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.55, 3.4]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0, 1.05, 0.25]} castShadow>
        <boxGeometry args={[1.55, 0.55, 1.7]} />
        <meshStandardMaterial color="#16233a" />
      </mesh>
      <mesh position={[0, 1.05, -0.62]}>
        <boxGeometry args={[1.35, 0.42, 0.06]} />
        <meshStandardMaterial color="#bcd7f5" />
      </mesh>

      {/* Phares et feux arrière */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.55, -1.72]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#fff3c4" emissive="#ffdf8a" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.55, 1.72]}>
          <boxGeometry args={[0.3, 0.14, 0.06]} />
          <meshStandardMaterial color="#d95d4e" emissive="#c23b2e" emissiveIntensity={0.9} />
        </mesh>
      ))}

      {/* Les roues : avant directrices (visuel) */}
      <Wheel position={[-0.95, 0.42, -1.1]} steerRef={steer} />
      <Wheel position={[0.95, 0.42, -1.1]} steerRef={steer} />
      <Wheel position={[-0.95, 0.42, 1.15]} />
      <Wheel position={[0.95, 0.42, 1.15]} />
    </RigidBody>
  );
};

// Caméra chasse : un décalage fixe (vue isométrique douce) et un lissage.
export const CameraRig = ({ bodyRef }) => {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z));

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const p = body.translation();
    const ideal = _v.set(p.x - 9, p.y + 12, p.z + 12);
    camera.position.lerp(ideal, 1 - Math.pow(0.0008, delta));
    target.current.lerp({ x: p.x, y: p.y, z: p.z }, 1 - Math.pow(0.0003, delta));
    camera.lookAt(target.current);
  });

  return null;
};
