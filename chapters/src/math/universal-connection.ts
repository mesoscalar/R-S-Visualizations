/**
 * Station 3.8a kernel — a universal connection made explicit (Def. 3.8.1,
 * Lemma 3.8.2, 3.8.3, Thm. 3.8.4) for U(1)-connections ω on the Hopf bundle
 * S³ → S².
 *
 * Lemma 3.8.2 for k = 1 on a chart with coordinates (u, v): write the local
 * potential as 𝒜 = i(A_u du + A_v dv) and take four functions fⱼ = rⱼ e^{iθⱼ},
 *   θ = (λu, −λu, λv, −λv),  r² = (¼ + A_u/2λ, ¼ − A_u/2λ, ¼ + A_v/2λ, ¼ − A_v/2λ),
 * so Σ|fⱼ|² = 1 and Σ f̄ⱼ dfⱼ = Σ rⱼdrⱼ + iΣ rⱼ²dθⱼ = 𝒜 (needs λ > 2 max|A|).
 * Lemma 3.8.3: ϑ_c(p) = f^{(c)}(π(p))·κ_c(p) on each chart c = 1, 2.
 * Thm. 3.8.4: ϑ = (√φ₁ ϑ₁, √φ₂ ϑ₂) ∈ S¹⁵ ⊂ C⁸ with φ₁ + φ₂ = 1; then
 * ϑ*(u†du) = ω. Here √φ₁ = cos ψ, √φ₂ = sin ψ with ψ a smooth step in the
 * polar angle, so both are smooth.
 *
 * Points of C^m are arrays [re₁, im₁, re₂, im₂, …]. Pure module: no DOM / WebGL imports.
 */
import { hopfMap, section1, section2, type Vec3, type Vec4 } from '@rsvis/math';
import type { U1Connection } from './transport';
import { smoothStep } from './clutching';

/** Chart c covers polar angles θ < 0.75π (c = 1) or θ > 0.25π (c = 2); coordinates w = (x, y)/(1 ± z). */
export const THETA_A = 0.25 * Math.PI;
export const THETA_B = 0.75 * Math.PI;

const toBase = (c: 1 | 2, u: number, v: number): Vec3 => {
  const r2 = u * u + v * v;
  // c = 1: w = (x, y)/(1 + z); c = 2: w = (x, y)/(1 − z)
  return c === 1 ? [(2 * u) / (1 + r2), (2 * v) / (1 + r2), (1 - r2) / (1 + r2)] : [(2 * u) / (1 + r2), (2 * v) / (1 + r2), (r2 - 1) / (1 + r2)];
};
const toChart = (c: 1 | 2, m: Vec3): [number, number] => (c === 1 ? [m[0] / (1 + m[2]), m[1] / (1 + m[2])] : [m[0] / (1 - m[2]), m[1] / (1 - m[2])]);
const sec = (c: 1 | 2, m: Vec3): Vec4 => (c === 1 ? section1(m)! : section2(m)!);

/** Components (A_u, A_v) of the real potential s_c*ω in chart coordinates (central differences, step h). */
export function potential(omega: U1Connection, c: 1 | 2, u: number, v: number, h = 1e-6): [number, number] {
  const s0 = sec(c, toBase(c, u, v));
  const d = (du: number, dv: number) => {
    const p = sec(c, toBase(c, u + du, v + dv));
    const q = sec(c, toBase(c, u - du, v - dv));
    return p.map((x, i) => (x - q[i]) / (2 * h));
  };
  return [omega(s0, d(h, 0)), omega(s0, d(0, h))];
}

/** Lemma 3.8.2 (k = 1): the four functions f₁..f₄ at (u, v), as a point of C⁴. */
export function localMap(omega: U1Connection, c: 1 | 2, u: number, v: number, lambda: number): number[] {
  const [Au, Av] = potential(omega, c, u, v);
  const r2 = [0.25 + Au / (2 * lambda), 0.25 - Au / (2 * lambda), 0.25 + Av / (2 * lambda), 0.25 - Av / (2 * lambda)];
  const th = [lambda * u, -lambda * u, lambda * v, -lambda * v];
  return r2.flatMap((q, j) => [Math.sqrt(q) * Math.cos(th[j]), Math.sqrt(q) * Math.sin(th[j])]);
}

/** Smallest r² over a grid of the chart region: λ is admissible iff this is > 0. */
export function minWeight(omega: U1Connection, lambda: number, N = 40): number {
  let m = Infinity;
  for (const c of [1, 2] as const)
    for (let i = 0; i <= N; i++)
      for (let j = 0; j < 2 * N; j++) {
        const th = c === 1 ? (THETA_B * i) / N : THETA_A + ((Math.PI - THETA_A) * i) / N;
        const ph = (Math.PI * j) / N;
        const m3: Vec3 = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
        if ((c === 1 && th >= Math.PI - 1e-9) || (c === 2 && th <= 1e-9)) continue;
        const [u, v] = toChart(c, m3);
        const [Au, Av] = potential(omega, c, u, v);
        m = Math.min(m, 0.25 - Math.abs(Au) / (2 * lambda), 0.25 - Math.abs(Av) / (2 * lambda));
      }
  return m;
}

/** κ_c(p) = ⟨s_c(π(p)), p⟩ ∈ U(1) (so that p = s_c·κ_c). */
function kappa(c: 1 | 2, p: ArrayLike<number>): [number, number] {
  const s = sec(c, hopfMap(p));
  // Σ s̄ p over the two complex coordinates
  return [s[0] * p[0] + s[1] * p[1] + s[2] * p[2] + s[3] * p[3], s[0] * p[1] - s[1] * p[0] + s[2] * p[3] - s[3] * p[2]];
}

const { beta } = smoothStep(THETA_A + 0.05, THETA_B - 0.05);
/** ψ(θ): 0 on chart 1 only, π/2 on chart 2 only; √φ₁ = cos ψ, √φ₂ = sin ψ. */
export const psi = (theta: number): number => (Math.PI / 2) * beta(theta);

/** Thm. 3.8.4: ϑ(p) ∈ S¹⁵ ⊂ C⁸. */
export function universalMap(omega: U1Connection, lambda: number): (p: ArrayLike<number>) => number[] {
  return (p) => {
    const m = hopfMap(p);
    const theta = Math.acos(Math.max(-1, Math.min(1, m[2])));
    const ps = psi(theta);
    const out: number[] = [];
    for (const [c, w] of [
      [1, Math.cos(ps)],
      [2, Math.sin(ps)],
    ] as const) {
      if (Math.abs(w) < 1e-15) {
        out.push(0, 0, 0, 0, 0, 0, 0, 0);
        continue;
      }
      const [u, v] = toChart(c, m);
      const f = localMap(omega, c, u, v, lambda);
      const k = kappa(c, p);
      for (let j = 0; j < 4; j++) {
        const re = f[2 * j] * k[0] - f[2 * j + 1] * k[1];
        const im = f[2 * j] * k[1] + f[2 * j + 1] * k[0];
        out.push(w * re, w * im);
      }
    }
    return out;
  };
}

/** The canonical connection u†du on C^m (real coefficient: Im Σ ū dU). */
export function omegaCanonical(u: ArrayLike<number>, du: ArrayLike<number>): number {
  let s = 0;
  for (let j = 0; j < u.length; j += 2) s += u[j] * du[j + 1] - u[j + 1] * du[j];
  return s;
}
