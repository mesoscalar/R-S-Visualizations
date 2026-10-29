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
