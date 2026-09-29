import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { useGameUiStore } from '../state/useGameUiStore';
import { ArenaEnvironment } from './ArenaEnvironment';
import { MatchCamera } from './MatchCamera';
import { ProceduralRing } from './ProceduralRing';
import { ProceduralWrestler } from './ProceduralWrestler';

export function GameViewport() {
  const physicsDebug = useGameUiStore((state) => state.physicsDebug);

  return (
    <div
      data-testid="game-viewport"
      className="absolute inset-0 overflow-hidden border border-zinc-800 bg-black"
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-0.45, 3.55, 6.7], fov: 52, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <MatchCamera />
          <ArenaEnvironment />
          <Physics debug={physicsDebug} gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <ProceduralRing />
            <ProceduralWrestler
              position={[-0.72, 0.72, 1.8]}
              primary="#1d4ed8"
              secondary="#d6b35a"
              skin="#c98c68"
            />
            <ProceduralWrestler
              mirrored
              position={[0.42, 0.72, -1.15]}
              primary="#9f2638"
              secondary="#d8d8d8"
              skin="#a9674d"
            />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
