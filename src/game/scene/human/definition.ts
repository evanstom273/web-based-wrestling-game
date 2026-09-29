/** Dimensions are ratios around the authored 1.86 m adult, not independent world scales. */
export const bodyParameters = {
  height: { label: 'Height (m)', min: 1.62, max: 2.12, default: 1.86 },
  shoulders: { label: 'Shoulder breadth', min: 0.88, max: 1.18, default: 1 },
  chest: { label: 'Chest width', min: 0.88, max: 1.18, default: 1 },
  depth: { label: 'Chest depth', min: 0.88, max: 1.2, default: 1 },
  waist: { label: 'Waist', min: 0.85, max: 1.22, default: 1 },
  hips: { label: 'Pelvis breadth', min: 0.9, max: 1.18, default: 1 },
  torso: { label: 'Torso length', min: 0.92, max: 1.08, default: 1 },
  arms: { label: 'Arm length', min: 0.92, max: 1.08, default: 1 },
  upperArms: { label: 'Upper-arm mass', min: 0.78, max: 1.3, default: 1 },
  forearms: { label: 'Forearm mass', min: 0.82, max: 1.22, default: 1 },
  hands: { label: 'Hand size', min: 0.9, max: 1.15, default: 1 },
  legs: { label: 'Leg length', min: 0.93, max: 1.07, default: 1 },
  thighs: { label: 'Thigh mass', min: 0.82, max: 1.28, default: 1 },
  calves: { label: 'Calf mass', min: 0.82, max: 1.25, default: 1 },
  feet: { label: 'Foot size', min: 0.9, max: 1.15, default: 1 },
  head: { label: 'Head size', min: 0.94, max: 1.08, default: 1 },
  neck: { label: 'Neck thickness', min: 0.85, max: 1.2, default: 1 },
  neckLength: { label: 'Neck length', min: 0.85, max: 1.15, default: 1 },
  muscle: { label: 'Muscle definition', min: 0, max: 1, default: 0.65 },
  feminine: { label: 'Female morphology', min: 0, max: 1, default: 0 },
  bust: { label: 'Chest contour', min: 0, max: 1, default: 0.45 },
  fat: { label: 'Body softness', min: 0, max: 1, default: 0.15 },
} as const;
export type BodyParameter = keyof typeof bodyParameters;
export type Body = Record<BodyParameter, number>;
export type WrestlerVisualDefinition = {
  body: Body;
  skin: string;
  gear: string;
  accent: string;
  hair: string;
  hairstyle: 'crop' | 'none' | 'crest' | 'swept' | 'bob';
  face: 'balanced' | 'broad' | 'tapered';
  wardrobe: Wardrobe;
};
export type Wardrobe = {
  outfit: 'trunks' | 'short-tights' | 'full-tights' | 'singlet';
  boots: 'classic' | 'tall' | 'none';
  top: boolean;
  kneePads: boolean;
  wristTape: boolean;
  armTape: boolean;
  armbands: boolean;
  mask: 'none' | 'classic' | 'open';
};
export const defaultWardrobe: Wardrobe = {
  outfit: 'trunks',
  boots: 'classic',
  top: false,
  kneePads: true,
  wristTape: true,
  armTape: false,
  armbands: false,
  mask: 'none',
};
export const defaultBody = Object.fromEntries(
  Object.entries(bodyParameters).map(([key, value]) => [key, value.default]),
) as Body;
export function validateBody(input: Partial<Body>): Body {
  const result = { ...defaultBody };
  for (const key of Object.keys(bodyParameters) as BodyParameter[]) {
    const value = input[key] ?? defaultBody[key];
    const range = bodyParameters[key];
    if (!Number.isFinite(value)) throw new RangeError(`${key} must be finite`);
    result[key] = Math.max(range.min, Math.min(range.max, value));
  }
  return result;
}
const preset = (body: Partial<Body>, skin: string, gear: string): WrestlerVisualDefinition => ({
  body: validateBody(body),
  skin,
  gear,
  accent: '#dfdfd5',
  hair: '#28211e',
  hairstyle: 'crop',
  face: 'balanced',
  wardrobe: { ...defaultWardrobe },
});
export const bodyPresets = {
  'Female athletic': {
    ...preset(
      {
        height: 1.72,
        feminine: 1,
        shoulders: 0.91,
        chest: 0.93,
        waist: 0.92,
        hips: 1.05,
        upperArms: 0.84,
        forearms: 0.88,
        thighs: 1.03,
        neck: 0.88,
        muscle: 0.55,
        fat: 0.25,
      },
      '#bd8666',
      '#583d80',
    ),
    face: 'tapered',
    hairstyle: 'swept',
    wardrobe: { ...defaultWardrobe, outfit: 'full-tights', top: true },
  },
  'Female powerhouse': {
    ...preset(
      {
        height: 1.82,
        feminine: 1,
        shoulders: 1.03,
        chest: 1.04,
        depth: 1.06,
        waist: 1.06,
        hips: 1.13,
        upperArms: 1.13,
        forearms: 1.07,
        thighs: 1.18,
        calves: 1.13,
        neck: 1.03,
        muscle: 0.8,
        fat: 0.45,
      },
      '#80553e',
      '#245a54',
    ),
    face: 'broad',
    hairstyle: 'bob',
    wardrobe: { ...defaultWardrobe, outfit: 'singlet' },
  },
  Athletic: preset({}, '#b47c59', '#214e68'),
  Powerhouse: preset(
    {
      height: 1.96,
      shoulders: 1.14,
      chest: 1.12,
      depth: 1.16,
      waist: 1.03,
      hips: 1.06,
      upperArms: 1.26,
      forearms: 1.17,
      thighs: 1.18,
      calves: 1.12,
      neck: 1.17,
      muscle: 0.95,
      fat: 0.22,
    },
    '#925e43',
    '#6b283b',
  ),
  'Lean / high-flyer': preset(
    {
      height: 1.75,
      shoulders: 0.93,
      chest: 0.91,
      depth: 0.9,
      waist: 0.9,
      hips: 0.94,
      upperArms: 0.82,
      forearms: 0.88,
      thighs: 0.87,
      calves: 0.9,
      neck: 0.9,
      legs: 1.04,
      muscle: 0.4,
      fat: 0.08,
    },
    '#c79673',
    '#365c42',
  ),
  Heavyweight: preset(
    {
      height: 1.91,
      shoulders: 1.1,
      chest: 1.13,
      depth: 1.18,
      waist: 1.2,
      hips: 1.14,
      torso: 1.04,
      upperArms: 1.2,
      forearms: 1.1,
      thighs: 1.23,
      calves: 1.16,
      neck: 1.2,
      muscle: 0.25,
      fat: 0.9,
    },
    '#a96f50',
    '#543660',
  ),
} satisfies Record<string, WrestlerVisualDefinition>;
