import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@rsvis/math';
import {
  conformalFactor,
  conformalLC,
  curvature,
  curvatureUVW,
  geodesicTransport,
  parallelogram,
  squareHolonomy,
  torsion,
  withTorsion,
  type V2,
} from '../src/math/linear-connections';

const rng = mulberry32(2101);
const r = () => 2 * rng() - 1;
const rv = (s = 1): V2 => [s * r(), s * r()];
const d2 = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('Station 2.1a — linear connections, torsion and geodesics (§2.1)', () => {
  it('conformalLC(k) is the Levi-Civita connection of λ²δ: torsion-free and metric', () => {
    for (let n = 0; n < 50; n++) {
      // stay inside the model's domain, |k||x|² ≤ ½ (the disk for k < 0 ends at |x|² = 1/|k|)
      const k = r();
      const x = rv(0.5);
      const G = conformalLC(k)(x);
      for (let m = 0; m < 2; m++) expect(Math.abs(G[m][0][1] - G[m][1][0])).toBeLessThan(1e-15);
      // ∂_i g_jl = Γ^m_ij g_ml + Γ^m_il g_jm with g = λ²δ (central difference h = 1e-5: error ≲ 1e-9)
      const h = 1e-5;
      for (let i = 0; i < 2; i++) {
        const e: V2 = i === 0 ? [h, 0] : [0, h];
        const dl = (conformalFactor(k, [x[0] + e[0], x[1] + e[1]]) - conformalFactor(k, [x[0] - e[0], x[1] - e[1]])) / (2 * h);
        const l2 = conformalFactor(k, x);
        for (let j = 0; j < 2; j++)
          for (let l = 0; l < 2; l++) {
            const lhs = j === l ? dl : 0;
            const rhs = G[l][i][j] * l2 + G[j][i][l] * l2;
            expect(Math.abs(lhs - rhs)).toBeLessThan(1e-8);
          }
      }
    }
  });

  it('(2.1.55): the added antisymmetric part has torsion T(u,v) = τ (u¹v² − u²v¹) t', () => {
    for (let n = 0; n < 100; n++) {
      const tau = 2 * r();
      const t = rv();
      const [u, v, x] = [rv(), rv(), rv(0.6)];
      const T = torsion(withTorsion(conformalLC(r()), tau, t), x, u, v);
      const c = tau * (u[0] * v[1] - u[1] * v[0]);
      expect(d2(T, [c * t[0], c * t[1]])).toBeLessThan(1e-14);
    }
  });

  it('geodesics see only the symmetric part: the same curves for every τ', () => {
    for (let n = 0; n < 20; n++) {
      const base = conformalLC(r());
      const [x0, v0] = [rv(0.5), rv()];
      const g0 = geodesicTransport(base, x0, v0, [], 1.5);
      const g1 = geodesicTransport(withTorsion(base, 3 * r(), rv()), x0, v0, [], 1.5);
      // Γ(v, v) differs by τ ε_ij v^i v^j t / 2 = 0 up to roundoff
      for (let i = 0; i < g0.x.length; i++) expect(d2(g0.x[i], g1.x[i])).toBeLessThan(1e-12);
    }
  });

  it('Prop. 2.1.22: along a geodesic, γ̇ = u(t)x with u(t) the parallel frame and x constant', () => {
    for (let n = 0; n < 20; n++) {
      const Gam = withTorsion(conformalLC(r()), 2 * r(), rv());
      const x0 = rv(0.5);
      const u0: [V2, V2] = [rv(), rv()];
      const xs: V2 = rv();
      const v0: V2 = [u0[0][0] * xs[0] + u0[1][0] * xs[1], u0[0][1] * xs[0] + u0[1][1] * xs[1]];
      const g = geodesicTransport(Gam, x0, v0, u0, 1.2, 400);
      for (let i = 0; i < g.ts.length; i += 40) {
        const e1 = g.Y[0][i];
        const e2 = g.Y[1][i];
        const ux: V2 = [e1[0] * xs[0] + e2[0] * xs[1], e1[1] * xs[0] + e2[1] * xs[1]];
        // the same RK4 solves both: agreement to the RK4 error of the joint system (~1e-11 at 400 steps)
        expect(d2(ux, g.v[i])).toBeLessThan(1e-9);
      }
    }
  });

  it('(2.1.33): geodesic parallelograms miss by −ε² T(X, Y) + O(ε³); torsion-free ones close to O(ε³)', () => {
    for (let n = 0; n < 10; n++) {
      const tau = 0.5 + rng();
      const t = rv();
      const base = conformalLC(r());
      const Gam = withTorsion(base, tau, t);
      const [p, X, Y] = [rv(0.4), rv(), rv()];
      const T = torsion(Gam, p, X, Y);
      const err = [0.02, 0.01].map((eps) => {
        const q = parallelogram(Gam, p, X, Y, eps);
        return d2([(q.qXY[0] - q.qYX[0]) / eps ** 2, (q.qXY[1] - q.qYX[1]) / eps ** 2], [-T[0], -T[1]]);
      });
      // first-order convergence: the error halves with ε (ratio measured 0.50 ± 0.01)
      expect(err[1] / err[0]).toBeGreaterThan(0.4);
      expect(err[1] / err[0]).toBeLessThan(0.6);
      const q0 = parallelogram(base, p, X, Y, 0.01);
      expect(d2(q0.qXY, q0.qYX) / 0.01 ** 2).toBeLessThan(10 * err[1]);
    }
  });

  it('Rem. 2.1.30/2: transport around a small square changes w by −ε² R(u, v)w + O(ε³)', () => {
    for (let n = 0; n < 10; n++) {
      const Gam = withTorsion(conformalLC(r()), 2 * r(), rv());
      const [p, u, v, w] = [rv(0.4), rv(), rv(), rv()];
      const Rw = curvatureUVW(curvature(Gam, p), u, v, w);
      const err = [0.02, 0.01].map((eps) => {
        const W = squareHolonomy(Gam, p, u, v, eps, w);
        return d2([(W[0] - w[0]) / eps ** 2, (W[1] - w[1]) / eps ** 2], [-Rw[0], -Rw[1]]);
      });
      expect(err[1] / err[0]).toBeGreaterThan(0.4);
      expect(err[1] / err[0]).toBeLessThan(0.6);
    }
  });

  it('the model surfaces have constant sectional curvature k (Def. 2.4.1)', () => {
    for (let n = 0; n < 50; n++) {
      const k = r();
      const x = rv(0.5);
      const R = curvature(conformalLC(k), x);
      const l2 = conformalFactor(k, x);
      const e1: V2 = [1, 0];
      const e2: V2 = [0, 1];
      const RYYX = curvatureUVW(R, e1, e2, e2);
      // ⟨R(e₁,e₂)e₂, e₁⟩ / (|e₁|²|e₂|²) with |e_i|² = λ²; FD of Γ with h = 1e-5: error ≲ 1e-9
      expect(Math.abs((RYYX[0] * l2) / (l2 * l2) - k)).toBeLessThan(1e-8);
    }
  });
});
