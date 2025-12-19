
import React, { useMemo } from 'react';
import * as THREE from 'three';

const TubbyHouse = ({ position }: { position: [number, number, number] }) => {
  const materials = useMemo(() => ({
    grass: new THREE.MeshStandardMaterial({ color: "#4a5d23", roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: "#777777", roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: "#444444", metalness: 0.6, roughness: 0.2 }),
    door: new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.8, roughness: 0.1 }),
    slide: new THREE.MeshStandardMaterial({ color: "#d11d9b", roughness: 0.3 }),
    windowGlass: new THREE.MeshStandardMaterial({ color: "#111111", metalness: 0.9, roughness: 0, opacity: 0.6, transparent: true }),
  }), []);

  return (
    <group position={position}>
      {/* 1. Exterior "Grass Wall" Dome */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <sphereGeometry args={[12, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={materials.grass} attach="material" />
      </mesh>

      {/* 2. Main Entrance Archway & Door */}
      <group position={[0, 0, 11.4]}>
        {/* Concrete Frame */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <torusGeometry args={[2.8, 0.4, 12, 24, Math.PI]} />
          <primitive object={materials.concrete} attach="material" />
        </mesh>
        
        {/* Entrance Door (Industrial Sliding Design) */}
        <group position={[0, 1.3, -0.2]}>
          {/* Left Panel */}
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[1.5, 3, 0.1]} />
            <primitive object={materials.door} attach="material" />
          </mesh>
          {/* Right Panel */}
          <mesh position={[0.8, 0, 0]}>
            <boxGeometry args={[1.5, 3, 0.1]} />
            <primitive object={materials.door} attach="material" />
          </mesh>
          {/* Handle/Trim */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.1, 2.5, 0.05]} />
            <primitive object={materials.metal} attach="material" />
          </mesh>
        </group>

        {/* Entrance Step */}
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[6, 0.3, 3]} />
          <primitive object={materials.concrete} attach="material" />
        </mesh>
      </group>

      {/* 3. Side Windows (Smaller Arches) */}
      {[Math.PI / 2.5, -Math.PI / 2.5].map((rot, i) => (
        <group key={i} rotation={[0, rot, 0]} position={[0, 0, 0]}>
          <group position={[0, 0, 11.2]}>
            {/* Window Frame */}
            <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[1.8, 0.3, 8, 16, Math.PI]} />
              <primitive object={materials.concrete} attach="material" />
            </mesh>
            {/* Window Glass */}
            <mesh position={[0, 1.2, -0.1]}>
              <circleGeometry args={[1.8, 16, 0, Math.PI]} />
              <primitive object={materials.windowGlass} attach="material" />
            </mesh>
          </group>
        </group>
      ))}

      {/* 4. Interior Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[11.5, 32]} />
        <primitive object={materials.metal} attach="material" />
      </mesh>

      {/* 5. Central Control Machine */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[2, 2.2, 6, 12]} />
          <primitive object={materials.concrete} attach="material" />
        </mesh>
        
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, 2.5, 2]}>
            <mesh castShadow>
              <boxGeometry args={[1.5, 2, 0.2]} />
              <primitive object={materials.metal} attach="material" />
            </mesh>
            {Array.from({ length: 6 }).map((_, j) => (
              <mesh key={j} position={[(j % 2 - 0.5) * 0.5, (Math.floor(j / 2) - 1) * 0.5, 0.15]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color={['#ff0000', '#ffff00', '#0000ff'][j % 3]} />
              </mesh>
            ))}
          </group>
        ))}

        {Array.from({ length: 8 }).map((_, i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
            <mesh position={[0, 6, 5]} rotation={[Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
              <primitive object={materials.metal} attach="material" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. The Slide */}
      <group position={[-6, 0, -4]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[3, 2, 4]} />
          <primitive object={materials.concrete} attach="material" />
        </mesh>
        <mesh position={[0, 0.5, 4]} rotation={[Math.PI / 8, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 0.3, 8]} />
          <primitive object={materials.slide} attach="material" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[3, 1, 1]} />
          <primitive object={materials.concrete} attach="material" />
        </mesh>
      </group>

      {/* Lighting */}
      <pointLight position={[0, 5, 0]} intensity={2} distance={15} color="#ffffff" />
      <pointLight position={[0, 2, 3]} intensity={1} distance={5} color="#ff0000" />
      <pointLight position={[0, 2, -11]} intensity={0.5} distance={10} color="#3333ff" />
    </group>
  );
};

export default TubbyHouse;
