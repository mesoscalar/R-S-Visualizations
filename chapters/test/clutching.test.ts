import { describe, expect, it } from 'vitest';
import { mulberry32, type Quat } from '@rsvis/math';
import { chernNumber, clutchingCurve, smoothStep, su2Clutching, su2Degree, winding } from '../src/math/clutching';

const rng = mulberry32(3301);

describe('Station 3.3a — bundles over spheres by clutching (§3.3)', () => {
  it('the smooth step has ∫β′ = 1 and vanishes near both poles', () => {
    const { beta } = smoothStep(0.4, Math.PI - 0.4);
    expect(beta(0.3)).toBe(0);
    expect(beta(Math.PI - 0.3)).toBe(1);
    expect(Math.abs(beta(Math.PI / 2) - 0.5)).toBeLessThan(1e-15);
  });

  it('Cor. 3.3.5: homotopies inside U(1) never change the winding, nor the Chern number −winding', () => {
    for (let k = 0; k < 40; k++) {
      const n = Math.floor(7 * rng()) - 3;
      const A = 3 * rng();
      const m = 1 + Math.floor(4 * rng());
      const g = clutchingCurve(n, A, m, 0);
      expect(winding(g.c)).toBeCloseTo(n, 10);
      // midpoint rules: periodic in φ (spectral), compactly supported smooth β′ in θ — measured ≤ 1e-12
      expect(Math.abs(chernNumber(g.w) + n)).toBeLessThan(1e-9);
    }
  });

  it('leaving the group can change the class: c + εb winds n times for |εb| < 1 and 0 times for |εb| > 1', () => {
    for (const n of [1, 2, 3]) {
      const b: [number, number] = [0.6, 0.8]; // |b| = 1
      expect(Math.round(winding(clutchingCurve(n, 0, 1, 0.9, b).c)) + 0).toBe(n);
      expect(Math.round(winding(clutchingCurve(n, 0, 1, 1.1, b).c)) + 0).toBe(0);
    }
  });

  it('Ex. 3.4.13: SU(2) clutching maps over S⁴ have integer degree — kept while qⁿ + εp cannot vanish (|εp| < 1), lost once it can', () => {
    const p: Quat = [0.3, -0.5, 0.6, 0.2]; // |p| ≈ 0.86
    for (const [n, eps, want] of [
      [1, 0, 1],
      [2, 0, 2],
      [-1, 0, -1],
      [1, 0.5, 1],
      [2, 0.5, 2],
      [-1, 0.5, -1],
      [1, 1.4, 0],
    ] as const) {
      // degree quadrature on 24·24·48 nodes: measured error ≤ 1.7e-4 on these maps (largest for ε = 1.4, where
      // |qⁿ + εp| gets small on part of S³); near-singular deformations need finer grids
      // (n = 2, ε = 0.9: 3e-2 at 24·24·48, 1.7e-3 at 40·40·80), so they are not used here
      expect(Math.abs(su2Degree(su2Clutching(n, eps, p)) - want)).toBeLessThan(1e-3);
    }
  });
});
