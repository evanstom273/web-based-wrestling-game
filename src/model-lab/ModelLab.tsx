import { useRef, useState } from 'react';
import { defaultPose } from '../game/scene/human/poses';
import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
import { StudyControls } from './StudyControls';
import { BodyControls, FaceControls, AttireControls, type Category } from './CustomizationControls';
import { StudioViewport } from './StudioViewport';
import { views, type View } from './views';
import { newWrestler, parseSavedWrestler, saveKey, type CreatedWrestler } from './savedWrestler';
const categories: Category[] = ['Body', 'Face', 'Attire', 'Preview'];
function restore() {
  try {
    const json = localStorage.getItem(saveKey);
    return { wrestler: json ? parseSavedWrestler(json) : newWrestler(), saved: json, error: '' };
  } catch {
    return {
      wrestler: newWrestler(),
      saved: null,
      error: 'Your saved wrestler could not be loaded. You can create and save a new one.',
    };
  }
}
export function ModelLab() {
  const [initial] = useState(restore);
  const [wrestler, setWrestler] = useState<CreatedWrestler>(initial.wrestler);
  const [saved, setSaved] = useState(initial.saved);
  const [error, setError] = useState(initial.error);
  const [preset, setPreset] = useState(initial.saved ? 'Custom' : 'Athletic');
  const [category, setCategory] = useState<Category>('Body');
  const [view, setView] = useState<View>('Three-quarter');
  const [revision, setRevision] = useState(0);
  const [rotating, setRotating] = useState(false),
    [wireframe, setWireframe] = useState(false),
    [gear, setGear] = useState(true);
  const [pose, setPose] = useState(defaultPose);
  const panel = useRef<HTMLDivElement>(null);
  const definition = wrestler.definition;
  const dirty = JSON.stringify(wrestler) !== saved;
  const change = (d: WrestlerVisualDefinition) => {
    setWrestler({ ...wrestler, definition: d });
    setPreset('Custom');
    setError('');
  };
  const switchCategory = (next: Category) => {
    setCategory(next);
    panel.current?.scrollTo(0, 0);
  };
  const save = () => {
    const value = { ...wrestler, name: wrestler.name.trim() || 'My wrestler' };
    try {
      const json = JSON.stringify(value);
      localStorage.setItem(saveKey, json);
      setSaved(json);
      setWrestler(value);
      setError('');
    } catch {
      setError('Unable to save on this device. Free some browser storage and try again.');
    }
  };
  return (
    <div className="model-lab creator" data-testid="model-lab">
      <header className="lab-header">
        <h1>Create a Wrestler</h1>
        <a href="/">Return to ring</a>
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
            pose={pose}
            focus={category === 'Face' ? 'head' : 'full'}
          />
        </div>
        <div className="lab-caption">
          <strong>{wrestler.name.trim() || 'My wrestler'}</strong>
          <span>
            {preset} · {definition.body.height.toFixed(2)} m
          </span>
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
        <p className="lab-hint">Drag to turn · Pinch or scroll to zoom</p>
      </section>
      <aside className="lab-panel" aria-label="Body controls">
        <nav className="creator-tabs" role="tablist" aria-label="Customization">
          {categories.map((tab, i) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              aria-selected={category === tab}
              aria-controls="creator-panel"
              tabIndex={category === tab ? 0 : -1}
              onClick={() => switchCategory(tab)}
              onKeyDown={(e) => {
                const next =
                  e.key === 'ArrowRight'
                    ? (i + 1) % 4
                    : e.key === 'ArrowLeft'
                      ? (i + 3) % 4
                      : e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? 3
                          : null;
                if (next !== null) {
                  e.preventDefault();
                  switchCategory(categories[next]!);
                  document.getElementById(`tab-${categories[next]}`)?.focus();
                }
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div
          className="creator-panel-content"
          ref={panel}
          role="tabpanel"
          id="creator-panel"
          aria-labelledby={`tab-${category}`}
          tabIndex={0}
        >
          {category === 'Body' && (
            <BodyControls
              definition={definition}
              change={change}
              preset={preset}
              setPreset={setPreset}
            />
          )}{' '}
          {category === 'Face' && <FaceControls definition={definition} change={change} />}{' '}
          {category === 'Attire' && <AttireControls definition={definition} change={change} />}{' '}
          {category === 'Preview' && (
            <StudyControls
              pose={pose}
              setPose={setPose}
              wireframe={wireframe}
              setWireframe={setWireframe}
              gear={gear}
              setGear={setGear}
              rotating={rotating}
              setRotating={setRotating}
            />
          )}
        </div>
        <footer className="creator-save">
          <label htmlFor="wrestler-name">Ring name</label>
          <div>
            <input
              id="wrestler-name"
              value={wrestler.name}
              maxLength={40}
              onChange={(e) => setWrestler({ ...wrestler, name: e.target.value })}
            />
            <button onClick={save} disabled={!dirty && !error}>
              Save wrestler
            </button>
          </div>
          <p role="status" className={error ? 'creator-error' : ''}>
            {error || (dirty ? 'Unsaved changes' : 'Saved on this device')}
          </p>
        </footer>
      </aside>
    </div>
  );
}
