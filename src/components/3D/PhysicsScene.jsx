import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const Atom = ({ position, color }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Nucleus */}
      <Sphere args={[0.15, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Electron orbits */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
          <ElectronOrbit
            radius={0.5 + i * 0.2}
            color={color}
            speed={0.5 + i * 0.2}
          />
        </group>
      ))}
    </group>
  );
};

const ElectronOrbit = ({ radius, color, speed }) => {
  const electronRef = useRef();
  const orbitRef = useRef();

  useFrame((state) => {
    if (electronRef.current && orbitRef.current) {
      const time = state.clock.elapsedTime * speed;
      const x = Math.cos(time) * radius;
      const z = Math.sin(time) * radius;
      electronRef.current.position.set(x, 0, z);
      orbitRef.current.rotation.y = time;
    }
  });

  return (
    <group ref={orbitRef}>
      <Sphere ref={electronRef} args={[0.05, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </Sphere>
    </group>
  );
};

const Particle = ({ position, velocity, color }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.add(velocity);

      // Reset position if it goes too far
      if (meshRef.current.position.length() > 5) {
        meshRef.current.position.set(...position);
      }
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.08, 16, 16]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </Sphere>
  );
};

export default function PhysicsScene({ colors = { primary: '#1565C0', secondary: '#546E7A', accent: '#4FC3F7', bg: '#FFFFFF' } }) {
  const primaryColor = colors.primary || '#1565C0';
  const accentColor = colors.accent || '#4FC3F7';
  const secondaryColor = colors.secondary || '#546E7A';

  const particles = Array.from({ length: 10 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
    ],
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ),
    color: i % 2 === 0 ? primaryColor : accentColor,
  }));

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={primaryColor} />

      <Atom position={[-1.5, 0, 0]} color={accentColor} />
      <Atom position={[1.5, 0, 0]} color={primaryColor} />
      <Atom position={[0, 1.5, -1]} color={accentColor} />

      {particles.map((particle, i) => (
        <Particle key={i} {...particle} />
      ))}
    </>
  );
}



