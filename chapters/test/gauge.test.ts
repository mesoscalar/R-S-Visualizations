import { describe, expect, it } from 'vitest';
import {
  carg,
  cconj,
  cmul,
  fromPolar,
  hopfDifferential,
  hopfMap,
  kappa1,
  kappa2,
  mulberry32,
  omegaC,
  potential1Phi,
  potential2Phi,
  randomUnitQuat,
  type Cx,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import {
  FD_H,
  gaugedSection,
  gaugeFunction,
  loopIntegralOverTwoPi,
  pullback,
  tangentFrame,
} from '../src/math/gauge';

// Every quantity below goes through one central difference (FD_H = 1e-5):
// truncation ~1e-10 plus roundoff ~1e-11, times O(10) derivative bounds of the
// gauged sections (|∇λ| ≤ |c1| + |c2| + 2|c3| ≤ 8). 1e-7 sits above that.
const FD_TOL = 1e-7;
const rng = mulberry32(1312);
const rand = (a: number) => a * (2 * rng() - 1);
const randGauge = () => gaugeFunction(rand(2), rand(2), rand(2));
// keep away from the excluded poles where the sections (and the FD stencil) degenerate
const randMid = (): Vec3 => fromPolar(0.3 + (Math.PI - 0.6) * rng(), 2 * Math.PI * rng());
const randTangentAt = (m: Vec3): Vec3 => {
  const [e1, e2] = tangentFrame(m);
  const a = rand(1);
  const b = rand(1);
  return [a * e1[0] + b * e2[0], a * e1[1] + b * e2[1], a * e1[2] + b * e2[2]];
};
/** dλ_m(v) by central difference of λ along the chord direction (λ is a polynomial). */
const dLambda = (lam: (m: Vec3) => number, m: Vec3, v: Vec3) =>
  (lam([m[0] + FD_H * v[0], m[1] + FD_H * v[1], m[2] + FD_H * v[2]]) -
    lam([m[0] - FD_H * v[0], m[1] - FD_H * v[1], m[2] - FD_H * v[2]])) /
  (2 * FD_H);

describe('Station H — local representatives and gauge transformations (§1.3)', () => {
  it('(1.3.11) with the book sections: 𝒜_1 = (i/2)(1−cosθ)dφ, 𝒜_2 = −(i/2)(1+cosθ)dφ', () => {
    for (let k = 0; k < 100; k++) {
      const m = randMid();
      const th = Math.acos(m[2]);
      const dphi: Vec3 = [-m[1], m[0], 0]; // ∂_φ
      expect(Math.abs(pullback(gaugedSection(1, () => 0), m, dphi) - potential1Phi(th))).toBeLessThan(FD_TOL);
      expect(Math.abs(pullback(gaugedSection(2, () => 0), m, dphi) - potential2Phi(th))).toBeLessThan(FD_TOL);
    }
  });

  it('gauge change s ↦ s·e^{iλ}: 𝒜 ↦ 𝒜 + i dλ', () => {
    for (let k = 0; k < 100; k++) {
      const lam = randGauge();
      const m = randMid();
      const v = randTangentAt(m);
      for (const i of [1, 2] as const) {
        const lhs = pullback(gaugedSection(i, lam), m, v);
        const rhs = pullback(gaugedSection(i, () => 0), m, v) + dLambda(lam, m, v);
        expect(Math.abs(lhs - rhs)).toBeLessThan(FD_TOL);
      }
    }
  });

  it('Prop. 1.3.11: ω_c(X) = 𝒜(π′X) + κ^*θ(X) at random p, X, for a gauged section', () => {
    for (let k = 0; k < 100; k++) {
      const lam = randGauge();
      const s = gaugedSection(1, lam);
      const p = randomUnitQuat(rng) as Vec4;
      const m = hopfMap(p);
      if (m[2] < -0.8) continue; // stay inside U1, away from its excluded pole
      // κ(p) defined by p = s(π(p))·κ(p): κ = κ1(p)·e^{−iλ(π(p))}
      const kap = (q: Vec4): Cx => cmul(kappa1(q)!, [Math.cos(lam(hopfMap(q))), -Math.sin(lam(hopfMap(q)))]);
      // random tangent X at p
      const r: Vec4 = [rand(1), rand(1), rand(1), rand(1)];
      const d = r[0] * p[0] + r[1] * p[1] + r[2] * p[2] + r[3] * p[3];
      const X: Vec4 = [r[0] - d * p[0], r[1] - d * p[1], r[2] - d * p[2], r[3] - d * p[3]];
      const step = (t: number): Vec4 => {
        const q = p.map((x, j) => x + t * X[j]);
        const n = Math.hypot(...q);
        return q.map((x) => x / n) as Vec4;
      };
      // κ^*θ(X) = Im(κ̄ dκ(X))
      const k0 = kap(p);
      const dk = [0, 1].map((j) => (kap(step(FD_H))[j] - kap(step(-FD_H))[j]) / (2 * FD_H)) as Cx;
      const kTheta = cmul(cconj(k0), dk)[1];
      const A = pullback(s, m, hopfDifferential(p, X));
      expect(Math.abs(A + kTheta - omegaC(p, X))).toBeLessThan(FD_TOL);
    }
  });

  it('Cor. 1.3.12: 𝒜′_2 = 𝒜′_1 + ρ′12^*θ for independently gauged sections', () => {
    for (let k = 0; k < 100; k++) {
      const l1 = randGauge();
      const l2 = randGauge();
      const s1 = gaugedSection(1, l1);
      const s2 = gaugedSection(2, l2);
      const m = randMid();
      const v = randTangentAt(m);
      // ρ′12(m) = κ′1κ′2⁻¹ evaluated at any p over m; at p = s′2(m): κ′2 = 1
      const rho = (q: Vec3): number => {
        const p = s2(q)!;
        const k1 = cmul(kappa1(p)!, [Math.cos(l1(q)), -Math.sin(l1(q))]);
        const k2 = cmul(kappa2(p)!, [Math.cos(l2(q)), -Math.sin(l2(q))]);
        return carg(cmul(k1, cconj(k2)));
      };
      // ρ^*θ(v) = d(arg ρ)(v); unwrap the difference across the branch cut
      let dr = rho([m[0] + FD_H * v[0], m[1] + FD_H * v[1], m[2] + FD_H * v[2]]) -
        rho([m[0] - FD_H * v[0], m[1] - FD_H * v[1], m[2] - FD_H * v[2]]);
      dr = Math.atan2(Math.sin(dr), Math.cos(dr)) / (2 * FD_H);
      expect(Math.abs(pullback(s2, m, v) - (pullback(s1, m, v) + dr))).toBeLessThan(FD_TOL);
    }
  });

  it('loop integrals: (1/2πi)∮𝒜_1 = (1−cosθ)/2 in every gauge, and ∮𝒜_2 − ∮𝒜_1 = −2πi', () => {
    // periodic trapezoid at N = 256 is spectrally exact for these trig-polynomial
    // integrands; the residual is the FD error (≤ ~1e-9 after averaging).
    for (let k = 0; k < 20; k++) {
      const th = 0.3 + (Math.PI - 0.6) * rng();
      const l1 = randGauge();
      const l2 = randGauge();
      const I1 = loopIntegralOverTwoPi(gaugedSection(1, l1), th);
      const I2 = loopIntegralOverTwoPi(gaugedSection(2, l2), th);
      expect(Math.abs(I1 - 0.5 * (1 - Math.cos(th)))).toBeLessThan(FD_TOL);
      expect(Math.abs(I2 - I1 - -1)).toBeLessThan(FD_TOL);
    }
  });
});
