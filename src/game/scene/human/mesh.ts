import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
export type Point = [number, number, number];
/** Indexed surface builder: adjacent anatomical regions share boundary vertex IDs. */
export class Surface {
  positions: number[] = [];
  indices: number[] = [];
  vertex(p: Point): number {
    const id = this.positions.length / 3;
    this.positions.push(...p);
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
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setIndex(this.indices);
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
