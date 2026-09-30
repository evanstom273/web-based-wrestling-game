import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

/** One bounded subdivision pass. Smooth limb silhouettes; preserve face landmarks and flat soles. */
export function refineGeometry(source: BufferGeometry): BufferGeometry {
  const p = source.getAttribute('position'),
    region = source.getAttribute('region');
  const positions = Array.from({ length: p.count }, (_, i) =>
    new Vector3().fromBufferAttribute(p, i),
  );
  const regions = Array.from({ length: p.count }, (_, i) => region?.getX(i) ?? 0);
  const edges = new Map<string, { a: number; b: number; opposite: number[]; id: number }>();
  const neighbors = Array.from({ length: p.count }, () => new Set<number>());
  const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const index = source.index!;
  for (let i = 0; i < index.count; i += 3) {
    const face = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    for (let j = 0; j < 3; j++) {
      const a = face[j]!,
        b = face[(j + 1) % 3]!,
        opposite = face[(j + 2) % 3]!;
      const k = key(a, b),
        edge = edges.get(k) ?? { a, b, opposite: [], id: -1 };
      edge.opposite.push(opposite);
      edges.set(k, edge);
      neighbors[a]!.add(b);
      neighbors[b]!.add(a);
    }
  }
  const maxY = Math.max(...positions.map((p) => p.y));
  const strength = (i: number) =>
    positions[i]!.y < 0.06 || positions[i]!.y > maxY - 0.015 ? 0 : regions[i] === 5 ? 0.3 : 0.65;
  const refined = positions.map((point, i) => {
    const ring = [...neighbors[i]!];
    const beta = ring.length === 3 ? 3 / 16 : 3 / (8 * ring.length);
    const smoothed = point.clone().multiplyScalar(1 - ring.length * beta);
    ring.forEach((j) => smoothed.addScaledVector(positions[j]!, beta));
    return point.clone().lerp(smoothed, strength(i));
  });
  for (const edge of edges.values()) {
    const midpoint = positions[edge.a]!.clone().add(positions[edge.b]!).multiplyScalar(0.5);
    if (edge.opposite.length === 2) {
      const curved = positions[edge.a]!.clone().add(positions[edge.b]!).multiplyScalar(0.375);
      edge.opposite.forEach((j) => curved.addScaledVector(positions[j]!, 0.125));
      midpoint.lerp(curved, Math.min(strength(edge.a), strength(edge.b)));
    }
    edge.id = refined.length;
    refined.push(midpoint);
    regions.push(regions[edge.a] === regions[edge.b] ? regions[edge.a]! : 0);
  }
  const indices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i),
      b = index.getX(i + 1),
      c = index.getX(i + 2);
    const ab = edges.get(key(a, b))!.id,
      bc = edges.get(key(b, c))!.id,
      ca = edges.get(key(c, a))!.id;
    indices.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      refined.flatMap((p) => p.toArray()),
      3,
    ),
  );
  geometry.setAttribute('region', new Float32BufferAttribute(regions, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
