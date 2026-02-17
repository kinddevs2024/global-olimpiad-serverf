import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import MathScene from "./MathScene";
import PhysicsScene from "./PhysicsScene";
import ChemistryScene from "./ChemistryScene";
import EnglishScene from "./EnglishScene";
import ScienceScene from "./ScienceScene";

const Scene3D = ({ subject = "math" }) => {
  const { currentTheme, customTheme } = useTheme();
  const [themeColors, setThemeColors] = useState({
    primary: '#1565C0',
    secondary: '#546E7A',
    accent: '#4FC3F7',
    bg: '#FFFFFF',
  });
  
  // Get theme colors from CSS variables (they're set by ThemeContext)
  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      setThemeColors({
        primary: getComputedStyle(root).getPropertyValue('--text-primary').trim() || '#1565C0',
        secondary: getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#546E7A',
        accent: getComputedStyle(root).getPropertyValue('--accent').trim() || '#4FC3F7',
        bg: getComputedStyle(root).getPropertyValue('--bg-primary').trim() || '#FFFFFF',
      });
    };

    // Update immediately
    updateColors();

    // Update when theme changes (listen to CSS variable changes)
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [currentTheme, customTheme]);

  const getScene = () => {
    switch (subject.toLowerCase()) {
      case "mathematics":
      case "math":
        return <MathScene colors={themeColors} />;
      case "physics":
        return <PhysicsScene colors={themeColors} />;
      case "chemistry":
        return <ChemistryScene colors={themeColors} />;
      case "english":
        return <EnglishScene colors={themeColors} />;
      case "science":
        return <ScienceScene colors={themeColors} />;
      default:
        return <MathScene colors={themeColors} />;
    }
  };

  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
      }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
      />
      {getScene()}
    </Canvas>
  );
};

export default Scene3D;



