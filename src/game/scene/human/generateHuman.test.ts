import { describe, expect, it } from 'vitest';
import {
  bodyParameters,
  bodyPresets,
  defaultBody,
  validateBody,
  type BodyParameter,
} from './definition';
import { generateHuman } from './generateHuman';

describe('procedural adult body', () => {
  it('rejects non-finite parameters and bounds imported proportions', () => {
    expect(() => validateBody({ height: NaN })).toThrow(RangeError);
    expect(() => validateBody({ waist: Infinity })).toThrow(RangeError);
    expect(validateBody({ height: 9, hips: -1 })).toMatchObject({ height: 2.12, hips: 0.9 });
    expect(validateBody({})).toEqual(defaultBody);
  });
  for (const [name, definition] of Object.entries(bodyPresets)) {
    it(`${name}: generates finite, economical geometry with grounded feet`, () => {
      const model = generateHuman(definition.body);
      expect(model.triangles).toBeLessThan(8000);
      for (const key of ['skin', 'trunks', 'boots', 'hair', 'tape', 'pads', 'features'] as const) {
        const g = model[key];
        expect(g.index!.count).toBeGreaterThan(0);
        expect([...g.attributes.position!.array].every(Number.isFinite)).toBe(true);
        expect([...g.attributes.normal!.array].every(Number.isFinite)).toBe(true);
        expect(Math.max(...g.index!.array)).toBeLessThan(g.attributes.position!.count);
      }
      expect(model.skin.boundingBox!.min.y).toBeCloseTo(0, 5);
      expect(model.skin.boundingBox!.max.y).toBeCloseTo(definition.body.height, 5);
      model.dispose();
    });
  }
  it('keeps all supported individual parameter endpoints finite and above the floor', () => {
    for (const key of Object.keys(bodyParameters) as BodyParameter[])
      for (const value of [bodyParameters[key].min, bodyParameters[key].max]) {
        const model = generateHuman({ ...defaultBody, [key]: value });
        expect(
          [...model.skin.attributes.position!.array].every(Number.isFinite),
          `${key}=${value}`,
        ).toBe(true);
        expect(model.skin.boundingBox!.min.y).toBeCloseTo(0, 5);
        model.dispose();
      }
  });
  it('closes the body surface and shares boundaries instead of leaving holes', () => {
    const model = generateHuman(defaultBody);
    const geometry = model.skin;
    const indices = geometry.index!.array;
    const edgeCounts = new Map<string, number>();
    for (let i = 0; i < indices.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const a = indices[i + j]!,
          b = indices[i + ((j + 1) % 3)]!;
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
      }
    expect([...edgeCounts.values()].every((count) => count === 2)).toBe(true);
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i < normals.count; i++)
      expect(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i))).toBeCloseTo(1, 4);
    model.dispose();
  });
  it('is deterministic and does not mutate a preset when generating', () => {
    const source = JSON.stringify(bodyPresets);
    const a = generateHuman(bodyPresets.Athletic.body),
      b = generateHuman(bodyPresets.Athletic.body);
    expect(a.skin.attributes.position!.array).toEqual(b.skin.attributes.position!.array);
    expect(JSON.stringify(bodyPresets)).toEqual(source);
    a.dispose();
    b.dispose();
  });
});
