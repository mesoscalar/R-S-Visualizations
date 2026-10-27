/**
 * Station 1.1d kernel — the Hopf family S_K(1, 2) → KP¹ for K = R, C, H and
 * the universal covering (Ex. 1.1.22, Rem. 1.1.23, Ex. 1.1.24, Rem. 1.1.25, Ex. 1.1.26).
 *
 * All three are κ_i = q_i/|q_i| and ρ12 = κ1 κ2⁻¹ with the right action
 * (q1, q2)·u = (q1 u, q2 u) of the unit sphere of K: O(1) = {±1}, U(1), Sp(1).
 *
 *  - K = R: S¹ → RP¹ ≅ S¹ (angle doubling), ρ12 = sign(x1 x2) — +1 on one arc
 *    of U1 ∩ U2, −1 on the other: the connected double cover.
 *  - K = H: S⁷ → HP¹ ≅ S⁴. Over the "equator" |q1| = |q2| the slice
 *    σ(w) = (w, 1)/√2, w ∈ S³, meets every fibre exactly once, and there
 *    ρ12(σ(w)) = w: the transition map is the identity of S³ = Sp(1), degree 1
 *    (Rem. 1.1.23/1 via the criterion of Rem. 1.1.21/2). A 0-cochain
 *    ρ_i = exp(λ_i), λ_i : U_i → sp(1) = Im H, changes it to ρ1 w ρ2⁻¹ (1.1.7)
 *    without changing the degree.
 *  - Universal covering R → S¹ with deck group π1(S¹) = Z: lifting a loop of
 *    winding n moves the endpoint by the deck transformation t ↦ t + 2πn.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { qconj, qexp, qmul, qnorm, type Quat } from '@rsvis/math';

export type QPair = [Quat, Quat];

// ---------- K = R ----------

/** RP¹ ≅ S¹ by angle doubling: (x1² − x2², 2x1x2) — the real analogue of (2z̄1z2, |z1|² − |z2|²). */
export function realHopf(x: [number, number]): [number, number] {
  return [x[0] * x[0] - x[1] * x[1], 2 * x[0] * x[1]];
}

/** κ_i = x_i/|x_i| ∈ O(1); null where x_i = 0. */
export function realKappa(i: 1 | 2, x: [number, number]): 1 | -1 | null {
  const v = x[i - 1];
  return v === 0 ? null : v > 0 ? 1 : -1;
}

/** ρ12 = κ1 κ2⁻¹ = sign(x1 x2). */
export function realTransition(x: [number, number]): 1 | -1 | null {
  const a = realKappa(1, x);
  const b = realKappa(2, x);
  return a && b ? ((a * b) as 1 | -1) : null;
}

// ---------- K = H ----------

/** κ_i = q_i/|q_i| ∈ Sp(1). */
export function quatKappa(i: 1 | 2, q: QPair): Quat | null {
  const v = q[i - 1];
  const n = qnorm(v);
  return n < 1e-12 ? null : [v[0] / n, v[1] / n, v[2] / n, v[3] / n];
}

export function quatAct(q: QPair, u: Quat): QPair {
  return [qmul(q[0], u), qmul(q[1], u)];
}

/** ρ12 = κ1 κ2⁻¹ (unit quaternions: inverse = conjugate). */
export function quatTransition(q: QPair): Quat | null {
  const a = quatKappa(1, q);
  const b = quatKappa(2, q);
  return a && b ? qmul(a, qconj(b)) : null;
}

/** The equatorial slice σ(w) = (w, 1)/√2. */
export function slice(w: Quat): QPair {
  const r = Math.SQRT1_2;
  return [
    [w[0] * r, w[1] * r, w[2] * r, w[3] * r],
    [r, 0, 0, 0],
  ];
}

/** A smooth Im H-valued function on the equatorial S³ (a 0-cochain exponent), amplitude c. */
export function cochainExponent(c: number, phase: number): (w: Quat) => Quat {
  return (w) => [0, c * (w[1] + w[2] * w[3]), c * Math.sin(phase + 2 * w[0]), c * (w[3] - w[1] * w[2])];
}

/** ρ′12(w) = ρ1(w) ρ12(σ(w)) ρ2(w)⁻¹ with ρ_i = exp(λ_i)  (1.1.7). */
export function cochainTransition(l1: (w: Quat) => Quat, l2: (w: Quat) => Quat): (w: Quat) => Quat {
  return (w) => qmul(qmul(qexp(l1(w)), quatTransition(slice(w))!), qconj(qexp(l2(w))));
}

// ---------- universal covering R → S¹ ----------

/** Lift of a loop c : [0, 2π] → S¹ ⊂ C (sampled) to R, starting at t0; returns the endpoint. */
export function liftEndpoint(c: (s: number) => [number, number], t0: number, N = 2000): number {
  let t = t0;
  let prev = c(0);
  for (let k = 1; k <= N; k++) {
    const cur = c((2 * Math.PI * k) / N);
    t += Math.atan2(prev[0] * cur[1] - prev[1] * cur[0], prev[0] * cur[0] + prev[1] * cur[1]);
    prev = cur;
  }
  return t;
}
