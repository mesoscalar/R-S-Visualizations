/**
 * Station 3.2a kernel — the exact homotopy sequence of the Hopf fibration
 * S¹ → S³ → S² (Def. 3.2.1, Cor. 3.2.5, Thm. 3.2.8, Ex. 3.2.10; (3.2.6), (3.2.7)).
 *
 * ∂ : π₂(S²) → π₁(U(1)): a based 2-sphere is a family of loops γ_ρ at the
 * north pole N, ρ ∈ [0, π], from the constant loop back to the constant loop.
 * Lifting each loop horizontally from z₀ over N, the endpoints z̃_ρ(1) lie in
 * the fibre over N; (3.2.7) says ∂[f] is the loop ρ ↦ κ(z̃_ρ(1)) in U(1).
 *
 * π₃(S²) = Z: fibres of the Hopf map are linked once; for g∘h with g of
 * degree n on S², preimages of points are n fibres and link n² times.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { holonomyPhase, horizontalLift, sectionOver, stereographic, type Vec3, type Vec4 } from '@rsvis/math';

/** The base point of the fibre over N = (0, 0, 1). */
export const Z0: Vec4 = [1, 0, 0, 0];

/**
 * The loop at N through which the sweep passes at parameter ρ: the circle of
 * angular radius ρ about c = (sin ρ, 0, cos ρ), starting and ending at N,
 * counterclockwise seen from outside (it bounds the cap about c positively).
 */
export function loopAtNorth(rho: number): { gamma: (t: number) => Vec3; gammaDot: (t: number) => Vec3 } {
  const s = Math.sin(rho);
  const c: Vec3 = [s, 0, Math.cos(rho)];
  if (Math.abs(s) < 1e-12) return { gamma: () => [0, 0, 1], gammaDot: () => [0, 0, 0] };
  // e₁ = (N − cos ρ c)/sin ρ, e₂ = c × e₁
  const e1: Vec3 = [(0 - Math.cos(rho) * c[0]) / s, 0, (1 - Math.cos(rho) * c[2]) / s];
  const e2: Vec3 = [c[1] * e1[2] - c[2] * e1[1], c[2] * e1[0] - c[0] * e1[2], c[0] * e1[1] - c[1] * e1[0]];
  const w = 2 * Math.PI;
  return {
    gamma: (t) => [0, 1, 2].map((i) => Math.cos(rho) * c[i] + s * (Math.cos(w * t) * e1[i] + Math.sin(w * t) * e2[i])) as Vec3,
    gammaDot: (t) => [0, 1, 2].map((i) => s * w * (-Math.sin(w * t) * e1[i] + Math.cos(w * t) * e2[i])) as Vec3,
  };
}

/** Horizontal lift of the loop at N for parameter ρ, from Z0 (RK4, N steps). */
export function liftLoop(rho: number, N = 400): Vec4[] {
  const { gammaDot } = loopAtNorth(rho);
  return horizontalLift(gammaDot, Z0, 0, 1, N).zs.map((z) => [z[0], z[1], z[2], z[3]] as Vec4);
}

/** κ of the endpoint: the phase α with z̃_ρ(1) = Z0·e^{iα}. */
export function endpointPhase(rho: number, N = 400): number {
  const zs = liftLoop(rho, N);
  return holonomyPhase(Z0, zs[zs.length - 1]);
}

/** ∂ of the sweep: the unwrapped phase ρ ↦ α(ρ) on a grid of M + 1 values of ρ ∈ [0, π]. */
export function boundaryLoop(M = 120, N = 400): { rhos: number[]; alphas: number[] } {
  const rhos: number[] = [];
  const alphas: number[] = [];
  let prev = 0;
  let acc = 0;
  for (let k = 0; k <= M; k++) {
    const rho = (Math.PI * k) / M;
    const a = endpointPhase(rho, N);
    let d = a - prev;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    acc += k === 0 ? a : d;
    prev = a;
    rhos.push(rho);
    alphas.push(acc);
  }
  return { rhos, alphas };
}

/** Base point m ∈ S² ↔ stereographic coordinate w = (x + iy)/(1 + z). */
export function toW(m: Vec3): [number, number] {
  return [m[0] / (1 + m[2]), m[1] / (1 + m[2])];
}
export function fromW(w: [number, number]): Vec3 {
  const r2 = w[0] * w[0] + w[1] * w[1];
  return [(2 * w[0]) / (1 + r2), (2 * w[1]) / (1 + r2), (1 - r2) / (1 + r2)];
}

/** The fibre over m, sampled at n points, stereographically projected to R³ (pole (0,0,0,1)). */
export function fibreCurve(m: Vec3, n = 400): Vec3[] {
  const z = sectionOver(m);
  return Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    // z·e^{ia}
    return stereographic([z[0] * c - z[1] * s, z[0] * s + z[1] * c, z[2] * c - z[3] * s, z[2] * s + z[3] * c]);
  });
}

/** Preimages under g(w) = wⁿ of the point m: the n base points whose fibres make up (g∘h)⁻¹(m). */
export function preimagesOfPower(m: Vec3, n: number): Vec3[] {
  const w = toW(m);
  const r = Math.hypot(...w) ** (1 / n);
  const a = Math.atan2(w[1], w[0]);
  return Array.from({ length: n }, (_, k) => fromW([r * Math.cos((a + 2 * Math.PI * k) / n), r * Math.sin((a + 2 * Math.PI * k) / n)]));
}
