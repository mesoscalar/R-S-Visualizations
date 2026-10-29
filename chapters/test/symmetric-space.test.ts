import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@rsvis/math';
import {
  I3,
  ORIGIN,
  bracket,
  curvatureAtOrigin,
  eta,
  expm,
  geodesic,
  hPart,
  killing,
  lambda,
  mPart,
  mm,
  mv,
  symmetryAt,
  symmetryAtOrigin,
  transportAlong,
  transvection,
  type M3,
  type V3,
} from '../src/math/symmetric-space';

const rng = mulberry32(2501);
const r = () => 2 * rng() - 1;
const rx = (): [number, number] => [r(), r()];
const dm = (a: M3, b: M3) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const dv = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const EPS = [1, -1];
// closed-form 3×3 algebra and a 20-term Taylor expm on O(1) matrices: roundoff ≲ 1e-14
const ALG = 1e-12;

describe('Station 2.5a — S² and H² as symmetric spaces (§2.5)', () => {
  it('Lemma 2.5.2 / (2.5.4): λ = Ad(S) is an involutive automorphism with h = +1 and m = −1 eigenspaces', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const [X, Y] = [mPart(eps, rx()), mPart(eps, rx())];
        const A = hPart(r());
        expect(dm(lambda(X), X.map((v) => -v))).toBeLessThan(ALG);
        expect(dm(lambda(A), A)).toBeLessThan(ALG);
        const Z = [X, A, Y][n % 3];
        const W = [Y, X, A][n % 3];
        expect(dm(lambda(bracket(Z, W)), bracket(lambda(Z), lambda(W)))).toBeLessThan(ALG);
        // [m, m] ⊂ h and [h, m] ⊂ m: compare with their λ-images
        expect(dm(lambda(bracket(X, Y)), bracket(X, Y))).toBeLessThan(ALG);
        expect(dm(lambda(bracket(A, X)), bracket(A, X).map((v) => -v))).toBeLessThan(ALG);
      }
  });

  it('exp(tM(x)) preserves η, and exp(tM(x))·o stays on the surface at unit speed |x|', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const x = rx();
        const t = 1.5 * r();
        const g = expm(mPart(eps, [t * x[0], t * x[1]]));
        // gᵀηg = η
        for (let i = 0; i < 3; i++)
          for (let j = 0; j < 3; j++) {
            const col = (c: number): V3 => [g[c], g[3 + c], g[6 + c]];
            expect(Math.abs(eta(eps, col(i), col(j)) - (i === j ? (i === 0 ? eps : 1) : 0))).toBeLessThan(1e-11);
          }
        const u = geodesic(eps, x, t);
        expect(Math.abs(eta(eps, u, u) - eps)).toBeLessThan(1e-11);
        const v = mv(mPart(eps, x), u);
        expect(Math.abs(eta(eps, v, v) - (x[0] ** 2 + x[1] ** 2))).toBeLessThan(1e-11);
      }
  });

  it('Prop. 2.5.10/5: exp(tM(x))·o is a geodesic — its ambient acceleration is normal, ü = −ε|x|²u', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const x = rx();
        const t = r();
        const u = geodesic(eps, x, t);
        const M = mPart(eps, x);
        const acc = mv(M, mv(M, u));
        // sphere: ü = −|x|² u; hyperboloid: ü = +|x|² u
        const want = u.map((c) => -eps * (x[0] ** 2 + x[1] ** 2) * c);
        expect(dv(acc, want)).toBeLessThan(1e-11);
      }
  });

  it('Rem. 2.5.14: s_o fixes o, has differential −id, and reverses geodesics: s_o(γ(t)) = γ(−t)', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const x = rx();
        const t = 1.5 * r();
        expect(dv(symmetryAtOrigin(ORIGIN), ORIGIN)).toBeLessThan(ALG);
        expect(dv(symmetryAtOrigin(geodesic(eps, x, t)), geodesic(eps, x, -t))).toBeLessThan(ALG);
        // s_m = g(−S)g⁻¹ fixes m = g·o and reverses the geodesic through it
        const y = rx();
        const g = expm(mPart(eps, y));
        const gi = expm(mPart(eps, [-y[0], -y[1]]));
        const sm = symmetryAt(g, gi);
        const m = mv(g, ORIGIN);
        expect(dv(mv(sm, m), m)).toBeLessThan(1e-11);
        expect(dm(mm(sm, sm), I3)).toBeLessThan(1e-11);
      }
  });

  it('Prop. 2.5.19: T_t = s_γ(t/2) ∘ s_γ(0) equals exp(tM(x)), slides γ along itself and is parallel transport', () => {
    for (const eps of EPS)
      for (let n = 0; n < 20; n++) {
        const x = rx();
        const t = 1.5 * r();
        const T = transvection(eps, x, t);
        expect(dm(T, expm(mPart(eps, [t * x[0], t * x[1]])))).toBeLessThan(1e-11);
        const s = r();
        expect(dv(mv(T, geodesic(eps, x, s)), geodesic(eps, x, s + t))).toBeLessThan(1e-11);
        // a tangent vector at o: Y = M(y)·o; transport by the ODE vs dT_t Y
        const Y0 = mv(mPart(eps, rx()), ORIGIN);
        // RK4, 400 steps over |t||x| ≲ 2: error ≲ 1e-11
        expect(dv(transportAlong(eps, x, Y0, t), mv(T, Y0))).toBeLessThan(1e-9);
      }
  });

  it('(2.5.10) / Rem. 2.5.28: F(x, y) = −[x, y] gives sectional curvature +1 on S² and −1 on H²', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const [x, y] = [rx(), rx()];
        const R = curvatureAtOrigin(eps, x, y, y);
        const num = R[0] * x[0] + R[1] * x[1];
        const den = (x[0] ** 2 + x[1] ** 2) * (y[0] ** 2 + y[1] ** 2) - (x[0] * y[0] + x[1] * y[1]) ** 2;
        expect(Math.abs(num / den - eps)).toBeLessThan(1e-10);
      }
  });

  it('Def. 2.5.7: the Killing form is −2ε·(x·y) on m — negative (compact type) for S², positive for H²', () => {
    for (const eps of EPS)
      for (let n = 0; n < 50; n++) {
        const [x, y] = [rx(), rx()];
        expect(Math.abs(killing(eps, mPart(eps, x), mPart(eps, y)) + 2 * eps * (x[0] * y[0] + x[1] * y[1]))).toBeLessThan(ALG);
      }
  });
});
