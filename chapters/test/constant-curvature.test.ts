import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@rsvis/math';
import { angleAt, distance, geodesicPoint, isometryTo0, spreadExact, triangleArea, type Cx } from '../src/math/constant-curvature';
import { conformalLC, geodesicTransport } from '../src/math/linear-connections';

const rng = mulberry32(2401);
const r = () => 2 * rng() - 1;
/** a point well inside the chart: |k||z|² ≤ 0.36 */
const pt = (k: number): Cx => {
  const R = 0.6 / Math.sqrt(Math.max(Math.abs(k), 1));
  const a = 2 * Math.PI * rng();
  const s = R * Math.sqrt(rng());
  return [s * Math.cos(a), s * Math.sin(a)];
};
const d2 = (a: Cx, b: Cx) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('Station 2.4a — constant curvature: triangles and spreading geodesics (§2.4)', () => {
  it('T_p is an isometry: T_p(p) = 0 and distances are preserved', () => {
    for (let n = 0; n < 200; n++) {
      const k = r();
      const [p, z, w] = [pt(k), pt(k), pt(k)];
      const { T, Tinv } = isometryTo0(k, p);
      expect(d2(T(p), [0, 0])).toBeLessThan(1e-15);
      expect(d2(Tinv(T(z)), z)).toBeLessThan(1e-14);
      // distance via T_z directly vs after moving everything by T_p: closed forms, roundoff only
      expect(Math.abs(distance(k, T(z), T(w)) - distance(k, z, w))).toBeLessThan(1e-12);
    }
  });

  it('the exact segments are geodesics of conformalLC(k) (Station 2.1a’s ODE lands on the endpoint)', () => {
    for (let n = 0; n < 30; n++) {
      const k = r();
      const [p, q] = [pt(k), pt(k)];
      const d = distance(k, p, q);
      // initial direction from the isometry: T_p⁻¹′(0) is real, so the direction of T_p(q)
      const w = isometryTo0(k, p).T(q);
      const lam = 2 / (1 + k * (p[0] ** 2 + p[1] ** 2));
      const v0: [number, number] = [w[0] / Math.hypot(...w) / lam, w[1] / Math.hypot(...w) / lam];
      const g = geodesicTransport(conformalLC(k), p, v0, [], d, 400);
      // RK4, 400 steps over a path of length ≲ 2: error ~ (d/400)⁴·C ≲ 1e-10
      expect(d2(g.x[400], q)).toBeLessThan(1e-8);
    }
  });

  it('Gauss–Bonnet for geodesic triangles: (α + β + γ) − π = k · Area', () => {
    for (let n = 0; n < 200; n++) {
      const k = 2 * r();
      const [a, b, c] = [pt(k), pt(k), pt(k)];
      const excess = angleAt(k, a, b, c) + angleAt(k, b, c, a) + angleAt(k, c, a, b) - Math.PI;
      const A = triangleArea(k, a, b, c);
      // Simpson with N = 200 per side on smooth integrands: O(N⁻⁴) ≈ 1e-9 relative
      expect(Math.abs(excess - k * A)).toBeLessThan(1e-8);
    }
  });

  it('flat triangles: angle sum π and the Euclidean area (scaled by λ² = 4)', () => {
    for (let n = 0; n < 50; n++) {
      const [a, b, c] = [pt(0), pt(0), pt(0)];
      const sum = angleAt(0, a, b, c) + angleAt(0, b, c, a) + angleAt(0, c, a, b);
      expect(Math.abs(sum - Math.PI)).toBeLessThan(1e-12);
      const shoelace = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
      expect(Math.abs(triangleArea(0, a, b, c) - 4 * shoelace)).toBeLessThan(1e-12);
    }
  });

  it('geodesics spread by the law of cosines of curvature k: sin, linear, sinh (Jacobi)', () => {
    for (let n = 0; n < 200; n++) {
      const k = r();
      const p = pt(k);
      const [a, delta] = [2 * Math.PI * rng(), 1.5 * rng()];
      const t = 0.3 + 0.9 * rng();
      const d = distance(k, geodesicPoint(k, p, a, t), geodesicPoint(k, p, a + delta, t));
      expect(Math.abs(d - spreadExact(k, delta, t))).toBeLessThan(1e-10);
      expect(Math.abs(distance(k, p, geodesicPoint(k, p, a, t)) - t)).toBeLessThan(1e-12);
    }
  });
});
