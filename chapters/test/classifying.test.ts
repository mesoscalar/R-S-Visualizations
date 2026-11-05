import { describe, expect, it } from 'vitest';
import { hopfMap, mulberry32, type Vec3 } from '@rsvis/math';
import { classMap, degreeS2, jacobian, lift, preimages, type MapParams } from '../src/math/classifying';
import { chernNumber, clutchingCurve } from '../src/math/clutching';

const rng = mulberry32(3401);
const d3 = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const randS2 = (): Vec3 => {
  const z = 2 * rng() - 1;
  const a = 2 * Math.PI * rng();
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), s * Math.sin(a), z];
};
const randS3 = () => {
  const v = [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const n = Math.hypot(...v);
  return v.map((c) => c / n);
};

describe('Station 3.4a — universal bundles and classification (§3.4)', () => {
  it('the lift F covers f: h∘F = f∘h on S³, so f is well defined on CP¹', () => {
    for (let k = 0; k < 200; k++) {
      const p: MapParams = { n: Math.floor(6 * rng()) - 2 || 1, t: rng(), s: 0 };
      const z = randS3();
      expect(d3(hopfMap(lift(p, z)), classMap(p)(hopfMap(z)))).toBeLessThan(1e-12);
    }
  });

  it('the degree of f by the area integral (1/4π)∫f*dA is n, for every t and target rotation s (homotopy invariance)', () => {
    for (const n of [-2, -1, 0, 1, 2, 3]) {
      for (const [t, s] of [
        [0, 0],
        [0.7, 1.1],
      ]) {
        // midpoint rule, 120 × 240 cells, FD Jacobians (h = 1e-5): measured error ≤ 2.9e-5 over these 12 maps
        expect(Math.abs(degreeS2(classMap({ n, t, s })) - n)).toBeLessThan(2e-3);
      }
    }
  });

  it('signed preimage count: a generic point has |n| preimages, each with Jacobian sign = sign n', () => {
    for (let k = 0; k < 20; k++) {
      const p: MapParams = { n: [1, 2, 3, -1, -2][k % 5], t: rng(), s: 0 };
      const y = randS2();
      const pre = preimages(p, y);
      expect(pre.length).toBe(Math.abs(p.n));
      const f = classMap(p);
      for (const x of pre) {
        expect(d3(f(x), y)).toBeLessThan(1e-9);
        expect(Math.sign(jacobian(f, x))).toBe(Math.sign(p.n));
      }
    }
  });

  it('Thm. 3.4.23 in miniature: c₁(f*Hopf) = −deg f equals c₁ of the clutched bundle of winding deg f (Station 3.3a)', () => {
    for (const n of [-2, -1, 0, 1, 2]) {
      // c₁(f*Hopf) = (i/2π)∫f*𝓕 with 𝓕 = (i/2) dA, i.e. −(1/4π)∫f*dA
      const c1Pullback = -degreeS2(classMap({ n, t: 0.5, s: 0.4 }));
      const c1Clutch = chernNumber(clutchingCurve(n, 0.8, 2, 0).w);
      // the degree quadrature dominates (≤ 2.9e-5 measured); the clutching integral is exact to roundoff
      expect(Math.abs(c1Pullback - c1Clutch)).toBeLessThan(2e-3);
    }
  });
});
