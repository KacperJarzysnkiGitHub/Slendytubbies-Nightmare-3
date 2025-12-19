
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CustardProps {
  position: [number, number, number];
  onCollect: () => void;
  collected: boolean;
  playerPosition: THREE.Vector3;
}

const Custard: React.FC<CustardProps> = ({ position, onCollect, collected, playerPosition }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (collected || !meshRef.current) return;
    
    // Check collection
    const custardPos = new THREE.Vector3(...position);
    if (custardPos.distanceTo(playerPosition) < 1.5) {
      onCollect();
    }

    // Animation
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  if (collected) return null;

  return (
    <group ref={meshRef} position={position}>
      {/* Bowl */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#888" metalness={0.5} />
      </mesh>
      {/* Pink Custard */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff69b4" emissive="#ff69b4" emissiveIntensity={0.5} />
      </mesh>
      {/* Glow Effect */}
      <pointLight intensity={0.5} distance={3} color="#ff69b4" />
    </group>
  );
};

export default Custard;
