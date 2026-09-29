import { GameViewport } from '../game/scene/GameViewport';
import { MatchControls } from '../game/ui/MatchControls';

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
        <GameViewport />
        <MatchControls />
      </main>
    </>
  );
}
