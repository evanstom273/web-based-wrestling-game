import { lazy, Suspense } from 'react';
import { GameViewport } from '../game/scene/GameViewport';
import { MatchControls } from '../game/ui/MatchControls';

const ModelLab = lazy(() => import('../model-lab/ModelLab').then((m) => ({ default: m.ModelLab })));

export function App() {
  return (
    <>
      <section
        data-testid="portrait-orientation-guard"
        className="portrait-orientation-guard"
        aria-labelledby="portrait-orientation-title"
      >
        <div className="max-w-sm text-center">
          <p className="mb-2 text-xs font-black tracking-[0.28em] text-amber-400 uppercase">
            Landscape required
          </p>
          <h1 id="portrait-orientation-title" className="text-2xl font-black text-zinc-50">
            Rotate your device
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Wrestling needs the width. The mobile match view is designed for landscape play.
          </p>
        </div>
      </section>

      <main data-testid="landscape-app" className="landscape-app match-shell">
        {window.location.pathname === '/model-lab' ? (
          <Suspense fallback={<p>Opening model lab…</p>}>
            <ModelLab />
          </Suspense>
        ) : (
          <>
            <GameViewport />
            <MatchControls />
            <a className="model-lab-link" href="/model-lab">
              Model lab ↗
            </a>
          </>
        )}
      </main>
    </>
  );
}
