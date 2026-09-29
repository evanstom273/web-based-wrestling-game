import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { useGameUiStore } from '../state/useGameUiStore';
import { ArenaEnvironment } from './ArenaEnvironment';
import { ProceduralRing } from './ProceduralRing';
import { ProceduralWrestler } from './ProceduralWrestler';

export function GameViewport() {
  const physicsDebug = useGameUiStore((state) => state.physicsDebug);

  return (
    <div
      data-testid="game-viewport"
      className="relative min-h-[420px] min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-black sm:min-h-[560px] lg:min-h-[680px]"
    >
      <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
        <div className="text-[10px] font-black tracking-[0.18em] text-amber-300 uppercase">
          Live scene
        </div>
        <div className="mt-0.5 text-xs text-zinc-300">
          Procedural ring · procedural wrestlers · Rapier world
        </div>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8.6, 7.2, 10.2], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <ArenaEnvironment />
          <Physics debug={physicsDebug} gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <ProceduralRing />
            <ProceduralWrestler
              position={[-1.35, 0.72, 0.8]}
              primary="#1d4ed8"
              secondary="#d6b35a"
              skin="#c98c68"
            />
            <ProceduralWrestler
              mirrored
              position={[1.35, 0.72, -0.8]}
              primary="#9f2638"
              secondary="#d8d8d8"
              skin="#a9674d"
            />
          </Physics>
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={7.5}
            maxDistance={18}
            minPolarAngle={0.55}
            maxPolarAngle={1.35}
            target={[0, 0.9, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
