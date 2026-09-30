import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  DoubleSide,
} from 'three';
import { validateBody, type Body, type WrestlerVisualDefinition } from './definition';
import { ellipse, loft, Surface, appendSurface, orientShells, type Point } from './mesh';
import { refineGeometry } from './refineGeometry';
import { buildHead } from './head';
export type HumanGeometry = {
  skin: BufferGeometry;
  trunks: BufferGeometry;
  boots: BufferGeometry;
  tape: BufferGeometry;
  pads: BufferGeometry;
  hair: BufferGeometry;
  features: BufferGeometry;
  scale: number;
  floor: number;
  triangles: number;
  dispose: () => void;
};

/** Generates a shared-boundary body, with authored profiles in metres. +Z is the face. */
export function generateHuman(
  body: Body,
  appearance?: Pick<WrestlerVisualDefinition, 'face' | 'hairstyle'>,
  quality: 'base' | 'creator' = 'base',
): HumanGeometry {
  const b = validateBody(body);
  // Mass changes the envelope; definition below changes the connected surface's relief.
  const bulk = b.muscle;
  b.upperArms *= 0.82 + bulk * 0.32;
  b.forearms *= 0.9 + bulk * 0.17;
  b.thighs *= 0.9 + bulk * 0.19;
  b.calves *= 0.91 + bulk * 0.16;
  b.chest *= 0.96 + bulk * 0.08;
  const skin = new Surface(),
    trunks = new Surface(),
    boots = new Surface(),
    tape = new Surface(),
    pads = new Surface(),
    hair = new Surface(),
    features = new Surface();

  const hipY = 0.91 * b.legs;
  const ty = (y: number) => hipY + (y - 0.91) * b.torso;
  const soft = b.fat;
  const female = b.feminine;
  const muscle = b.muscle ** 1.35 * (1 - soft * 0.88);
  // Pelvis → abdomen → rib cage → axilla → clavicle → trapezius → neck.
  const levels: [number, number, number, number][] = [
    [0.91, 0.211 * b.hips, 0.124 + soft * 0.035, -0.012],
    [0.98, 0.207 * b.hips, 0.133 + soft * 0.035, -0.021],
    [1.055, 0.172 * b.waist + soft * 0.035, 0.112 + soft * 0.1, 0.003],
    [1.1, 0.166 * b.waist + soft * 0.039, 0.109 + soft * 0.115, 0.003],
    [1.14, 0.163 * b.waist + soft * 0.039, 0.108 + soft * 0.12, 0.003],
    [1.19, 0.176 * b.chest + soft * 0.034, 0.119 * b.depth + soft * 0.09, 0],
    [1.235, 0.187 * b.chest + soft * 0.026, 0.132 * b.depth + soft * 0.034, 0],
    [1.26, 0.197 * b.chest + soft * 0.017, 0.137 * b.depth + soft * 0.03, 0],
    [1.285, 0.207 * b.chest + soft * 0.01, 0.144 * b.depth + soft * 0.023, 0],
    [1.315, 0.217 * b.chest, 0.146 * b.depth + soft * 0.02, 0],
    [1.37, 0.232 * b.shoulders, 0.137 * b.depth, -0.002],
    [1.42, 0.251 * b.shoulders, 0.124 * b.depth, -0.006],
    [1.465, 0.249 * b.shoulders, 0.109 * b.depth, -0.008],
    [1.5, 0.228 * b.shoulders, 0.092 * b.depth, -0.008],
    [1.53, 0.143 * b.shoulders, 0.075 * b.neck, -0.006],
    [1.56, 0.071 * b.neck, 0.063 * b.neck, -0.006],
    [1.592 + (b.neckLength - 1) * 0.065, 0.061 * b.neck, 0.058 * b.neck, -0.006],
  ];
  // Extra abdominal rows resolve paired rectus muscles without pasted-on geometry.
  for (const y of [1.075, 1.12, 1.155, 1.175, 1.205, 1.22, 1.245, 1.3, 1.34]) {
    const i = levels.findIndex((p) => p[0] > y);
    const a = levels[i - 1]!,
      c = levels[i]!;
    const t = (y - a[0]) / (c[0] - a[0]);
    levels.splice(i, 0, [y, ...a.slice(1).map((v, j) => v + (c[j + 1]! - v) * t)] as [
      number,
      number,
      number,
      number,
    ]);
  }
  const gaussian = (v: number, center: number, width: number) =>
    Math.exp(-(((v - center) / width) ** 2));
  const axilla = levels.findIndex((p) => p[0] === 1.37);
  const shoulderTop = axilla + 3;
  const rings = levels.map(([y, w, d, z]) =>
    skin.ring(
      ellipse(0, ty(y), z, w, d).map(([x, yy, zz], j): Point => {
        const angle = (j / 24) * Math.PI * 2;
        if (y < 1.055) x *= 1 + female * 0.045;
        if (y >= 1.055 && y <= 1.235)
          x *= 1 - female * 0.06 * Math.sin(((y - 1.055) / 0.18) * Math.PI);
        // Female contour is part of the rib-cage surface, never an attached breast primitive.
        if (zz > 0 && y > 1.19 && y < 1.43) {
          const chestContour =
            Math.exp(-(((y - 1.305) / 0.063) ** 2)) *
            Math.exp(-(((Math.abs(x) - 0.095) / 0.065) ** 2));
          zz += female * (0.018 + b.bust * 0.028) * chestContour;
        }
        // Broad pectorals, a sternum valley and three paired rectus groups.
        if (zz > z) {
          const front = Math.max(0, Math.sin(angle)) ** 3;
          zz +=
            muscle *
            0.032 *
            gaussian(y, 1.315, 0.065) *
            gaussian(Math.abs(x), 0.098, 0.066) *
            front;
          zz -= muscle * 0.007 * gaussian(x, 0, 0.014) * gaussian(y, 1.29, 0.1) * front;
          const abs = [1.12, 1.175, 1.22].reduce((sum, row) => sum + gaussian(y, row, 0.018), 0);
          zz += muscle * 0.012 * abs * gaussian(Math.abs(x), 0.046, 0.028) * front;
          zz -= muscle * 0.003 * gaussian(x, 0, 0.013) * gaussian(y, 1.17, 0.09) * front;
          zz +=
            muscle *
            0.009 *
            gaussian(Math.abs(x), 0.115, 0.028) *
            gaussian(y, 1.175, 0.065) *
            front;
        }
        if (zz < z && y >= 1.055 && y <= 1.37) {
          const rearDepth =
            0.106 + 0.034 * Math.sin((Math.min(1, (y - 1.055) / 0.26) * Math.PI) / 2);
          zz = z + (rearDepth * b.depth + soft * 0.026) * Math.sin(angle);
          zz += muscle * 0.01 * gaussian(x, 0, 0.023);
          zz -= muscle * 0.012 * gaussian(Math.abs(x), 0.095, 0.045) * gaussian(y, 1.32, 0.07);
        }
        if (y === 1.465 && zz > 0) zz -= 0.012 * Math.sin(angle);
        if (y === 1.5 && Math.abs(x) > 0.1) yy += 0.012;
        return [x, yy, zz];
      }),
    ),
  );
  for (let r = 0; r < rings.length - 1; r++) {
    for (let j = 0; j < 24; j++) {
      // Leave two genuine shoulder openings. Arms share these boundary vertices.
      const shoulder = r >= axilla && r < shoulderTop && (j >= 22 || j < 2 || (j >= 10 && j < 14));
      if (shoulder) continue;
      const n = (j + 1) % 24,
        a = rings[r]!,
        c = rings[r + 1]!;
      skin.face(a[j]!, c[j]!, a[n]!);
      skin.face(a[n]!, c[j]!, c[n]!);
    }
  }

  // Two legs share the pelvis hem and the same crotch vertex. No spheres or hidden seams.
  const crotch = skin.vertex([0, ty(0.867), 0]);
  for (const side of [-1, 1]) {
    skin.region = side === -1 ? 1 : 2;
    const indices =
      side === 1
        ? [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6]
        : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    let boundary = [...indices.map((j) => rings[0]![j]!), crotch];
    const legX = 0.111 * b.hips;
    const first = skin.point(boundary[0]!);
    const start = Math.atan2(first[2], first[0] - side * legX);
    const legProfiles: [number, number, number, number, number][] = [
      [0.845, 0.108 * b.thighs, 0.117 * b.thighs, -0.006, 0.123 * b.hips],
      [0.76, 0.108 * b.thighs, 0.113 * b.thighs, 0.011, 0.139 * b.hips],
      [0.66, 0.087 * b.thighs, 0.093 * b.thighs, 0.019, 0.151 * b.hips],
      [0.565, 0.067, 0.072, 0.03, 0.16 * b.hips],
      [0.54, 0.065, 0.068, 0.033, 0.162 * b.hips],
      [0.515, 0.064, 0.066, 0.034, 0.165 * b.hips],
      [0.494, 0.063, 0.063, 0.025, 0.167 * b.hips],
      [0.475, 0.064 * b.calves, 0.062, 0.013, 0.17 * b.hips],
      [0.405, 0.073 * b.calves, 0.079 * b.calves, -0.01, 0.179 * b.hips],
      [0.335, 0.063 * b.calves, 0.073 * b.calves, -0.014, 0.188 * b.hips],
      [0.24, 0.046, 0.054, -0.006, 0.197 * b.hips],
      [0.13, 0.038, 0.044, 0, 0.203 * b.hips],
      [0.085, 0.039, 0.048, 0.01, 0.205 * b.hips],
    ];
    legProfiles.forEach(([y, w, d, z, x]) => {
      const ring = skin.ring(
        Array.from({ length: 14 }, (_, j): Point => {
          const a = start + (j / 14) * Math.PI * 2;
          const quad = muscle * 0.008 * gaussian(y, 0.73, 0.11) * Math.max(0, Math.sin(a));
          return [side * x + w * Math.cos(a), y * b.legs, z + d * Math.sin(a) + quad];
        }),
      );
      skin.join(boundary, ring);
      boundary = ring;
    });
    skin.cap(boundary, true);
    // Feet and fitted boots share the same authored heel/instep/toe profile.
    const footX = side * 0.205 * b.hips;
    const footProfiles: [number, number, number, number][] = [
      [0.003, 0.053, 0.112, 0.052],
      [0.052, 0.055, 0.118, 0.052],
      [0.085, 0.051, 0.11, 0.047],
      [0.116, 0.044, 0.075, 0.023],
      [0.16, 0.039, 0.045, 0],
    ];
    const foot = loft(
      footProfiles.map(([y, w, d, z]) =>
        ellipse(footX, y * b.legs, z * b.feet, w * b.feet, d * b.feet, 16),
      ),
    );
    appendSurface(skin, foot);
    const bootProfiles: [number, number, number, number][] = [
      [0.003, 0.057, 0.118, 0.052],
      [0.048, 0.059, 0.123, 0.052],
      [0.088, 0.055, 0.114, 0.047],
      [0.122, 0.047, 0.08, 0.024],
      [0.165, 0.044, 0.05, 0],
      [0.235, 0.05, 0.059, -0.006],
      [0.31, 0.063 * b.calves, 0.073 * b.calves, -0.013],
      [0.34, 0.068 * b.calves, 0.077 * b.calves, -0.014],
    ];
    appendSurface(
      boots,
      loft(
        bootProfiles.map(([y, w, d, z]) =>
          ellipse(
            side * (0.205 - Math.max(0, y - 0.13) * 0.079) * b.hips,
            y * b.legs,
            z * (y < 0.17 ? b.feet : 1),
            w * (y < 0.17 ? b.feet : 1) + 0.005,
            d * (y < 0.17 ? b.feet : 1) + 0.005,
            16,
          ),
        ),
      ),
    );
    const sampleLeg = (y: number) => {
      for (let i = 0; i < legProfiles.length - 1; i++) {
        const a = legProfiles[i]!,
          c = legProfiles[i + 1]!;
        if (y <= a[0] && y >= c[0]) {
          const t = (a[0] - y) / (a[0] - c[0]);
          return a.map((v, j) => v + (c[j]! - v) * t);
        }
      }
      throw new RangeError('Pad outside leg');
    };
    appendSurface(
      pads,
      loft(
        [0.475, 0.492, 0.548, 0.57].map((y) => {
          const [, w, d, z, x] = sampleLeg(y);
          return ellipse(side * x!, y * b.legs, z!, w! + 0.009, d! + 0.012, 16);
        }),
      ),
    );
    skin.region = side === -1 ? 3 : 4;
    // Shoulder opening ordered around its perimeter, smoothly landing on the deltoid.
    const center = side === 1 ? 0 : 12;
    const at = (r: number, j: number) => rings[r]![(j + 24) % 24]!;
    const opening: number[] = [];
    for (let j = -2; j <= 2; j++) opening.push(at(shoulderTop, center + j));
    for (let r = shoulderTop - 1; r >= axilla; r--) opening.push(at(r, center + 2));
    for (let j = 1; j >= -2; j--) opening.push(at(axilla, center + j));
    for (let r = axilla + 1; r < shoulderTop; r++) opening.push(at(r, center - 2));
    // Corresponding arm rings follow the opening's angle around its longitudinal axis.
    const shoulderX = side * 0.259 * b.shoulders;
    const shoulderY = ty(1.437);
    const startAngle = Math.atan2(
      skin.point(opening[0]!)[2],
      skin.point(opening[0]!)[1] - shoulderY,
    );
    const angles = opening.map((_, i) => startAngle + ((side * i) / opening.length) * Math.PI * 2);
    let arm = opening;
    const armProfiles: [number, number, number, number][] = [
      [0.025, 0.075 * b.upperArms, 0.08 * b.upperArms, 0],
      [0.075, 0.081 * b.upperArms, 0.085 * b.upperArms, 0],
      [0.17, 0.074 * b.upperArms, 0.079 * b.upperArms, 0.002],
      [0.245, 0.057, 0.059, 0.008],
      [0.266, 0.053, 0.055, 0.012],
      [0.285, 0.052, 0.054, 0.016],
      [0.303, 0.055 * b.forearms, 0.058 * b.forearms, 0.019],
      [0.325, 0.059 * b.forearms, 0.063 * b.forearms, 0.021],
      [0.395, 0.052 * b.forearms, 0.056 * b.forearms, 0.027],
      [0.455, 0.037, 0.04, 0.033],
      [0.485, 0.032, 0.034, 0.035],
    ];
    const armPoint = (t: number, rad: number, depth: number, z: number, a: number): Point => [
      shoulderX + side * (t * 0.34 + rad * Math.cos(a) * 0.94),
      shoulderY - t * 0.94 + rad * Math.cos(a) * 0.34,
      z + depth * Math.sin(a),
    ];
    armProfiles.forEach(([distance, w, d, z]) => {
      const t = distance * b.arms;
      const ring = skin.ring(angles.map((a) => armPoint(t, w, d, z, a)));
      skin.join(arm, ring);
      arm = ring;
    });
    // Palm and grouped fingers narrow towards fingertips; thumb grows out of the radial edge.
    const handProfiles: [number, number, number][] = [
      [0.51, 0.039, 0.028],
      [0.55, 0.045, 0.027],
      [0.59, 0.041, 0.026],
      [0.615, 0.038, 0.022],
      [0.641, 0.031, 0.018],
      [0.655, 0.018, 0.009],
    ];
    const thumbIndex = angles.reduce(
      (best, a, i) => (Math.cos(a - 2.6) > Math.cos(angles[best]! - 2.6) ? i : best),
      0,
    );
    const wrap = (i: number) => (i + angles.length) % angles.length;
    const palmRings: number[][] = [];
    handProfiles.forEach(([t, w, d], row) => {
      const dist = 0.485 * b.arms + (t - 0.485) * b.hands;
      const ring = skin.ring(
        angles.map((a) => {
          const p = armPoint(
            dist,
            w * b.hands,
            d * b.hands,
            0.035 + Math.max(0, t - 0.57) * 0.23,
            a,
          );
          // Flatten the palm and round the unequal finger envelope instead of a conical tip.
          if (t > 0.61) p[1] += Math.abs(Math.cos(a)) * 0.012 * b.hands;
          return p;
        }),
      );
      if (row === 1 || row === 2) {
        for (let j = 0; j < angles.length; j++) {
          if (j === wrap(thumbIndex - 1) || j === thumbIndex) continue;
          const n = wrap(j + 1);
          skin.face(arm[j]!, ring[j]!, arm[n]!);
          skin.face(arm[n]!, ring[j]!, ring[n]!);
        }
      } else skin.join(arm, ring);
      palmRings.push(ring);
      arm = ring;
    });
    skin.cap(arm, true);
    const palm = (r: number, j: number) => palmRings[r]![wrap(j)]!;
    let thumb = [
      palm(0, thumbIndex - 1),
      palm(0, thumbIndex),
      palm(0, thumbIndex + 1),
      palm(1, thumbIndex + 1),
      palm(2, thumbIndex + 1),
      palm(2, thumbIndex),
      palm(2, thumbIndex - 1),
      palm(1, thumbIndex - 1),
    ];
    const root = new Vector3();
    thumb.forEach((id) => root.add(new Vector3(...skin.point(id))));
    root.divideScalar(thumb.length);
    const axis = new Vector3(-side * 0.57, -0.78, 0.24).normalize();
    const u = new Vector3(side * 0.81, -0.59, 0).normalize();
    const v = new Vector3().crossVectors(axis, u).normalize();
    const initial = new Vector3(...skin.point(thumb[0]!)).sub(root);
    const thumbAngle = Math.atan2(initial.dot(v), initial.dot(u));
    for (const [distance, radius] of [
      [0.019, 0.018],
      [0.041, 0.014],
      [0.054, 0.008],
    ] as const) {
      const ring = skin.ring(
        thumb.map((_, j): Point => {
          const a = thumbAngle + ((side * j) / 8) * Math.PI * 2;
          return root
            .clone()
            .addScaledVector(axis, distance * b.hands)
            .addScaledVector(u, Math.cos(a) * radius * b.hands)
            .addScaledVector(v, Math.sin(a) * radius * b.hands)
            .toArray() as Point;
        }),
      );
      skin.join(thumb, ring);
      thumb = ring;
    }
    skin.cap(thumb);
    appendSurface(
      tape,
      loft(
        [0.456, 0.475, 0.489].map((t) =>
          angles.map((a) =>
            armPoint(t * b.arms, 0.035 + (0.489 - t) * 0.16, 0.037 + (0.489 - t) * 0.16, 0.035, a),
          ),
        ),
      ),
    );
  }
  skin.region = features.region = hair.region = 5;
  buildHead(
    skin,
    features,
    hair,
    rings[rings.length - 1]!,
    ty(1.6) + (b.neckLength - 1) * 0.065,
    b.head,
    appearance?.face ?? 'balanced',
    appearance?.hairstyle ?? 'crop',
  );
  // Reuse the exact pelvis topology and weld garment vertices by source ID.
  orientShells(skin);
  const source = new BufferGeometry();
  source.setAttribute('position', new Float32BufferAttribute(skin.positions, 3));
  source.setIndex(skin.indices);
  source.computeVertexNormals();
  const normals = source.getAttribute('normal');
  const garmentVertices = new Map<number, number>();
  for (let k = 0; k < skin.indices.length; k += 3) {
    const ids = skin.indices.slice(k, k + 3);
    if (
      !ids.every((id) => {
        const p = skin.point(id);
        return p[1] >= 0.84 * b.legs && p[1] <= ty(1.056) && Math.abs(p[0]) < 0.31;
      })
    )
      continue;
    const garment = ids.map((id) => {
      const existing = garmentVertices.get(id);
      if (existing !== undefined) return existing;
      const [x, y, z] = skin.point(id);
      const copied = trunks.vertex([
        x + normals.getX(id) * 0.004,
        y + normals.getY(id) * 0.004,
        z + normals.getZ(id) * 0.004,
      ]);
      garmentVertices.set(id, copied);
      return copied;
    });
    trunks.face(garment[0]!, garment[1]!, garment[2]!);
  }
  source.dispose();
  const surfaces = { skin, trunks, boots, tape, pads, hair, features };
  const ys = skin.positions.filter((_, i) => i % 3 === 1);
  const floor = Math.min(...ys);
  const scale = b.height / (Math.max(...ys) - floor);
  const geometries = Object.fromEntries(
    Object.entries(surfaces).map(([name, s]) => {
      orientShells(s);
      const coarse = s.geometry();
      const g =
        quality === 'creator' && (name === 'skin' || name === 'hair')
          ? refineGeometry(coarse)
          : coarse;
      if (g !== coarse) coarse.dispose();
      g.translate(0, -floor, 0);
      g.scale(scale, scale, scale);
      return [name, g];
    }),
  ) as Record<keyof typeof surfaces, BufferGeometry>;
  if (quality === 'creator') {
    // Project minimal eyelids/iris/brow/lip planes onto the refined face, rather than floating.
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const face = new Mesh(geometries.skin, material);
    face.updateMatrixWorld();
    const source = geometries.features;
    const points = source.getAttribute('position');
    const colors = source.getAttribute('color');
    const positions: number[] = [],
      shades: number[] = [],
      regions: number[] = [],
      featureIds: number[] = [],
      indices: number[] = [];
    const ray = new Raycaster();
    // Tessellate each feature patch before projection so its interior follows the curved face.
    for (let patch = 0; patch < points.count / 4; patch++) {
      const corners = Array.from({ length: 4 }, (_, j) =>
        new Vector3(...features.point(patch * 4 + j))
          .add(new Vector3(0, -floor, 0))
          .multiplyScalar(scale),
      );
      const offset = positions.length / 3;
      for (let row = 0; row <= 2; row++)
        for (let col = 0; col <= 8; col++) {
          const upper = corners[0]!.clone().lerp(corners[1]!, col / 8);
          const lower = corners[3]!.clone().lerp(corners[2]!, col / 8);
          const point = upper.lerp(lower, row / 2);
          ray.set(new Vector3(point.x, point.y, b.height), new Vector3(0, 0, -1));
          const hit = ray.intersectObject(face)[0];
          if (hit) point.z = hit.point.z + (0.0015 + (patch % 4) * 0.0007) * scale;
          positions.push(point.x, point.y, point.z);
          shades.push(colors.getX(patch * 4), colors.getY(patch * 4), colors.getZ(patch * 4));
          regions.push(5);
          featureIds.push(patch === 8 ? 4 : patch % 4);
          if (row < 2 && col < 8) {
            const a = offset + row * 9 + col;
            indices.push(a, a + 1, a + 10, a, a + 10, a + 9);
          }
        }
    }
    const fitted = new BufferGeometry();
    fitted.setAttribute('position', new Float32BufferAttribute(positions, 3));
    fitted.setAttribute('color', new Float32BufferAttribute(shades, 3));
    fitted.setAttribute('region', new Float32BufferAttribute(regions, 1));
    fitted.setAttribute('featureId', new Float32BufferAttribute(featureIds, 1));
    fitted.setIndex(indices);
    fitted.computeVertexNormals();
    geometries.features = fitted;
    source.dispose();
    material.dispose();
  }
  return {
    ...geometries,
    scale,
    floor,
    triangles: Object.values(geometries).reduce((n, g) => n + (g.index?.count ?? 0) / 3, 0),
    dispose: () => Object.values(geometries).forEach((g) => g.dispose()),
  };
}
