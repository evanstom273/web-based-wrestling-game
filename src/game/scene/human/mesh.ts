import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
export type Point = [number, number, number];
/** Indexed surface builder: adjacent anatomical regions share boundary vertex IDs. */
export class Surface {
  region = 0;
  regions: number[] = [];
  positions: number[] = [];
  colors: number[] = [];
  colored = false;
  indices: number[] = [];
  vertex(p: Point, color?: Point): number {
    if (color) this.colored = true;
    this.colors.push(...(color ?? [1, 1, 1]));
    const id = this.positions.length / 3;
    this.positions.push(...p);
    this.regions.push(this.region);
    return id;
  }
  point(i: number): Point {
    return [this.positions[i * 3]!, this.positions[i * 3 + 1]!, this.positions[i * 3 + 2]!];
  }
  face(a: number, b: number, c: number) {
    this.indices.push(a, b, c);
  }
  join(a: number[], b: number[]) {
    if (a.length !== b.length) throw new Error('Profile boundaries must match');
    a.forEach((v, i) => {
      const j = (i + 1) % a.length;
      this.face(v, b[i]!, a[j]!);
      this.face(a[j]!, b[i]!, b[j]!);
    });
  }
  /** Stitch loops of unequal resolution without duplicating their boundary vertices. */
  bridge(a: number[], b: number[]) {
    let i = 0,
      j = 0;
    while (i < a.length || j < b.length) {
      const nextA = (i + 1) / a.length,
        nextB = (j + 1) / b.length;
      if (nextA < nextB) {
        this.face(a[i % a.length]!, b[j % b.length]!, a[(i + 1) % a.length]!);
        i++;
      } else {
        this.face(a[i % a.length]!, b[j % b.length]!, b[(j + 1) % b.length]!);
        j++;
      }
    }
  }
  ring(points: Point[]): number[] {
    return points.map((p) => this.vertex(p));
  }
  cap(ring: number[], reverse = false) {
    const center = new Vector3();
    ring.forEach((i) => center.add(new Vector3(...this.point(i))));
    center.divideScalar(ring.length);
    const id = this.vertex(center.toArray() as Point);
    ring.forEach((v, i) => {
      const next = ring[(i + 1) % ring.length]!;
      if (reverse) this.face(id, next, v);
      else this.face(id, v, next);
    });
  }
  geometry(): BufferGeometry {
    const remap = new Map<number, number>();
    const positions: number[] = [];
    const colors: number[] = [];
    const regions: number[] = [];
    const indices = this.indices.map((id) => {
      const old = remap.get(id);
      if (old !== undefined) return old;
      const next = positions.length / 3;
      positions.push(...this.point(id));
      regions.push(this.regions[id]!);
      colors.push(...this.colors.slice(id * 3, id * 3 + 3));
      remap.set(id, next);
      return next;
    });
    const g = new BufferGeometry();
    g.setAttribute('region', new Float32BufferAttribute(regions, 1));
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    if (this.colored) g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    return g;
  }
}
export function ellipse(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  count = 24,
): Point[] {
  return Array.from({ length: count }, (_, j) => {
    const a = (j / count) * Math.PI * 2;
    return [x + w * Math.cos(a), y, z + d * Math.sin(a)];
  });
}
/** Profiles run bottom to top; clockwise when viewed from above gives outward faces. */
export function loft(profiles: Point[][]): Surface {
  const s = new Surface();
  let previous: number[] | undefined;
  profiles.forEach((p) => {
    const ring = s.ring(p);
    if (previous) s.join(previous, ring);
    else s.cap(ring, true);
    previous = ring;
  });
  if (previous) s.cap(previous);
  return s;
}

export function appendSurface(target: Surface, source: Surface) {
  const offset = target.positions.length / 3;
  target.positions.push(...source.positions);
  target.regions.push(...source.regions.map((r) => r || target.region));
  target.colors.push(...source.colors);
  target.indices.push(...source.indices.map((i) => i + offset));
}
export function patchSurface(
  target: Surface,
  points: Point[],
  color: Point = [0.035, 0.025, 0.02],
) {
  const r = points.map((p) => target.vertex(p, color));
  target.face(r[0]!, r[1]!, r[2]!);
  target.face(r[0]!, r[2]!, r[3]!);
}
/** Consistent winding across branching profile joins. Each connected shell gets positive volume. */
export function orientShells(surface: Surface) {
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
