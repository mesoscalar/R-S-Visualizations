/**
 * Station 1.4b kernel — curvature of the canonical connection on the
 * quaternionic Hopf bundle Sp(1) → S⁷ → HP¹ ≅ S⁴ (Ex. 1.1.22, (1.3.21),
 * Exercise 1.4.2; Prop. 1.4.9, 1.4.11, Rem. 1.4.12, 1.4.15).
 *
 * On S⁷ ⊂ H²: ω = q̄₁dq₁ + q̄₂dq₂ (Im H-valued), and by the structure
 * equation Ω = dω + ½[ω ∧ ω], i.e. Ω(X, Y) = Σ(X̄ᵢYᵢ − ȲᵢXᵢ) + [ω(X), ω(Y)].
 * In the affine chart x = q₂q₁⁻¹ ∈ H ≅ R⁴ with section s₁(x) = (1, x)/√(1+|x|²),
 * the local potential is 𝒜 = Im(x̄dx)/(1+|x|²) and 𝓕 = dx̄ ∧ dx/(1+|x|²)².
 * The second chart's section is s₂ = s₁·g with g = x̄/|x|.
 *
 * Quaternions are [re, i, j, k]; Im H ≅ su(2) with [p, q] = pq − qp, and in
 * the 2×2 representation tr(pq) = 2Re(pq). Pure module: no DOM / WebGL imports.
 */
import { qconj, qmul, type Quat } from '@rsvis/math';

export type H2 = [Quat, Quat];
/** Components 𝒜_μ (μ = 0..3) at x. */
export type Potential4 = (x: Quat) => Quat[];

export const E: Quat[] = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];
const add = (a: Quat, b: Quat): Quat => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
const sub = (a: Quat, b: Quat): Quat => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const sc = (s: number, a: Quat): Quat => [s * a[0], s * a[1], s * a[2], s * a[3]];
const n2 = (a: Quat) => a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3];
export const bracket = (p: Quat, q: Quat): Quat => sub(qmul(p, q), qmul(q, p));

/** ω_p(X) = q̄₁X₁ + q̄₂X₂. */
export function omega(p: H2, X: H2): Quat {
  return add(qmul(qconj(p[0]), X[0]), qmul(qconj(p[1]), X[1]));
}

/** Ω_p(X, Y) = dω(X, Y) + [ω(X), ω(Y)] with dω = dq̄₁∧dq₁ + dq̄₂∧dq₂. */
export function Omega(p: H2, X: H2, Y: H2): Quat {
  let d: Quat = [0, 0, 0, 0];
  for (const i of [0, 1]) d = add(d, sub(qmul(qconj(X[i]), Y[i]), qmul(qconj(Y[i]), X[i])));
  return add(d, bracket(omega(p, X), omega(p, Y)));
}

/** Fundamental vector field A*_p = p·A (right action (q₁, q₂)·u = (q₁u, q₂u)). */
export const fundamental = (p: H2, A: Quat): H2 => [qmul(p[0], A), qmul(p[1], A)];

/** Right action on points and (by linearity) on tangent vectors. */
export const act = (p: H2, u: Quat): H2 => [qmul(p[0], u), qmul(p[1], u)];

/** Project an arbitrary vector of H² onto T_pS⁷ (remove the radial part). */
export function tangent(p: H2, v: H2): H2 {
  const r = p[0].reduce((s, c, i) => s + c * v[0][i], 0) + p[1].reduce((s, c, i) => s + c * v[1][i], 0);
  return [sub(v[0], sc(r, p[0])), sub(v[1], sc(r, p[1]))];
}

/** s₁(x) = (1, x)/√(1+|x|²). */
export function section1(x: Quat): H2 {
  const r = 1 / Math.sqrt(1 + n2(x));
  return [[r, 0, 0, 0], sc(r, x)];
}

/** s₂ = s₁·g with g = x̄/|x| (defined for x ≠ 0): the section (y, 1)/√(1+|y|²), y = x⁻¹. */
export function section2(x: Quat): H2 {
  return act(section1(x), gauge12(x));
}

/** The transition g(x) = x̄/|x| with s₂ = s₁·g. */
export const gauge12 = (x: Quat): Quat => sc(1 / Math.sqrt(n2(x)), qconj(x));

/** Push e_μ forward by a section (central difference, step h). */
export function sectionDeriv(s: (x: Quat) => H2, x: Quat, mu: number, h = 1e-6): H2 {
  const p = s(add(x, sc(h, E[mu])));
  const m = s(sub(x, sc(h, E[mu])));
  return [sc(1 / (2 * h), sub(p[0], m[0])), sc(1 / (2 * h), sub(p[1], m[1]))];
}

/** 𝒜 = s*ω in components. */
export function pullbackPotential(s: (x: Quat) => H2): Potential4 {
  return (x) => [0, 1, 2, 3].map((mu) => omega(s(x), sectionDeriv(s, x, mu)));
}

/** Closed form 𝒜_μ = Im(x̄ e_μ)/(1+|x|²) for s₁. */
export const bpstPotential: Potential4 = (x) =>
  E.map((e) => {
    const q = qmul(qconj(x), e);
    return sc(1 / (1 + n2(x)), [0, q[1], q[2], q[3]]);
  });

/** Closed form 𝓕_μν = (ē_μe_ν − ē_νe_μ)/(1+|x|²)² for s₁. */
export function bpstCurvature(x: Quat, mu: number, nu: number): Quat {
  const c = 1 / (1 + n2(x)) ** 2;
  return sc(c, sub(qmul(qconj(E[mu]), E[nu]), qmul(qconj(E[nu]), E[mu])));
}

/** 𝓕_μν = ∂_μ𝒜_ν − ∂_ν𝒜_μ + [𝒜_μ, 𝒜_ν] (Rem. 1.4.15), central differences. */
export function curvatureFD(A: Potential4, x: Quat, mu: number, nu: number, h = 1e-5): Quat {
  const dmu = sc(1 / (2 * h), sub(A(add(x, sc(h, E[mu])))[nu], A(sub(x, sc(h, E[mu])))[nu]));
  const dnu = sc(1 / (2 * h), sub(A(add(x, sc(h, E[nu])))[mu], A(sub(x, sc(h, E[nu])))[mu]));
  const a = A(x);
  return add(sub(dmu, dnu), bracket(a[mu], a[nu]));
}

/** All six components in the order 01, 02, 03, 23, 31, 12 (so ⋆ pairs entries k and k+3). */
export const PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [2, 3],
  [3, 1],
  [1, 2],
];

/** Curvature components from any F(μ, ν). */
export const components = (F: (mu: number, nu: number) => Quat): Quat[] => PAIRS.map(([m, n]) => F(m, n));

/**
 * Bianchi residual (Prop. 1.4.11 / Rem. 1.4.12): for each λ < μ < ν the
 * cyclic sum of ∂_λ𝓕_μν + [𝒜_λ, 𝓕_μν], with 𝓕 from F and ∂ by central differences.
 */
export function bianchiResidual(A: Potential4, F: (x: Quat, mu: number, nu: number) => Quat, x: Quat, h = 1e-4): number {
  let worst = 0;
  const a = A(x);
  const D = (l: number, m: number, n: number): Quat => {
    const d = sc(1 / (2 * h), sub(F(add(x, sc(h, E[l])), m, n), F(sub(x, sc(h, E[l])), m, n)));
    return add(d, bracket(a[l], F(x, m, n)));
  };
  for (const [l, m, n] of [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ]) {
    const s = add(add(D(l, m, n), D(m, n, l)), D(n, l, m));
    worst = Math.max(worst, Math.sqrt(n2(s)));
  }
  return worst;
}

/** Topological charge density (1/8π²)·tr(𝓕∧𝓕)/d⁴x = (1/8π²)·2·Σ_{pairs} tr(𝓕_k 𝓕_{k+3}). */
export function chargeDensity(comps: Quat[]): number {
  let s = 0;
  for (let k = 0; k < 3; k++) s += 2 * qmul(comps[k], comps[k + 3])[0];
  return (2 * s) / (8 * Math.PI * Math.PI);
}

/** Total charge of the radial density c(r): ∫ c·2π²r³ dr over [0, ∞), via r = tan t and Simpson on N panels. */
export function radialCharge(c: (r: number) => number, N = 400): number {
  const f = (t: number) => {
    if (t >= Math.PI / 2) return 0;
    const r = Math.tan(t);
    return c(r) * 2 * Math.PI * Math.PI * r ** 3 * (1 + r * r);
  };
  const h = Math.PI / 2 / N;
  let s = f(0) + f(Math.PI / 2);
  for (let k = 1; k < N; k++) s += (k % 2 ? 4 : 2) * f(k * h);
  return (s * h) / 3;
}
