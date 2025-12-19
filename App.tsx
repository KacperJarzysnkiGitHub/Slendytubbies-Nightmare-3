import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './components/Player';
import Monster from './components/Monster';
import Environment from './components/Environment';
import Custard from './components/Custard';
import { GameState, CustardData, GameSettings } from './types';
import { getScaryMessage, getInitialLore } from './services/geminiService';
import { Ghost, Skull, Trophy, Play, MousePointer2, Move, AlertTriangle, Settings, X, Volume2, Music as MusicIcon } from 'lucide-react';

const MAX_CUSTARDS = 10;

const generateCustards = (): CustardData[] => {
  return Array.from({ length: MAX_CUSTARDS }).map((_, i) => ({
    id: `custard-${i}`,
    position: [
      (Math.random() - 0.5) * 80,
      0,
      (Math.random() - 0.5) * 80
    ],
    collected: false
  }));
};

const JumpscareOverlay = () => {
  return (
    <div className="absolute inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center animate-[flash_0.1s_infinite]">
      <style>{`
        @keyframes flash {
          0% { background-color: #000; }
          50% { background-color: #200; }
          100% { background-color: #000; }
        }
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg) scale(1); }
          10% { transform: translate(-1px, -2px) rotate(-1deg) scale(1.1); }
          20% { transform: translate(-3px, 0px) rotate(1deg) scale(1.2); }
          30% { transform: translate(3px, 2px) rotate(0deg) scale(1.1); }
          40% { transform: translate(1px, -1px) rotate(1deg) scale(1.3); }
          50% { transform: translate(-1px, 2px) rotate(-1deg) scale(1.2); }
          60% { transform: translate(-3px, 1px) rotate(0deg) scale(1.1); }
          70% { transform: translate(3px, 1px) rotate(-1deg) scale(1.2); }
          80% { transform: translate(-1px, -1px) rotate(1deg) scale(1.3); }
          90% { transform: translate(1px, 2px) rotate(0deg) scale(1.1); }
          100% { transform: translate(1px, -2px) rotate(-1deg) scale(1); }
        }
      `}</style>
      <div className="relative w-full h-full flex items-center justify-center animate-[shake_0.15s_infinite]">
        <div className="w-[80vmin] h-[80vmin] bg-[#6a0dad] rounded-full relative shadow-[0_0_100px_rgba(255,0,0,0.5)] border-8 border-black">
          <div className="absolute top-[25%] left-[20%] w-[20%] h-[20%] bg-black rounded-full flex items-center justify-center">
             <div className="w-[30%] h-[30%] bg-red-600 rounded-full animate-pulse" />
          </div>
          <div className="absolute top-[25%] right-[20%] w-[20%] h-[20%] bg-black rounded-full flex items-center justify-center">
             <div className="w-[30%] h-[30%] bg-red-600 rounded-full animate-pulse" />
          </div>
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[40%] h-[35%] bg-black rounded-[50%] border-4 border-[#444]" />
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[30%] h-[30%] border-[15px] border-[#6a0dad] rotate-45" />
        </div>
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uWUicG9vAIdX9u/giphy.gif')] bg-cover" />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    custardsCollected: 0,
    maxCustards: MAX_CUSTARDS,
    isGameOver: false,
    isGameWon: false,
    isStarted: false,
    horrorMessage: "",
    isFrightened: false,
    isJumpscare: false
  });

  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 0.4,
    soundVolume: 0.6
  });

  const [showSettings, setShowSettings] = useState(false);
  const [custards, setCustards] = useState<CustardData[]>([]);
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1.7, 0));
  const [lore, setLore] = useState("Loading nightmare...");
  
  const audioCtx = useRef<any>(null);
  const musicGain = useRef<any>(null);
  const ambientOscs = useRef<any[]>([]);

  useEffect(() => {
    getInitialLore().then(setLore);
  }, []);

  // Update Music Volume
  useEffect(() => {
    if (musicGain.current) {
      musicGain.current.gain.setTargetAtTime(settings.musicVolume, (audioCtx.current?.currentTime || 0), 0.1);
    }
  }, [settings.musicVolume]);

  const initAmbientMusic = () => {
    const WinAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx.current && WinAudioContext) {
      audioCtx.current = new WinAudioContext();
      musicGain.current = audioCtx.current.createGain();
      musicGain.current.gain.value = settings.musicVolume;
      musicGain.current.connect(audioCtx.current.destination);

      // Procedural Horror Drone
      const createDrone = (freq: number, type: string = 'sine', vol: number = 0.1) => {
        const osc = audioCtx.current.createOscillator();
        const g = audioCtx.current.createGain();
        osc.type = type as any;
        osc.frequency.value = freq;
        g.gain.value = vol;
        osc.connect(g);
        g.connect(musicGain.current);
        osc.start();
        return osc;
      };

      ambientOscs.current = [
        createDrone(40, 'sine', 0.4),
        createDrone(42, 'sine', 0.2),
        createDrone(60, 'sawtooth', 0.05),
        createDrone(150, 'sine', 0.02)
      ];

      // LFO for the drone to make it "pulsate"
      const lfo = audioCtx.current.createOscillator();
      const lfoGain = audioCtx.current.createGain();
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      ambientOscs.current.forEach(osc => lfoGain.connect(osc.frequency));
      lfo.start();
    }
    if (audioCtx.current?.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playScream = () => {
    if (!audioCtx.current) return;

    const ctx = audioCtx.current;
    const now = ctx.currentTime;
    
    const masterScreamGain = ctx.createGain();
    masterScreamGain.connect(ctx.destination);
    masterScreamGain.gain.setValueAtTime(0.8 * settings.soundVolume, now);
    masterScreamGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    const lowOsc = ctx.createOscillator();
    const lowGain = ctx.createGain();
    lowOsc.type = 'sawtooth';
    lowOsc.frequency.setValueAtTime(80, now);
    lowOsc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
    lowGain.gain.setValueAtTime(0.6, now);
    lowGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    lowOsc.connect(lowGain);
    lowGain.connect(masterScreamGain);

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(400, now);
    carrier.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(150, now);
    modGain.gain.setValueAtTime(500, now);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    const screechGain = ctx.createGain();
    screechGain.gain.setValueAtTime(0.5, now);
    screechGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
    
    carrier.connect(screechGain);
    screechGain.connect(masterScreamGain);

    const bufferSize = ctx.sampleRate * 2.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.linearRampToValueAtTime(200, now + 2);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    for(let i = 0; i < 20; i++) {
        const timeOffset = i * 0.1;
        noiseGain.gain.setValueAtTime(0.4, now + timeOffset);
        noiseGain.gain.setValueAtTime(0.1, now + timeOffset + 0.05);
    }
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterScreamGain);

    lowOsc.start();
    carrier.start();
    modulator.start();
    noise.start();

    lowOsc.stop(now + 2.5);
    carrier.stop(now + 2.5);
    modulator.stop(now + 2.5);
    noise.stop(now + 2.5);
  };

  const startGame = () => {
    initAmbientMusic();
    setCustards(generateCustards());
    setGameState({ 
      custardsCollected: 0,
      maxCustards: MAX_CUSTARDS,
      isGameOver: false, 
      isGameWon: false, 
      isStarted: true, 
      horrorMessage: "The hunt begins...",
      isFrightened: false,
      isJumpscare: false
    });
  };

  const collectCustard = useCallback(async (id: string) => {
    setCustards(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, collected: true } : c);
      const collectedCount = updated.filter(c => c.collected).length;
      
      setGameState(state => ({
        ...state,
        custardsCollected: collectedCount,
        isGameWon: collectedCount === MAX_CUSTARDS
      }));

      getScaryMessage(collectedCount).then(msg => {
        setGameState(state => ({ ...state, horrorMessage: msg }));
        setTimeout(() => setGameState(state => ({ ...state, horrorMessage: "" })), 4000);
      });

      return updated;
    });
  }, []);

  const gameOver = () => {
    if (gameState.isJumpscare || gameState.isGameOver) return;
    setGameState(prev => ({ ...prev, isGameOver: true, isJumpscare: true }));
    playScream();
    setTimeout(() => {
      setGameState({
        custardsCollected: 0,
        maxCustards: MAX_CUSTARDS,
        isGameOver: false,
        isGameWon: false,
        isStarted: false,
        horrorMessage: "",
        isFrightened: false,
        isJumpscare: false
      });
    }, 2500);
  };

  return (
    <div className="relative w-full h-screen bg-black select-none overflow-hidden font-sans">
      {/* 3D Scene */}
      {gameState.isStarted && !gameState.isGameOver && !gameState.isGameWon && (
        <Canvas shadows camera={{ position: [0, 1.7, 10], fov: 75 }}>
          <Environment />
          <Player 
            onPositionUpdate={setPlayerPosition} 
            isGameOver={gameState.isGameOver} 
            soundVolume={settings.soundVolume}
          />
          <Monster 
            playerPosition={playerPosition} 
            onCatch={gameOver} 
            isGameOver={gameState.isGameOver} 
            aggression={gameState.custardsCollected / MAX_CUSTARDS}
            soundVolume={settings.soundVolume}
          />
          {custards.map(c => (
            <Custard 
              key={c.id} 
              position={c.position} 
              collected={c.collected} 
              onCollect={() => collectCustard(c.id)}
              playerPosition={playerPosition}
            />
          ))}
        </Canvas>
      )}

      {/* Jumpscare Overlay */}
      {gameState.isJumpscare && <JumpscareOverlay />}

      {/* HUD */}
      {gameState.isStarted && !gameState.isGameOver && !gameState.isGameWon && (
        <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="bg-black/60 backdrop-blur-md px-6 py-3 border border-white/10 rounded-lg">
              <span className="text-pink-400 font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
                <Ghost className="w-5 h-5" />
                Custards: {gameState.custardsCollected} / {MAX_CUSTARDS}
              </span>
            </div>
            {gameState.horrorMessage && (
              <div className="text-red-900 font-serif font-black italic text-2xl drop-shadow-lg animate-pulse transition-opacity duration-500">
                "{gameState.horrorMessage}"
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
             <button 
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
             >
                <Settings className="w-6 h-6" />
             </button>
             <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
               Shift to Sprint • WASD to Move
             </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!gameState.isStarted && !gameState.isJumpscare && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 px-4 text-center">
          <h1 className="text-7xl md:text-9xl font-black text-white mb-4 tracking-tighter uppercase italic select-none">
            TUBBY <span className="text-purple-600">TERRORS</span>
          </h1>
          <p className="text-zinc-500 max-w-md text-center mb-12 font-serif text-lg leading-relaxed italic">
            {lore}
          </p>
          <div className="flex flex-col md:flex-row gap-4">
             <button 
               onClick={startGame}
               className="group relative px-12 py-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-full transition-all hover:scale-110 active:scale-95 flex items-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(126,34,206,0.3)]"
             >
               <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
               <Play className="fill-current" /> ENTER THE FOREST
             </button>
             <button 
               onClick={() => {
                 initAmbientMusic();
                 setShowSettings(true);
               }}
               className="px-12 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-3 border border-white/5"
             >
               <Settings className="w-5 h-5" /> SETTINGS
             </button>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 text-white font-bold text-xs tracking-widest uppercase">
            <div className="flex flex-col items-center gap-2"><Move className="w-6 h-6" /> WASD</div>
            <div className="flex flex-col items-center gap-2"><MousePointer2 className="w-6 h-6" /> LOOK</div>
            <div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-white flex items-center justify-center text-[8px]">SHIFT</div> SPRINT</div>
            <div className="flex flex-col items-center gap-2"><AlertTriangle className="w-6 h-6" /> SURVIVE</div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
           <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Settings</h2>
                 <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                    <X className="w-6 h-6 text-white" />
                 </button>
              </div>

              <div className="space-y-12">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                       <div className="flex items-center gap-2"><MusicIcon className="w-4 h-4" /> Music Volume</div>
                       <span>{Math.round(settings.musicVolume * 100)}%</span>
                    </div>
                    {/* Fix: Cast e.target to HTMLInputElement to access 'value' property */}
                    <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={settings.musicVolume}
                       onChange={(e) => setSettings(s => ({ ...s, musicVolume: parseFloat((e.target as HTMLInputElement).value) }))}
                       className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                       <div className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Sound Volume</div>
                       <span>{Math.round(settings.soundVolume * 100)}%</span>
                    </div>
                    {/* Fix: Cast e.target to HTMLInputElement to access 'value' property */}
                    <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={settings.soundVolume}
                       onChange={(e) => setSettings(s => ({ ...s, soundVolume: parseFloat((e.target as HTMLInputElement).value) }))}
                       className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                 </div>
              </div>

              <button 
                 onClick={() => setShowSettings(false)}
                 className="w-full mt-12 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 hover:text-white transition-all active:scale-95"
              >
                 Return to Game
              </button>
           </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState.isGameWon && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-50">
          <Trophy className="w-24 h-24 text-yellow-500 mb-6" />
          <h2 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">SURVIVED</h2>
          <p className="text-zinc-400 mb-10 text-xl">You collected all the custards. The nightmare ends... for now.</p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-purple-600 text-white font-bold rounded-lg transition-all"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Crosshair */}
      {gameState.isStarted && !gameState.isGameOver && !gameState.isGameWon && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/40 rounded-full" />
      )}
    </div>
  );
};

export default App;