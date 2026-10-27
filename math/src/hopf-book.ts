/**
 * The complex Hopf bundle in the exact conventions of Rudolph & Schmidt,
 * Part II: Example 1.1.20 (trivializations), Remark 1.1.21 (CP^1 ≅ S^2,
 * nontriviality) and Example 1.3.22 (canonical connection).
 *
 * State vectors are those of ./hopf: z = [Re z1, Im z1, Re z2, Im z2] ∈ S^3.
 * The structure group U(1) acts by Ψ(z, e^{iα}) = (e^{iα} z1, e^{iα} z2)
 * (= fiberPoint), and the base is identified with S^2 by the book's
 *   f(z1, z2) = (2 z̄1 z2, |z1|^2 − |z2|^2) ∈ C × R     (= hopfMap).
 * U1 = S^2 \ {π(0,1)} = S^2 \ {south pole}, U2 = S^2 \ {π(1,0)} = S^2 \ {north pole}.
 * κ_i = z_i/|z_i| (1.1.1), sections s_i(m) = χ_i^{-1}(m, 1) (Prop. 1.1.6),
 * ρ12 = κ1 κ2^{-1} (1.1.5). u(1) = iR-valued forms are returned as their
 * real coefficient a, meaning the form's value is i·a.
 *
 * Pure module: no DOM / WebGL imports.
 */

import { fiberPoint, type Vec3, type Vec4 } from './hopf';

/** A complex number [re, im]. */
export type Cx = [number, number];

export function cmul(a: Cx, b: Cx): Cx {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
export function cconj(a: Cx): Cx {
  return [a[0], -a[1]];
}
export function cexpi(t: number): Cx {
  return [Math.cos(t), Math.sin(t)];
}
export function carg(a: Cx): number {
  return Math.atan2(a[1], a[0]);
}

/**
 * Below this modulus z_i is treated as 0, i.e. the point is outside π^{-1}(U_i).
 * Chosen far above roundoff (1e-16) so that κ_i is never a ratio of noise.
 */
export const CHART_EPS = 1e-12;

/** κ1(z) = z1/|z1| on π^{-1}(U1); null where z1 = 0 (the fibre over the south pole). */
export function kappa1(z: ArrayLike<number>): Cx | null {
  const r = Math.hypot(z[0], z[1]);
  return r < CHART_EPS ? null : [z[0] / r, z[1] / r];
}

/** κ2(z) = z2/|z2| on π^{-1}(U2); null where z2 = 0 (the fibre over the north pole). */
export function kappa2(z: ArrayLike<number>): Cx | null {
  const r = Math.hypot(z[2], z[3]);
  return r < CHART_EPS ? null : [z[2] / r, z[3] / r];
}

/** Right action of e^{iα}; alias of fiberPoint in the book's notation Ψ_a. */
export function actU1(z: ArrayLike<number>, alpha: number): Vec4 {
  return fiberPoint(z, alpha);
}

/** Right action by a unit complex number a. */
export function actBy(z: ArrayLike<number>, a: Cx): Vec4 {
  return fiberPoint(z, carg(a));
}

/**
 * Local section s1 = χ1^{-1}(·, 1) over U1: the point of the fibre with z1 > 0.
 * With m = (w, t), w = x + iy: s1(m) = (√((1+t)/2), w/√(2(1+t))). Null at the south pole.
 */
export function section1(m: Vec3): Vec4 | null {
  const t = m[2];
  if (1 + t < CHART_EPS) return null;
  const a = Math.sqrt((1 + t) / 2);
  const d = Math.sqrt(2 * (1 + t));
  return [a, 0, m[0] / d, m[1] / d];
}

/**
 * Local section s2 = χ2^{-1}(·, 1) over U2: the point with z2 > 0, i.e. the
 * book's g₊(w, t) = (w̄/√(2(1−t)), √((1−t)/2)) of Remark 1.1.21/1. Null at the north pole.
 */
export function section2(m: Vec3): Vec4 | null {
  const t = m[2];
  if (1 - t < CHART_EPS) return null;
  const d = Math.sqrt(2 * (1 - t));
  return [m[0] / d, -m[1] / d, Math.sqrt((1 - t) / 2), 0];
}

/** χ_i^{-1}(m, g) = s_i(m) · g. */
export function chiInverse(i: 1 | 2, m: Vec3, g: Cx): Vec4 | null {
  const s = i === 1 ? section1(m) : section2(m);
  return s ? actBy(s, g) : null;
}

/**
 * Transition mapping ρ12(m) = κ1(p) κ2(p)^{-1}, p ∈ π^{-1}(m) (1.1.5), evaluated
 * at p = s2(m) where κ2 = 1. Null off U1 ∩ U2. Closed form: e^{−iφ}, φ = azimuth.
 */
export function transition12(m: Vec3): Cx | null {
  const s = section2(m);
  if (!s) return null;
  return kappa1(s);
}

/** ρ12 from an arbitrary point of the fibre (used to test fibre-independence). */
export function transitionAt(z: ArrayLike<number>): Cx | null {
  const k1 = kappa1(z);
  const k2 = kappa2(z);
  return k1 && k2 ? cmul(k1, cconj(k2)) : null;
}

/** The book's loop γ̃(t) = (e^{it/2}/√2, e^{−it/2}/√2), t ∈ [0, 2π] (Remark 1.1.21/2). */
export function bookLoop(t: number): Vec4 {
  const r = Math.SQRT1_2;
  return [r * Math.cos(t / 2), r * Math.sin(t / 2), r * Math.cos(t / 2), -r * Math.sin(t / 2)];
}

/**
 * Canonical connection ω_c = z̄1 dz1 + z̄2 dz2 (Ex. 1.3.22) on v ∈ T_z S^3,
 * returned as a with ω_c(v) = i·a. (Re⟨z, v⟩ = 0 on T_z S^3, so the real
 * part vanishes; tests assert this.)
 */
export function omegaC(z: ArrayLike<number>, v: ArrayLike<number>): number {
  // Im(z̄1 v1 + z̄2 v2)
  return z[0] * v[1] - z[1] * v[0] + z[2] * v[3] - z[3] * v[2];
}

/** Real part of z̄1 v1 + z̄2 v2 (zero exactly on tangent vectors to S^3). */
export function omegaCRe(z: ArrayLike<number>, v: ArrayLike<number>): number {
  return z[0] * v[0] + z[1] * v[1] + z[2] * v[2] + z[3] * v[3];
}

/** Killing vector field A* of A = i ∈ u(1): (A*)_z = d/dt z e^{it} = i z. */
export function killingI(z: ArrayLike<number>): Vec4 {
  return [-z[1], z[0], -z[3], z[2]];
}

/** Spherical coordinates (θ, φ) of a base point (θ from the north pole). */
export function polarAngles(m: Vec3): [number, number] {
  return [Math.acos(Math.max(-1, Math.min(1, m[2]))), Math.atan2(m[1], m[0])];
}

export function fromPolar(theta: number, phi: number): Vec3 {
  return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
}

/**
 * Local representatives 𝒜_i = s_i^* ω_c (1.3.11) in spherical coordinates,
 * as the coefficient of i·dφ (no dθ component):
 *   𝒜_1 = (i/2)(1 − cos θ) dφ on U1,   𝒜_2 = −(i/2)(1 + cos θ) dφ on U2.
 * Derived by hand from section1/section2; the tests re-derive them by
 * differentiating the sections numerically.
 */
export function potential1Phi(theta: number): number {
  return 0.5 * (1 - Math.cos(theta));
}
export function potential2Phi(theta: number): number {
  return -0.5 * (1 + Math.cos(theta));
}
