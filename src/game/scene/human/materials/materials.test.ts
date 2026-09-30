import { describe, expect, it, vi } from 'vitest';
import { LinearMipmapLinearFilter, PlaneGeometry, RepeatWrapping } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createSurfaceTextures, generateSurfacePixels } from './textures';
import { addGarmentAttributes } from './garmentAttributes';
import { createWrestlerMaterials } from './materials';
import { bodyPresets } from '../definition';

describe('procedural wrestler material data', () => {
  it('generates repeatable, bounded data without an image or browser dependency', () => {
    const a = generateSurfacePixels('skin', 64),
      b = generateSurfacePixels('skin', 64);
    expect(a.data).toEqual(b.data);
    expect(new Set(a.data).size).toBeGreaterThan(30);
    expect(a.data.length).toBe(64 * 64 * 4);
    for (let i = 3; i < a.data.length; i += 4) expect(a.data[i]).toBe(255);
    expect(() => generateSurfacePixels('skin', 63)).toThrow(RangeError);
    expect(() => generateSurfacePixels('skin', 2048)).toThrow(RangeError);
  });
  it('hair has directional fibers and continuous tiled edges', () => {
    const { data, size } = generateSurfacePixels('hair');
    let across = 0,
      along = 0,
      seam = 0;
    const value = (x: number, y: number) => data[(y * size + x) * 4]!;
    for (let y = 0; y < size - 1; y++) {
      seam += Math.abs(value(0, y) - value(size - 1, y));
      for (let x = 0; x < size - 1; x++) {
        across += Math.abs(value(x + 1, y) - value(x, y));
        along += Math.abs(value(x, y + 1) - value(x, y));
      }
    }
    expect(across).toBeGreaterThan(along * 2);
    expect(seam / (size - 1)).toBeLessThan((across / (size - 1) ** 2) * 2);
  });
  it('bounds texture memory, filters distant detail, and releases every texture', () => {
    const bundle = createSurfaceTextures(16);
    const textures = Object.values(bundle.textures);
    expect(textures.reduce((n, t) => n + t.image.data!.byteLength, 0)).toBe(2 * 1024 * 1024);
    const disposals = textures.map((t) => vi.spyOn(t, 'dispose'));
    for (const texture of textures) {
      expect(texture.generateMipmaps).toBe(true);
      expect(texture.minFilter).toBe(LinearMipmapLinearFilter);
      expect(texture.wrapS).toBe(RepeatWrapping);
      expect(texture.anisotropy).toBe(8);
    }
    bundle.dispose();
    disposals.forEach((spy) => expect(spy).toHaveBeenCalledOnce());
  });
  it('retains tape identity and seam masks when material batches merge', () => {
    const tape = new PlaneGeometry(1, 1, 4, 4),
      fabric = tape.clone();
    addGarmentAttributes(tape, 'wrist tape');
    addGarmentAttributes(fabric, 'outfit');
    const merged = mergeGeometries([tape, fabric])!;
    const tags = merged.getAttribute('surfaceTag');
    expect(tags.count).toBe(merged.getAttribute('position').count);
    expect(tags.getX(0)).toBe(1);
    expect(tags.getX(tags.count - 1)).toBe(0);
    expect(new Set(tape.getAttribute('edgeDistance').array)).toEqual(
      new Set([0, Math.fround(0.018)]),
    );
    tape.dispose();
    fabric.dispose();
    merged.dispose();
  });
  it('updates palettes and body landmarks without replacing or recompiling materials', () => {
    const textures = createSurfaceTextures();
    const bundle = createWrestlerMaterials(textures.textures);
    const before = Object.values(bundle.materials).map((m) => [m.uuid, m.version]);
    bundle.update(bodyPresets.Athletic, { scale: 1, floor: 0 }, false);
    bundle.update(bodyPresets['Female powerhouse'], { scale: 0.94, floor: 0.01 }, false);
    expect(Object.values(bundle.materials).map((m) => [m.uuid, m.version])).toEqual(before);
    expect('#' + bundle.materials.skin.color.getHexString()).toBe(
      bodyPresets['Female powerhouse'].skin,
    );
    expect('#' + bundle.materials.primary.color.getHexString()).toBe(
      bodyPresets['Female powerhouse'].gear,
    );
    Object.values(bundle.materials).forEach((m) => m.dispose());
    textures.dispose();
  });
});
