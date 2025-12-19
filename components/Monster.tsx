
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MonsterProps {
  playerPosition: THREE.Vector3;
  onCatch: () => void;
  isGameOver: boolean;
  aggression: number; // 0 to 1 based on custards collected
  soundVolume: number;
}

const Monster: React.FC<MonsterProps> = ({ playerPosition, onCatch, isGameOver, aggression, soundVolume }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(20, 0, 20));
  const lastTargetUpdate = useRef(0);

  // Audio refs
  const audioCtx = useRef<any>(null);
  const chaseGain = useRef<any>(null);
  const droneOsc = useRef<any>(null);
  const pulseOsc = useRef<any>(null);

  // Current proximity tracker for volume adjustment when settings change
  const currentProximity = useRef(0);

  // Materials
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6a0dad", roughness: 0.7 }), []);
  const faceMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e0e0e0", roughness: 0.9 }), []);
  const screenMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c0c0c0", emissive: "#555555", roughness: 0.3 }), []);
  const blackMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#000000" }), []);

  useEffect(() => {
    if (chaseGain.current && audioCtx.current) {
      const targetVol = currentProximity.current * 0.8 * soundVolume;
      chaseGain.current.gain.setTargetAtTime(targetVol, audioCtx.current.currentTime, 0.1);
    }
  }, [soundVolume]);

  useEffect(() => {
    // Initialize Chase Audio
    const initChaseAudio = () => {
      const WinAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!audioCtx.current && WinAudioContext) {
        audioCtx.current = new WinAudioContext();
        chaseGain.current = audioCtx.current.createGain();
        chaseGain.current.connect(audioCtx.current.destination);
        chaseGain.current.gain.value = 0;

        // Low drone
        droneOsc.current = audioCtx.current.createOscillator();
        droneOsc.current.type = 'sawtooth';
        droneOsc.current.frequency.setValueAtTime(45, audioCtx.current.currentTime);
        
        const droneFilter = audioCtx.current.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(150, audioCtx.current.currentTime);
        
        droneOsc.current.connect(droneFilter);
        droneFilter.connect(chaseGain.current);
        droneOsc.current.start();

        // Rhythmic Pulse (Heartbeat)
        pulseOsc.current = audioCtx.current.createOscillator();
        pulseOsc.current.type = 'sine';
        pulseOsc.current.frequency.setValueAtTime(60, audioCtx.current.currentTime);
        
        const pulseGain = audioCtx.current.createGain();
        pulseGain.gain.setValueAtTime(0, audioCtx.current.currentTime);
        
        pulseOsc.current.connect(pulseGain);
        pulseGain.connect(chaseGain.current);
        pulseOsc.current.start();

        const updateHeartbeat = () => {
          if (!audioCtx.current || !pulseGain) return;
          const now = audioCtx.current.currentTime;
          pulseGain.gain.setTargetAtTime(0.4, now, 0.05);
          pulseGain.gain.setTargetAtTime(0, now + 0.1, 0.05);
          pulseGain.gain.setTargetAtTime(0.3, now + 0.2, 0.05);
          pulseGain.gain.setTargetAtTime(0, now + 0.3, 0.1);
        };
        
        const heartbeatInterval = setInterval(() => {
          if (chaseGain.current && chaseGain.current.gain.value > 0.01) {
            updateHeartbeat();
          }
        }, 800);

        return () => clearInterval(heartbeatInterval);
      }
    };

    const handleInteraction = () => {
      initChaseAudio();
      if (audioCtx.current?.state === 'suspended') {
        audioCtx.current.resume();
      }
    };

    (window as any).addEventListener('mousedown', handleInteraction);
    (window as any).addEventListener('keydown', handleInteraction);
    
    return () => {
      (window as any).removeEventListener('mousedown', handleInteraction);
      (window as any).removeEventListener('keydown', handleInteraction);
      if (audioCtx.current) {
        audioCtx.current.close();
      }
    };
  }, []);

  useFrame((state, delta) => {
    if (isGameOver || !groupRef.current) {
      if (chaseGain.current) chaseGain.current.gain.setTargetAtTime(0, state.clock.elapsedTime, 0.1);
      return;
    }

    const monsterPos = groupRef.current.position;
    const distToPlayer = monsterPos.distanceTo(playerPosition);
    
    if (distToPlayer < 1.8) {
      onCatch();
    }

    const chaseThreshold = 18 + (aggression * 20);
    const speed = (2.8 + (aggression * 3.5)) * delta;

    let isChasing = false;
    if (distToPlayer < chaseThreshold) {
      isChasing = true;
      const dir = new THREE.Vector3().subVectors(playerPosition, monsterPos).normalize();
      monsterPos.x += dir.x * speed;
      monsterPos.z += dir.z * speed;
      
      const targetRotation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dir.x, 0, dir.z))
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 0.1);
      
      if (chaseGain.current && audioCtx.current) {
        const proximity = 1 - Math.min(distToPlayer / chaseThreshold, 1);
        currentProximity.current = proximity;
        const targetVol = proximity * 0.8 * soundVolume;
        chaseGain.current.gain.setTargetAtTime(targetVol, audioCtx.current.currentTime, 0.1);
        
        if (droneOsc.current) {
          droneOsc.current.frequency.setTargetAtTime(45 + (proximity * 20), audioCtx.current.currentTime, 0.1);
        }
      }
    } else {
      currentProximity.current = 0;
      if (Date.now() - lastTargetUpdate.current > 6000) {
        setTargetPos(new THREE.Vector3(
          (Math.random() - 0.5) * 90,
          0,
          (Math.random() - 0.5) * 90
        ));
        lastTargetUpdate.current = Date.now();
      }
      const dir = new THREE.Vector3().subVectors(targetPos, monsterPos).normalize();
      monsterPos.x += dir.x * (speed * 0.5);
      monsterPos.z += dir.z * (speed * 0.5);
      
      const targetRotation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dir.x, 0, dir.z))
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, 0.05);

      if (chaseGain.current && audioCtx.current) {
        chaseGain.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 0.5);
      }
    }

    const animSpeed = isChasing ? 10 : 5;
    const swingAmount = isChasing ? 0.6 : 0.3;
    const time = state.clock.elapsedTime * animSpeed;

    groupRef.current.position.y = Math.abs(Math.sin(time)) * 0.15;

    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time) * swingAmount;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(time) * swingAmount;

    if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(time) * swingAmount;
    if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time) * swingAmount;
  });

  return (
    <group ref={groupRef} position={[30, 0, 30]}>
      <group position={[0, 1.2, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.55, 0.7, 8, 16]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0.1, 0.45]}>
          <planeGeometry args={[0.45, 0.35]} />
          <primitive object={screenMaterial} attach="material" />
        </mesh>
        <group position={[0, 0.95, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.45]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          <group position={[0, -0.05, 0.35]}>
            <mesh rotation={[0.1, 0, 0]}>
              <planeGeometry args={[0.5, 0.5]} />
              <primitive object={faceMaterial} attach="material" />
            </mesh>
            <mesh position={[0, -0.15, 0.01]}>
              <ellipseCurve args={[0, 0, 0.1, 0.15, 0, Math.PI * 2, false]} />
              <circleGeometry args={[0.12, 16]} />
              <primitive object={blackMaterial} attach="material" />
            </mesh>
            <mesh position={[0.12, 0.08, 0.01]}>
              <circleGeometry args={[0.06, 12]} />
              <primitive object={blackMaterial} attach="material" />
            </mesh>
            <mesh position={[-0.12, 0.08, 0.01]}>
              <circleGeometry args={[0.06, 12]} />
              <primitive object={blackMaterial} attach="material" />
            </mesh>
          </group>
          <mesh position={[0.45, 0, 0]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.45, 0, 0]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
          <group position={[0, 0.5, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.2]} />
              <primitive object={bodyMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.12, 0.02, 8, 3]} />
              <primitive object={bodyMaterial} attach="material" />
            </mesh>
          </group>
        </group>
        <mesh ref={leftArmRef} position={[-0.65, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
        <mesh ref={rightArmRef} position={[0.65, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
      </group>
      <mesh ref={leftLegRef} position={[-0.25, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.25, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <pointLight position={[0, 2.5, 0.5]} intensity={1.5} distance={10} color="#ff0000" />
    </group>
  );
};

export default Monster;
