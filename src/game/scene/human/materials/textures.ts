import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from 'three';
export type SurfaceKind = 'skin' | 'hair' | 'fabric' | 'tape' | 'leather';
const TAU = Math.PI * 2;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
// Integer hash: reproducible across browsers, independent of Math.random and saved colour choices.
function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(u: number, v: number, cells: number, seed: number) {
  const x = u * cells,
    y = v * cells,
    ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = x - ix,
    fy = y - iy,
    sx = fx * fx * (3 - 2 * fx),
    sy = fy * fy * (3 - 2 * fy);
  const at = (a: number, b: number) =>
    hash(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, seed);
  const a = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx;
  const b = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx;
  return a * (1 - sy) + b * sy;
}
/** Packed linear data: R albedo modulation, G roughness, B relief, A reserved. No image downloads. */
export function generateSurfacePixels(kind: SurfaceKind, size = kind === 'hair' ? 512 : 256) {
  if (!Number.isInteger(size) || size < 16 || size > 1024 || (size & (size - 1)) !== 0)
    throw new RangeError('Texture size must be a power of two from 16 to 1024');
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      const broad = noise(u, v, 8, 17),
        grain = noise(u, v, 64, 41);
      let value = 0.8,
        rough = 0.6,
        height = grain;
      if (kind === 'skin') {
        const pore = Math.max(0, (grain - 0.58) * 2.3);
        value = 0.86 + (broad - 0.5) * 0.06 - pore * 0.04;
        rough = 0.52 + grain * 0.18;
        height = 0.55 - pore * 0.45;
      } else if (kind === 'hair') {
        const bend = 0.004 * Math.sin(v * TAU) + 0.002 * Math.sin(v * TAU * 3);
        const strand = Math.pow(noise(u + bend, 0.5 + Math.sin(v * TAU) * 0.02, 256, 7), 1.6);
        const lock = noise(u, 0.5 + Math.sin(v * TAU) * 0.035, 32, 31);
        value = 0.5 + lock * 0.32 + strand * 0.18;
        rough = 0.5 + (1 - strand) * 0.18;
        height = strand * 0.6 + lock * 0.4;
      } else if (kind === 'fabric') {
        const warp = Math.sin(u * TAU * 64),
          weft = Math.sin(v * TAU * 64);
        const weave = warp * weft;
        value = 0.85 + weave * 0.09 + (broad - 0.5) * 0.025;
        rough = 0.57 + weave * 0.08;
        height = 0.5 + weave * 0.3;
      } else if (kind === 'tape') {
        const fiber = Math.sin(u * TAU * 80 + grain * 2) * Math.sin(v * TAU * 48);
        value = 0.9 + fiber * 0.07 + (grain - 0.5) * 0.04;
        rough = 0.88 + fiber * 0.04;
        height = 0.5 + fiber * 0.25;
      } else {
        const crease = Math.pow(Math.abs(grain - 0.5) * 2, 0.55);
        value = 0.7 + broad * 0.15 + crease * 0.12;
        rough = 0.34 + grain * 0.17;
        height = 0.3 + crease * 0.5;
      }
      const i = (y * size + x) * 4;
      data[i] = Math.round(clamp(value) * 255);
      data[i + 1] = Math.round(clamp(rough) * 255);
      data[i + 2] = Math.round(clamp(height) * 255);
      data[i + 3] = 255;
    }
  return { data, size };
}
export function createSurfaceTextures(anisotropy = 4) {
  const textures = Object.fromEntries(
    (['skin', 'hair', 'fabric', 'tape', 'leather'] as const).map((kind) => {
      const { data, size } = generateSurfacePixels(kind);
      const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
      texture.name = `procedural-${kind}`;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.max(1, Math.min(8, anisotropy));
      texture.needsUpdate = true;
      return [kind, texture];
    }),
  ) as Record<SurfaceKind, DataTexture>;
  return { textures, dispose: () => Object.values(textures).forEach((t) => t.dispose()) };
}
