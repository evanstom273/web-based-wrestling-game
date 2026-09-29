import {
  Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Skeleton,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import type { Body } from './definition';
import type { HumanGeometry } from './generateHuman';

export type HumanRig = ReturnType<typeof createHumanRig>;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Bind landmarks use exactly the generator's authored coordinates and height normalization. */
export function createHumanRig(b: Body, model: Pick<HumanGeometry, 'scale' | 'floor'>) {
  const bones: Bone[] = [];
  const names = new Map<string, number>();
  const rest = new Map<string, Vector3>();
  const ty = (y: number) => 0.91 * b.legs + (y - 0.91) * b.torso;
  const world = (x: number, y: number, z: number) =>
    new Vector3(x, y - model.floor, z).multiplyScalar(model.scale);
  function add(name: string, parent: string | undefined, point: Vector3) {
    const bone = new Bone();
    bone.name = name;
    bone.position.copy(point);
    if (parent) {
      bone.position.sub(rest.get(parent)!);
      bones[names.get(parent)!]!.add(bone);
    }
    names.set(name, bones.length);
    rest.set(name, point);
    bones.push(bone);
  }
  add('pelvis', undefined, world(0, 0.91 * b.legs, 0));
  add('spine', 'pelvis', world(0, ty(1.11), 0));
  add('chest', 'spine', world(0, ty(1.34), 0));
  add('neck', 'chest', world(0, ty(1.55), -0.006));
  add('head', 'neck', world(0, ty(1.63) + (b.neckLength - 1) * 0.065, 0));
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'L' : 'R';
    const arm = (t: number, z: number) =>
      world(side * (0.259 * b.shoulders + t * 0.34), ty(1.437) - t * 0.94, z);
    add(`${s}clavicle`, 'chest', world(side * 0.095 * b.shoulders, ty(1.47), 0));
    add(`${s}upperArm`, `${s}clavicle`, arm(0.025 * b.arms, 0));
    add(`${s}forearm`, `${s}upperArm`, arm(0.275 * b.arms, 0.014));
    add(`${s}hand`, `${s}forearm`, arm(0.485 * b.arms, 0.035));
    add(`${s}fingers`, `${s}hand`, arm(0.485 * b.arms + 0.1 * b.hands, 0.039));
    add(`${s}fingerTips`, `${s}fingers`, arm(0.485 * b.arms + 0.14 * b.hands, 0.05));
    const thumb = arm(0.485 * b.arms + 0.058 * b.hands, 0.047);
    thumb.x -= side * 0.028 * b.hands * model.scale;
    add(`${s}thumb`, `${s}hand`, thumb);
    add(`${s}thigh`, 'pelvis', world(side * 0.111 * b.hips, 0.87 * b.legs, 0));
    add(`${s}shin`, `${s}thigh`, world(side * 0.165 * b.hips, 0.515 * b.legs, 0.034));
    add(`${s}foot`, `${s}shin`, world(side * 0.203 * b.hips, 0.13 * b.legs, 0));
  }
  const root = bones[0]!;
  root.updateMatrixWorld(true);
  const skeleton = new Skeleton(bones);
  skeleton.calculateInverses();
  return { root, skeleton, bones, names, rest, b, scale: model.scale, floor: model.floor, ty };
}

/** Region ownership prevents a nearby thigh/torso from stealing arm weights. Shared openings blend. */
export function skinGeometry(geometry: BufferGeometry, rig: HumanRig, rigidHead = false) {
  const p = geometry.getAttribute('position');
  const region = geometry.getAttribute('region');
  const indices: number[] = [],
    weights: number[] = [];
  const { b, ty } = rig;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / rig.scale,
      y = p.getY(i) / rig.scale + rig.floor;
    const r = region?.getX(i) ?? 0;
    const s = x < 0 ? 'L' : 'R';
    let links: [string, number][];
    const blend = (a: string, c: string, t: number): [string, number][] => [
      [a, 1 - t],
      [c, t],
    ];
    if (rigidHead || r === 5) links = [['head', 1]];
    else if (r === 3 || r === 4) {
      const t = ((Math.abs(x) - 0.259 * b.shoulders) * 0.34 + (ty(1.437) - y) * 0.94) / b.arms;
      if (t < 0.12) links = blend(`${s}clavicle`, `${s}upperArm`, smooth(-0.025, 0.13, t));
      else if (t < 0.39) links = blend(`${s}upperArm`, `${s}forearm`, smooth(0.235, 0.31, t));
      else if (t < 0.515) links = blend(`${s}forearm`, `${s}hand`, smooth(0.45, 0.51, t));
      else {
        const centerX = 0.259 * b.shoulders + ((ty(1.437) - y) * 0.34) / 0.94;
        const handT = 0.485 + ((t - 0.485) * b.arms) / b.hands;
        const thumb = handT < 0.61 && Math.abs(x) < centerX - 0.033 * b.hands;
        links = thumb
          ? blend(`${s}hand`, `${s}thumb`, smooth(0.032, 0.065, centerX - Math.abs(x)))
          : handT < 0.61
            ? blend(`${s}hand`, `${s}fingers`, smooth(0.56, 0.6, handT))
            : blend(`${s}fingers`, `${s}fingerTips`, smooth(0.615, 0.641, handT));
      }
    } else if (r === 1 || r === 2) {
      if (y > 0.7 * b.legs)
        links = blend(`${s}thigh`, 'pelvis', smooth(0.79 * b.legs, 0.98 * b.legs, y));
      else if (y > 0.23 * b.legs)
        links = blend(`${s}shin`, `${s}thigh`, smooth(0.47 * b.legs, 0.565 * b.legs, y));
      else links = blend(`${s}foot`, `${s}shin`, smooth(0.09 * b.legs, 0.19 * b.legs, y));
    } else if (y < ty(1.055)) links = [['pelvis', 1]];
    else if (y < ty(1.26)) links = blend('pelvis', 'spine', smooth(ty(1.055), ty(1.19), y));
    else if (y < ty(1.43)) {
      links = blend('spine', 'chest', smooth(ty(1.23), ty(1.37), y));
      const shoulder =
        smooth(0.17 * b.shoulders, 0.25 * b.shoulders, Math.abs(x)) * smooth(ty(1.34), ty(1.4), y);
      links = links.map(([n, w]) => [n, w * (1 - shoulder)]);
      links.push([`${s}clavicle`, shoulder * 0.7], [`${s}upperArm`, shoulder * 0.3]);
    } else if (Math.abs(x) > 0.105 * b.shoulders && y < ty(1.54)) {
      const lateral = smooth(0.1 * b.shoulders, 0.25 * b.shoulders, Math.abs(x));
      links = [
        ['chest', 1 - lateral],
        [`${s}clavicle`, lateral * 0.65],
        [`${s}upperArm`, lateral * 0.35],
      ];
    } else links = blend('neck', 'head', smooth(ty(1.56), ty(1.635), y));
    for (let j = 0; j < 4; j++) {
      indices.push(rig.names.get(links[j]?.[0] ?? 'pelvis')!);
      weights.push(links[j]?.[1] ?? 0);
    }
  }
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
}
