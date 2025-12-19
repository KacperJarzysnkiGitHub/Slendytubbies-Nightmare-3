
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, SpotLight } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  onPositionUpdate: (pos: THREE.Vector3) => void;
  isGameOver: boolean;
  soundVolume: number;
}

const Player: React.FC<PlayerProps> = ({ onPositionUpdate, isGameOver, soundVolume }) => {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const stepCycle = useRef(0);
  const lastStepSide = useRef(0); // 0 for left, 1 for right

  // Audio Context and Nodes
  const audioCtx = useRef<any>(null);
  const masterGain = useRef<any>(null);

  useEffect(() => {
    if (masterGain.current) {
      masterGain.current.gain.setTargetAtTime(0.15 * soundVolume, (audioCtx.current?.currentTime || 0), 0.1);
    }
  }, [soundVolume]);

  useEffect(() => {
    // Initialize Audio on first interaction
    const initAudio = () => {
      if (!audioCtx.current) {
        const WinAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (WinAudioContext) {
          audioCtx.current = new WinAudioContext();
          masterGain.current = audioCtx.current.createGain();
          masterGain.current.connect(audioCtx.current.destination);
          masterGain.current.gain.value = 0.15 * soundVolume;
        }
      }
      if (audioCtx.current && audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio();
      switch ((e as any).code) {
        case 'KeyW': moveState.current.forward = true; break;
        case 'KeyS': moveState.current.backward = true; break;
        case 'KeyA': moveState.current.left = true; break;
        case 'KeyD': moveState.current.right = true; break;
        case 'ShiftLeft': moveState.current.sprint = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch ((e as any).code) {
        case 'KeyW': moveState.current.forward = false; break;
        case 'KeyS': moveState.current.backward = false; break;
        case 'KeyA': moveState.current.left = false; break;
        case 'KeyD': moveState.current.right = false; break;
        case 'ShiftLeft': moveState.current.sprint = false; break;
      }
    };

    (window as any).addEventListener('keydown', handleKeyDown);
    (window as any).addEventListener('keyup', handleKeyUp);
    return () => {
      (window as any).removeEventListener('keydown', handleKeyDown);
      (window as any).removeEventListener('keyup', handleKeyUp);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, []);

  // Procedural Footstep Synthesis
  const playFootstepSound = (isSprinting: boolean) => {
    if (!audioCtx.current || !masterGain.current) return;

    const ctx = audioCtx.current;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSprinting ? 600 : 400, now);
    filter.Q.setValueAtTime(1, now);

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(isSprinting ? 0.8 : 0.5, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + (isSprinting ? 0.08 : 0.12));

    const panner = ctx.createStereoPanner();
    const panValue = lastStepSide.current === 0 ? -0.3 : 0.3;
    panner.pan.setValueAtTime(panValue, now);
    lastStepSide.current = 1 - lastStepSide.current;

    noise.connect(filter);
    filter.connect(panner);
    panner.connect(envelope);
    envelope.connect(masterGain.current);

    noise.start(now);
    noise.stop(now + 0.2);
  };

  useFrame((state, delta) => {
    if (isGameOver) return;

    const walkSpeed = 4.5;
    const sprintSpeed = 8.5;
    const moveSpeed = moveState.current.sprint ? sprintSpeed : walkSpeed;
    const friction = 10;

    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.current.normalize();

    if (moveState.current.forward || moveState.current.backward) {
      velocity.current.z += direction.current.z * moveSpeed * delta;
    }
    if (moveState.current.left || moveState.current.right) {
      velocity.current.x -= direction.current.x * moveSpeed * delta;
    }

    velocity.current.x -= velocity.current.x * friction * delta;
    velocity.current.z -= velocity.current.z * friction * delta;

    camera.translateX(-velocity.current.x);
    camera.translateZ(-velocity.current.z);
    
    const isMoving = Math.abs(velocity.current.x) > 0.05 || Math.abs(velocity.current.z) > 0.05;
    if (isMoving) {
      const bobFrequency = moveState.current.sprint ? 12 : 8;
      const bobAmount = moveState.current.sprint ? 0.08 : 0.04;
      
      const prevCycle = stepCycle.current;
      stepCycle.current += delta * bobFrequency;
      
      const currentSin = Math.sin(stepCycle.current);
      const prevSin = Math.sin(prevCycle);
      
      if ((prevSin >= 0 && currentSin < 0) || (prevSin <= 0 && currentSin > 0)) {
        playFootstepSound(moveState.current.sprint);
      }

      const bobOffset = currentSin * bobAmount;
      camera.position.y = 1.7 + bobOffset;
    } else {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, delta * 5);
      stepCycle.current = 0;
    }

    const limit = 45;
    camera.position.x = Math.max(-limit, Math.min(limit, camera.position.x));
    camera.position.z = Math.max(-limit, Math.min(limit, camera.position.z));

    onPositionUpdate(camera.position);
  });

  return (
    <>
      <PointerLockControls />
      <group position={camera.position}>
        <SpotLight
          position={[0, 0, 0]}
          target={new THREE.Object3D().translateZ(-5)}
          distance={30}
          angle={0.5}
          attenuation={5}
          anglePower={5}
          intensity={2.5}
          color="#fffceb"
          castShadow
        />
      </group>
    </>
  );
};

export default Player;
