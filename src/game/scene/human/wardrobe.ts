import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Body, Wardrobe } from './definition';
import type { HumanGeometry } from './generateHuman';
import { addGarmentAttributes } from './materials/garmentAttributes';

type Sample = { x: number; y: number; z: number; region: number };
/** Fit a panel to existing topology. Copied weights keep its clearance through deformation. */
export function fittedPanel(
  source: BufferGeometry,
  select: (point: Sample) => boolean,
  model: Pick<HumanGeometry, 'scale' | 'floor'>,
  clearance = 0.005,
) {
  const p = source.getAttribute('position'),
    n = source.getAttribute('normal');
  const region = source.getAttribute('region');
  const si = source.getAttribute('skinIndex'),
    sw = source.getAttribute('skinWeight');
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [],
    skinIndices: number[] = [],
    skinWeights: number[] = [];
  type Vertex = { position: Vector3; normal: Vector3; weights: Map<number, number> };
  const mix = (a: Vertex, b: Vertex, t: number): Vertex => {
    const weights = new Map<number, number>();
    a.weights.forEach((w, id) => weights.set(id, w * (1 - t)));
    b.weights.forEach((w, id) => weights.set(id, (weights.get(id) ?? 0) + w * t));
    return {
      position: a.position.clone().lerp(b.position, t),
      normal: a.normal.clone().lerp(b.normal, t),
      weights,
    };
  };
  for (let i = 0; i < source.index!.count; i += 3) {
    const ids = [0, 1, 2].map((j) => source.index!.getX(i + j));
    const r = region?.getX(ids[0]!) ?? 0;
    const inside = (v: Vertex) =>
      select({
        x: v.position.x / model.scale,
        y: v.position.y / model.scale + model.floor,
        z: v.position.z / model.scale,
        region: r,
      });
    const triangle = ids.map((id): Vertex => {
      const weights = new Map<number, number>();
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(id, k);
        if (w > 0) weights.set(si.getComponent(id, k), w);
      }
      return {
        position: new Vector3().fromBufferAttribute(p, id),
        normal: new Vector3().fromBufferAttribute(n, id),
        weights,
      };
    });
    // Clip boundary triangles against the actual garment predicate, avoiding saw-tooth hems.
    const polygon: Vertex[] = [];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j]!,
        b = triangle[(j + 1) % 3]!;
      const aIn = inside(a),
        bIn = inside(b);
      if (aIn) polygon.push(a);
      if (aIn !== bIn) {
        let low = 0,
          high = 1;
        for (let k = 0; k < 12; k++) {
          const t = (low + high) / 2;
          if (inside(mix(a, b, t)) === aIn) low = t;
          else high = t;
        }
        polygon.push(mix(a, b, (low + high) / 2));
      }
    }
    if (polygon.length < 3) continue;
    const base = positions.length / 3;
    for (const v of polygon) {
      positions.push(...v.position.clone().addScaledVector(v.normal, clearance).toArray());
      normals.push(...v.normal.clone().normalize().toArray());
      const links = [...v.weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = links.reduce((sum, [, w]) => sum + w, 0);
      for (let k = 0; k < 4; k++) {
        skinIndices.push(links[k]?.[0] ?? 0);
        skinWeights.push((links[k]?.[1] ?? 0) / total);
      }
    }
    for (let j = 1; j < polygon.length - 1; j++) indices.push(base, base + j, base + j + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
  g.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));
  g.setIndex(indices);
  g.computeBoundingBox();
  return g;
}
export function generateWardrobe(model: HumanGeometry, b: Body, wardrobe: Wardrobe) {
  const ty = (y: number) => 0.91 * b.legs + (y - 0.91) * b.torso;
  const armDistance = (p: Sample) =>
    ((Math.abs(p.x) - 0.259 * b.shoulders) * 0.34 + (ty(1.437) - p.y) * 0.94) / b.arms;
  const headBase = ty(1.6) + (b.neckLength - 1) * 0.065;
  const panels: {
    name: string;
    geometry: BufferGeometry;
    material: 'primary' | 'accent' | 'boot';
  }[] = [];
  const panel = (
    name: string,
    select: (point: Sample) => boolean,
    material: 'primary' | 'accent' | 'boot' = 'primary',
    offset = 0.005,
  ) => {
    const geometry = fittedPanel(model.skin, select, model, offset);
    if (geometry.index!.count) {
      addGarmentAttributes(geometry, name);
      panels.push({ name, geometry, material });
    } else geometry.dispose();
  };
  const bottom =
    wardrobe.outfit === 'full-tights'
      ? wardrobe.boots === 'tall'
        ? 0.455
        : wardrobe.boots === 'classic'
          ? 0.32
          : 0.14
      : wardrobe.outfit === 'trunks'
        ? 0.84
        : 0.68;
  panel('outfit', (p) => {
    if (p.region === 3 || p.region === 4 || p.region === 5) return false;
    if (p.y < bottom * b.legs) return false;
    if (p.y < ty(1.056)) return true;
    if (wardrobe.outfit !== 'singlet' || p.y > ty(1.565)) return false;
    const neckLine = ty(p.z > 0 ? 1.32 : 1.36);
    return (
      p.y < neckLine || (Math.abs(p.x) > 0.11 * b.shoulders && Math.abs(p.x) < 0.205 * b.shoulders)
    );
  });
  if (wardrobe.top && wardrobe.outfit !== 'singlet')
    panel(
      'athletic top',
      (p) =>
        p.region === 0 &&
        p.y > ty(1.235) &&
        p.y < ty(1.565) &&
        (p.y < ty(1.37) ||
          (Math.abs(p.x) > 0.11 * b.shoulders && Math.abs(p.x) < 0.205 * b.shoulders)),
    );
  // Accent side panels and waistband are body-fitted, with a little extra clearance.
  panel('waistband', (p) => p.region === 0 && p.y > ty(0.98) && p.y < ty(1.056), 'accent', 0.006);
  if (wardrobe.outfit !== 'trunks')
    panel(
      'side stripe',
      (p) =>
        (p.region === 1 || p.region === 2) &&
        p.y > bottom * b.legs &&
        p.y < 0.85 * b.legs &&
        Math.abs(p.x) > (0.145 + (0.85 * b.legs - p.y) * 0.08) * b.hips &&
        Math.abs(p.z - 0.01) < 0.027,
      'accent',
      0.006,
    );
  if (wardrobe.armbands)
    panel(
      'armbands',
      (p) => (p.region === 3 || p.region === 4) && armDistance(p) > 0.09 && armDistance(p) < 0.19,
      'primary',
    );
  if (wardrobe.armTape)
    panel(
      'forearm tape',
      (p) => (p.region === 3 || p.region === 4) && armDistance(p) > 0.32 && armDistance(p) < 0.45,
      'accent',
    );
  if (wardrobe.wristTape)
    panel(
      'wrist tape',
      (p) => (p.region === 3 || p.region === 4) && armDistance(p) > 0.45 && armDistance(p) < 0.49,
      'accent',
    );
  if (wardrobe.kneePads)
    panel(
      'knee pads',
      (p) => (p.region === 1 || p.region === 2) && p.y > 0.47 * b.legs && p.y < 0.565 * b.legs,
      'primary',
      0.011,
    );
  if (wardrobe.boots === 'tall')
    panel(
      'boot shafts',
      (p) => (p.region === 1 || p.region === 2) && p.y > 0.29 * b.legs && p.y < 0.475 * b.legs,
      'boot',
      0.009,
    );
  if (wardrobe.mask !== 'none') {
    const maskSelect = (p: Sample) => {
      if (p.region !== 5 || p.y < headBase + 0.012) return false;
      const h = (p.y - headBase) / (b.head * 1.065),
        x = Math.abs(p.x) / (b.head * 1.065);
      if (p.z > 0.045 && h > 0.108 && h < 0.14 && x > 0.013 && x < 0.065) return false;
      if (p.z > 0.055 && h > 0.025 && h < 0.06 && x < 0.035) return false;
      if (wardrobe.mask === 'open' && p.z > 0.025 && h < 0.1) return false;
      return true;
    };
    panel('mask', maskSelect, 'primary', 0.004);
    panel(
      'mask crest',
      (p) => maskSelect(p) && Math.abs(p.x) < 0.021 * b.head && p.y > headBase + 0.145,
      'accent',
      0.006,
    );
  }
  const batches = (['primary', 'accent', 'boot'] as const).flatMap((material) => {
    const geometries = panels.filter((p) => p.material === material).map((p) => p.geometry);
    return geometries.length
      ? [{ name: material, material, geometry: mergeGeometries(geometries)! }]
      : [];
  });
  return {
    panels,
    batches,
    dispose: () => [...panels, ...batches].forEach((p) => p.geometry.dispose()),
  };
}
