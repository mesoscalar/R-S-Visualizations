import { describe, expect, it } from 'vitest';
import { mulberry32, qconj, qmul, qnormalize, type Quat } from '@rsvis/math';
import {
  Omega,
  act,
  bianchiResidual,
  bpstCurvature,
  bpstPotential,
  chargeDensity,
  components,
  curvatureFD,
  fundamental,
  gauge12,
  omega,
  pullbackPotential,
  radialCharge,
  section1,
  section2,
  sectionDeriv,
  tangent,
  type H2,
} from '../src/math/quaternionic-hopf';

const rng = mulberry32(1402);
const r = () => 2 * rng() - 1;
const rq = (s = 1): Quat => [s * r(), s * r(), s * r(), s * r()];
const dq = (a: Quat, b: Quat) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const randS7 = (): H2 => {
  const a = rq();
  const b = rq();
  const n = Math.hypot(...a, ...b);
  return [a.map((c) => c / n) as Quat, b.map((c) => c / n) as Quat];
};
const randTan = (p: H2): H2 => tangent(p, [rq(), rq()]);
const imq = (): Quat => [0, r(), r(), r()];
// closed-form quaternion algebra on O(1) data: roundoff
const ALG = 1e-13;
// one central difference (h = 1e-6 of a smooth section, or 1e-5 of a smooth potential): truncation ≲ 1e-10, roundoff ≲ 1e-10
const FD = 1e-8;

describe('Station 1.4b — curvature of the quaternionic Hopf bundle (Exercise 1.4.2)', () => {
  it('(1.3.21): ω is Im H-valued on TS⁷ and reproduces generators, ω(A*) = A', () => {
    for (let k = 0; k < 100; k++) {
      const p = randS7();
      expect(Math.abs(omega(p, randTan(p))[0])).toBeLessThan(ALG);
      const A = imq();
      expect(dq(omega(p, fundamental(p, A)), A)).toBeLessThan(ALG);
    }
  });

  it('Def. 1.4.6: Ω is horizontal, Ω(A*, Y) = 0, and of type Ad: Ω(Xu, Yu) = ū Ω(X, Y) u', () => {
    for (let k = 0; k < 100; k++) {
      const p = randS7();
      const [X, Y] = [randTan(p), randTan(p)];
      expect(dq(Omega(p, fundamental(p, imq()), Y), [0, 0, 0, 0])).toBeLessThan(ALG);
      const u = qnormalize(rq());
      const lhs = Omega(act(p, u), act(X, u), act(Y, u));
      expect(dq(lhs, qmul(qmul(qconj(u), Omega(p, X, Y)), u))).toBeLessThan(ALG);
    }
  });

  it('Rem. 1.4.15: s₁*ω = Im(x̄dx)/(1+|x|²) and s₁*Ω = dx̄∧dx/(1+|x|²)²', () => {
    for (let k = 0; k < 100; k++) {
      const x = rq(1.5);
      const A = pullbackPotential(section1)(x);
      const B = bpstPotential(x);
      for (let mu = 0; mu < 4; mu++) expect(dq(A[mu], B[mu])).toBeLessThan(FD);
      for (let mu = 0; mu < 4; mu++)
        for (let nu = mu + 1; nu < 4; nu++) {
          const p = section1(x);
          const F = Omega(p, sectionDeriv(section1, x, mu), sectionDeriv(section1, x, nu));
          expect(dq(F, bpstCurvature(x, mu, nu))).toBeLessThan(FD);
        }
    }
  });

  it('Prop. 1.4.9 (structure equation): 𝓕 = d𝒜 + ½[𝒜∧𝒜] from the potential alone', () => {
    for (let k = 0; k < 100; k++) {
      const x = rq(1.5);
      for (let mu = 0; mu < 4; mu++)
        for (let nu = mu + 1; nu < 4; nu++)
          expect(dq(curvatureFD(bpstPotential, x, mu, nu), bpstCurvature(x, mu, nu))).toBeLessThan(FD);
    }
  });

  it('Prop. 1.4.11 / Rem. 1.4.12 (Bianchi): d𝓕 + [𝒜∧𝓕] = 0', () => {
    for (let k = 0; k < 100; k++) {
      // central difference h = 1e-4 of the closed-form 𝓕: truncation ~h²|∂³𝓕| ≲ 1e-7
      expect(bianchiResidual(bpstPotential, bpstCurvature, rq(1.5))).toBeLessThan(1e-6);
    }
    // a non-solution fails: drop the commutator term
    const bad = (x: Quat, mu: number, nu: number) => bpstCurvature(x, mu, nu).map((c, i) => c * (1 + 0.3 * x[0] * (i > 0 ? 1 : 0))) as Quat;
    expect(bianchiResidual(bpstPotential, bad, [0.4, 0.3, -0.2, 0.5])).toBeGreaterThan(1e-2);
  });

  it('Rem. 1.4.15: in the second chart 𝓕₂ = Ad_{g⁻¹}𝓕₁ with g = x̄/|x|', () => {
    for (let k = 0; k < 100; k++) {
      let x = rq(1.5);
      while (Math.hypot(...x) < 0.3) x = rq(1.5); // g = x̄/|x| is singular at 0
      const A2 = pullbackPotential(section2);
      const g = gauge12(x);
      for (let mu = 0; mu < 4; mu++)
        for (let nu = mu + 1; nu < 4; nu++) {
          // nested differences: the inner step (h = 1e-6) leaves ~1e-10 roundoff in 𝒜₂, which the outer
          // quotient (h = 1e-4) amplifies to ~1e-6; measured max 2.9e-6 over 300 random x with |x| ≥ 0.3
          const F2 = curvatureFD(A2, x, mu, nu, 1e-4);
          expect(dq(F2, qmul(qmul(qconj(g), bpstCurvature(x, mu, nu)), g))).toBeLessThan(1e-5);
        }
    }
  });

  it('𝓕 is anti-self-dual in the orientation (x⁰, x¹, x², x³): 𝓕₀₁ = −𝓕₂₃, 𝓕₀₂ = −𝓕₃₁, 𝓕₀₃ = −𝓕₁₂', () => {
    for (let k = 0; k < 100; k++) {
      const x = rq(2);
      const F = components((m, n) => bpstCurvature(x, m, n));
      for (let j = 0; j < 3; j++) expect(dq(F[j], F[j + 3].map((v) => -v) as Quat)).toBeLessThan(ALG);
    }
  });

  it('the charge density is a constant multiple of the round volume of S⁴ (radius ½), and the total charge is 1', () => {
    for (let k = 0; k < 50; k++) {
      const x = rq(2);
      const c = chargeDensity(components((m, n) => curvatureFD(bpstPotential, x, m, n)));
      // conformal factor of the round S⁴ of radius ½ in this chart is (1+|x|²)⁻²; FD relative error ≲ 1e-8
      expect(Math.abs(c * (1 + x.reduce((s, v) => s + v * v, 0)) ** 4 - 6 / Math.PI ** 2)).toBeLessThan(1e-7);
    }
    const q = radialCharge((rad) => chargeDensity(components((m, n) => bpstCurvature([rad, 0, 0, 0], m, n))));
    // Simpson, N = 400 on a smooth integrand in t = arctan r: error O(N⁻⁴) ≈ 1e-10
    expect(Math.abs(q - 1)).toBeLessThan(1e-9);
  });
});
