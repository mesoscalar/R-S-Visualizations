/**
 * Station 1.6a kernel — a fibre metric as a bundle reduction (Prop. 1.6.2,
 * Cor. 1.6.5, Ex. 1.6.6/2, Prop. 1.6.10, Def. 1.6.11, Ex. 1.6.12).
 *
 * E = S¹ × R² with a fibre metric h(s) whose principal axes turn by k·π
 * around the loop. A frame e (columns e₁, e₂) has Gram matrix
 * Φ̃(e) = eᵀ h e ∈ Sym⁺(2) ≅ GL(2)/O(2); Φ̃(e·a) = aᵀ Φ̃(e) a is the
 * equivariant map of Prop. 1.6.2 and Q = Φ̃⁻¹(1) is the bundle of
 * h-orthonormal frames. Connections are ∇Φ = Φ′ + AΦ in the standard frame.
 *
 * Matrices are 2×2 row-major [a, b, c, d] = [[a, b], [c, d]].
 * Pure module: no DOM / WebGL imports.
 */
import { integrateRK4Path } from '@rsvis/math';

export type M2 = [number, number, number, number];
export type V2 = [number, number];

export const mul = (x: M2, y: M2): M2 => [
  x[0] * y[0] + x[1] * y[2],
  x[0] * y[1] + x[1] * y[3],
  x[2] * y[0] + x[3] * y[2],
  x[2] * y[1] + x[3] * y[3],
];
export const tr = (x: M2): M2 => [x[0], x[2], x[1], x[3]];
export const det = (x: M2): number => x[0] * x[3] - x[1] * x[2];
export const inv = (x: M2): M2 => {
  const d = det(x);
  return [x[3] / d, -x[1] / d, -x[2] / d, x[0] / d];
};
export const add = (x: M2, y: M2): M2 => [x[0] + y[0], x[1] + y[1], x[2] + y[2], x[3] + y[3]];
export const scale = (s: number, x: M2): M2 => [s * x[0], s * x[1], s * x[2], s * x[3]];
export const apply = (x: M2, v: V2): V2 => [x[0] * v[0] + x[1] * v[1], x[2] * v[0] + x[3] * v[1]];
export const rot = (b: number): M2 => [Math.cos(b), -Math.sin(b), Math.sin(b), Math.cos(b)];
export const J: M2 = [0, -1, 1, 0];
export const I2: M2 = [1, 0, 0, 1];

/** Inverse square root of a symmetric positive definite matrix (closed form via √x = (x + √det·1)/√(tr + 2√det)). */
export function invSqrtSPD(x: M2): M2 {
  const sd = Math.sqrt(det(x));
  const t = Math.sqrt(x[0] + x[3] + 2 * sd);
  return inv(scale(1 / t, add(x, scale(sd, I2))));
}

export interface MetricParams {
  /** the principal axes turn by twist·π around the loop (integer, so h is periodic) */
  twist: number;
  /** anisotropy: the h-unit ellipse has semi-axes e^δ and e^{−δ}(1 + w sin s) */
  delta: number;
  wobble: number;
}

function axes(s: number, p: MetricParams): { a: number; b: number; db: number; beta: number; dbeta: number } {
  return {
    a: Math.exp(p.delta),
    b: Math.exp(-p.delta) * (1 + p.wobble * Math.sin(s)),
    db: Math.exp(-p.delta) * p.wobble * Math.cos(s),
    beta: (p.twist * s) / 2,
    dbeta: p.twist / 2,
  };
}

/** h(s) = R(β) diag(a⁻², b⁻²) R(β)ᵀ: the unit ellipse {vᵀhv = 1} has semi-axes a, b along R(β)ε₁, R(β)ε₂. */
export function metric(s: number, p: MetricParams): M2 {
  const { a, b, beta } = axes(s, p);
  const R = rot(beta);
  return mul(mul(R, [1 / (a * a), 0, 0, 1 / (b * b)]), tr(R));
}

/** h′(s), differentiated by hand: R′ = β′JR, (b⁻²)′ = −2b′/b³. */
export function metricDeriv(s: number, p: MetricParams): M2 {
  const { a, b, db, beta, dbeta } = axes(s, p);
  const R = rot(beta);
  const D: M2 = [1 / (a * a), 0, 0, 1 / (b * b)];
  const dD: M2 = [0, 0, 0, (-2 * db) / (b * b * b)];
  const dR = scale(dbeta, mul(J, R));
  return add(add(mul(mul(dR, D), tr(R)), mul(mul(R, dD), tr(R))), mul(mul(R, D), tr(dR)));
}

/** Φ̃(e) = eᵀ h e: the equivariant map L(E) → Sym⁺(2) of Prop. 1.6.2. */
export const gram = (h: M2, e: M2): M2 => mul(mul(tr(e), h), e);

/** Polar retraction L(E) → Q = Φ̃⁻¹(1): e ↦ e·Φ̃(e)^{−1/2}, O(2)-equivariant. */
export const toQ = (h: M2, e: M2): M2 => mul(e, invSqrtSPD(gram(h, e)));

export type ConnKind = 'h' | 'euclid';

/**
 * Connection matrix A(s) (∇Φ = Φ′ + AΦ). 'h': A = ½h⁻¹h′ + κh⁻¹J, the general
 * solution of h′ = Aᵀh + hA, i.e. (1.6.7). 'euclid': A = κJ, compatible with
 * the standard metric of R² but not with h.
 */
export function connection(kind: ConnKind, s: number, p: MetricParams, kappa: number): M2 {
  if (kind === 'euclid') return scale(kappa, J);
  const hi = inv(metric(s, p));
  return add(scale(0.5, mul(hi, metricDeriv(s, p))), scale(kappa, mul(hi, J)));
}

/** Parallel transport of a frame (or, column-wise, of vectors) along s ∈ [0, s1]: F′ = −AF, RK4. */
export function transport(
  kind: ConnKind,
  p: MetricParams,
  kappa: number,
  F0: M2,
  s1: number,
  steps = 600,
): { ss: number[]; frames: M2[] } {
  const f = (s: number, y: Float64Array) => {
    const A = connection(kind, s, p, kappa);
    return Float64Array.from(scale(-1, mul(A, [y[0], y[1], y[2], y[3]])));
  };
  const { ts, ys } = integrateRK4Path(f, 0, Float64Array.from(F0), s1, steps);
  return { ss: Array.from(ts), frames: ys.map((y) => [y[0], y[1], y[2], y[3]] as M2) };
}

/** Holonomy around the loop: Hol = F(2π)F(0)⁻¹ in the standard frame. */
export function holonomy(kind: ConnKind, p: MetricParams, kappa: number, steps = 2000): M2 {
  const { frames } = transport(kind, p, kappa, I2, 2 * Math.PI, steps);
  return frames[frames.length - 1];
}

/** Rotation angle of a holonomy matrix in an h(0)-orthonormal frame (meaningful when Hol ∈ SO(h)). */
export function holonomyAngle(hol: M2, p: MetricParams): number {
  const q = toQ(metric(0, p), I2);
  const r = mul(mul(inv(q), hol), q);
  return Math.atan2(r[2], r[0]);
}
