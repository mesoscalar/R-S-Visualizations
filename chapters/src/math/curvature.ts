/**
 * Station 1.4a kernel — curvature of U(1)-connections on the Hopf bundle
 * (Def. 1.4.1, 1.4.6, Rem. 1.4.7, Prop. 1.4.9, Rem. 1.4.15; (1.4.5), (1.4.9), (1.4.16)–(1.4.19)).
 *
 * Ω = D_ω ω = dω(hor·, hor·) (Def. 1.4.6). For U(1), [ω, ω] = 0 and the
 * structure equation (1.4.9) says Ω = dω. With ω_c = i·Σ(x dy − y dx),
 * dω_c = 2i·Σ dx_k∧dy_k exactly. Locally, in chart 1, a connection has
 * 𝒜_1 = i·a(θ) dφ for the rotation-invariant ones used here, so
 * 𝓕 = d𝒜_1 = i·a′(θ) dθ∧dφ, a curvature density a′(θ)/sin θ per unit area.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { torusSlope } from './affine-connections';
import { horizontalPart } from './connection-split';

/** dω_c(X, Y) = 2Σ (X_x Y_y − X_y Y_x) over (z1, z2): real coefficient of i. */
export function dOmegaC(X: ArrayLike<number>, Y: ArrayLike<number>): number {
  return 2 * (X[0] * Y[1] - X[1] * Y[0] + X[2] * Y[3] - X[3] * Y[2]);
}

/** Ω_c(X, Y) = dω_c(hor X, hor Y) (Def. 1.4.6). */
export function curvatureC(z: ArrayLike<number>, X: ArrayLike<number>, Y: ArrayLike<number>): number {
  return dOmegaC(horizontalPart(z, X), horizontalPart(z, Y));
}

export type ConnKind = 'c' | 'pu' | 'flat';

/** a(θ): the chart-1 coefficient 𝒜_1 = i·a(θ) dφ (ω_c: (1 − cos θ)/2; ω_PU: f2(cos θ); flat: 0). */
export function chartCoefficient(kind: ConnKind, theta: number, lo = -0.6, hi = 0.2): number {
  if (kind === 'flat') return 0;
  return torusSlope(kind === 'c' ? 0 : 1, theta, lo, hi);
}

/**
 * Curvature density per unit area, a′(θ)/sin θ (central difference, h = 1e-5:
 * truncation ~1e-10 for these smooth profiles). ω_c gives the constant 1/2.
 */
export function curvatureDensity(kind: ConnKind, theta: number, lo = -0.6, hi = 0.2): number {
  const h = 1e-5;
  const d = (chartCoefficient(kind, theta + h, lo, hi) - chartCoefficient(kind, theta - h, lo, hi)) / (2 * h);
  return d / Math.sin(theta);
}
