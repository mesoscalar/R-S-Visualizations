import { describe, expect, it } from 'vitest';
import {
  aMinusPhi,
  aPlusPhi,
  chernNumber,
  curvatureAreaDensity,
  PERTURBATIONS,
} from '../src/math/monopole';
import { integrateS2, mulberry32 } from '@rsvis/math';

describe('Widget 2 — Chern–Weil on the monopole bundle', () => {
  // Spec: verify the quadrature scheme on the area form first.
  it('scheme check: ∫_{S²} dA = 4π to 1e-12', () => {
    expect(Math.abs(integrateS2(() => 1, 64, 128) - 4 * Math.PI)).toBeLessThan(1e-12);
  });

  it('two-patch structure: A₊ − A₋ = n dφ (pure gauge across the overlap)', () => {
    for (const n of [-2, 1, 3]) {
      for (const th of [0.3, 1.1, Math.PI / 2, 2.6]) {
        expect(Math.abs(aPlusPhi(n, th) - aMinusPhi(n, th) - n)).toBeLessThan(1e-14);
      }
    }
  });

  // Spec: c₁ = n to 1e-8 for n = -2..3 with zero perturbation.
  it('c₁ = n to 1e-8 for n = -2..3, unperturbed', () => {
    for (let n = -2; n <= 3; n++) {
      // Constant area density n/2: GL x trapezoid integrates it exactly up to
      // roundoff, so 1e-8 (spec) is met with ~1e-13 to spare.
      expect(Math.abs(chernNumber(n, []) - n)).toBeLessThan(1e-8);
      expect(Math.abs(chernNumber(n, []) - n)).toBeLessThan(1e-12); // actual headroom
    }
  });

  it('each basis perturbation integrates to zero (Stokes), 1e-12', () => {
    for (const p of PERTURBATIONS) {
      const v = integrateS2((th, ph) => p.q(th, ph), 64, 128);
      expect(Math.abs(v)).toBeLessThan(1e-12);
    }
  });

  // Spec: c₁ = n to 1e-6 for 20 random perturbation settings.
  it('c₁ pinned at n to 1e-6 for 20 seeded random perturbations', () => {
    const rng = mulberry32(2026);
    for (let trial = 0; trial < 20; trial++) {
      const n = Math.floor(rng() * 6) - 2; // n in [-2, 3]
      const lambdas = PERTURBATIONS.map(() => 4 * rng() - 2); // λ ∈ [−2, 2]
      const c1 = chernNumber(n, lambdas);
      // Integrand is a trig polynomial of low degree: the 64x128 product rule is
      // exact up to roundoff, so the spec's 1e-6 has ~6 orders of headroom.
      expect(Math.abs(c1 - n)).toBeLessThan(1e-6);
      expect(Math.abs(c1 - n)).toBeLessThan(1e-11);
    }
  });

  it('the density genuinely sloshes: perturbations change ρ pointwise', () => {
    const rho0 = curvatureAreaDensity(1, [], 1.0, 2.0);
    const rho1 = curvatureAreaDensity(1, [1.5, 0, 0, 0, 0], 1.0, 2.0);
    expect(Math.abs(rho1 - rho0)).toBeGreaterThan(0.5);
  });
});
