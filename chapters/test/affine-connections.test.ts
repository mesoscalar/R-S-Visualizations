import { describe, expect, it } from 'vitest';
import {
  actU1,
  fromPolar,
  hopfDifferential,
  hopfMap,
  killingI,
  mulberry32,
  omegaC,
  randomUnitQuat,
  section1,
  type Vec4,
} from '@rsvis/math';
import { betaPhi, omegaPU, omegaT, partition, smoothStep, torusSlope } from '../src/math/affine-connections';

// Pointwise algebra on O(1) quantities (chart forms divide by |z_i|² ≥ ~0.1
// wherever their weight is nonzero for lo = −0.6, hi = 0.2): roundoff ~1e-15,
// amplified ≤ 10× by that division; 1e-13 keeps an order of headroom.
const RT = 1e-13;
const LO = -0.6;
const HI = 0.2;
const rng = mulberry32(1307);
const randTangent = (z: Vec4): Vec4 => {
  const r: Vec4 = [2 * rng() - 1, 2 * rng() - 1, 2 * rng() - 1, 2 * rng() - 1];
  const d = r[0] * z[0] + r[1] * z[1] + r[2] * z[2] + r[3] * z[3];
  return [r[0] - d * z[0], r[1] - d * z[1], r[2] - d * z[2], r[3] - d * z[3]];
};

describe('Station 1.3c — the affine space of connections (§1.3)', () => {
  it('the partition of unity is subordinate to {U1, U2} and sums to 1', () => {
    const { f1, f2 } = partition(LO, HI);
    for (let k = 0; k <= 200; k++) {
      const z = -1 + (2 * k) / 200;
      expect(f1(z) + f2(z)).toBe(1);
      if (z <= LO) expect(f1(z)).toBe(0); // vanishes near the south pole ∉ U1
      if (z >= HI) expect(f2(z)).toBe(0); // vanishes near the north pole ∉ U2
    }
    expect(smoothStep(0.5)).toBeCloseTo(0.5, 15);
  });

  it('Prop. 1.3.7: ω_PU and every ω_t satisfy ω(A*) = A and Ψ_a^*ω = ω', () => {
    for (let k = 0; k < 300; k++) {
      const z = randomUnitQuat(rng);
      const X = randTangent(z);
      const a = 2 * Math.PI * rng();
      for (const t of [0, 0.3, 1]) {
        const w = omegaT(t, LO, HI);
        expect(Math.abs(w(z, killingI(z)) - 1)).toBeLessThan(RT);
        expect(Math.abs(w(actU1(z, a), actU1(X, a)) - w(z, X))).toBeLessThan(RT);
      }
    }
  });

  it('Rem. 1.3.8: ω_PU − ω_c is horizontal and equals π^*β with β = −(f1𝒜_1 + f2𝒜_2)', () => {
    const pu = omegaPU(LO, HI);
    for (let k = 0; k < 300; k++) {
      const z = randomUnitQuat(rng);
      const m = hopfMap(z);
      if (Math.hypot(m[0], m[1]) < 0.05) continue; // dφ degenerates at the poles (β itself is fine)
      expect(Math.abs(pu(z, killingI(z)) - omegaC(z, killingI(z)))).toBeLessThan(RT); // kills vertical
      const X = randTangent(z);
      const v = hopfDifferential(z, X);
      const dphi = (m[0] * v[1] - m[1] * v[0]) / (m[0] * m[0] + m[1] * m[1]);
      const lhs = pu(z, X) - omegaC(z, X);
      const rhs = betaPhi(Math.acos(m[2]), LO, HI) * dphi;
      // dφ carries 1/(x² + y²) ≤ 400: bound the roundoff accordingly
      expect(Math.abs(lhs - rhs)).toBeLessThan(RT * 400);
    }
  });

  it('torus slope: ω_t(∂_φ) = (1 − t)(1 − cos θ)/2 + t f2(cos θ), checked by differentiating s1', () => {
    // central differences, h = 1e-5: truncation ~1e-10, roundoff ~1e-11 → 1e-8
    const h = 1e-5;
    for (let k = 0; k < 100; k++) {
      const th = 0.1 + (Math.PI - 0.2) * rng();
      const ph = 2 * Math.PI * rng();
      const al = 2 * Math.PI * rng();
      const p = (q: number) => actU1(section1(fromPolar(th, q))!, al);
      const vel = p(ph + h).map((x, i) => (x - p(ph - h)[i]) / (2 * h));
      const t = rng();
      expect(Math.abs(omegaT(t, LO, HI)(p(ph), vel) - torusSlope(t, th, LO, HI))).toBeLessThan(1e-8);
    }
  });

  it('the twist is pinned by topology: a_t(θ) → 0 at the north pole and → 1 at the south pole for every t', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(Math.abs(torusSlope(t, 1e-8, LO, HI))).toBeLessThan(1e-15);
      expect(Math.abs(torusSlope(t, Math.PI - 1e-8, LO, HI) - 1)).toBeLessThan(1e-15);
    }
  });
});
