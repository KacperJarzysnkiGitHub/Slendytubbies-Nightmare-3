
import React, { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import TubbyHouse from './TubbyHouse';

const Tree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.4, 4]} />
      <meshStandardMaterial color="#3d2b1d" />
    </mesh>
    <mesh position={[0, 4, 0]} castShadow>
      <coneGeometry args={[1.5, 3, 8]} />
      <meshStandardMaterial color="#2a3e2a" roughness={1} />
    </mesh>
  </group>
);

const HangingTree = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {/* Large twisted trunk */}
    <mesh position={[0, 4, 0]} castShadow>
      <cylinderGeometry args={[0.8, 1.2, 8, 8]} />
      <meshStandardMaterial color="#443322" roughness={1} />
    </mesh>
    {/* Twisted branches */}
    <mesh position={[2, 6, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
      <cylinderGeometry args={[0.3, 0.5, 5, 6]} />
      <meshStandardMaterial color="#443322" />
    </mesh>
    <mesh position={[-2, 7, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
      <cylinderGeometry args={[0.2, 0.4, 4, 6]} />
      <meshStandardMaterial color="#443322" />
    </mesh>
    
    {/* The Hanging Figure */}
    <group position={[3.5, 5, 0]}>
      {/* Rope */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Red Tubby figure */}
      <group position={[0, -0.5, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.35]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
      </group>
    </group>
  </group>
);

const Mountain = ({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh position={position} scale={scale} rotation={[0, Math.random() * Math.PI, 0]}>
    <coneGeometry args={[1, 1, 4]} />
    <meshStandardMaterial color="#222222" roughness={1} />
  </mesh>
);

const Environment = () => {
  const trees = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 120,
        0,
        (Math.random() - 0.5) * 120
      ] as [number, number, number],
      scale: 0.8 + Math.random() * 0.5
    })).filter(t => Math.abs(t.position[0]) > 20 || Math.abs(t.position[2]) > 20); // Clear space for house
  }, []);

  const mountains = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      position: [
        Math.cos(i) * 80,
        -5,
        Math.sin(i) * 80
      ] as [number, number, number],
      scale: [20 + Math.random() * 20, 30 + Math.random() * 20, 20 + Math.random() * 20] as [number, number, number]
    }));
  }, []);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <color attach="background" args={['#a0a090']} />
      <fog attach="fog" args={['#a0a090', 5, 45]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#555544" roughness={1} />
      </mesh>

      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={0.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />

      {/* Landmarks */}
      <TubbyHouse position={[0, 0, 0]} />
      <HangingTree position={[40, 0, -30]} />

      {/* Trees */}
      {trees.map(t => (
        <Tree key={t.id} position={t.position} scale={t.scale} />
      ))}

      {/* Distant Mountains */}
      {mountains.map(m => (
        <Mountain key={m.id} position={m.position} scale={m.scale} />
      ))}

      {/* Invisible Boundaries */}
      <group>
        <mesh position={[0, 10, -100]}>
          <boxGeometry args={[200, 20, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh position={[0, 10, 100]}>
          <boxGeometry args={[200, 20, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh position={[-100, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[200, 20, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <mesh position={[100, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[200, 20, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};

export default Environment;
