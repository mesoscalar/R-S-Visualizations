/**
 * Station 4.6a kernel — Chern–Weil forms do not depend on the connection
 * (Lemma 4.6.5, Def. 4.6.6, Cor. 4.6.8, Thm. 4.6.11, Cor. 4.6.12).
 *
 * U(1): the affine family ω_t = (1 − t)ω_c + tω_PU on the Hopf bundle (Station
 * 1.3c). In chart 1, ω_t = i a_t(θ)dφ, 𝓕_t = i a_t′(θ) dθ∧dφ, and the
 * transgression of Lemma 4.6.5 is 𝓕_t − 𝓕_0 = d(tβ) with β = ω_PU − ω_c basic.
 *
 * SU(2): the BPST family 𝒜_λ = Im(x̄dx)/(λ² + |x|²) on R⁴ (Station 1.4b at
 * scale λ). The charge inside |x| < R is computed two ways: the bulk integral
 * of (1/8π²) tr 𝓕∧𝓕 and the flux of the Chern–Simons form
 * (1/8π²) tr(𝒜∧d𝒜 + ⅔𝒜∧𝒜∧𝒜) through the sphere |x| = R.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { qmul, type Quat } from '@rsvis/math';
import { betaPhi, torusSlope } from './affine-connections';
import { chargeDensity, components, curvatureFD, type Potential4 } from './quaternionic-hopf';

export const LO = -0.6;
export const HI = 0.2;

/** a_t(θ): the dφ-coefficient of ω_t in chart 1. */
export const coefficient = (t: number, theta: number) => torusSlope(t, theta, LO, HI);

/** Curvature density per unit area a_t′(θ)/sin θ (central difference, h = 1e-5). */
export function density(t: number, theta: number, h = 1e-5): number {
  return (coefficient(t, theta + h) - coefficient(t, theta - h)) / (2 * h) / Math.sin(theta);
}

/** c₁ = (i/2π)∫𝓕 = −(a_t(π) − a_t(0)). */
export const chernNumber = (t: number) => -(coefficient(t, Math.PI - 1e-12) - coefficient(t, 1e-12));

/** The transgression potential: the dφ-coefficient of t·β. */
export const transgression = (t: number, theta: number) => t * betaPhi(theta, LO, HI);

/** The BPST potential at scale λ: 𝒜_μ = Im(x̄ e_μ)/(λ² + |x|²). */
export function bpstScaled(lambda: number): Potential4 {
  return (x) => {
    const r2 = x[0] * x[0] + x[1] * x[1] + x[2] * x[2] + x[3] * x[3];
    return [0, 1, 2, 3].map((mu) => {
      const e: Quat = [0, 0, 0, 0];
      e[mu] = 1;
      const q = qmul([x[0], -x[1], -x[2], -x[3]], e);
      return [0, q[1] / (lambda * lambda + r2), q[2] / (lambda * lambda + r2), q[3] / (lambda * lambda + r2)] as Quat;
    });
  };
}

/** The pure gauge Im(x̄dx)/|x|² that 𝒜_λ approaches as |x| → ∞. */
export const pureGauge: Potential4 = (x) => {
  const r2 = x[0] * x[0] + x[1] * x[1] + x[2] * x[2] + x[3] * x[3];
  return [0, 1, 2, 3].map((mu) => {
    const e: Quat = [0, 0, 0, 0];
    e[mu] = 1;
    const q = qmul([x[0], -x[1], -x[2], -x[3]], e);
    return [0, q[1] / r2, q[2] / r2, q[3] / r2] as Quat;
  });
};

/** Bulk charge (1/8π²)∫_{|x|<R} tr 𝓕∧𝓕 for a radial density (Simpson on N panels in r). */
export function bulkCharge(A: Potential4, R: number, N = 200): number {
  const f = (r: number) => (r === 0 ? 0 : chargeDensity(components((m, n) => curvatureFD(A, [r, 0, 0, 0], m, n))) * 2 * Math.PI * Math.PI * r ** 3);
  const h = R / N;
  let s = f(0) + f(R);
  for (let k = 1; k < N; k++) s += (k % 2 ? 4 : 2) * f(k * h);
  return (s * h) / 3;
}

const tr = (...qs: Quat[]) => 2 * qs.reduce((acc, q) => qmul(acc, q), [1, 0, 0, 0] as Quat)[0];
const comb = (A: Quat[], X: number[]): Quat => [0, 1, 2, 3].map((i) => A.reduce((s, a, mu) => s + X[mu] * a[i], 0)) as Quat;

/** The Chern–Simons 3-form (1/8π²) tr(𝒜∧d𝒜 + ⅔ 𝒜∧𝒜∧𝒜) on vectors X, Y, Z at x (d𝒜 by central differences). */
export function chernSimons(A: Potential4, x: number[], X: number[], Y: number[], Z: number[], h = 1e-5): number {
  const a = A(x as Quat);
  const dA = [0, 1, 2, 3].map((mu) => {
    const p = A(x.map((c, i) => c + (i === mu ? h : 0)) as Quat);
    const q = A(x.map((c, i) => c - (i === mu ? h : 0)) as Quat);
    return p.map((v, nu) => v.map((c, k) => (c - q[nu][k]) / (2 * h)) as Quat);
  });
  // d𝒜(U, V) = Σ U^μ V^ν (∂_μ𝒜_ν − ∂_ν𝒜_μ)
  const dAUV = (U: number[], V: number[]): Quat => {
    const out: Quat = [0, 0, 0, 0];
    for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) for (let k = 0; k < 4; k++) out[k] += U[m] * V[n] * (dA[m][n][k] - dA[n][m][k]);
    return out;
  };
  const [AX, AY, AZ] = [comb(a, X), comb(a, Y), comb(a, Z)];
  const AdA = tr(AX, dAUV(Y, Z)) - tr(AY, dAUV(X, Z)) + tr(AZ, dAUV(X, Y));
  // (𝒜∧𝒜∧𝒜)(X,Y,Z) traced = 3 tr(𝒜_X[𝒜_Y, 𝒜_Z])
  const AAA = 3 * (tr(AX, AY, AZ) - tr(AX, AZ, AY));
  return (AdA + (2 / 3) * AAA) / (8 * Math.PI * Math.PI);
}

/** Flux of the Chern–Simons form through |x| = R, outward orientation (midpoint rule in hyperspherical angles). */
export function csFlux(A: Potential4, R: number, N = 24): number {
  const [Nc, Nt, Np] = [N, N, 2 * N];
  let s = 0;
  for (let i = 0; i < Nc; i++) {
    const c = ((i + 0.5) * Math.PI) / Nc;
    for (let j = 0; j < Nt; j++) {
      const t = ((j + 0.5) * Math.PI) / Nt;
      for (let k = 0; k < Np; k++) {
        const p = ((k + 0.5) * 2 * Math.PI) / Np;
        const [sc, cc, st, ct, sp, cp] = [Math.sin(c), Math.cos(c), Math.sin(t), Math.cos(t), Math.sin(p), Math.cos(p)];
        const x = [R * cc, R * sc * ct, R * sc * st * cp, R * sc * st * sp];
        const Xc = [-R * sc, R * cc * ct, R * cc * st * cp, R * cc * st * sp];
        const Xt = [0, -R * sc * st, R * sc * ct * cp, R * sc * ct * sp];
        const Xp = [0, 0, -R * sc * st * sp, R * sc * st * cp];
        s += chernSimons(A, x, Xc, Xt, Xp);
      }
    }
  }
  return s * (Math.PI / Nc) * (Math.PI / Nt) * ((2 * Math.PI) / Np);
}
