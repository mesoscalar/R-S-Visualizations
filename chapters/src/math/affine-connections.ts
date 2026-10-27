/**
 * Station 1.3c kernel — existence of connections by partition of unity and
 * the affine space of connections (Prop. 1.3.7, Rem. 1.3.8; (1.3.8)).
 *
 * The proof of Prop. 1.3.7 on the Hopf bundle: each trivialization χ_i gives
 * the flat connection whose horizontal spaces are tangent to χ_i^{-1}(U_i × {1})
 * transported by the action ((1.3.8)); its form is ω̃_i = κ_i^*θ, i.e.
 * ω̃_i(X) = i·Im(z̄_i X_i)/|z_i|². With a partition of unity f1 + f2 = 1,
 * supp f_i ⊂ U_i, the glued form ω_PU = f1 ω̃1 + f2 ω̃2 is a connection form.
 * Rem. 1.3.8: ω_t = (1 − t) ω_c + t ω_PU are all connections, and
 * ω_PU − ω_c = π^*β with β = −(f1 𝒜_1 + f2 𝒜_2) a global 1-form on S².
 *
 * All forms are returned as real coefficients a of i·a.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { hopfMap, omegaC, potential1Phi, potential2Phi } from '@rsvis/math';

/** C^∞ step: 0 for s ≤ 0, 1 for s ≥ 1 (e^{−1/s} construction). */
export function smoothStep(s: number): number {
  if (s <= 0) return 0;
  if (s >= 1) return 1;
  const a = Math.exp(-1 / s);
  const b = Math.exp(-1 / (1 - s));
  return a / (a + b);
}

/**
 * Partition of unity on S² subordinate to {U1, U2}: f1 depends on the height z
 * only, f1 = 0 for z ≤ lo (so supp f1 avoids the south pole, ⊂ U1) and f1 = 1 for
 * z ≥ hi (so supp f2 avoids the north pole, ⊂ U2). Requires −1 < lo < hi < 1.
 */
export function partition(lo: number, hi: number): { f1: (z: number) => number; f2: (z: number) => number } {
  const f1 = (z: number) => smoothStep((z - lo) / (hi - lo));
  return { f1, f2: (z) => 1 - f1(z) };
}

/** ω̃1 = κ1^*θ: Im(z̄1 X1)/|z1|². */
export function chartFlat1(z: ArrayLike<number>, X: ArrayLike<number>): number {
  return (z[0] * X[1] - z[1] * X[0]) / (z[0] * z[0] + z[1] * z[1]);
}

/** ω̃2 = κ2^*θ: Im(z̄2 X2)/|z2|². */
export function chartFlat2(z: ArrayLike<number>, X: ArrayLike<number>): number {
  return (z[2] * X[3] - z[3] * X[2]) / (z[2] * z[2] + z[3] * z[3]);
}

/** The partition-of-unity connection of Prop. 1.3.7. */
export function omegaPU(lo: number, hi: number): (z: ArrayLike<number>, X: ArrayLike<number>) => number {
  const { f1, f2 } = partition(lo, hi);
  return (z, X) => {
    const h = hopfMap(z)[2];
    const w1 = f1(h);
    const w2 = f2(h);
    // a term with zero weight is skipped: ω̃_i is singular off π^{-1}(U_i)
    return (w1 > 0 ? w1 * chartFlat1(z, X) : 0) + (w2 > 0 ? w2 * chartFlat2(z, X) : 0);
  };
}

/** ω_t = (1 − t) ω_c + t ω_PU (Rem. 1.3.8). */
export function omegaT(t: number, lo: number, hi: number): (z: ArrayLike<number>, X: ArrayLike<number>) => number {
  const pu = omegaPU(lo, hi);
  return (z, X) => (1 - t) * omegaC(z, X) + t * pu(z, X);
}

/** β_φ, the dφ-coefficient of β = ω_PU − ω_c pushed down: −(f1 𝒜_1φ + f2 𝒜_2φ). */
export function betaPhi(theta: number, lo: number, hi: number): number {
  const { f1, f2 } = partition(lo, hi);
  const z = Math.cos(theta);
  return -(f1(z) * potential1Phi(theta) + f2(z) * potential2Phi(theta));
}

/**
 * ω_t(∂_φ) on the torus over the latitude θ in chart-1 coordinates
 * p = s1(θ, φ)·e^{iα}: κ1^*θ(∂_φ) = 0, κ2^*θ(∂_φ) = 1 (κ2 = e^{i(φ+α)}), so
 *   a_t(θ) = (1 − t)·(1 − cos θ)/2 + t·f2(cos θ).
 * Horizontal curves have dα/dφ = −a_t(θ) and miss by −2π a_t(θ) after one turn.
 */
export function torusSlope(t: number, theta: number, lo: number, hi: number): number {
  const { f2 } = partition(lo, hi);
  return (1 - t) * potential1Phi(theta) + t * f2(Math.cos(theta));
}
