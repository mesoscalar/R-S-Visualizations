/**
 * The oriented orthonormal frame bundle O⁺(S²) ≅ SO(3) → S² in the
 * conventions of Rudolph & Schmidt, Part II: Ex. 1.1.4/4 (G → G/H),
 * Ex. 1.1.18 (O(Sⁿ) ≅ O(n+1) via the blockwise embedding R^{n+1} = R ⊕ Rⁿ),
 * Ex. 1.1.24 / 1.3.20 (Stiefel bundle, canonical connection ω_c = uᵀdu).
 *
 * A frame at x ∈ S² is f = {x, u1, u2} with (u1, u2) an oriented orthonormal
 * basis of T_xS² (u1 × u2 = x). The structure group SO(2) acts on the right,
 *   f·b(β) = {x, cos β u1 + sin β u2, −sin β u1 + cos β u2},
 * i.e. (u1 u2) ↦ (u1 u2)·b with b(β) = [[cos β, −sin β], [sin β, cos β]].
 * Ex. 1.1.18 identifies f with the matrix [x | u1 | u2] ∈ SO(3), on which
 * SO(2) acts by right multiplication with diag(1, b). The Stiefel picture of
 * Ex. 1.3.20 uses the column order [u1 | u2 | x] (k-frame first).
 *
 * Local sections: s_N on S² ∖ {south} is the normalised coordinate frame of
 * stereographic projection from the south pole; s_S = M s_N M with
 * M = diag(1, −1, −1) (rotation by π about the x-axis) on S² ∖ {north}.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { integrateRK4Path } from './ode';
import type { Vec3 } from './hopf';

export interface Frame {
  x: Vec3;
  u1: Vec3;
  u2: Vec3;
}

/** 3×3 matrix stored as its three columns. */
export type Mat3 = [Vec3, Vec3, Vec3];

export const dot3 = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: ArrayLike<number>, b: ArrayLike<number>): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const lin = (a: number, u: Vec3, b: number, v: Vec3): Vec3 => [
  a * u[0] + b * v[0],
  a * u[1] + b * v[1],
  a * u[2] + b * v[2],
];
const unit = (v: Vec3): Vec3 => {
  const r = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / r, v[1] / r, v[2] / r];
};

/** Right action of b(β) ∈ SO(2). */
export function actSO2(f: Frame, beta: number): Frame {
  const c = Math.cos(beta);
  const s = Math.sin(beta);
  return { x: f.x, u1: lin(c, f.u1, s, f.u2), u2: lin(-s, f.u1, c, f.u2) };
}

/** Ex. 1.1.18: the frame as [x | u1 | u2] ∈ SO(3). */
export function frameToSO3(f: Frame): Mat3 {
  return [f.x, f.u1, f.u2];
}

/** Ex. 1.3.20: the Stiefel 2-frame matrix u = [u1 | u2] completed to [u1 | u2 | x]. */
export function frameToStiefel(f: Frame): Mat3 {
  return [f.u1, f.u2, f.x];
}

/** Matrix product of column-stored 3×3 matrices. */
export function matMul(A: Mat3, B: Mat3): Mat3 {
  const col = (v: Vec3): Vec3 => lin(v[0], A[0], v[1], A[1]).map((t, i) => t + v[2] * A[2][i]) as Vec3;
  return [col(B[0]), col(B[1]), col(B[2])];
}

export function matT(A: Mat3): Mat3 {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]],
  ];
}

export function det3(A: Mat3): number {
  return dot3(A[0], cross3(A[1], A[2]));
}

/** Rotation that is the block embedding diag(1, b(β)) of Ex. 1.1.18. */
export function blockSO2(beta: number): Mat3 {
  const c = Math.cos(beta);
  const s = Math.sin(beta);
  return [
    [1, 0, 0],
    [0, c, s],
    [0, -s, c],
  ];
}

/** Normalised coordinate frame of stereographic projection from the south pole; null at the south pole. */
export function sectionN(x: Vec3): Frame | null {
  if (1 + x[2] < 1e-12) return null;
  const u = x[0] / (1 + x[2]);
  const v = x[1] / (1 + x[2]);
  // ∂_u, ∂_v of (2u, 2v, 1 − r²)/(1 + r²), up to the common factor 2/(1 + r²)²
  const du: Vec3 = [1 - u * u + v * v, -2 * u * v, -2 * u];
  const dv: Vec3 = [-2 * u * v, 1 + u * u - v * v, -2 * v];
  return { x, u1: unit(du), u2: unit(dv) };
}

const M = (p: Vec3): Vec3 => [p[0], -p[1], -p[2]];

/** s_S = M s_N M: the same construction centred on the south pole; null at the north pole. */
export function sectionS(x: Vec3): Frame | null {
  const f = sectionN(M(x));
  return f ? { x, u1: M(f.u1), u2: M(f.u2) } : null;
}

/** κ(f) relative to a reference frame g at the same point: the β with f = g·b(β). */
export function frameAngle(g: Frame, f: Frame): number {
  return Math.atan2(dot3(f.u1, g.u2), dot3(f.u1, g.u1));
}

/** Transition map ρ_NS(x) = κ_N κ_S⁻¹: the angle of s_S measured in s_N. */
export function transitionNS(x: Vec3): number | null {
  const n = sectionN(x);
  const s = sectionS(x);
  return n && s ? frameAngle(n, s) : null;
}

/** Rotation log: axis·angle vector with angle ∈ [0, π] (the "π-ball" picture of SO(3)). */
export function so3Log(A: Mat3): Vec3 {
  const tr = A[0][0] + A[1][1] + A[2][2];
  const c = Math.max(-1, Math.min(1, (tr - 1) / 2));
  const ang = Math.acos(c);
  // axial vector of the antisymmetric part: (A − Aᵀ)/2 = sin(ang)·[n]×
  const w: Vec3 = [(A[1][2] - A[2][1]) / 2, (A[2][0] - A[0][2]) / 2, (A[0][1] - A[1][0]) / 2];
  const s = Math.hypot(w[0], w[1], w[2]);
  if (s > 1e-9) return [(w[0] / s) * ang, (w[1] / s) * ang, (w[2] / s) * ang];
  if (c > 0) return [0, 0, 0];
  // ang ≈ π: axis from the symmetric part (A + I)/2 = n nᵀ
  const cols = [A[0], A[1], A[2]].map((col, i) => {
    const v: Vec3 = [col[0], col[1], col[2]];
    v[i] += 1;
    return v;
  });
  const best = cols.reduce((a, b) => (Math.hypot(...b) > Math.hypot(...a) ? b : a));
  const n = unit(best);
  return [n[0] * ang, n[1] * ang, n[2] * ang];
}

/**
 * Stiefel canonical connection ω_c = uᵀdu (1.3.19) on the 2-frame u = [u1 | u2]:
 * an so(2)-valued form, returned as its (2,1) entry u2·du1 (the generator
 * A = [[0, −1], [1, 0]] has coefficient 1).
 */
export function stiefelOmega(f: Frame, df: { u1: Vec3; u2: Vec3 }): number {
  return dot3(f.u2, df.u1);
}

/**
 * Horizontal (ω_c = 0) transport of a frame along a base curve x(t): the
 * frame vectors stay tangent and do not spin, u̇_i = −(u_i·ẋ) x — the
 * extrinsic Levi-Civita transport on S². RK4 with re-orthonormalisation.
 */
export function transportFrame(
  xOf: (t: number) => Vec3,
  xDot: (t: number) => Vec3,
  f0: Frame,
  t0: number,
  t1: number,
  nSteps: number,
): Frame[] {
  const rhs = (t: number, y: Float64Array): Float64Array => {
    const x = xOf(t);
    const xd = xDot(t);
    const a = y[0] * xd[0] + y[1] * xd[1] + y[2] * xd[2];
    const b = y[3] * xd[0] + y[4] * xd[1] + y[5] * xd[2];
    return Float64Array.of(-a * x[0], -a * x[1], -a * x[2], -b * x[0], -b * x[1], -b * x[2]);
  };
  const { ts, ys } = integrateRK4Path(rhs, t0, Float64Array.of(...f0.u1, ...f0.u2), t1, nSteps);
  return ys.map((y, k) => {
    const x = xOf(ts[k]);
    // project onto T_x S² and re-orthonormalise (Gram–Schmidt); removes O(h⁵) drift
    let u1: Vec3 = [y[0], y[1], y[2]];
    u1 = unit(lin(1, u1, -dot3(u1, x), x));
    const u2 = cross3(x, u1);
    return { x, u1, u2 };
  });
}
