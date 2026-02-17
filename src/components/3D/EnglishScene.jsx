import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const FloatingLetter = ({ letter, position, color, outlineColor }) => {
  const textRef = useRef();

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.3;
      textRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.2;
      textRef.current.rotation.x =
        Math.cos(state.clock.elapsedTime * 0.5 + position[1]) * 0.1;
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.5}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor={outlineColor}
    >
      {letter}
    </Text>
  );
};

const FloatingWord = ({ word, position, color, outlineColor }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {word.split("").map((letter, i) => (
        <Text
          key={i}
          position={[(i - word.length / 2) * 0.3, 0, 0]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor={outlineColor}
        >
          {letter}
        </Text>
      ))}
    </group>
  );
};

export default function EnglishScene({ colors = { primary: '#1565C0', secondary: '#546E7A', accent: '#4FC3F7', bg: '#FFFFFF' } }) {
  const letters = ["A", "B", "C", "D", "E"];
  const words = ["READ", "WRITE", "LEARN"];
  const primaryColor = colors.primary || '#1565C0';
  const accentColor = colors.accent || '#4FC3F7';
  const outlineColor = colors.bg === '#FFFFFF' || colors.bg === '#ffffff' ? '#000000' : '#FFFFFF';

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={primaryColor} />

      {letters.map((letter, i) => (
        <FloatingLetter
          key={i}
          letter={letter}
          position={[
            (i - letters.length / 2) * 0.8,
            Math.sin(i) * 0.5,
            Math.cos(i) * 0.5,
          ]}
          color={i % 2 === 0 ? primaryColor : accentColor}
          outlineColor={outlineColor}
        />
      ))}

      {words.map((word, i) => (
        <FloatingWord
          key={i}
          word={word}
          position={[(i - words.length / 2) * 1.5, -1 + i * 0.5, -1]}
          color={i % 2 === 0 ? primaryColor : accentColor}
          outlineColor={outlineColor}
        />
      ))}
    </>
  );
}



