
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CustardProps {
  position: [number, number, number];
  onCollect: () => void;
  collected: boolean;
  playerPosition: THREE.Vector3;
  isInteracting: boolean;
}

const Custard: React.FC<CustardProps> = ({ position, onCollect, collected, playerPosition, isInteracting }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [canCollect, setCanCollect] = useState(false);

  useFrame((state) => {
    if (collected || !meshRef.current) return;
    
    // Check collection proximity
    const custardPos = new THREE.Vector3(...position);
    const dist = custardPos.distanceTo(playerPosition);
    const inRange = dist < 2.5;
    
    setCanCollect(inRange);

    if (inRange && isInteracting) {
      onCollect();
    }

    // Floating animation
    meshRef.current.rotation.y += 0.015;
    meshRef.current.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
  });

  if (collected) return null;

  return (
    <group ref={meshRef} position={position}>
      {/* Interaction Prompt */}
      {canCollect && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div className="bg-black/90 text-white px-4 py-2 rounded-lg text-[12px] whitespace-nowrap border-2 border-pink-500/80 uppercase tracking-[0.2em] font-black animate-pulse pointer-events-none shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            [E] COLLECT
          </div>
        </Html>
      )}

      {/* The Bowl - Adjusted to match image taper and color */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.35, 0.35, 32]} />
        <meshStandardMaterial 
          color="#3a4b5c" 
          metalness={0.6} 
          roughness={0.2}
          emissive="#1a2530"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* The Custard Surface - Bright pink flat fill as seen in image */}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.05, 32]} />
        <meshStandardMaterial 
          color="#ff88ff" 
          emissive="#ff66ff" 
          emissiveIntensity={canCollect ? 2.5 : 0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Internal Rim Highlight */}
      {/* Fix: Moved rotation from torusGeometry to mesh as geometries do not support the rotation prop in R3F */}
      <mesh position={[0, 0.176, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.485, 0.02, 16, 64]} />
        <meshStandardMaterial color="#5a6b7c" />
      </mesh>

      {/* Light and Glow */}
      <pointLight 
        intensity={canCollect ? 2.0 : 0.8} 
        distance={5} 
        color="#ff69b4" 
        position={[0, 0.2, 0]}
      />
    </group>
  );
};

export default Custard;
