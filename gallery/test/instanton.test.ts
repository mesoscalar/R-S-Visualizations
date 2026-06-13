import { describe, expect, it } from 'vitest';
import { integrateR4Radial } from '@rsvis/math';
import {
  bpstRadial,
  sliceGrid,
  slicePeak,
  totalCharge,
  totalCharge4D,
  type Vec4,
} from '../src/math/instanton';

describe('Widget 6 — BPST instanton density kernel', () => {
  it('analytic check: ∫ d⁴x (|x|²+ρ²)⁻⁴ = π²/(6ρ⁴) for ρ = ½, 1, 2 (1e-10)', () => {
    for (const rho of [0.5, 1, 2]) {
      const v = integrateR4Radial((r) => (r * r + rho * rho) ** -4, 200);
      // GL-200 with the rational tail map: error is roundoff-level for these
      // smooth rational integrands (measured ~1e-15 relative).
      expect(Math.abs(v - Math.PI ** 2 / (6 * rho ** 4))).toBeLessThan(1e-10 / rho ** 4);
    }
  });

  // Spec: 4D quadrature of q equals 1 to 1e-4 (radial reduction).
  it('total charge = 1 to 1e-4 (radial reduction; actual ~1e-12) for many ρ', () => {
    for (const rho of [0.3, 0.5, 1, 1.7, 3]) {
      const c = totalCharge(rho);
      expect(Math.abs(c - 1)).toBeLessThan(1e-4); // spec tolerance
      expect(Math.abs(c - 1)).toBeLessThan(1e-10); // actual headroom
    }
  });

  it('scheme cross-check: full 4D tensor quadrature with offset centre agrees', () => {
    // Independent of the radial trick: rational-mapped GL per axis. Measured
    // convergence: 7.2e-5 / 1.1e-6 / 9.6e-8 / 1.6e-8 at n = 16/24/32/40 per
    // axis — geometric, as expected for a smooth integrand. n = 32 with
    // tolerance 1e-6 leaves a 10x margin.
    const a: Vec4 = [0.3, -0.2, 0.5, 0.1];
    const c = totalCharge4D(a, 1, 32);
    expect(Math.abs(c - 1)).toBeLessThan(1e-6);
  });

  it('the ρ-squeeze: density concentrates (peak ∝ ρ⁻⁴) while charge stays 1', () => {
    const peak = (rho: number) => bpstRadial(0, rho);
    expect(peak(0.25) / peak(0.5)).toBeCloseTo(16, 10); // halving rho: peak x16
    expect(Math.abs(totalCharge(0.25) - totalCharge(0.5))).toBeLessThan(1e-10);
  });

  // Spec: slice renderer's sampled max location equals a.
  it('slice max sits at the centre a, with the analytic peak value', () => {
    const a: Vec4 = [0.4, -0.3, 0.2, 0.15];
    for (const x4 of [0.15, 0.6]) {
      const m = 31; // odd: the grid contains (a1, a2, a3) exactly
      const g = sliceGrid(a, 0.8, x4, 2, m);
      expect(g.argmax).toEqual([(m - 1) / 2, (m - 1) / 2, (m - 1) / 2]);
      expect(Math.abs(g.max - slicePeak(a, 0.8, x4))).toBeLessThan(1e-14);
    }
  });
});
