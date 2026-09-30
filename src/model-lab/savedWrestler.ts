import {
  bodyParameters,
  bodyPresets,
  validateBody,
  type BodyParameter,
  type WrestlerVisualDefinition,
} from '../game/scene/human/definition';
export const saveKey = 'web-wrestling.created-wrestler.v1';
export type CreatedWrestler = { version: 1; name: string; definition: WrestlerVisualDefinition };
export const newWrestler = (): CreatedWrestler => ({
  version: 1,
  name: 'My wrestler',
  definition: bodyPresets.Athletic,
});
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
/** Validate browser storage as untrusted, versioned data; never trust a cast after JSON.parse. */
export function parseSavedWrestler(json: string): CreatedWrestler {
  const value: unknown = JSON.parse(json);
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.name !== 'string' ||
    !record(value.definition)
  )
    throw new Error('Unsupported wrestler save');
  const d = value.definition;
  if (!record(d.body) || !record(d.wardrobe)) throw new Error('Incomplete wrestler save');
  const body = { ...bodyPresets.Athletic.body };
  for (const key of Object.keys(bodyParameters) as BodyParameter[]) {
    const n = d.body[key];
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error('Invalid body proportions');
    body[key] = n;
  }
  for (const key of ['skin', 'gear', 'accent', 'hair'])
    if (typeof d[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(d[key] as string))
      throw new Error('Invalid colour');
  const enums: [unknown, string[]][] = [
    [d.face, ['balanced', 'broad', 'tapered']],
    [d.hairstyle, ['crop', 'crest', 'swept', 'bob', 'none']],
    [d.wardrobe.outfit, ['trunks', 'short-tights', 'full-tights', 'singlet']],
    [d.wardrobe.boots, ['classic', 'tall', 'none']],
    [d.wardrobe.mask, ['none', 'classic', 'open']],
  ];
  if (enums.some(([v, options]) => typeof v !== 'string' || !options.includes(v)))
    throw new Error('Invalid appearance option');
  for (const key of ['top', 'kneePads', 'wristTape', 'armTape', 'armbands'])
    if (typeof d.wardrobe[key] !== 'boolean') throw new Error('Invalid wardrobe option');
  // All fields in the visual definition have now been checked, including each wardrobe slot.
  const definition = d as unknown as WrestlerVisualDefinition;
  return {
    version: 1,
    name: value.name.trim().slice(0, 40) || 'My wrestler',
    definition: { ...definition, body: validateBody(body), wardrobe: { ...definition.wardrobe } },
  };
}
