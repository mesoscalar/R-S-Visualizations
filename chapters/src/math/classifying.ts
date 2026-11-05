/**
 * Station 3.4a kernel — the Hopf bundle as a 2-universal U(1)-bundle and the
 * classification of U(1)-bundles over S² by pullback (Def. 3.4.1, Thm. 3.4.6,
 * Rem. 3.4.9, Thm. 3.4.10, Ex. 3.4.17, Thm. 3.4.23).
 *
 * Maps f : S² → S² = CP¹ are rational maps in homogeneous coordinates:
 *   [Z₁ : Z₂] ↦ [W₁ : W₂] = [Z₁ⁿ + t·b·Z₂ⁿ : Z₂ⁿ + t·a·Z₁ⁿ]   (n ≥ 0),
 * with Z̄ in place of Z for n < 0, followed by a rotation R_s of the target.
 * On S³ the same formula, normalised, is a lift F with h∘F = f∘h, where
 * h(z) = (2z̄₁z₂, |z₁|² − |z₂|²) is the Hopf map (stereographic w = z₂/z₁).
 *
 * Pure module: no DOM / WebGL imports.
 */
import { hopfMap, type Vec3, type Vec4 } from '@rsvis/math';

type Cx = [number, number];
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cpow = (a: Cx, n: number): Cx => {
  let r: Cx = [1, 0];
  for (let k = 0; k < n; k++) r = cmul(r, a);
  return r;
};

export interface MapParams {
  n: number;
  /** homotopy parameter: t = 0 is the plain power map */
  t: number;
  /** rotation of the target sphere about the x-axis */
  s: number;
  a?: Cx;
  b?: Cx;
}

const A0: Cx = [0.5, 0.3];
const B0: Cx = [-0.4, 0.2];

/** The lift F : S³ → S³ (points [re₁, im₁, re₂, im₂]). */
export function lift(p: MapParams, z: ArrayLike<number>): Vec4 {
  const n = Math.abs(p.n);
  let z1: Cx = [z[0], z[1]];
  let z2: Cx = [z[2], z[3]];
  if (p.n < 0) {
    z1 = [z1[0], -z1[1]];
    z2 = [z2[0], -z2[1]];
  }
  const a = p.a ?? A0;
  const b = p.b ?? B0;
  const p1 = cpow(z1, n);
  const p2 = cpow(z2, n);
  const w1: Cx = [p1[0] + p.t * cmul(b, p2)[0], p1[1] + p.t * cmul(b, p2)[1]];
  const w2: Cx = [p2[0] + p.t * cmul(a, p1)[0], p2[1] + p.t * cmul(a, p1)[1]];
  const nn = Math.hypot(w1[0], w1[1], w2[0], w2[1]);
  return [w1[0] / nn, w1[1] / nn, w2[0] / nn, w2[1] / nn];
}

/** A point of S³ over x ∈ S² (any section will do: f does not depend on the choice). */
export function overPoint(x: Vec3): Vec4 {
  if (1 + x[2] > 1e-9) {
    const a = Math.sqrt((1 + x[2]) / 2);
    const d = Math.sqrt(2 * (1 + x[2]));
    return [a, 0, x[0] / d, x[1] / d];
  }
  return [0, 0, 1, 0];
}

const rotX = (s: number, y: Vec3): Vec3 => [y[0], Math.cos(s) * y[1] - Math.sin(s) * y[2], Math.sin(s) * y[1] + Math.cos(s) * y[2]];

/** f : S² → S², f(x) = R_s h(F(z)) for any z over x. */
export function classMap(p: MapParams): (x: Vec3) => Vec3 {
  return (x) => rotX(p.s, hopfMap(lift(p, overPoint(x))));
}

/** Signed area ratio J(x) = ⟨df e₁ × df e₂, f(x)⟩ for an orthonormal frame (e₁, e₂) at x (central differences). */
export function jacobian(f: (x: Vec3) => Vec3, x: Vec3, h = 1e-5): number {
  const ref: Vec3 = Math.abs(x[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const d = ref[0] * x[0] + ref[1] * x[1] + ref[2] * x[2];
  const e1n = [ref[0] - d * x[0], ref[1] - d * x[1], ref[2] - d * x[2]];
  const l = Math.hypot(...e1n);
  const e1: Vec3 = [e1n[0] / l, e1n[1] / l, e1n[2] / l];
  const e2: Vec3 = [x[1] * e1[2] - x[2] * e1[1], x[2] * e1[0] - x[0] * e1[2], x[0] * e1[1] - x[1] * e1[0]];
  const geo = (e: Vec3, t: number): Vec3 => [0, 1, 2].map((i) => Math.cos(t) * x[i] + Math.sin(t) * e[i]) as Vec3;
  const D = (e: Vec3): Vec3 => {
    const p = f(geo(e, h));
    const m = f(geo(e, -h));
    return [(p[0] - m[0]) / (2 * h), (p[1] - m[1]) / (2 * h), (p[2] - m[2]) / (2 * h)];
  };
  const u = D(e1);
  const v = D(e2);
  const fx = f(x);
  return (u[1] * v[2] - u[2] * v[1]) * fx[0] + (u[2] * v[0] - u[0] * v[2]) * fx[1] + (u[0] * v[1] - u[1] * v[0]) * fx[2];
}

/** deg f = (1/4π)∫ f*(dA): midpoint rule on an Nθ × 2Nθ grid in polar coordinates of the domain. */
export function degreeS2(f: (x: Vec3) => Vec3, Nt = 120): number {
  const Nf = 2 * Nt;
  let s = 0;
  for (let i = 0; i < Nt; i++) {
    const th = ((i + 0.5) * Math.PI) / Nt;
    for (let j = 0; j < Nf; j++) {
      const ph = ((j + 0.5) * 2 * Math.PI) / Nf;
      const x: Vec3 = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
      s += jacobian(f, x) * Math.sin(th);
    }
  }
  return (s * (Math.PI / Nt) * ((2 * Math.PI) / Nf)) / (4 * Math.PI);
}

/**
 * Preimages of the target point y under the unrotated map (s = 0), n ≥ 1:
 * w′ = (wⁿ + ta)/(1 + tb wⁿ) = y′ ⇔ wⁿ = (y′ − ta)/(1 − tb y′), n roots (w̄ⁿ for n < 0).
 */
export function preimages(p: MapParams, y: Vec3): Vec3[] {
  const n = Math.abs(p.n);
  const a = p.a ?? A0;
  const b = p.b ?? B0;
  const yw: Cx = [y[0] / (1 + y[2]), y[1] / (1 + y[2])];
  const num: Cx = [yw[0] - p.t * a[0], yw[1] - p.t * a[1]];
  const by = cmul(b, yw);
  const den: Cx = [1 - p.t * by[0], -p.t * by[1]];
  const dd = den[0] * den[0] + den[1] * den[1];
  const q: Cx = [(num[0] * den[0] + num[1] * den[1]) / dd, (num[1] * den[0] - num[0] * den[1]) / dd];
  const r = Math.hypot(...q) ** (1 / n);
  const ang = Math.atan2(q[1], q[0]);
  return Array.from({ length: n }, (_, k) => {
    let w: Cx = [r * Math.cos((ang + 2 * Math.PI * k) / n), r * Math.sin((ang + 2 * Math.PI * k) / n)];
    if (p.n < 0) w = [w[0], -w[1]];
    const r2 = w[0] * w[0] + w[1] * w[1];
    return [(2 * w[0]) / (1 + r2), (2 * w[1]) / (1 + r2), (1 - r2) / (1 + r2)] as Vec3;
  });
}
