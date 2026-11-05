/**
 * Station 4.7a kernel — characteristic numbers of 4-manifolds from curvature
 * (Thm. 4.6.11, 4.6.14; Prop. 4.7.1, Ex. 4.7.3).
 *
 * With Ω^a_b(X, Y) = ⟨R(X, Y)e_b, e_a⟩ (R_ijkl as in Station 2.8a):
 *   p₁ = −(1/8π²) tr(Ω∧Ω),   e = Pf(Ω/2π) = (1/32π²) ε_abcd Ω_ab∧Ω_cd,
 * and for Kähler manifolds, with the complex matrix Ω^C in the basis (e₁, e₃)
 * (Je₁ = e₂, Je₃ = e₄): c(T) = det(1 + (i/2π)Ω^C).
 * The model spaces are homogeneous, so each number is (density at one point)
 * × volume. The L-genus gives the signature τ = L₁ = p₁/3.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { J, levi, type Tensor4 } from './self-duality';

/** A 2-form as its antisymmetric 4×4 component matrix; evaluate α∧β on (e₁, e₂, e₃, e₄). */
export function wedge4(a: number[][], b: number[][]): number {
  return a[0][1] * b[2][3] - a[0][2] * b[1][3] + a[0][3] * b[1][2] + a[1][2] * b[0][3] - a[1][3] * b[0][2] + a[2][3] * b[0][1];
}

/** Ω^a_b as a 2-form: components Ω^a_b(e_i, e_j) = R_ij b a. */
const omega = (R: Tensor4, a: number, b: number): number[][] => [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => R[i][j][b][a]));

export function p1Density(R: Tensor4): number {
  let s = 0;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) s += wedge4(omega(R, a, b), omega(R, b, a));
  return -s / (8 * Math.PI * Math.PI);
}

export function eulerDensity(R: Tensor4): number {
  let s = 0;
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      for (let c = 0; c < 4; c++)
        for (let d = 0; d < 4; d++) {
          const e = levi(a, b, c, d);
          if (e) s += e * wedge4(omega(R, a, b), omega(R, c, d));
        }
  return s / (32 * Math.PI * Math.PI);
}

/** Chern forms of a Kähler 4-manifold: densities of c₁², c₂ (complex basis (e₁, e₃)). */
export function chernDensities(R: Tensor4): { c1sq: number; c2: number } {
  const f = [0, 2];
  const Jf = f.map((k) => [0, 1, 2, 3].map((r) => J[r][k]));
  // Ω^C_{αβ} = ⟨R f_β, f_α⟩ + i⟨R f_β, J f_α⟩ as pairs (real 2-form, imaginary 2-form)
  const entry = (al: number, be: number): [number[][], number[][]] => {
    const re = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => R[i][j][f[be]][f[al]]));
    const im = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => [0, 1, 2, 3].reduce((s, l) => s + R[i][j][f[be]][l] * Jf[al][l], 0)));
    return [re, im];
  };
  const add = (x: number[][], y: number[][], s = 1) => x.map((r, i) => r.map((v, j) => v + s * y[i][j]));
  const [o11, o22] = [entry(0, 0), entry(1, 1)];
  const [o12, o21] = [entry(0, 1), entry(1, 0)];
  // c₁ = (i/2π) tr Ω^C: real part −(Im tr)/2π
  const trIm = add(o11[1], o22[1]);
  const c1 = trIm.map((r) => r.map((v) => -v / (2 * Math.PI)));
  // c₂ = (i/2π)² det Ω^C = −(1/4π²)(Ω₁₁∧Ω₂₂ − Ω₁₂∧Ω₂₁), real part of the complex 4-form
  const cw = (x: [number[][], number[][]], y: [number[][], number[][]]) => wedge4(x[0], y[0]) - wedge4(x[1], y[1]);
  const det = cw(o11, o22) - cw(o12, o21);
  return { c1sq: wedge4(c1, c1), c2: -det / (4 * Math.PI * Math.PI) };
}

/** Volumes of the model spaces: unit S⁴, S² × S² of unit spheres, CP² with holomorphic sectional curvature 1. */
export const VOLUMES = { S4: (8 * Math.PI * Math.PI) / 3, S2S2: 16 * Math.PI * Math.PI, CP2: 8 * Math.PI * Math.PI };
