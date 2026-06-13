import { describe, expect, it } from 'vitest';
import {
  gaussLegendre,
  integrateGL,
  integratePeriodic,
  integrateR4Radial,
  integrateS2,
  integrateS3,
} from '../src/math/quadrature';

describe('Gauss–Legendre', () => {
  it('weights sum to 2 and rule is exact on degree 2n-1 polynomials', () => {
    for (const n of [2, 5, 10, 30]) {
      const { weights } = gaussLegendre(n);
      let s = 0;
      for (const w of weights) s += w;
      expect(Math.abs(s - 2)).toBeLessThan(1e-14);
      // integral of x^(2n-1) over [0,1] = 1/(2n) — top degree the rule must nail.
      const k = 2 * n - 1;
      const v = integrateGL((x) => x ** k, 0, 1, n);
      expect(Math.abs(v - 1 / (k + 1))).toBeLessThan(1e-14);
    }
  });

  it('converges spectrally on an analytic integrand', () => {
    // integral of e^x over [0,1] = e - 1; 12 nodes already at machine precision.
    const v = integrateGL(Math.exp, 0, 1, 12);
    expect(Math.abs(v - (Math.E - 1))).toBeLessThan(1e-14);
  });
});

describe('periodic trapezoid', () => {
  it('is spectrally accurate for smooth periodic integrands', () => {
    // integral over [0, 2 pi) of e^{cos x} dx = 2 pi I_0(1) = 7.95492652101284527...
    const exact = 7.954926521012845274513219665329394328161342771816638; // 2*pi*I0(1)
    const v = integratePeriodic((x) => Math.exp(Math.cos(x)), 32);
    expect(Math.abs(v - exact)).toBeLessThan(1e-13);
  });
});

describe('sphere quadrature', () => {
  it('integrates 1 over S^2 to 4 pi (1e-13)', () => {
    // GL in cos(theta) + periodic trapezoid in phi is exact for constants up to roundoff.
    const v = integrateS2(() => 1, 32, 64);
    expect(Math.abs(v - 4 * Math.PI)).toBeLessThan(1e-13);
  });

  it('integrates cos^2(theta) over S^2 to 4 pi / 3 (1e-13)', () => {
    const v = integrateS2((th) => Math.cos(th) ** 2, 32, 64);
    expect(Math.abs(v - (4 * Math.PI) / 3)).toBeLessThan(1e-13);
  });

  it('kills spherical harmonics: integral of Y-like sin(theta)cos(phi) vanishes', () => {
    const v = integrateS2((th, ph) => Math.sin(th) * Math.cos(ph), 32, 64);
    expect(Math.abs(v)).toBeLessThan(1e-13);
  });
});

describe('S^3 quadrature', () => {
  it('integrates 1 over S^3 to 2 pi^2 (1e-12)', () => {
    const v = integrateS3(() => 1, 24, 24, 48);
    expect(Math.abs(v - 2 * Math.PI * Math.PI)).toBeLessThan(1e-12);
  });

  it('integrates w^2 over S^3 to pi^2 / 2 (1e-12)', () => {
    // By symmetry each coordinate squared integrates to Vol(S^3)/4 = pi^2/2.
    const v = integrateS3((p) => p[0] * p[0], 24, 24, 48);
    expect(Math.abs(v - (Math.PI * Math.PI) / 2)).toBeLessThan(1e-12);
  });
});

describe('R^4 radial quadrature', () => {
  it('reproduces the BPST normalisation integral for rho = 1', () => {
    // integral over R^4 of (|x|^2 + 1)^{-4} d^4x = pi^2/6 (analytic check from the task spec).
    const v = integrateR4Radial((r) => (r * r + 1) ** -4, 200);
    expect(Math.abs(v - (Math.PI * Math.PI) / 6)).toBeLessThan(1e-12);
  });

  it('integrates the Gaussian e^{-r^2} to pi^2 (1e-10)', () => {
    // integral over R^4 of e^{-|x|^2} = pi^2; the rational map handles the tail.
    const v = integrateR4Radial((r) => Math.exp(-r * r), 200);
    expect(Math.abs(v - Math.PI * Math.PI)).toBeLessThan(1e-10);
  });
});
