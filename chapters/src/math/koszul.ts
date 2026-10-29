/**
 * Station 1.5a kernel — the covariant derivative on TS² induced by the frame
 * bundle connection ω_c = uᵀdu (Stations 1.1c/1.3d), via the Koszul calculus
 * (Def. 1.5.2, Prop. 1.5.3, Rem. 1.5.5, Prop. 1.5.11, Prop. 1.7.17).
 *
 * In the local frame e_α = s_N (Prop. 1.5.3): ∇e_α = 𝒜^β_α e_β with
 * 𝒜^β_α(X) = e_β · D_X e_α, and for V = ξ^α e_α (1.5.8):
 *   ∇_X V = (Xξ^α) e_α + ξ^α 𝒜^β_α(X) e_β.
 * Vector fields are maps S² → R³ tangent to the sphere; derivatives along X
 * are central differences along the great circle through m with velocity X.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { sectionN, transportFrame, type Frame, type Vec3 } from '@rsvis/math';

export type Field = (m: Vec3) => Vec3;
/** A local section of the frame bundle (s_N, s_S, …); null outside its domain. */
export type Section = (m: Vec3) => Frame | null;

const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const comb = (a: number, u: ArrayLike<number>, b: number, v: ArrayLike<number>): Vec3 => [
  a * u[0] + b * v[0],
  a * u[1] + b * v[1],
  a * u[2] + b * v[2],
];

/** Point reached from m along the great circle with initial velocity X after time t. */
export function geodesic(m: Vec3, X: Vec3, t: number): Vec3 {
  const n = Math.hypot(...X);
  if (n === 0) return m;
  const c = Math.cos(n * t);
  const s = Math.sin(n * t) / n;
  return comb(c, m, s, X);
}

/** Directional derivative of any map S² → R^k at m along X (central difference, step h). */
export function derivative(F: (m: Vec3) => ArrayLike<number>, m: Vec3, X: Vec3, h = 1e-5): number[] {
  const p = F(geodesic(m, X, h));
  const q = F(geodesic(m, X, -h));
  return Array.from(p, (v, i) => (v - q[i]) / (2 * h));
}

/** Tangential projection onto T_mS². */
export function tangential(m: Vec3, v: ArrayLike<number>): Vec3 {
  const d = dot(m, v);
  return [v[0] - d * m[0], v[1] - d * m[1], v[2] - d * m[2]];
}

/** 𝒜^β_α(X) = e_β · D_X e_α for the frame sec (Prop. 1.5.3); returns [[𝒜¹₁, 𝒜¹₂], [𝒜²₁, 𝒜²₂]]. */
export function connectionMatrix(m: Vec3, X: Vec3, h = 1e-5, sec: Section = sectionN): number[][] {
  const f = sec(m)!;
  const e = [f.u1, f.u2];
  const de = [0, 1].map((a) => derivative((p) => (a === 0 ? sec(p)!.u1 : sec(p)!.u2), m, X, h));
  return [0, 1].map((b) => [0, 1].map((a) => dot(e[b], de[a])));
}

/** The two terms of (1.5.8) in the frame sec: (Xξ^α) e_α and ξ^α 𝒜^β_α(X) e_β. Each depends on the frame; their sum does not. */
export function nablaTerms(V: Field, m: Vec3, X: Vec3, h = 1e-5, sec: Section = sectionN): { dxi: Vec3; conn: Vec3 } {
  const f = sec(m)!;
  const xi = (p: Vec3) => {
    const g = sec(p)!;
    const v = V(p);
    return [dot(v, g.u1), dot(v, g.u2)];
  };
  const x0 = xi(m);
  const dxi = derivative(xi, m, X, h);
  const A = connectionMatrix(m, X, h, sec);
  const c = [0, 1].map((b) => A[b][0] * x0[0] + A[b][1] * x0[1]);
  return { dxi: comb(dxi[0], f.u1, dxi[1], f.u2), conn: comb(c[0], f.u1, c[1], f.u2) };
}

/** ∇_X V at m by the local formula (1.5.8) in the frame sec. */
export function nablaLocal(V: Field, m: Vec3, X: Vec3, h = 1e-5, sec: Section = sectionN): Vec3 {
  const { dxi, conn } = nablaTerms(V, m, X, h, sec);
  return [dxi[0] + conn[0], dxi[1] + conn[1], dxi[2] + conn[2]];
}

/** ∇_X V as the tangential part of the ambient derivative (Levi-Civita on the embedded sphere). */
export function nablaExtrinsic(V: Field, m: Vec3, X: Vec3, h = 1e-5): Vec3 {
  return tangential(m, derivative(V, m, X, h));
}

/**
 * Prop. 1.7.17: (P_t)^{-1} V(γ(t)) — the value at γ(t) transported back to m
 * along the great circle γ with γ(0) = m, γ′(0) = X — expressed in R³.
 */
export function transportedBack(V: Field, m: Vec3, X: Vec3, t: number, steps = 200): Vec3 {
  const f0 = sectionN(m)!;
  const xOf = (s: number) => geodesic(m, X, s);
  const xDot = (s: number): Vec3 => {
    const n = Math.hypot(...X);
    return comb(-n * Math.sin(n * s), m, Math.cos(n * s), X);
  };
  const path = transportFrame(xOf, xDot, f0, 0, t, steps);
  const ft: Frame = path[path.length - 1];
  const v = V(ft.x);
  return comb(dot(v, ft.u1), f0.u1, dot(v, ft.u2), f0.u2);
}

/** Curvature R(X, Y)V = ∇_X∇_Y V − ∇_Y∇_X V − ∇_[X,Y] V (Prop. 1.5.11) for vector fields X, Y, V. */
export function curvatureR(X: Field, Y: Field, V: Field, m: Vec3, h = 1e-4): Vec3 {
  const nab = (A: Field, B: Field): Field => (p) => nablaLocal(B, p, A(p), h);
  const a = nablaLocal(nab(Y, V), m, X(m), h);
  const b = nablaLocal(nab(X, V), m, Y(m), h);
  // Lie bracket of tangent fields on S²: [X, Y] = D_X Y − D_Y X (its tangential part)
  const br = tangential(m, derivative(Y, m, X(m), h).map((v, i) => v - derivative(X, m, Y(m), h)[i]));
  const c = nablaLocal(V, m, br, h);
  return [a[0] - b[0] - c[0], a[1] - b[1] - c[1], a[2] - b[2] - c[2]];
}

/** Killing field of rotation about the axis a: m ↦ a × m. */
export function rotationField(a: Vec3): Field {
  return (m) => [a[1] * m[2] - a[2] * m[1], a[2] * m[0] - a[0] * m[2], a[0] * m[1] - a[1] * m[0]];
}

/** Tangent gradient field of h(x) = c·x + xᵀQx. */
export function gradField(c: Vec3, Q: [Vec3, Vec3, Vec3]): Field {
  return (m) => tangential(m, [0, 1, 2].map((i) => c[i] + 2 * dot(Q[i], m)));
}
