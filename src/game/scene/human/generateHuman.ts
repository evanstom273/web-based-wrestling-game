import { BufferGeometry } from 'three';
import { validateBody, type WrestlerVisualDefinition } from './definition';
import { ellipse, loft, Surface, type Point } from './mesh';
export type HumanGeometry = {
  skin: BufferGeometry;
  trunks: BufferGeometry;
  boots: BufferGeometry;
  tape: BufferGeometry;
  pads: BufferGeometry;
  hair: BufferGeometry;
  features: BufferGeometry;
  triangles: number;
  dispose: () => void;
};

/** Generates a shared-boundary body, with authored profiles in metres. +Z is the face. */
export function generateHuman(definition: WrestlerVisualDefinition): HumanGeometry {
  const b = validateBody(definition.body);
  const skin = new Surface(),
    trunks = new Surface(),
    boots = new Surface(),
    tape = new Surface(),
    pads = new Surface(),
    hair = new Surface(),
    features = new Surface();
  const scale = b.height / 1.86;
  const hipY = 0.91 * b.legs;
  const ty = (y: number) => hipY + (y - 0.91) * b.torso;
  const soft = b.fat;
  const muscle = b.muscle * (1 - soft * 0.7);
  // Pelvis → abdomen → rib cage → axilla → clavicle → trapezius → neck.
  const levels: [number, number, number, number][] = [
    [0.91, 0.177 * b.hips, 0.111, -0.016],
    [0.98, 0.194 * b.hips, 0.133 + soft * 0.022, -0.021],
    [1.055, 0.172 * b.waist + soft * 0.035, 0.112 + soft * 0.058, 0.003],
    [1.14, 0.163 * b.waist + soft * 0.039, 0.108 + soft * 0.068, 0.003],
    [1.235, 0.187 * b.chest + soft * 0.026, 0.132 * b.depth + soft * 0.034, 0],
    [1.315, 0.217 * b.chest, 0.146 * b.depth + soft * 0.02, 0],
    [1.37, 0.232 * b.shoulders, 0.137 * b.depth, -0.002],
    [1.42, 0.251 * b.shoulders, 0.124 * b.depth, -0.006],
    [1.465, 0.249 * b.shoulders, 0.109 * b.depth, -0.008],
    [1.5, 0.217 * b.shoulders, 0.092 * b.depth, -0.008],
    [1.53, 0.143 * b.shoulders, 0.075 * b.neck, -0.006],
    [1.56, 0.071 * b.neck, 0.063 * b.neck, -0.006],
    [1.61 + (b.neckLength - 1) * 0.065, 0.061 * b.neck, 0.058 * b.neck, -0.006],
  ];
  const rings = levels.map(([y, w, d, z]) =>
    skin.ring(
      ellipse(0, ty(y), z, w, d).map(([x, yy, zz], j): Point => {
        const angle = (j / 24) * Math.PI * 2;
        // Broad pectoral plane with a restrained sternum valley; no applied muscle blobs.
        if (y > 1.23 && y < 1.43 && zz > 0)
          zz += muscle * 0.013 * Math.sin(angle) * Math.sin(angle * 2) ** 2;
        if (y > 1.05 && y < 1.24 && zz > 0) zz += muscle * 0.004 * Math.cos(x * 48);
        if (zz < 0 && y > 1.2) zz += muscle * 0.009 * Math.exp((-x * x) / 0.0015);
        return [x, yy, zz];
      }),
    ),
  );
  for (let r = 0; r < rings.length - 1; r++) {
    for (let j = 0; j < 24; j++) {
      // Leave two genuine shoulder openings. Arms share these boundary vertices.
      const shoulder = r >= 6 && r < 9 && (j >= 22 || j < 2 || (j >= 10 && j < 14));
      if (shoulder) continue;
      const n = (j + 1) % 24,
        a = rings[r]!,
        c = rings[r + 1]!;
      skin.face(a[j]!, c[j]!, a[n]!);
      skin.face(a[n]!, c[j]!, c[n]!);
    }
  }
  skin.cap(rings[rings.length - 1]!);
  // Two legs share the pelvis hem and the same crotch vertex. No spheres or hidden seams.
  const crotch = skin.vertex([0, ty(0.867), 0]);
  for (const side of [-1, 1]) {
    const indices =
      side === 1
        ? [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6]
        : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    let boundary = [...indices.map((j) => rings[0]![j]!), crotch];
    const legX = 0.111 * b.hips;
    const first = skin.point(boundary[0]!);
    const start = Math.atan2(first[2], first[0] - side * legX);
    const legProfiles: [number, number, number, number, number][] = [
      [0.845, 0.115 * b.thighs, 0.117 * b.thighs, -0.006, 0.123 * b.hips],
      [0.76, 0.108 * b.thighs, 0.113 * b.thighs, 0.011, 0.139 * b.hips],
      [0.66, 0.087 * b.thighs, 0.093 * b.thighs, 0.019, 0.151 * b.hips],
      [0.565, 0.067, 0.072, 0.03, 0.16 * b.hips],
      [0.515, 0.064, 0.066, 0.034, 0.165 * b.hips],
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
          return [side * x + w * Math.cos(a), y * b.legs, z + d * Math.sin(a)];
        }),
      );
      skin.join(boundary, ring);
      boundary = ring;
    });
    skin.cap(boundary, true);
    // Feet and fitted boots share the same authored heel/instep/toe profile.
    const footX = side * 0.205 * b.hips;
    const footProfiles: [number, number, number, number][] = [
      [0.024, 0.053, 0.112, 0.052],
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
    append(skin, foot);
    const bootProfiles: [number, number, number, number][] = [
      [0.018, 0.057, 0.118, 0.052],
      [0.048, 0.059, 0.123, 0.052],
      [0.088, 0.055, 0.114, 0.047],
      [0.122, 0.047, 0.08, 0.024],
      [0.165, 0.044, 0.05, 0],
      [0.235, 0.05, 0.059, -0.006],
      [0.31, 0.063 * b.calves, 0.073 * b.calves, -0.013],
      [0.34, 0.068 * b.calves, 0.077 * b.calves, -0.014],
    ];
    append(
      boots,
      loft(
        bootProfiles.map(([y, w, d, z]) =>
          ellipse(footX, y * b.legs, z * b.feet, w * b.feet, d * b.feet, 16),
        ),
      ),
    );
    append(
      pads,
      loft(
        [
          [0.475, 0.066, 0.07],
          [0.495, 0.073, 0.081],
          [0.55, 0.074, 0.083],
          [0.57, 0.069, 0.076],
        ].map(([y, w, d]) => ellipse(side * 0.165 * b.hips, y! * b.legs, 0.034, w!, d!, 16)),
      ),
    );
    // Shoulder opening ordered around its perimeter, smoothly landing on the deltoid.
    const center = side === 1 ? 0 : 12;
    const at = (r: number, j: number) => rings[r]![(j + 24) % 24]!;
    const opening: number[] = [];
    for (let j = -2; j <= 2; j++) opening.push(at(9, center + j));
    for (let r = 8; r >= 6; r--) opening.push(at(r, center + 2));
    for (let j = 1; j >= -2; j--) opening.push(at(6, center + j));
    for (let r = 7; r <= 8; r++) opening.push(at(r, center - 2));
    // Corresponding arm rings follow the opening's angle around its longitudinal axis.
    const shoulderX = side * 0.259 * b.shoulders;
    const shoulderY = ty(1.437);
    const angles = opening.map((id) => {
      const p = skin.point(id);
      return Math.atan2(p[2], p[1] - shoulderY);
    });
    let arm = opening;
    const armProfiles: [number, number, number, number][] = [
      [0.045, 0.088 * b.upperArms, 0.09 * b.upperArms, 0],
      [0.105, 0.09 * b.upperArms, 0.087 * b.upperArms, 0],
      [0.18, 0.075 * b.upperArms, 0.079 * b.upperArms, 0.002],
      [0.245, 0.057, 0.059, 0.008],
      [0.285, 0.052, 0.054, 0.016],
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
      [0.635, 0.032, 0.022],
      [0.653, 0.019, 0.014],
    ];
    handProfiles.forEach(([t, w, d]) => {
      const dist = 0.485 * b.arms + (t - 0.485) * b.hands;
      const ring = skin.ring(angles.map((a) => armPoint(dist, w * b.hands, d * b.hands, 0.035, a)));
      skin.join(arm, ring);
      arm = ring;
    });
    skin.cap(arm, true);
    const thumbProfiles = [
      [0.528, 0.036, 0.022],
      [0.56, 0.05, 0.02],
      [0.584, 0.06, 0.015],
      [0.596, 0.063, 0.005],
    ];
    const thumb = loft(
      thumbProfiles.map(([t, offset, r]) => {
        const c = armPoint(
          0.485 * b.arms + (t! - 0.485) * b.hands,
          offset! * b.hands,
          0,
          0.055,
          Math.PI,
        );
        return ellipse(c[0], c[1], c[2], r! * b.hands, r! * b.hands, 10);
      }),
    );
    append(skin, thumb);
    append(
      tape,
      loft(
        [0.456, 0.489].map((t) => angles.map((a) => armPoint(t * b.arms, 0.036, 0.039, 0.035, a))),
      ),
    );
  }
  // Trunks follow the pelvis and upper thighs, rather than surrounding it with a torus.
  // Copy the actual continuous lower-body surface faces and classify their coverage.
  for (let k = 0; k < skin.indices.length; k += 3) {
    const ids = skin.indices.slice(k, k + 3);
    const pts = ids.map((i) => skin.point(i));
    if (pts.every((p) => p[1] > ty(0.865) && p[1] < ty(1.06) && Math.abs(p[0]) < 0.29)) {
      const ids2 = pts.map(([x, y, z]) => trunks.vertex([x * 1.016, y, z * 1.022]));
      trunks.face(ids2[0]!, ids2[1]!, ids2[2]!);
    }
  }
  // Head: angular jaw, cheeks, flattened face, projecting nose and rounded occiput.
  const headBase = ty(1.59) + (b.neckLength - 1) * 0.065;
  const headLevels: [number, number, number, number][] = [
    [0, 0.044, 0.067, 0.018],
    [0.022, 0.065, 0.078, 0.01],
    [0.057, 0.076, 0.087, 0.002],
    [0.094, 0.083, 0.094, -0.003],
    [0.13, 0.084, 0.097, -0.008],
    [0.17, 0.083, 0.099, -0.012],
    [0.204, 0.068, 0.086, -0.014],
    [0.226, 0.045, 0.063, -0.013],
    [0.237, 0.008, 0.018, -0.012],
  ];
  const headPoints = headLevels.map(([y, w, d, z]) =>
    ellipse(0, headBase + y * b.head, z, w * b.head, d * b.head, 24).map(
      ([x, yy, zz], j): Point => {
        const a = (j / 24) * Math.PI * 2;
        if (Math.sin(a) > 0) {
          // A flatter facial plane, cheek ridge, chin and an integrated nose down the midline.
          zz = z + d * b.head * Math.min(1, Math.sin(a) * 1.35);
          if (y === 0.094) zz += 0.025 * b.head * Math.exp((-x * x) / 0.00016);
          if (y === 0.13) zz -= 0.007 * b.head * Math.exp(-((Math.abs(x) - 0.035) ** 2) / 0.00016);
        }
        return [x, yy, zz];
      },
    ),
  );
  append(skin, loft(headPoints));
  for (const side of [-1, 1]) {
    append(
      skin,
      loft(
        [
          [0.055, 0.011, 0.011],
          [0.07, 0.017, 0.02],
          [0.102, 0.018, 0.022],
          [0.125, 0.01, 0.013],
        ].map(([y, w, d]) =>
          ellipse(
            side * 0.083 * b.head,
            headBase + y! * b.head,
            -0.005,
            w! * b.head,
            d! * b.head,
            10,
          ),
        ),
      ),
    );
    // Small inset eye and brow planes. Geometry, no textures.
    patch(features, [
      [side * 0.017, headBase + 0.127 * b.head, 0.084 * b.head],
      [side * 0.054, headBase + 0.129 * b.head, 0.081 * b.head],
      [side * 0.052, headBase + 0.12 * b.head, 0.084 * b.head],
      [side * 0.019, headBase + 0.12 * b.head, 0.088 * b.head],
    ]);
    patch(features, [
      [side * 0.016, headBase + 0.143 * b.head, 0.089 * b.head],
      [side * 0.058, headBase + 0.142 * b.head, 0.087 * b.head],
      [side * 0.055, headBase + 0.137 * b.head, 0.089 * b.head],
      [side * 0.018, headBase + 0.138 * b.head, 0.092 * b.head],
    ]);
  }
  patch(features, [
    [-0.027 * b.head, headBase + 0.04 * b.head, 0.089 * b.head],
    [0.027 * b.head, headBase + 0.04 * b.head, 0.089 * b.head],
    [0.022 * b.head, headBase + 0.036 * b.head, 0.089 * b.head],
    [-0.022 * b.head, headBase + 0.036 * b.head, 0.089 * b.head],
  ]);
  // Short crop follows the head's own surface; its lower edge forms temples and hairline.
  const hairProfiles = headPoints.slice(4).map((points, r) =>
    points.map(([x, y, z], j): Point => {
      const a = (j / 24) * Math.PI * 2;
      const hairline =
        r === 0 ? (Math.sin(a) > 0 ? 0.032 : Math.sin(a) < -0.3 ? -0.035 : 0) : 0.006;
      return [x * 1.035, y + hairline * b.head, z * 1.04 - 0.002];
    }),
  );
  append(hair, loft(hairProfiles));
  const surfaces = { skin, trunks, boots, tape, pads, hair, features };
  const geometries = Object.fromEntries(
    Object.entries(surfaces).map(([name, s]) => {
      orient(s);
      const g = s.geometry();
      g.scale(scale, scale, scale);
      return [name, g];
    }),
  ) as Record<keyof typeof surfaces, BufferGeometry>;
  return {
    ...geometries,
    triangles: Object.values(geometries).reduce((n, g) => n + (g.index?.count ?? 0) / 3, 0),
    dispose: () => Object.values(geometries).forEach((g) => g.dispose()),
  };
}
function append(target: Surface, source: Surface) {
  const offset = target.positions.length / 3;
  target.positions.push(...source.positions);
  target.indices.push(...source.indices.map((i) => i + offset));
}
function patch(target: Surface, points: Point[]) {
  const r = target.ring(points);
  target.face(r[0]!, r[1]!, r[2]!);
  target.face(r[0]!, r[2]!, r[3]!);
}
/** Consistent winding across branching profile joins. Each connected shell gets positive volume. */
function orient(surface: Surface) {
  const edges = new Map<string, { face: number; sign: number }[]>();
  const count = surface.indices.length / 3;
  for (let f = 0; f < count; f++)
    for (let j = 0; j < 3; j++) {
      const a = surface.indices[f * 3 + j]!,
        b = surface.indices[f * 3 + ((j + 1) % 3)]!;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const e = edges.get(key) ?? [];
      e.push({ face: f, sign: a < b ? 1 : -1 });
      edges.set(key, e);
    }
  const neighbors = Array.from({ length: count }, () => [] as { face: number; flip: boolean }[]);
  edges.forEach((e) => {
    if (e.length === 2) {
      const a = e[0]!,
        b = e[1]!;
      neighbors[a.face]!.push({ face: b.face, flip: a.sign === b.sign });
      neighbors[b.face]!.push({ face: a.face, flip: a.sign === b.sign });
    }
  });
  const visited = new Map<number, boolean>();
  for (let seed = 0; seed < count; seed++) {
    if (visited.has(seed)) continue;
    const stack = [seed],
      component: number[] = [];
    visited.set(seed, false);
    while (stack.length) {
      const f = stack.pop()!;
      component.push(f);
      for (const n of neighbors[f]!)
        if (!visited.has(n.face)) {
          visited.set(n.face, visited.get(f)! !== n.flip);
          stack.push(n.face);
        }
    }
    let volume = 0;
    for (const f of component) {
      const ids = surface.indices.slice(f * 3, f * 3 + 3);
      if (visited.get(f)) [ids[1], ids[2]] = [ids[2]!, ids[1]!];
      const [a, b, c] = ids.map((i) => surface.point(i));
      volume +=
        a![0] * (b![1] * c![2] - b![2] * c![1]) +
        a![1] * (b![2] * c![0] - b![0] * c![2]) +
        a![2] * (b![0] * c![1] - b![1] * c![0]);
    }
    for (const f of component)
      if (visited.get(f)! !== volume < 0) {
        const i = f * 3;
        [surface.indices[i + 1], surface.indices[i + 2]] = [
          surface.indices[i + 2]!,
          surface.indices[i + 1]!,
        ];
      }
  }
}
