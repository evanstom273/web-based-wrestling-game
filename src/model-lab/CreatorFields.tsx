import {
  bodyParameters,
  type BodyParameter,
  type WrestlerVisualDefinition,
} from '../game/scene/human/definition';
export function Choice<T extends string>({
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
  const labels: Record<string, string> = {
    'short-tights': 'Short tights',
    'full-tights': 'Full tights',
    open: 'Open-face',
  };
  return (
    <label className="lab-choice">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => change(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function BodySlider({
  parameter,
  definition,
  change,
}: {
  parameter: BodyParameter;
  definition: WrestlerVisualDefinition;
  change: (d: WrestlerVisualDefinition) => void;
}) {
  const p = bodyParameters[parameter];
  const value = definition.body[parameter];
  const muscle = parameter === 'muscle';
  return (
    <label className={`lab-slider ${muscle ? 'creator-muscle' : ''}`}>
      <span>
        {p.label}
        <output>{muscle ? `${Math.round(value * 100)}%` : value.toFixed(2)}</output>
      </span>
      <input
        aria-label={p.label}
        type="range"
        min={p.min}
        max={p.max}
        step={0.01}
        value={value}
        onChange={(e) =>
          change({
            ...definition,
            body: { ...definition.body, [parameter]: Number(e.target.value) },
          })
        }
      />
      {muscle && (
        <span className="slider-endpoints">
          <span>Smooth</span>
          <span>Defined</span>
          <span>Ripped</span>
        </span>
      )}
    </label>
  );
}
export function Palette({
  keys,
  definition,
  change,
}: {
  keys: ('skin' | 'gear' | 'accent' | 'hair')[];
  definition: WrestlerVisualDefinition;
  change: (d: WrestlerVisualDefinition) => void;
}) {
  const swatches = {
    skin: ['#e1b899', '#bd8666', '#925e43', '#573b30'],
    gear: ['#214e68', '#583d80', '#9c3446', '#245a54'],
    accent: ['#dfdfd5', '#d2ad57', '#292d32', '#9bd1c0'],
    hair: ['#28211e', '#644433', '#b99862', '#bfc0bd'],
  };
  return (
    <div className="creator-palette">
      {keys.map((key) => (
        <div className="creator-swatch-row" key={key}>
          <label htmlFor={`colour-${key}`}>
            {key === 'gear' ? 'Main colour' : key === 'accent' ? 'Trim colour' : `${key} colour`}
          </label>
          <div>
            {swatches[key].map((color) => (
              <button
                key={color}
                className="creator-swatch"
                aria-label={`${key} ${color}`}
                aria-pressed={definition[key] === color}
                style={{ backgroundColor: color }}
                onClick={() => change({ ...definition, [key]: color })}
              />
            ))}
          </div>
          <input
            id={`colour-${key}`}
            aria-label={`${key} colour`}
            type="color"
            value={definition[key]}
            onChange={(e) => change({ ...definition, [key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
