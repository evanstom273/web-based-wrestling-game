import { poses, type PoseSettings } from '../game/scene/human/poses';
import { Choice } from './CreatorFields';
export function StudyControls({
  pose,
  setPose,
  wireframe,
  setWireframe,
  gear,
  setGear,
  rotating,
  setRotating,
}: {
  pose: PoseSettings;
  setPose: (p: PoseSettings) => void;
  wireframe: boolean;
  setWireframe: (v: boolean) => void;
  gear: boolean;
  setGear: (v: boolean) => void;
  rotating: boolean;
  setRotating: (v: boolean) => void;
}) {
  return (
    <>
      <section className="lab-section">
        <h2>Check your look</h2>
        <p className="creator-intro">See your wrestler standing, moving and posing.</p>
        <Choice
          label="Pose"
          value={pose.pose}
          options={poses}
          change={(value) => setPose({ ...pose, pose: value })}
        />
        <div className="lab-toggles">
          <label>
            <input
              type="checkbox"
              checked={pose.playing}
              onChange={(e) => setPose({ ...pose, playing: e.target.checked })}
            />
            Animate preview
          </label>
          <label>
            <input
              type="checkbox"
              checked={rotating}
              onChange={(e) => setRotating(e.target.checked)}
            />
            Slow rotation
          </label>
          <label>
            <input type="checkbox" checked={gear} onChange={(e) => setGear(e.target.checked)} />
            Wrestling gear
          </label>
        </div>
      </section>
      <details className="lab-section">
        <summary>Advanced inspection</summary>
        <div className="lab-toggles">
          <label>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
            />
            Wireframe
          </label>
          <label>
            <input
              type="checkbox"
              checked={pose.skeleton}
              onChange={(e) => setPose({ ...pose, skeleton: e.target.checked })}
            />
            Show skeleton
          </label>
        </div>
        {(['amount', 'phase', 'fists'] as const).map((key) => (
          <label className="lab-slider" key={key}>
            <span>
              {key === 'amount' ? 'Pose strength' : key === 'phase' ? 'Cycle scrub' : 'Hand curl'}
              <output>{pose[key].toFixed(2)}</output>
            </span>
            <input
              aria-label={
                key === 'amount' ? 'Pose strength' : key === 'phase' ? 'Cycle scrub' : 'Hand curl'
              }
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={pose[key]}
              onChange={(e) =>
                setPose({
                  ...pose,
                  [key]: Number(e.target.value),
                  ...(key === 'phase' ? { playing: false } : {}),
                })
              }
            />
          </label>
        ))}
        <p className="lab-note">Scrub to compare the same frame across builds.</p>
      </details>
    </>
  );
}
