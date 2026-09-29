import type { WrestlerVisualDefinition } from '../game/scene/human/definition';
import { poses, type PoseSettings } from '../game/scene/human/poses';
function Choice<T extends string>({
  label,
  value,
  options,
  change,
}: {
  label: string;
  value: T;
  options: readonly T[];
  change: (value: T) => void;
}) {
  return (
    <label className="lab-choice">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => change(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
export function StudyControls({
  definition,
  change,
  pose,
  setPose,
}: {
  definition: WrestlerVisualDefinition;
  change: (value: WrestlerVisualDefinition) => void;
  pose: PoseSettings;
  setPose: (pose: PoseSettings) => void;
}) {
  const wardrobe = definition.wardrobe;
  return (
    <>
      <details className="lab-section" open>
        <summary>Pose & rig study</summary>
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
            />{' '}
            Animate study
          </label>
          <label>
            <input
              type="checkbox"
              checked={pose.skeleton}
              onChange={(e) => setPose({ ...pose, skeleton: e.target.checked })}
            />{' '}
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
        <p className="lab-note">
          Drag Cycle scrub to compare the same animation frame across builds. These are deformation
          studies, not match actions.
        </p>
      </details>
      <details className="lab-section" open>
        <summary>Ring wardrobe</summary>
        <Choice
          label="Outfit"
          value={wardrobe.outfit}
          options={['trunks', 'short-tights', 'full-tights', 'singlet']}
          change={(outfit) => change({ ...definition, wardrobe: { ...wardrobe, outfit } })}
        />
        <Choice
          label="Boots"
          value={wardrobe.boots}
          options={['classic', 'tall', 'none']}
          change={(boots) => change({ ...definition, wardrobe: { ...wardrobe, boots } })}
        />
        <Choice
          label="Mask"
          value={wardrobe.mask}
          options={['none', 'classic', 'open']}
          change={(mask) => change({ ...definition, wardrobe: { ...wardrobe, mask } })}
        />
        <div className="lab-toggles">
          {(
            [
              ['top', 'Athletic top'],
              ['kneePads', 'Knee pads'],
              ['wristTape', 'Wrist tape'],
              ['armTape', 'Arm tape'],
              ['armbands', 'Armbands'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={wardrobe[key]}
                onChange={(e) =>
                  change({ ...definition, wardrobe: { ...wardrobe, [key]: e.target.checked } })
                }
              />{' '}
              {label}
            </label>
          ))}
        </div>
      </details>
      <details className="lab-section" open>
        <summary>Face & hair</summary>
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
        <p className="lab-note">
          Masks replace hair. Face shape and body proportions remain independent.
        </p>
      </details>
    </>
  );
}
