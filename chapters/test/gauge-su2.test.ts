import { describe, expect, it } from 'vitest';
import { mulberry32, qconj, qexp, qmul, type Quat } from '@rsvis/math';
import {
  adInv,
  circle,
  composeGauge,
  curvature,
  examplePotential,
  exampleCurvature,
  makeGauge,
  stationGauge,
  transformPotential,
  transportPath,
  wilson,
  type Potential,
} from '../src/math/gauge-su2';

const rng = mulberry32(1808);
const r = () => 2 * rng() - 1;
const dq = (a: Quat, b: Quat) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const zero: Potential = () => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];
// one central difference, h = 1e-5, of O(10)-sized smooth fields: truncation ~1e-9, roundoff ~1e-11
const FD = 1e-7;

/** A random member of the gauge family with random trigonometric angle functions. */
function randomGauge(): ReturnType<typeof makeGauge> {
  const ang = () => {
    const [p, q, s, t] = [r(), r(), 2 * r(), 2 * r()];
    return {
      f: (x: number, y: number) => s * Math.sin(p * x + q * y + t),
      fx: (x: number, y: number) => s * p * Math.cos(p * x + q * y + t),
      fy: (x: number, y: number) => s * q * Math.cos(p * x + q * y + t),
    };
  };
  return makeGauge(1, ang(), ang(), ang());
}

describe('Station 1.8a — non-abelian gauge transformations (§1.8)', () => {
  it('the example potential has the stated curvature (structure equation with the commutator term)', () => {
    for (let k = 0; k < 50; k++) {
      const [a, b, x, y] = [r(), r(), r(), r()];
      expect(dq(curvature(examplePotential(a, b), x, y), exampleCurvature(a, b, x, y))).toBeLessThan(FD);
    }
  });

  it('the closed-form Maurer–Cartan form ρ⁻¹dρ matches finite differences', () => {
    for (let k = 0; k < 50; k++) {
      const g = randomGauge();
      const [x, y] = [r(), r()];
      const rho = g.rho(x, y);
      const h = 1e-5;
      const dx = qmul(qconj(rho), g.rho(x + h, y).map((v, i) => (v - g.rho(x - h, y)[i]) / (2 * h)));
      const dy = qmul(qconj(rho), g.rho(x, y + h).map((v, i) => (v - g.rho(x, y - h)[i]) / (2 * h)));
      const [mx, my] = g.mc(x, y);
      expect(dq(dx, mx)).toBeLessThan(FD);
      expect(dq(dy, my)).toBeLessThan(FD);
    }
  });

  it('pure gauge ρ⁻¹dρ is flat (Maurer–Cartan equation)', () => {
    for (let k = 0; k < 50; k++) {
      const A = transformPotential(zero, randomGauge());
      expect(dq(curvature(A, r(), r()), [0, 0, 0, 0])).toBeLessThan(FD);
    }
  });

  it('(1.8.8) / Rem. 1.8.8: 𝓕 transforms by Ad_{ρ⁻¹} — pointwise rotation, |𝓕| invariant', () => {
    for (let k = 0; k < 50; k++) {
      const A = examplePotential(r(), r());
      const g = randomGauge();
      const [x, y] = [r(), r()];
      const F1 = curvature(transformPotential(A, g), x, y);
      expect(dq(F1, adInv(g.rho(x, y), curvature(A, x, y)))).toBeLessThan(FD);
    }
  });

  it('gauge transformations act: (𝒜^{ρ₁})^{ρ₂} = 𝒜^{ρ₁ρ₂}', () => {
    for (let k = 0; k < 50; k++) {
      const A = examplePotential(r(), r());
      const [g1, g2] = [randomGauge(), randomGauge()];
      const [x, y] = [r(), r()];
      const lhs = transformPotential(transformPotential(A, g1), g2)(x, y);
      const rhs = transformPotential(A, composeGauge(g1, g2))(x, y);
      // closed-form algebra only: roundoff
      expect(Math.max(dq(lhs[0], rhs[0]), dq(lhs[1], rhs[1]))).toBeLessThan(1e-12);
    }
  });

  it('holonomy transforms by conjugation Hol′ = ρ(x₀)⁻¹ Hol ρ(x₀); the Wilson loop tr Hol is gauge invariant', () => {
    for (let k = 0; k < 20; k++) {
      const A = examplePotential(1.5 * r(), r());
      const g = stationGauge(rng(), 1 + rng());
      const loop = circle(0.3 * r(), 0.3 * r(), 0.2 + 0.6 * rng());
      const hol = transportPath(A, loop.c, loop.cd, 800).at(-1)!;
      const hol1 = transportPath(transformPotential(A, g), loop.c, loop.cd, 800).at(-1)!;
      const [x0, y0] = loop.c(0);
      // RK4 with 800 steps on |𝒜(ċ)| ≲ 15: global error ~ (15/800)⁴·15 ≈ 2e-6 worst case
      expect(dq(hol1, adInv(g.rho(x0, y0), hol))).toBeLessThan(1e-5);
      expect(Math.abs(wilson(hol1) - wilson(hol))).toBeLessThan(1e-5);
    }
  });

  it('small loops: (1 − Hol)/area → 𝓕(x₀) at first order in the radius (non-abelian Stokes)', () => {
    const A = examplePotential(1.2, 0.7);
    for (const [x0, y0] of [
      [0.2, -0.3],
      [-0.5, 0.4],
    ]) {
      const F = curvature(A, x0, y0);
      const X = (eps: number): Quat => {
        const loop = circle(x0, y0, eps);
        const hol = transportPath(A, loop.c, loop.cd, 400).at(-1)!;
        const area = Math.PI * eps * eps;
        return [0, -hol[1] / area, -hol[2] / area, -hol[3] / area];
      };
      const [X1, X2, X3] = [0.05, 0.025, 0.0125].map(X);
      const [e1, e2, e3] = [X1, X2, X3].map((v) => dq(v, F));
      // first order: the base point c(0) sits ε off the centre, so the error is ~Cε (measured C ≈ 4.5)
      expect(e1 / e2).toBeGreaterThan(1.6);
      expect(e1 / e2).toBeLessThan(2.4);
      expect(e2 / e3).toBeGreaterThan(1.6);
      expect(e2 / e3).toBeLessThan(2.4);
      // Richardson 2X(ε/2) − X(ε) cancels the O(ε) term; the O(ε²) remainder measured 2.0e-3 at both base points
      const rich: Quat = X3.map((v, i) => 2 * v - X2[i]) as Quat;
      expect(dq(rich, F)).toBeLessThan(5e-3);
    }
  });

  it('qexp sanity: e^{αi} = cos α + i sin α', () => {
    const q = qexp([0, 0.7, 0, 0]);
    expect(dq(q, [Math.cos(0.7), Math.sin(0.7), 0, 0])).toBeLessThan(1e-15);
  });
});
