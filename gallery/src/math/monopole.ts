/**
 * Widget 2 kernel — Chern–Weil on the charge-n monopole bundle over S^2.
 *
 * Connection in the two standard patches:
 *   A_± = (n/2)(±1 − cos θ) dφ,
 * curvature F = dA_± = (n/2) sin θ dθ∧dφ, first Chern number
 *   c₁ = (1/2π) ∫_{S²} F = n.
 *
 * Deformations: a GLOBAL 1-form a on S² shifts A → A + a, F → F + da, and
 * ∫ da = 0 by Stokes (∂S² = ∅) — the integer cannot move. We realise global
 * 1-forms as u dv with u, v restrictions of polynomials in (x, y, z) to the
 * sphere (hence smooth everywhere, poles included); then
 *   (da)_{θφ} = u_θ v_φ − u_φ v_θ  (the u du-cross terms cancel),
 * and the curvature density per unit AREA is ρ = F_{θφ}/sin θ.
 *
 * Pure module: no DOM / WebGL imports.
 */

export interface Perturbation {
  name: string;
  latex: string;
  /** Area density (da)_{θφ}/sin θ — smooth on all of S². */
  q: (theta: number, phi: number) => number;
}

/**
 * Basis of perturbation 1-forms a_i = u dv (computed analytically; each q is
 * (u_θ v_φ − u_φ v_θ)/sin θ simplified by hand and checked in tests against
 * Stokes: ∫ q dA = 0).
 *  x = sinθ cosφ, y = sinθ sinφ, z = cosθ.
 */
export const PERTURBATIONS: Perturbation[] = [
  {
    name: 'z dx',
    latex: 'a_1 = z\\,dx',
    // (da)_{θφ} = z_θ x_φ − z_φ x_θ = sin²θ sinφ  ⇒  ρ = sinθ sinφ
    q: (th, ph) => Math.sin(th) * Math.sin(ph),
  },
  {
    name: 'x dy',
    latex: 'a_2 = x\\,dy',
    // (da)_{θφ} = sinθ cosθ  ⇒  ρ = cosθ (axisymmetric north/south slosh)
    q: (th) => Math.cos(th),
  },
  {
    name: 'xy dz',
    latex: 'a_3 = xy\\,dz',
    // (da)_{θφ} = sin³θ cos2φ  ⇒  ρ = sin²θ cos2φ
    q: (th, ph) => Math.sin(th) ** 2 * Math.cos(2 * ph),
  },
  {
    name: 'z² dy',
    latex: 'a_4 = z^2\\,dy',
    // (da)_{θφ} = −2 cosθ sin²θ cosφ  ⇒  ρ = −2 sinθ cosθ cosφ
    q: (th, ph) => -2 * Math.sin(th) * Math.cos(th) * Math.cos(ph),
  },
  {
    name: '(x²−y²) dz',
    latex: 'a_5 = (x^2 - y^2)\\,dz',
    // (da)_{θφ} = −2 sin³θ sin2φ  ⇒  ρ = −2 sin²θ sin2φ
    q: (th, ph) => -2 * Math.sin(th) ** 2 * Math.sin(2 * ph),
  },
];

/** A_± dφ-coefficients (the two-patch potentials). */
export function aPlusPhi(n: number, theta: number): number {
  return (n / 2) * (1 - Math.cos(theta));
}
export function aMinusPhi(n: number, theta: number): number {
  return (n / 2) * (-1 - Math.cos(theta));
}

/**
 * Curvature density per unit area of the perturbed connection:
 *   ρ(θ,φ) = n/2 + Σ λ_i q_i(θ,φ),   F = ρ dA.
 */
export function curvatureAreaDensity(
  n: number,
  lambdas: ReadonlyArray<number>,
  theta: number,
  phi: number,
): number {
  let rho = n / 2;
  for (let i = 0; i < lambdas.length && i < PERTURBATIONS.length; i++) {
    if (lambdas[i] !== 0) rho += lambdas[i] * PERTURBATIONS[i].q(theta, phi);
  }
  return rho;
}

import { integrateS2 } from '@rsvis/math';

/** First Chern number c₁ = (1/2π) ∫_{S²} F of the perturbed connection. */
export function chernNumber(
  n: number,
  lambdas: ReadonlyArray<number>,
  nTheta = 64,
  nPhi = 128,
): number {
  return (
    integrateS2((th, ph) => curvatureAreaDensity(n, lambdas, th, ph), nTheta, nPhi) /
    (2 * Math.PI)
  );
}
