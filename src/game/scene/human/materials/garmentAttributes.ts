import { BufferGeometry, Float32BufferAttribute } from 'three';
/** Preserve panel identity after batching. Boundary distance is a lightweight seam mask. */
export function addGarmentAttributes(geometry: BufferGeometry, name: string) {
  const p = geometry.getAttribute('position'),
    index = geometry.index!;
  const tag = name.includes('tape') ? 1 : name === 'knee pads' ? 2 : 0;
  const keys = Array.from({ length: p.count }, (_, i) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 100000)).join(','),
  );
  const edges = new Map<string, { count: number; a: string; b: string }>();
  for (let i = 0; i < index.count; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = keys[index.getX(i + j)]!,
        b = keys[index.getX(i + ((j + 1) % 3))]!;
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      const edge = edges.get(key) ?? { count: 0, a, b };
      edge.count++;
      edges.set(key, edge);
    }
  const boundary = new Set<string>();
  edges.forEach((e) => {
    if (e.count === 1) {
      boundary.add(e.a);
      boundary.add(e.b);
    }
  });
  geometry.setAttribute(
    'surfaceTag',
    new Float32BufferAttribute(new Float32Array(p.count).fill(tag), 1),
  );
  geometry.setAttribute(
    'edgeDistance',
    new Float32BufferAttribute(
      keys.map((k) => (boundary.has(k) ? 0 : 0.018)),
      1,
    ),
  );
}
