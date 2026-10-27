import { describe, expect, it } from 'vitest';
import {
  actU1,
  hopfDifferential,
  hopfMap,
  jq,
  kappa1,
  killingI,
  kq,
  mulberry32,
  omegaC,
  randomUnitQuat,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import {
  chartFlatCurve,
  horizontalLiftVector,
  horizontalPart,
  horizontalTorusCurve,
  tangentFromAngles,
  verticalPart,
} from '../src/math/connection-split';

// Bilinear identities in O(1) quantities: roundoff ~1e-15; 1e-13 leaves margin.
const RT = 1e-13;
const rng = mulberry32(1302);
const norm3 = (v: ArrayLike<number>) => Math.hypot(v[0], v[1], v[2]);
const dot4 = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
const sub4 = (a: ArrayLike<number>, b: ArrayLike<number>): Vec4 => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const randTangent = (z: Vec4): Vec4 => tangentFromAngles(z, Math.PI * (rng() - 0.5), 2 * Math.PI * rng());

describe('Station G — horizontal and vertical (§1.3)', () => {
  it('Lemma 1.3.1: V_z = R·iz is tangent to the fibre (ker dπ) and nonzero', () => {
    for (let k = 0; k < 200; k++) {
      const z = randomUnitQuat(rng);
      expect(norm3(hopfDifferential(z, killingI(z)))).toBeLessThan(RT);
      expect(Math.abs(Math.hypot(...killingI(z)) - 1)).toBeLessThan(RT);
    }
  });

  it('Def. 1.3.2 / Prop. 1.3.5/1: Γ_z = span{jz, kz} = ker ω_c, and T_zS³ = Γ_z ⊕ V_z', () => {
    for (let k = 0; k < 200; k++) {
      const z = randomUnitQuat(rng);
      const [i, j, kk] = [killingI(z), jq(z), kq(z)];
      expect(Math.abs(omegaC(z, j))).toBeLessThan(RT);
      expect(Math.abs(omegaC(z, kk))).toBeLessThan(RT);
      // {z, iz, jz, kz} is orthonormal in R⁴ ⇒ {iz, jz, kz} is a basis of T_zS³
      const B = [z, i, j, kk];
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 4; b++) expect(Math.abs(dot4(B[a], B[b]) - (a === b ? 1 : 0))).toBeLessThan(RT);
    }
  });

  it('(1.3.7): X = hor X + ver X with ω_c(hor X) = 0 and dπ(ver X) = 0', () => {
    for (let k = 0; k < 200; k++) {
      const z = randomUnitQuat(rng);
      const X = randTangent(z);
      const h = horizontalPart(z, X);
      const v = verticalPart(z, X);
      expect(Math.hypot(...sub4(X, [h[0] + v[0], h[1] + v[1], h[2] + v[2], h[3] + v[3]]))).toBeLessThan(RT);
      expect(Math.abs(omegaC(z, h))).toBeLessThan(RT);
      expect(norm3(hopfDifferential(z, v))).toBeLessThan(RT);
      expect(Math.abs(omegaC(z, v) - omegaC(z, X))).toBeLessThan(RT); // ω(A*) = A on the vertical part
    }
  });

  it('Def. 1.3.2/2: Γ_{z·a} = Ψ′_a(Γ_z)', () => {
    for (let k = 0; k < 200; k++) {
      const z = randomUnitQuat(rng);
      const a = 2 * Math.PI * rng();
      const za = actU1(z, a);
      for (const e of [jq(z), kq(z)]) {
        const moved = actU1(e, a); // Ψ_a is complex-linear: Ψ′_a = Ψ_a on vectors
        expect(Math.abs(omegaC(za, moved))).toBeLessThan(RT);
        // and it lies in span{j(za), k(za)} (no component along z or i·za)
        expect(Math.abs(dot4(moved, za))).toBeLessThan(RT);
        expect(Math.abs(dot4(moved, killingI(za)))).toBeLessThan(RT);
      }
    }
  });

  it('Rem. 1.3.3/2: the horizontal lift X^h is horizontal, π-related to v, and Ψ-invariant', () => {
    for (let k = 0; k < 200; k++) {
      const z = randomUnitQuat(rng);
      const m = hopfMap(z);
      // random tangent vector to S² at m
      const r: Vec3 = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
      const d = r[0] * m[0] + r[1] * m[1] + r[2] * m[2];
      const v: Vec3 = [r[0] - d * m[0], r[1] - d * m[1], r[2] - d * m[2]];
      const Xh = horizontalLiftVector(z, v);
      expect(Math.abs(omegaC(z, Xh))).toBeLessThan(RT);
      const dv = hopfDifferential(z, Xh);
      expect(Math.hypot(dv[0] - v[0], dv[1] - v[1], dv[2] - v[2])).toBeLessThan(RT);
      const a = 2 * Math.PI * rng();
      expect(Math.hypot(...sub4(horizontalLiftVector(actU1(z, a), v), actU1(Xh, a)))).toBeLessThan(RT);
    }
  });

  it('torus over a latitude: α = α0 − 𝒜_1φ(θ0)·φ is ω_c-horizontal; α = const is κ1^*θ-horizontal', () => {
    // central differences, h = 1e-5: truncation ~1e-10, roundoff ~1e-11 → 1e-8
    const h = 1e-5;
    for (let k = 0; k < 50; k++) {
      const th = 0.15 + (Math.PI - 0.5) * rng();
      const a0 = 2 * Math.PI * rng();
      const ph = 2 * Math.PI * rng();
      const c = horizontalTorusCurve(th, a0);
      const vel = sub4(c(ph + h), c(ph - h)).map((x) => x / (2 * h));
      expect(Math.abs(omegaC(c(ph), vel))).toBeLessThan(1e-8);
      const f = chartFlatCurve(th, a0);
      const velF = sub4(f(ph + h), f(ph - h)).map((x) => x / (2 * h));
      // κ1^*θ(v) = Im(κ̄1 dκ1(v)); along α = const, κ1 is constant
      const k0 = kappa1(f(ph - h))!;
      const k1 = kappa1(f(ph + h))!;
      expect(Math.hypot(k1[0] - k0[0], k1[1] - k0[1])).toBeLessThan(1e-12);
      // ...but such a curve is not ω_c-horizontal unless θ0 = 0: ω_c(c′) = 𝒜_1φ(θ0)
      expect(Math.abs(omegaC(f(ph), velF) - 0.5 * (1 - Math.cos(th)))).toBeLessThan(1e-8);
    }
  });
});
