import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Torus } from "@react-three/drei";
import * as THREE from "three";

const DNAHelix = ({ position, primaryColor, accentColor }) => {
  const groupRef = useRef();
  const segments = 20;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 4;
        const radius = 0.3;
        const y = (i / segments) * 2 - 1;
        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        return (
          <group key={i}>
            <Sphere args={[0.08, 16, 16]} position={[x1, y, z1]}>
              <meshStandardMaterial
                color={primaryColor}
                emissive={primaryColor}
                emissiveIntensity={0.4}
              />
            </Sphere>
            <Sphere args={[0.08, 16, 16]} position={[x2, y, z2]}>
              <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={0.4}
              />
            </Sphere>
            {i < segments - 1 && (
              <>
                <Bond from={[x1, y, z1]} to={[x1, y + 2 / segments, z1]} color={primaryColor} />
                <Bond from={[x2, y, z2]} to={[x2, y + 2 / segments, z2]} color={accentColor} />
                <Bond from={[x1, y, z1]} to={[x2, y, z2]} color={primaryColor} />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
};

const Bond = ({ from, to, color }) => {
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(...to),
    new THREE.Vector3(...from)
  );
  const length = direction.length();
  const midpoint = new THREE.Vector3()
    .addVectors(new THREE.Vector3(...from), new THREE.Vector3(...to))
    .multiplyScalar(0.5);

  return (
    <mesh
      position={[midpoint.x, midpoint.y, midpoint.z]}
      rotation={[
        Math.atan2(direction.y, Math.sqrt(direction.x ** 2 + direction.z ** 2)),
        Math.atan2(direction.x, direction.z),
        0,
      ]}
      scale={[1, length, 1]}
    >
      <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const Planet = ({ position, size, color, speed }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed;
      meshRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

export default function ScienceScene({ colors = { primary: '#1565C0', secondary: '#546E7A', accent: '#4FC3F7', bg: '#FFFFFF' } }) {
  const primaryColor = colors.primary || '#1565C0';
  const accentColor = colors.accent || '#4FC3F7';

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={primaryColor} />

      <DNAHelix position={[-1.5, 0, 0]} primaryColor={primaryColor} accentColor={accentColor} />
      <DNAHelix position={[1.5, 0, 0]} primaryColor={accentColor} accentColor={primaryColor} />

      <Planet position={[0, 1.5, -1]} size={0.2} color={accentColor} speed={0.01} />
      <Planet
        position={[-2, -1, 1]}
        size={0.15}
        color={primaryColor}
        speed={0.015}
      />
      <Planet
        position={[2, -1.5, 0.5]}
        size={0.12}
        color={accentColor}
        speed={0.008}
      />
    </>
  );
}



