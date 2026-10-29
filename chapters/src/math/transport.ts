/**
 * Horizontal lifts on the Hopf bundle by the construction in the proof of
 * Prop. 1.7.2: start from any lift γ̃ of the base curve — here γ̃ = s1∘γ —
 * and correct it by a group-valued g(t) with Ad_{g⁻¹} ω(γ̃′) = −g⁻¹ġ.
 * For U(1) (Ad trivial, g = e^{iα}) this is α′ = −ω(γ̃′) (real coefficient),
 * and the horizontal lift is γ^h(t) = γ̃(t)·e^{iα(t)}.
 *
 * Works for any U(1)-connection ω on π⁻¹(U1) given as (z, X) ↦ a with ω(X) = i·a
 * (ω_c, the glued ω_PU of Station 1.3c, the flat chart connection κ1^*θ, …).
 *
 * Pure module: no DOM / WebGL imports.
 */
import { actU1, section1, type Vec3, type Vec4 } from '@rsvis/math';

export type U1Connection = (z: ArrayLike<number>, X: ArrayLike<number>) => number;

/** Central-difference step for γ̃′: truncation ~h²|γ‴| ≈ 1e-12, roundoff ~1e-16/h ≈ 1e-10. */
const H = 1e-6;

export interface Lift {
  ts: number[];
  /** the arbitrary lift γ̃ = s1∘γ */
  tilde: Vec4[];
  /** the correction g(t) = e^{iα(t)} */
  alpha: number[];
  /** the horizontal lift γ^h = γ̃·g */
  lift: Vec4[];
}

/**
 * Horizontal lift of γ : [t0, t1] → U1 starting at s1(γ(t0))·e^{iα0}.
 * α is integrated with Simpson's rule on N (even) panels: error O(N⁻⁴).
 */
export function chart1Lift(
  omega: U1Connection,
  gamma: (t: number) => Vec3,
  t0: number,
  t1: number,
  N = 400,
  alpha0 = 0,
): Lift {
  const integrand = (t: number): number => {
    const z = section1(gamma(t))!;
    const zp = section1(gamma(t + H))!;
    const zm = section1(gamma(t - H))!;
    const v = [0, 1, 2, 3].map((k) => (zp[k] - zm[k]) / (2 * H));
    return -omega(z, v);
  };
  const ts: number[] = [];
  const alpha: number[] = [];
  const h = (t1 - t0) / N;
  let acc = alpha0;
  ts.push(t0);
  alpha.push(acc);
  // Simpson on each pair of panels; intermediate (odd) nodes get the trapezoid-midpoint value
  for (let k = 0; k < N; k += 2) {
    const a = t0 + k * h;
    const fa = integrand(a);
    const fm = integrand(a + h);
    const fb = integrand(a + 2 * h);
    const half = acc + (h / 12) * (5 * fa + 8 * fm - fb); // ∫ over the first panel (quadratic fit)
    acc += (h / 3) * (fa + 4 * fm + fb);
    ts.push(a + h, a + 2 * h);
    alpha.push(half, acc);
  }
  const tilde = ts.map((t) => section1(gamma(t))!);
  return { ts, tilde, alpha, lift: tilde.map((z, k) => actU1(z, alpha[k])) };
}

/** Holonomy angle of a closed loop in U1: α(end) − α(start) (s1∘γ closes, so this is the fibre gap). */
export function holonomyAngle(omega: U1Connection, gamma: (t: number) => Vec3, N = 400): number {
  const l = chart1Lift(omega, gamma, 0, 1, N);
  return l.alpha[l.alpha.length - 1] - l.alpha[0];
}

/** Boundary of the coordinate rectangle [θ0, θ0+ε] × [φ0, φ0+ε], traversed θ↑, φ↑, θ↓, φ↓ (positive for dθ∧dφ). */
export function rectangleLoop(theta0: number, phi0: number, eps: number): (t: number) => Vec3 {
  return (t) => {
    const s = 4 * t;
    let th: number;
    let ph: number;
    if (s < 1) [th, ph] = [theta0 + eps * s, phi0];
    else if (s < 2) [th, ph] = [theta0 + eps, phi0 + eps * (s - 1)];
    else if (s < 3) [th, ph] = [theta0 + eps * (3 - s), phi0 + eps];
    else [th, ph] = [theta0, phi0 + eps * (4 - s)];
    return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  };
}

/** Rotation taking the north pole to c (Rodrigues about n̂ × c). */
function rotateFromNorth(c: Vec3, p: Vec3): Vec3 {
  const ct = c[2];
  const ax: Vec3 = [-c[1], c[0], 0]; // ẑ × c
  const s = Math.hypot(ax[0], ax[1]);
  if (s < 1e-12) return ct > 0 ? p : [p[0], -p[1], -p[2]];
  const n: Vec3 = [ax[0] / s, ax[1] / s, 0];
  const d = n[0] * p[0] + n[1] * p[1];
  const x: Vec3 = [n[1] * p[2], -n[0] * p[2], n[0] * p[1] - n[1] * p[0]];
  return [0, 1, 2].map((i) => ct * p[i] + s * x[i] + (1 - ct) * d * n[i]) as Vec3;
}

/**
 * Circle of angular radius r about c, t ∈ [0, 1], counterclockwise seen from
 * outside the sphere (so it bounds the cap around c positively).
 * `speed` reparametrises t ↦ t + speed·sin(2πt)/(2π) (monotone for |speed| < 1).
 */
export function circleLoop(c: Vec3, r: number, speed = 0): (t: number) => Vec3 {
  return (t) => {
    const u = 2 * Math.PI * (t + (speed * Math.sin(2 * Math.PI * t)) / (2 * Math.PI));
    return rotateFromNorth(c, [Math.sin(r) * Math.cos(u), Math.sin(r) * Math.sin(u), Math.cos(r)]);
  };
}

/** A unit tangent vector at c (toward the north pole where defined). */
function tangentAt(c: Vec3): Vec3 {
  const e: Vec3 = [-c[0] * c[2], -c[1] * c[2], 1 - c[2] * c[2]];
  const n = Math.hypot(...e);
  return n < 1e-9 ? [1, 0, 0] : [e[0] / n, e[1] / n, e[2] / n];
}

/** Circle of angular radius ρ about q, starting (u = 0) at the point p0 at distance ρ; sense = ±1 (+1 ccw from outside). */
function circleThrough(q: Vec3, rho: number, p0: Vec3, sense: number, u: number): Vec3 {
  const d = q[0] * p0[0] + q[1] * p0[1] + q[2] * p0[2];
  const g: Vec3 = [p0[0] - d * q[0], p0[1] - d * q[1], p0[2] - d * q[2]];
  const n = Math.hypot(...g);
  const f1: Vec3 = [g[0] / n, g[1] / n, g[2] / n];
  const f2: Vec3 = [q[1] * f1[2] - q[2] * f1[1], q[2] * f1[0] - q[0] * f1[2], q[0] * f1[1] - q[1] * f1[0]];
  const a = sense * u;
  return [0, 1, 2].map((i) => Math.cos(rho) * q[i] + Math.sin(rho) * (Math.cos(a) * f1[i] + Math.sin(a) * f2[i])) as Vec3;
}

/**
 * Figure eight through c: a lobe of angular radius r traversed counterclockwise,
 * then a lobe of radius r·(1 + asym) on the other side traversed clockwise.
 * The enclosed signed area is capArea(r) − capArea(r(1 + asym)).
 */
export function figureEight(c: Vec3, r: number, asym: number): (t: number) => Vec3 {
  const e = tangentAt(c);
  const R = r * (1 + asym);
  const qA: Vec3 = [0, 1, 2].map((i) => Math.cos(r) * c[i] + Math.sin(r) * e[i]) as Vec3;
  const qB: Vec3 = [0, 1, 2].map((i) => Math.cos(R) * c[i] - Math.sin(R) * e[i]) as Vec3;
  return (t) =>
    t < 0.5 ? circleThrough(qA, r, c, 1, 4 * Math.PI * t) : circleThrough(qB, R, c, -1, 4 * Math.PI * (t - 0.5));
}

/** Solid angle of a cap of angular radius r. */
export function capArea(r: number): number {
  return 2 * Math.PI * (1 - Math.cos(r));
}
