import { describe, expect, it } from 'vitest';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { bodyPresets } from './definition';
import { generateHuman } from './generateHuman';
import { createHumanRig, skinGeometry } from './rig';
import { generateWardrobe } from './wardrobe';

describe('creator fidelity and fitted shoulders', () => {
  for (const name of ['Athletic', 'Female athletic', 'Powerhouse', 'Female powerhouse'] as const) {
    for (const outfit of ['trunks', 'singlet'] as const)
      it(`${name} ${outfit}: both straps cover the shoulder crest`, () => {
        const d = bodyPresets[name],
          model = generateHuman(d.body, d, 'creator');
        const rig = createHumanRig(d.body, model);
        skinGeometry(model.skin, rig);
        const wardrobe = generateWardrobe(model, d.body, { ...d.wardrobe, outfit, top: true });
        const top = wardrobe.panels.find(
          (p) => p.name === (outfit === 'singlet' ? 'outfit' : 'athletic top'),
        )!;
        const material = new MeshBasicMaterial({ side: DoubleSide });
        const skin = new Mesh(model.skin, material),
          fabric = new Mesh(top.geometry, material);
        skin.updateMatrixWorld();
        fabric.updateMatrixWorld();
        for (const side of [-1, 1])
          for (const x of [0.125, 0.15, 0.18]) {
            const ray = new Raycaster(
              new Vector3(side * x * d.body.shoulders * model.scale, 3, 0),
              new Vector3(0, -1, 0),
            );
            const skinHit = ray.intersectObject(skin)[0],
              fabricHit = ray.intersectObject(fabric)[0];
            expect(skinHit).toBeDefined();
            expect(fabricHit, `shoulder x=${side * x}`).toBeDefined();
            expect(fabricHit!.point.y - skinHit!.point.y).toBeGreaterThan(0);
            expect(fabricHit!.point.y - skinHit!.point.y).toBeLessThan(0.02);
          }
        expect(model.skin.index!.count / 3).toBeLessThan(24000);
        expect([...model.skin.getAttribute('position').array].every(Number.isFinite)).toBe(true);
        expect(model.skin.boundingBox!.min.y).toBeCloseTo(0, 5);
        expect(model.skin.boundingBox!.max.y).toBeCloseTo(d.body.height, 5);
        wardrobe.dispose();
        rig.skeleton.dispose();
        model.dispose();
        material.dispose();
      });
  }
  it('muscle control changes mass and relief while preserving connectivity and height', () => {
    const d = bodyPresets.Athletic;
    const smooth = generateHuman({ ...d.body, muscle: 0, fat: 0.08 }),
      ripped = generateHuman({ ...d.body, muscle: 1, fat: 0.08 });
    expect(smooth.skin.index!.array).toEqual(ripped.skin.index!.array);
    const a = smooth.skin.getAttribute('position'),
      b = ripped.skin.getAttribute('position');
    let displacement = 0;
    for (let i = 0; i < a.count; i++)
      displacement = Math.max(
        displacement,
        new Vector3().fromBufferAttribute(a, i).distanceTo(new Vector3().fromBufferAttribute(b, i)),
      );
    expect(displacement).toBeGreaterThan(0.02);
    expect(smooth.skin.boundingBox!.max.y).toBeCloseTo(ripped.skin.boundingBox!.max.y, 5);
    smooth.dispose();
    ripped.dispose();
  });
});
