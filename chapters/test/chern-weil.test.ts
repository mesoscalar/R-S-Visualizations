import { describe, expect, it } from 'vitest';
import { bpstScaled, bulkCharge, chernNumber, coefficient, csFlux, density, pureGauge, transgression } from '../src/math/chern-weil';

/**
 * The midpoint rule for the flux is O(N⁻²) (errors at N = 16 and 24 differ by the factor 2.25 to three digits),
 * so one Richardson step removes it: measured ≤ 8.0e-7 on the cases below.
 */
const fluxRichardson = (A: Parameters<typeof csFlux>[0], R: number) => (2.25 * csFlux(A, R, 24) - csFlux(A, R, 16)) / 1.25;

describe('Station 4.6a — Chern–Weil forms (§4.6)', () => {
  it('Lemma 4.6.5: 𝓕_t − 𝓕_0 = d(tβ) pointwise, with tβ vanishing at both poles', () => {
    for (const t of [0.2, 0.5, 1]) {
      for (let k = 1; k < 40; k++) {
        const th = (Math.PI * k) / 40;
        const h = 1e-5;
        const dT = (transgression(t, th + h) - transgression(t, th - h)) / (2 * h);
        const dA = (coefficient(t, th + h) - coefficient(t, th - h)) / (2 * h) - (coefficient(0, th + h) - coefficient(0, th - h)) / (2 * h);
        // central differences, h = 1e-5, of smooth profiles: ≲ 1e-9
        expect(Math.abs(dT - dA)).toBeLessThan(1e-8);
      }
      expect(Math.abs(transgression(t, 1e-9)) + Math.abs(transgression(t, Math.PI - 1e-9))).toBeLessThan(1e-8);
    }
  });

  it('Thm. 4.6.11: c₁ = −1 for every connection of the family, although the density changes', () => {
    for (const t of [0, 0.3, 0.7, 1]) expect(Math.abs(chernNumber(t) + 1)).toBeLessThan(1e-10);
    expect(Math.abs(density(1, 1.0) - density(0, 1.0))).toBeGreaterThan(0.05);
  });

  it('the BPST charge inside R in bulk equals the Chern–Simons flux through |x| = R, for several scales λ', () => {
    for (const [lam, R] of [
      [1, 0.7],
      [1, 1.5],
      [0.6, 1.0],
      [1.8, 2.0],
    ]) {
      const A = bpstScaled(lam);
      const bulk = bulkCharge(A, R);
      const u = 1 + (R / lam) ** 2;
      const exact = 1 - 3 / u ** 2 + 2 / u ** 3;
      // Simpson on 200 panels of a smooth radial integrand (FD curvature): measured ≤ 2.2e-9
      expect(Math.abs(bulk - exact)).toBeLessThan(1e-7);
      expect(Math.abs(fluxRichardson(A, R) - bulk)).toBeLessThan(1e-5);
    }
  });

  it('at infinity: the Chern–Simons flux of the pure gauge Im(x̄dx)/|x|² through S³ is the total charge 1', () => {
    expect(Math.abs(fluxRichardson(pureGauge, 1) - 1)).toBeLessThan(1e-5);
  });
});
