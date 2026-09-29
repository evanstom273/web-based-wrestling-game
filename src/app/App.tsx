import { GameViewport } from '../game/scene/GameViewport';
import { useGameUiStore } from '../game/state/useGameUiStore';

const stack = [
  'React 19',
  'TypeScript 6',
  'Three.js / WebGL',
  'React Three Fiber',
  'Drei',
  'Rapier Physics',
  'Zustand',
  'Tailwind CSS',
  'Vitest',
  'Playwright',
] as const;

export function App() {
  const physicsDebug = useGameUiStore((state) => state.physicsDebug);
  const togglePhysicsDebug = useGameUiStore((state) => state.togglePhysicsDebug);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-black tracking-[0.28em] text-amber-400 uppercase">
            Foundation build
          </p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
            Web Wrestling
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
            A proper code-driven 3D wrestling foundation: application UI in React, simulation in
            plain TypeScript, rendering in R3F/Three, and spatial physics in Rapier.
          </p>
        </div>

        <button
          type="button"
          aria-pressed={physicsDebug}
          onClick={togglePhysicsDebug}
          className="min-h-11 shrink-0 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 transition hover:border-amber-500/60 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Physics debug: {physicsDebug ? 'ON' : 'OFF'}
        </button>
      </header>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <GameViewport />

        <aside className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
          <h2 className="text-sm font-black tracking-[0.16em] text-zinc-200 uppercase">
            Stack online
          </h2>
          <div className="mt-4 flex flex-wrap gap-2 xl:flex-col">
            {stack.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-zinc-800 pt-4 text-xs leading-5 text-zinc-500">
            The ring and wrestlers are geometry generated in code. Orbit the camera with
            mouse/touch. Rapier owns collision space from the first commit; match rules will remain
            separate from rendering and physics.
          </div>
        </aside>
      </section>
    </main>
  );
}
