import {
  bodyPresets,
  type BodyParameter,
  type WrestlerVisualDefinition,
} from '../game/scene/human/definition';
import { BodySlider, Choice, Palette } from './CreatorFields';
export type Category = 'Body' | 'Face' | 'Attire' | 'Preview';
type Props = {
  definition: WrestlerVisualDefinition;
  change: (d: WrestlerVisualDefinition) => void;
};
export function BodyControls({
  definition,
  change,
  preset,
  setPreset,
}: { preset: string; setPreset: (name: string) => void } & Props) {
  const groups: { title: string; keys: BodyParameter[] }[] = [
    { title: 'Frame', keys: ['shoulders', 'chest', 'depth', 'waist', 'hips', 'torso'] },
    { title: 'Arms & hands', keys: ['arms', 'upperArms', 'forearms', 'hands'] },
    { title: 'Legs & feet', keys: ['legs', 'thighs', 'calves', 'feet'] },
    { title: 'Body shape', keys: ['feminine', 'bust'] },
  ];
  return (
    <>
      <section className="lab-section">
        <h2>Choose your build</h2>
        <p className="creator-intro">Start with a build. Make it your own.</p>
        <div className="lab-presets">
          {Object.entries(bodyPresets).map(([name, d]) => (
            <button
              key={name}
              aria-pressed={preset === name}
              onClick={() => {
                change({
                  ...d,
                  wardrobe: {
                    ...definition.wardrobe,
                    ...(d.body.feminine > 0.5 ? { top: true } : {}),
                  },
                });
                setPreset(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </section>
      <section className="lab-section">
        <h2>Build & definition</h2>
        <BodySlider parameter="muscle" definition={definition} change={change} />
        <p className="lab-note">
          Adds muscle mass and definition. Body softness controls how much definition shows.
        </p>
        <BodySlider parameter="fat" definition={definition} change={change} />
        <BodySlider parameter="height" definition={definition} change={change} />
        <Palette keys={['skin']} definition={definition} change={change} />
      </section>
      <details className="lab-section">
        <summary>Fine-tune proportions</summary>
        {groups.map((group) => (
          <section className="creator-proportions" key={group.title}>
            <h3>{group.title}</h3>
            {group.keys.map((key) => (
              <BodySlider key={key} parameter={key} definition={definition} change={change} />
            ))}
          </section>
        ))}
      </details>
      <button
        className="lab-reset"
        onClick={() => {
          change(bodyPresets.Athletic);
          setPreset('Athletic');
        }}
      >
        Reset to athletic
      </button>
    </>
  );
}
export function FaceControls({ definition, change }: Props) {
  return (
    <>
      <section className="lab-section">
        <h2>Face & hair</h2>
        <p className="creator-intro">A closer look at your wrestler.</p>
        <Choice
          label="Face shape"
          value={definition.face}
          options={['balanced', 'broad', 'tapered']}
          change={(face) => change({ ...definition, face })}
        />
        <Choice
          label="Hairstyle"
          value={definition.hairstyle}
          options={['crop', 'crest', 'swept', 'bob', 'none']}
          change={(hairstyle) => change({ ...definition, hairstyle })}
        />
        {definition.wardrobe.mask !== 'none' && (
          <p className="lab-note">
            Your mask covers the hair. Remove it in Attire to see this hairstyle.
          </p>
        )}
        <Palette keys={['hair']} definition={definition} change={change} />
      </section>
      <section className="lab-section">
        <h2>Head & neck</h2>
        {(['head', 'neck', 'neckLength'] as const).map((key) => (
          <BodySlider key={key} parameter={key} definition={definition} change={change} />
        ))}
      </section>
    </>
  );
}
export function AttireControls({ definition, change }: Props) {
  const w = definition.wardrobe;
  return (
    <>
      <section className="lab-section">
        <h2>Ring attire</h2>
        <p className="creator-intro">Choose your cut, colours and finishing touches.</p>
        <Choice
          label="Outfit"
          value={w.outfit}
          options={['trunks', 'short-tights', 'full-tights', 'singlet']}
          change={(outfit) => change({ ...definition, wardrobe: { ...w, outfit } })}
        />
        <div className="lab-toggles">
          <label>
            <input
              type="checkbox"
              checked={w.top}
              disabled={w.outfit === 'singlet'}
              onChange={(e) => change({ ...definition, wardrobe: { ...w, top: e.target.checked } })}
            />
            Athletic top
          </label>
        </div>
        {w.outfit === 'singlet' && <p className="lab-note">The singlet includes its own top.</p>}
        <Choice
          label="Boots"
          value={w.boots}
          options={['classic', 'tall', 'none']}
          change={(boots) => change({ ...definition, wardrobe: { ...w, boots } })}
        />
        <Choice
          label="Mask"
          value={w.mask}
          options={['none', 'classic', 'open']}
          change={(mask) => change({ ...definition, wardrobe: { ...w, mask } })}
        />
      </section>
      <section className="lab-section">
        <h2>Accessories</h2>
        <div className="lab-toggles">
          {(
            [
              ['kneePads', 'Knee pads'],
              ['wristTape', 'Wrist tape'],
              ['armTape', 'Arm tape'],
              ['armbands', 'Armbands'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={w[key]}
                onChange={(e) =>
                  change({ ...definition, wardrobe: { ...w, [key]: e.target.checked } })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>
      <section className="lab-section">
        <h2>Attire colours</h2>
        <Palette keys={['gear', 'accent']} definition={definition} change={change} />
      </section>
    </>
  );
}
