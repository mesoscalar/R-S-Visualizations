/**
 * Station 1.3b kernel — local representatives 𝒜 = s^*ω_c and gauge
 * transformations ((1.3.11), Rem. 1.3.10, Prop. 1.3.11, Cor. 1.3.12).
 *
 * u(1)-valued 1-forms are handled through their real coefficient: 𝒜(v) = i·a.
 * Pullbacks are computed honestly from the sections — ω_c applied to a
 * central-difference derivative of s along a great circle — so the tests can
 * check the book's formulas against them rather than restate them.
 *
 * A gauge change of the local section, s ↦ s·e^{iλ} with λ a smooth function,
 * changes the representative by (1.3.15)-type law 𝒜 ↦ 𝒜 + i dλ.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { actU1, omegaC, section1, section2, type Vec3, type Vec4 } from '@rsvis/math';

export type LocalSection = (m: Vec3) => Vec4 | null;
export type BaseFunction = (m: Vec3) => number;

/** Global smooth gauge functions on S² (restrictions of polynomials). */
export function gaugeFunction(c1: number, c2: number, c3: number): BaseFunction {
  return (m) => c1 * m[0] + c2 * m[1] * m[2] + c3 * (m[0] * m[0] - m[1] * m[1]);
}

export function gaugedSection(i: 1 | 2, lambda: BaseFunction): LocalSection {
  const s = i === 1 ? section1 : section2;
  return (m) => {
    const z = s(m);
    return z ? actU1(z, lambda(m)) : null;
  };
}

/** Point reached from m along the great circle with initial velocity v (|v| arbitrary). */
function geo(m: Vec3, v: Vec3, t: number): Vec3 {
  const q: Vec3 = [m[0] + t * v[0], m[1] + t * v[1], m[2] + t * v[2]];
  const r = Math.hypot(...q);
  return [q[0] / r, q[1] / r, q[2] / r];
}

/** Central-difference step: truncation ~h²|s'''| ≈ 1e-10, roundoff ~1e-16/h ≈ 1e-11. */
export const FD_H = 1e-5;

/** a with (s^*ω_c)_m(v) = i·a, v ∈ T_m S². */
export function pullback(s: LocalSection, m: Vec3, v: Vec3): number {
  const z = s(m)!;
  const zp = s(geo(m, v, FD_H))!;
  const zm = s(geo(m, v, -FD_H))!;
  const dz = [0, 1, 2, 3].map((k) => (zp[k] - zm[k]) / (2 * FD_H));
  return omegaC(z, dz);
}

/** An orthonormal basis of T_m S². */
export function tangentFrame(m: Vec3): [Vec3, Vec3] {
  const ref: Vec3 = Math.abs(m[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const d = ref[0] * m[0] + ref[1] * m[1] + ref[2] * m[2];
  let e1: Vec3 = [ref[0] - d * m[0], ref[1] - d * m[1], ref[2] - d * m[2]];
  const r = Math.hypot(...e1);
  e1 = [e1[0] / r, e1[1] / r, e1[2] / r];
  const e2: Vec3 = [m[1] * e1[2] - m[2] * e1[1], m[2] * e1[0] - m[0] * e1[2], m[0] * e1[1] - m[1] * e1[0]];
  return [e1, e2];
}

/** Metric dual of the real coefficient of 𝒜 = s^*ω_c: the vector a♯ with a(v) = ⟨a♯, v⟩. */
export function potentialVector(s: LocalSection, m: Vec3): Vec3 {
  const [e1, e2] = tangentFrame(m);
  const a1 = pullback(s, m, e1);
  const a2 = pullback(s, m, e2);
  return [a1 * e1[0] + a2 * e2[0], a1 * e1[1] + a2 * e2[1], a1 * e1[2] + a2 * e2[2]];
}

/**
 * (1/2πi) ∮ 𝒜 over the latitude θ0, traversed with φ increasing; periodic
 * trapezoid rule (spectrally accurate for the smooth periodic integrand).
 */
export function loopIntegralOverTwoPi(s: LocalSection, theta0: number, N = 256): number {
  let acc = 0;
  const st = Math.sin(theta0);
  const ct = Math.cos(theta0);
  for (let k = 0; k < N; k++) {
    const ph = (2 * Math.PI * k) / N;
    const m: Vec3 = [st * Math.cos(ph), st * Math.sin(ph), ct];
    const v: Vec3 = [-st * Math.sin(ph), st * Math.cos(ph), 0]; // dγ/dφ
    acc += pullback(s, m, v);
  }
  return acc / N; // (1/2π)·Σ a·(2π/N)
}
