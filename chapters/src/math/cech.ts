/**
 * Station 1.1b kernel — transition maps, 0-cochains and Čech classes
 * (§1.1: (1.1.5)–(1.1.7), Prop. 1.1.10, Thm. 1.1.11, Cor. 1.1.13, Rem. 1.1.21/2).
 *
 * Everything lives over the equator E ⊂ U1 ∩ U2 of the Hopf base, where the
 * fibres sweep out a torus T = π^{-1}(E) ⊂ S^3. Points of T are written in
 * chart-1 coordinates p(φ, α) = s1(φ)·e^{iα}, so κ1(p) = e^{iα}.
 *
 * A 0-cochain ρ_i = e^{iλ_i} (λ_i real, smooth — U_i is a disc, so every
 * U(1)-valued map on it has a global logarithm) re-trivializes chart i:
 * κ'_i = ρ_i κ_i, so the sections become s'_i = s_i ρ_i^{-1} and the
 * transition map becomes ρ'_12 = ρ1 ρ12 ρ2^{-1} — formula (1.1.7).
 *
 * For a general clutching integer n we use the abstract cocycle
 * ρ12 = e^{-inφ} on the equator (Prop. 1.1.10 builds a bundle from it); the
 * Hopf bundle is n = 1 (ρ12 = e^{-iφ}, degree 1 along the book's loop γ,
 * which runs with φ = −t).
 *
 * Pure module: no DOM / WebGL imports.
 */
import { actU1, fromPolar, section1, type Vec4 } from '@rsvis/math';

/** A real function on the equator, λ(φ), 2π-periodic. */
export type Phase = (phi: number) => number;

/** Two-parameter cochain families used by the station's sliders. */
export function lambda1(a: number, b: number): Phase {
  return (phi) => a * Math.cos(phi) + b * Math.sin(2 * phi);
}
export function lambda2(a: number, b: number): Phase {
  return (phi) => a * Math.sin(phi) + b * Math.cos(3 * phi);
}

/** Point of the equatorial torus in chart-1 coordinates: s1(φ)·e^{iα}. */
export function torusPoint(phi: number, alpha: number): Vec4 {
  return actU1(section1(fromPolar(Math.PI / 2, phi))!, alpha);
}

/**
 * Chart-1 height α of the re-trivialized section curves over the equator:
 *   s'_1 = s1 ρ1^{-1}            → α = −λ1(φ)
 *   s'_2 = s2 ρ2^{-1} = s1 ρ12 ρ2^{-1} → α = −nφ − λ2(φ)
 * (s1 = s2 ρ12^{-1} because κ2(s1) = ρ12^{-1}.) These are continuous lifts.
 */
export function sectionHeight1(l1: Phase): Phase {
  return (phi) => -l1(phi);
}
export function sectionHeight2(n: number, l2: Phase): Phase {
  return (phi) => -n * phi - l2(phi);
}

/** Continuous lift of arg ρ'_12 = λ1 − nφ − λ2 (formula (1.1.7) in the exponent). */
export function transitionPhase(n: number, l1: Phase, l2: Phase): Phase {
  return (phi) => l1(phi) - n * phi - l2(phi);
}

export interface Crossing {
  phi: number;
  /** +1 if arg ρ'12 passes 0 (mod 2π) increasing in φ, −1 if decreasing. */
  sign: 1 | -1;
}

/**
 * Points of the equator where the two section curves meet, i.e. ρ'12(φ) = 1,
 * found as level crossings of the lift D(φ) = arg ρ'12 through 2πℤ:
 * sampled at N points and refined by bisection to ~1e-15 in φ.
 * The signed count is the degree of ρ'12 (oriented by increasing φ).
 */
export function sectionCrossings(D: Phase, N = 4096): Crossing[] {
  const out: Crossing[] = [];
  const level = (x: number) => Math.floor(x / (2 * Math.PI));
  for (let i = 0; i < N; i++) {
    let lo = (2 * Math.PI * i) / N;
    let hi = (2 * Math.PI * (i + 1)) / N;
    const k0 = level(D(lo));
    const k1 = level(D(hi));
    if (k0 === k1) continue;
    // one or more levels crossed in this cell; a cell this small crosses at most one
    const sign: 1 | -1 = k1 > k0 ? 1 : -1;
    const target = 2 * Math.PI * Math.max(k0, k1);
    for (let it = 0; it < 60; it++) {
      const mid = 0.5 * (lo + hi);
      const above = D(mid) >= target;
      if ((sign === 1) === above) hi = mid;
      else lo = mid;
    }
    out.push({ phi: 0.5 * (lo + hi), sign });
  }
  return out;
}

export function signedCount(cs: ReadonlyArray<Crossing>): number {
  return cs.reduce((acc, c) => acc + c.sign, 0);
}
