import { describe, expect, it } from 'vitest';
import { fromPolar, mulberry32, sectionS, type Vec3 } from '@rsvis/math';
import {
  connectionMatrix,
  curvatureR,
  gradField,
  nablaExtrinsic,
  nablaLocal,
  nablaTerms,
  rotationField,
  tangential,
  transportedBack,
  type Field,
} from '../src/math/koszul';

const rng = mulberry32(1505);
const randMid = (): Vec3 => fromPolar(0.3 + 2.2 * rng(), 6.28 * rng());
const randTan = (m: Vec3): Vec3 => tangential(m, [rng() - 0.5, rng() - 0.5, rng() - 0.5]);
const r = () => 2 * rng() - 1;
const randGrad = (): Field => {
  const q = [r(), r(), r()];
  return gradField([r(), r(), r()], [
    [r(), q[0], q[1]],
    [q[0], r(), q[2]],
    [q[1], q[2], r()],
  ]);
};
const d3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// one central difference, h = 1e-5: truncation ~1e-10, roundoff ~1e-11, O(10) field derivatives
const FD = 1e-7;

describe('Station 1.5a — Koszul calculus on TS² (§1.5)', () => {
  it('Prop. 1.5.3: the connection matrix 𝒜^β_α is so(2)-valued (𝒜¹₁ = 𝒜²₂ = 0, 𝒜¹₂ = −𝒜²₁)', () => {
    for (let k = 0; k < 100; k++) {
      const m = randMid();
      const A = connectionMatrix(m, randTan(m));
      expect(Math.abs(A[0][0]) + Math.abs(A[1][1])).toBeLessThan(FD);
      expect(Math.abs(A[0][1] + A[1][0])).toBeLessThan(FD);
    }
  });

  it('(1.5.8) in the frame s_N agrees with the Levi-Civita derivative of the embedded sphere', () => {
    for (let k = 0; k < 100; k++) {
      const V = k % 2 ? randGrad() : rotationField([r(), r(), r()]);
      const m = randMid();
      const X = randTan(m);
      expect(d3(nablaLocal(V, m, X), nablaExtrinsic(V, m, X))).toBeLessThan(FD);
    }
  });

  it('Rem. 1.5.5: the two terms of (1.5.8) depend on the frame (s_N vs s_S), their sum does not', () => {
    let termGap = 0;
    for (let k = 0; k < 100; k++) {
      const V = randGrad();
      const m = randMid();
      const X = randTan(m);
      const tn = nablaTerms(V, m, X);
      const ts = nablaTerms(V, m, X, 1e-5, sectionS);
      expect(d3(nablaLocal(V, m, X), nablaLocal(V, m, X, 1e-5, sectionS))).toBeLessThan(FD);
      termGap = Math.max(termGap, d3(tn.conn, ts.conn));
    }
    // s_S = s_N·b(ρ) with ρ = π + 2φ, so the connection term shifts by 2dφ(X)·Jξ: O(1) unless X is meridional
    expect(termGap).toBeGreaterThan(0.1);
  });

  it('Prop. 1.5.4 (Leibniz): ∇(fV) = df ⊗ V + f∇V', () => {
    for (let k = 0; k < 50; k++) {
      const V = randGrad();
      const a: Vec3 = [r(), r(), r()];
      const f = (p: Vec3) => 1 + a[0] * p[0] + a[1] * p[1] * p[2] + a[2] * p[2];
      const m = randMid();
      const X = randTan(m);
      const fV: Field = (p) => V(p).map((c) => f(p) * c) as Vec3;
      const df = (f(m.map((c, i) => c + 1e-6 * X[i]) as Vec3) - f(m.map((c, i) => c - 1e-6 * X[i]) as Vec3)) / 2e-6;
      const rhs = V(m).map((c, i) => df * c + f(m) * nablaLocal(V, m, X)[i]) as Vec3;
      expect(d3(nablaLocal(fV, m, X), rhs)).toBeLessThan(1e-6);
    }
  });

  it('Prop. 1.7.17: ∇_X V = d/dt|₀ of V(γ(t)) transported back to m', () => {
    for (let k = 0; k < 30; k++) {
      const V = randGrad();
      const m = randMid();
      const X = randTan(m);
      const t = 1e-3;
      const p = transportedBack(V, m, X, t);
      const q = transportedBack(V, m, X, -t);
      // symmetric quotient: O(t²) ≈ 1e-6·|V‴|; RK4 transport over ±1e-3 is exact to roundoff
      const deriv = p.map((c, i) => (c - q[i]) / (2 * t)) as Vec3;
      expect(d3(deriv, nablaLocal(V, m, X))).toBeLessThan(1e-5);
    }
  });

  it('Prop. 1.5.11: R(X,Y)V = [∇_X,∇_Y]V − ∇_[X,Y]V equals ⟨Y,V⟩X − ⟨X,V⟩Y (curvature 1)', () => {
    for (let k = 0; k < 20; k++) {
      const X = rotationField([r(), r(), r()]);
      const Y = rotationField([r(), r(), r()]);
      const V = randGrad();
      const m = randMid();
      const got = curvatureR(X, Y, V, m);
      const x = X(m);
      const y = Y(m);
      const v = V(m);
      const yv = y[0] * v[0] + y[1] * v[1] + y[2] * v[2];
      const xv = x[0] * v[0] + x[1] * v[1] + x[2] * v[2];
      const want = x.map((c, i) => yv * c - xv * y[i]) as Vec3;
      // nested central differences, h = 1e-4: truncation ~1e-8 per level, roundoff ~1e-16/h² ≈ 1e-8
      expect(d3(got, want)).toBeLessThan(1e-5);
    }
  });
});
