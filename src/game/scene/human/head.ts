import { ellipse, loft, Surface, appendSurface, patchSurface } from './mesh';
import type { Point } from './mesh';

/** Anatomical skull profiles, minimal inset features and skull-following short crop. */
export function buildHead(
  skin: Surface,
  features: Surface,
  hair: Surface,
  neckBoundary: number[],
  headBase: number,
  headSize: number,
) {
  // Head: angular jaw, cheeks, flattened face, projecting nose and rounded occiput.
  const headScale = headSize * 1.065;
  const headLevels: [number, number, number, number][] = [
    [0, 0.035, 0.06, 0.014],
    [0.014, 0.051, 0.069, 0.007],
    [0.035, 0.065, 0.083, -0.006],
    [0.047, 0.07, 0.083, -0.004],
    [0.06, 0.073, 0.078, -0.001],
    [0.073, 0.076, 0.083, -0.002],
    [0.09, 0.079, 0.086, -0.003],
    [0.105, 0.082, 0.09, -0.006],
    [0.125, 0.081, 0.092, -0.009],
    [0.139, 0.082, 0.096, -0.011],
    [0.17, 0.08, 0.098, -0.014],
    [0.199, 0.067, 0.087, -0.015],
    [0.222, 0.043, 0.061, -0.015],
    [0.235, 0.007, 0.017, -0.015],
  ];
  const headPoints = headLevels.map(([y, w, d, z]) =>
    ellipse(0, headBase + y * headScale, z * headScale, w * headScale, d * headScale, 32).map(
      ([x, yy, zz], j): Point => {
        const sine = Math.sin((j / 32) * Math.PI * 2);
        if (sine > 0) {
          zz = (z + d * Math.pow(sine, 0.58)) * headScale;
          const mid = Math.exp((-x * x) / 0.00012);
          if (y === 0.09) zz += 0.021 * headScale * mid;
          if (y === 0.073) zz += 0.015 * headScale * mid;
          if (y === 0.105) zz += 0.017 * headScale * mid;
          if (y === 0.125) zz += 0.008 * headScale * mid;
          if (y === 0.047) zz += 0.006 * headScale * Math.exp((-x * x) / 0.0008);
          if (y === 0.125)
            zz -= 0.006 * headScale * Math.exp(-((Math.abs(x) - 0.037) ** 2) / 0.0001);
        }
        if (y < 0.06)
          yy += (1 - Math.sin((j / 32) * Math.PI * 2)) * 0.017 * (1 - y / 0.06) * headScale;
        return [x, yy, zz];
      },
    ),
  );
  let headBoundary = neckBoundary;
  for (const points of headPoints) {
    const next = skin.ring(points);
    skin.bridge(headBoundary, next);
    headBoundary = next;
  }
  skin.cap(headBoundary);

  for (const side of [-1, 1]) {
    appendSurface(
      skin,
      loft(
        [
          [0.055, 0.011, 0.011],
          [0.07, 0.012, 0.018],
          [0.102, 0.013, 0.019],
          [0.125, 0.01, 0.013],
        ].map(([y, w, d]) =>
          ellipse(
            side * 0.083 * headScale,
            headBase + y! * headScale,
            -0.005,
            w! * headScale,
            d! * headScale,
            10,
          ),
        ),
      ),
    );
    // Small inset eye and brow planes. Geometry, no textures.
    patchSurface(features, [
      [side * 0.017, headBase + 0.127 * headScale, 0.086 * headScale],
      [side * 0.054, headBase + 0.129 * headScale, 0.079 * headScale],
      [side * 0.052, headBase + 0.12 * headScale, 0.086 * headScale],
      [side * 0.019, headBase + 0.12 * headScale, 0.088 * headScale],
    ]);
    patchSurface(
      features,
      [
        [side * 0.022 * headScale, headBase + 0.127 * headScale, 0.091 * headScale],
        [side * 0.049 * headScale, headBase + 0.126 * headScale, 0.086 * headScale],
        [side * 0.047 * headScale, headBase + 0.12 * headScale, 0.087 * headScale],
        [side * 0.023 * headScale, headBase + 0.12 * headScale, 0.091 * headScale],
      ],
      [0.52, 0.48, 0.4],
    );
    patchSurface(features, [
      [side * 0.032 * headScale, headBase + 0.127 * headScale, 0.092 * headScale],
      [side * 0.039 * headScale, headBase + 0.127 * headScale, 0.091 * headScale],
      [side * 0.039 * headScale, headBase + 0.12 * headScale, 0.091 * headScale],
      [side * 0.032 * headScale, headBase + 0.12 * headScale, 0.092 * headScale],
    ]);
    patchSurface(features, [
      [side * 0.016, headBase + 0.143 * headScale, 0.089 * headScale],
      [side * 0.058, headBase + 0.142 * headScale, 0.087 * headScale],
      [side * 0.055, headBase + 0.137 * headScale, 0.089 * headScale],
      [side * 0.018, headBase + 0.138 * headScale, 0.092 * headScale],
    ]);
  }
  patchSurface(features, [
    [-0.027 * headScale, headBase + 0.04 * headScale, 0.089 * headScale],
    [0.027 * headScale, headBase + 0.04 * headScale, 0.089 * headScale],
    [0.022 * headScale, headBase + 0.036 * headScale, 0.089 * headScale],
    [-0.022 * headScale, headBase + 0.036 * headScale, 0.089 * headScale],
  ]);
  // Short crop follows the head's own surface; its lower edge forms temples and hairline.
  const hairProfiles = headPoints.slice(9).map((points, r) =>
    points.map(([x, y, z], j): Point => {
      const a = (j / 32) * Math.PI * 2;
      const hairline =
        r === 0 ? (Math.sin(a) > 0 ? 0.032 : Math.sin(a) < -0.3 ? -0.035 : 0) : 0.006;
      return [x * 1.035, y + hairline * headScale, z * 1.04 - 0.002];
    }),
  );
  appendSurface(hair, loft(hairProfiles));
}
