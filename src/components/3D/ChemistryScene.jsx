import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

const Molecule = ({ position, structure, color }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {structure.map((atom, i) => (
        <group key={i}>
          <Atom3D position={atom.position} color={color} size={atom.size} />
          {atom.bonds?.map((bond, j) => (
            <Bond key={j} from={atom.position} to={bond} color={color} />
          ))}
        </group>
      ))}
    </group>
  );
};

const Atom3D = ({ position, color, size = 0.2 }) => {
  return (
    <Sphere args={[size, 32, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </Sphere>
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
      <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

// Water molecule (H2O)
const waterStructure = [
  {
    position: [0, 0, 0],
    size: 0.25,
    bonds: [
      [0.5, 0.3, 0],
      [-0.5, 0.3, 0],
    ],
  },
  { position: [0.5, 0.3, 0], size: 0.15 },
  { position: [-0.5, 0.3, 0], size: 0.15 },
];

// CO2 molecule
const co2Structure = [
  {
    position: [0, 0, 0],
    size: 0.2,
    bonds: [
      [-0.6, 0, 0],
      [0.6, 0, 0],
    ],
  },
  { position: [-0.6, 0, 0], size: 0.15 },
  { position: [0.6, 0, 0], size: 0.15 },
];

export default function ChemistryScene({ colors = { primary: '#1565C0', secondary: '#546E7A', accent: '#4FC3F7', bg: '#FFFFFF' } }) {
  const primaryColor = colors.primary || '#1565C0';
  const accentColor = colors.accent || '#4FC3F7';

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={primaryColor} />

      <Molecule
        position={[-1.5, 0, 0]}
        structure={waterStructure}
        color={accentColor}
      />
      <Molecule
        position={[1.5, 0, 0]}
        structure={co2Structure}
        color={primaryColor}
      />
    </>
  );
}



