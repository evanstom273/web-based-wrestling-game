import { expect, it } from 'vitest';
import { newWrestler, parseSavedWrestler } from './savedWrestler';
it('round-trips the whole named wrestler without mutating defaults', () => {
  const saved = newWrestler();
  saved.name = 'The Phoenix';
  saved.definition = {
    ...saved.definition,
    body: { ...saved.definition.body, muscle: 0.95 },
    wardrobe: { ...saved.definition.wardrobe, outfit: 'singlet', top: true },
  };
  expect(parseSavedWrestler(JSON.stringify(saved))).toEqual(saved);
  expect(newWrestler().definition.body.muscle).toBe(0.65);
});
it('rejects broken, unsupported or invalid local saves', () => {
  expect(() => parseSavedWrestler('{')).toThrow();
  expect(() => parseSavedWrestler('{"version":8}')).toThrow();
  for (const definition of [
    { ...newWrestler().definition, skin: 'javascript:bad' },
    { ...newWrestler().definition, face: 'unknown' },
    { ...newWrestler().definition, body: { height: null } },
  ])
    expect(() => parseSavedWrestler(JSON.stringify({ ...newWrestler(), definition }))).toThrow();
});
