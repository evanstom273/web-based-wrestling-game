import { useState } from 'react';
import {
  bodyParameters,
  bodyPresets,
  type BodyParameter,
  type WrestlerVisualDefinition,
} from '../game/scene/human/definition';
import { StudioViewport } from './StudioViewport';
import { views, type View } from './views';
const groups: { title: string; keys: BodyParameter[] }[] = [
  { title: 'Frame', keys: ['height', 'shoulders', 'chest', 'depth', 'waist', 'hips', 'torso'] },
  { title: 'Arms & hands', keys: ['arms', 'upperArms', 'forearms', 'hands'] },
  { title: 'Legs & feet', keys: ['legs', 'thighs', 'calves', 'feet'] },
  { title: 'Head & build', keys: ['head', 'neck', 'neckLength', 'muscle', 'fat'] },
];
export function ModelLab() {
  const [definition, setDefinition] = useState<WrestlerVisualDefinition>(bodyPresets.Athletic);
  const [preset, setPreset] = useState('Athletic');
  const [view, setView] = useState<View>('Three-quarter');
  const [revision, setRevision] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [gear, setGear] = useState(true);
  return (
    <div className="model-lab" data-testid="model-lab">
      <header className="lab-header">
        <div>
          <span className="lab-eyebrow">PROCEDURAL HUMAN STUDY / 01</span>
          <h1>Wrestler model lab</h1>
        </div>
        <a href="/">Return to ring ↗</a>
      </header>
      <section className="lab-stage" aria-label="Wrestler studio">
        <div className="lab-canvas">
          <StudioViewport
            definition={definition}
            view={view}
            revision={revision}
            rotating={rotating}
            wireframe={wireframe}
            gear={gear}
          />
        </div>
        <div className="lab-caption">
          <strong>{preset}</strong>
          <span>{definition.body.height.toFixed(2)} m · generated geometry</span>
        </div>
        <div className="lab-views" aria-label="Camera views">
          {views.map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setRevision((n) => n + 1);
                setRotating(false);
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="lab-hint">Drag to orbit · Pinch or scroll to zoom</p>
      </section>
      <aside className="lab-panel" aria-label="Body controls">
        <div className="lab-section">
          <h2>Body preset</h2>
          <div className="lab-presets">
            {Object.entries(bodyPresets).map(([name, value]) => (
              <button
                key={name}
                aria-pressed={preset === name}
                onClick={() => {
                  setDefinition(value);
                  setPreset(name);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="lab-section lab-toggles">
          <label>
            <input type="checkbox" checked={gear} onChange={(e) => setGear(e.target.checked)} />{' '}
            Wrestling gear
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
            />{' '}
            Wireframe
          </label>
          <label>
            <input
              type="checkbox"
              checked={rotating}
              onChange={(e) => setRotating(e.target.checked)}
            />{' '}
            Slow rotation
          </label>
          <label>
            <input
              type="checkbox"
              checked={definition.hairstyle === 'crop'}
              onChange={(e) =>
                setDefinition({ ...definition, hairstyle: e.target.checked ? 'crop' : 'none' })
              }
            />{' '}
            Short crop hair
          </label>
        </div>
        {groups.map((group) => (
          <details className="lab-section" key={group.title} open>
            <summary>{group.title}</summary>
            {group.keys.map((key) => {
              const p = bodyParameters[key];
              return (
                <label className="lab-slider" key={key}>
                  <span>
                    {p.label}
                    <output>{definition.body[key].toFixed(2)}</output>
                  </span>
                  <input
                    aria-label={p.label}
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={0.01}
                    value={definition.body[key]}
                    onChange={(e) => {
                      setDefinition({
                        ...definition,
                        body: { ...definition.body, [key]: Number(e.target.value) },
                      });
                      setPreset('Custom');
                    }}
                  />
                </label>
              );
            })}
          </details>
        ))}
        <div className="lab-section">
          <h2>Palette</h2>
          {(['skin', 'gear', 'accent', 'hair'] as const).map((key) => (
            <label className="lab-color" key={key}>
              {key}
              <input
                aria-label={`${key} colour`}
                type="color"
                value={definition[key]}
                onChange={(e) => setDefinition({ ...definition, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="lab-section">
          <button
            className="lab-reset"
            onClick={() => {
              setDefinition(bodyPresets.Athletic);
              setPreset('Athletic');
            }}
          >
            Reset to athletic
          </button>
          <p className="lab-note">
            Proportions use bounded anatomical ranges. Camera framing stays fixed when changing
            builds.
          </p>
        </div>
      </aside>
    </div>
  );
}
