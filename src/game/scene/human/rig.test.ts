import { describe, expect, it } from 'vitest';
import { Matrix4, SkinnedMesh, Vector3 } from 'three';
import { bodyPresets, defaultWardrobe } from './definition';
import { generateHuman } from './generateHuman';
import { createHumanRig, skinGeometry } from './rig';
import { applyPose, defaultPose, poses } from './poses';
import { generateWardrobe } from './wardrobe';

describe('proportion-aware human rig', () => {
  for (const [name, definition] of Object.entries(bodyPresets)) {
    it(`${name}: normalized skin weights, identity bind and finite joint studies`, () => {
      const model = generateHuman(definition.body, definition);
      const rig = createHumanRig(definition.body, model);
      skinGeometry(model.skin, rig);
      const mesh = new SkinnedMesh(model.skin);
      mesh.bind(rig.skeleton, new Matrix4());
      const p = model.skin.getAttribute('position'),
        weights = model.skin.getAttribute('skinWeight'),
        ids = model.skin.getAttribute('skinIndex');
      expect(rig.bones.length).toBe(25);
      for (let i = 0; i < p.count; i++) {
        let sum = 0;
        for (let j = 0; j < 4; j++) {
          const w = weights.getComponent(i, j);
          expect(w).toBeGreaterThanOrEqual(0);
          sum += w;
          expect(ids.getComponent(i, j)).toBeLessThan(rig.bones.length);
        }
        expect(sum).toBeCloseTo(1, 6);
        const rest = new Vector3().fromBufferAttribute(p, i);
        expect(mesh.applyBoneTransform(i, rest.clone()).distanceTo(rest)).toBeLessThan(0.000001);
      }
      for (const name of [
        'Lfingers',
        'LfingerTips',
        'Lthumb',
        'Rfingers',
        'RfingerTips',
        'Rthumb',
      ]) {
        const bone = rig.names.get(name)!;
        const influenced = Array.from({ length: p.count }, (_, i) => i).some((i) =>
          [0, 1, 2, 3].some(
            (j) => ids.getComponent(i, j) === bone && weights.getComponent(i, j) > 0.1,
          ),
        );
        expect(influenced, `${name} must actually deform the hand`).toBe(true);
      }
      for (const pose of poses) {
        applyPose(rig, { ...defaultPose, pose, phase: 0.25, fists: 1 }, 0);
        for (let i = 0; i < p.count; i++) {
          const point = mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(p, i));
          expect(point.toArray().every(Number.isFinite)).toBe(true);
          expect(point.length()).toBeLessThan(3);
        }
      }
      // Reset must not accumulate transforms across animation frames.
      applyPose(rig, { ...defaultPose, amount: 0 }, 99);
      for (const bone of rig.bones)
        expect(bone.quaternion.angleTo(bone.quaternion.clone().identity())).toBeCloseTo(0);
      rig.skeleton.dispose();
      model.dispose();
    });
  }
  it('generates every wardrobe option with copied weights and an economical visible mesh budget', () => {
    const definition = bodyPresets['Female powerhouse'];
    const model = generateHuman(definition.body, definition);
    const rig = createHumanRig(definition.body, model);
    skinGeometry(model.skin, rig);
    for (const outfit of ['trunks', 'short-tights', 'full-tights', 'singlet'] as const) {
      const wardrobe = generateWardrobe(model, definition.body, {
        ...defaultWardrobe,
        outfit,
        boots: 'tall',
        mask: 'classic',
        top: true,
        armTape: true,
        armbands: true,
      });
      expect(wardrobe.panels.map((p) => p.name)).toEqual(
        expect.arrayContaining([
          'outfit',
          'mask',
          'armbands',
          'forearm tape',
          'wrist tape',
          'boot shafts',
        ]),
      );
      const triangles =
        wardrobe.panels.reduce((sum, p) => sum + p.geometry.index!.count / 3, 0) +
        model.skin.index!.count / 3 +
        model.boots.index!.count / 3;
      expect(triangles).toBeLessThan(10000);
      for (const { geometry } of wardrobe.panels) {
        expect(geometry.index!.count).toBeGreaterThan(0);
        expect([...geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
        const weights = geometry.getAttribute('skinWeight');
        for (let i = 0; i < weights.count; i++)
          expect(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i)).toBeCloseTo(
            1,
            6,
          );
      }
      wardrobe.dispose();
    }
    rig.skeleton.dispose();
    model.dispose();
  });
  it('female morphology and face variants change contour without changing body connectivity', () => {
    const base = bodyPresets.Athletic;
    const a = generateHuman(base.body, base),
      b = generateHuman({ ...base.body, feminine: 1 }, { face: 'tapered', hairstyle: 'bob' });
    expect(a.skin.index!.array).toEqual(b.skin.index!.array);
    expect(a.skin.getAttribute('position').array).not.toEqual(
      b.skin.getAttribute('position').array,
    );
    expect(a.hair.getAttribute('position').array).not.toEqual(
      b.hair.getAttribute('position').array,
    );
    a.dispose();
    b.dispose();
  });
});
