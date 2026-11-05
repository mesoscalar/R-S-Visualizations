/**
 * Station 3.3a kernel — principal bundles over spheres by clutching
 * (Thm. 3.3.1, Cor. 3.3.4, 3.3.5; Ex. 3.4.13).
 *
 * U(1) over S²: the bundle E_g is trivial over each closed hemisphere, glued
 * along the equator by g : S¹ → U(1). A connection on E_g: in the northern
 * trivialization 𝒜_N = β(θ) g⁻¹dg (pulled back along φ), with β a smooth step
 * from 0 near N to 1 near S, so that 𝒜_S = 𝒜_N − g⁻¹dg = (β − 1) g⁻¹dg is
 * smooth at S. Then 𝓕 = d𝒜_N = i β′(θ) w(φ) dθ∧dφ with g⁻¹dg = i w(φ) dφ, and
 * (i/2π)∫𝓕 = −(winding of g).
 *
 * SU(2) over S⁴: clutching maps S³ → SU(2) = Sp(1), classified by their degree.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { degreeQuadrature, qconj, qnormalize, qpowInt, type Quat } from '@rsvis/math';

export type Cx = [number, number];

/**
 * Clutching curve c(φ) = e^{i(nφ + A sin(mφ))} + ε·b in C. For ε = 0 it lies on
 * U(1) for every A (a homotopy inside the group); g = c/|c| is defined while c ≠ 0.
 */
export function clutchingCurve(n: number, A: number, m: number, eps: number, b: Cx = [0.6, 0.35]) {
  const psi = (f: number) => n * f + A * Math.sin(m * f);
  const dpsi = (f: number) => n + A * m * Math.cos(m * f);
  const c = (f: number): Cx => [Math.cos(psi(f)) + eps * b[0], Math.sin(psi(f)) + eps * b[1]];
  return {
    c,
    /** w(φ) = d arg g/dφ = Im(c′/c) for g = c/|c|, c′ = iψ′e^{iψ} (equals ψ′ for ε = 0) */
    w: (f: number) => {
      const z = c(f);
      const dz: Cx = [-dpsi(f) * Math.sin(psi(f)), dpsi(f) * Math.cos(psi(f))];
      return (dz[1] * z[0] - dz[0] * z[1]) / (z[0] * z[0] + z[1] * z[1]);
    },
  };
}

/** Winding number of a closed curve around 0 (sum of wrapped angle increments over N samples). */
export function winding(c: (f: number) => Cx, N = 2000): number {
  let tot = 0;
  let prev = Math.atan2(c(0)[1], c(0)[0]);
  for (let k = 1; k <= N; k++) {
    const p = c((2 * Math.PI * k) / N);
    const a = Math.atan2(p[1], p[0]);
    let d = a - prev;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    tot += d;
    prev = a;
  }
  return tot / (2 * Math.PI);
}

/** Smooth step β(θ): 0 for θ ≤ a, 1 for θ ≥ b, with derivative β′. */
export function smoothStep(a: number, b: number) {
  const f = (x: number) => (x <= 0 ? 0 : Math.exp(-1 / x));
  const df = (x: number) => (x <= 0 ? 0 : Math.exp(-1 / x) / (x * x));
  return {
    beta: (t: number) => {
      const u = (t - a) / (b - a);
      return f(u) / (f(u) + f(1 - u));
    },
    dbeta: (t: number) => {
      const u = (t - a) / (b - a);
      const p = f(u);
      const q = f(1 - u);
      if (p + q === 0) return 0;
      return ((df(u) * q + p * df(1 - u)) / (p + q) ** 2) / (b - a);
    },
  };
}

/**
 * First Chern number (i/2π)∫𝓕 of E_g with the connection above:
 * ∫𝓕 = i ∫β′(θ)dθ ∫w(φ)dφ, each by the midpoint rule (periodic in φ: spectral;
 * in θ the integrand is smooth with compact support).
 */
export function chernNumber(w: (f: number) => number, Nt = 400, Nf = 400): number {
  const { dbeta } = smoothStep(0.4, Math.PI - 0.4);
  let It = 0;
  for (let i = 0; i < Nt; i++) It += dbeta(((i + 0.5) * Math.PI) / Nt);
  It *= Math.PI / Nt;
  let If = 0;
  for (let j = 0; j < Nf; j++) If += w(((j + 0.5) * 2 * Math.PI) / Nf);
  If *= (2 * Math.PI) / Nf;
  // (i/2π)·(i·It·If)
  return -(It * If) / (2 * Math.PI);
}

/** SU(2) clutching maps: g(q) = normalize(qⁿ + εp) (n ≥ 0) or normalize(q̄^|n| + εp) (n < 0). */
export function su2Clutching(n: number, eps: number, p: Quat = [0.3, -0.5, 0.6, 0.2]): (q: Quat) => Quat {
  return (q) => {
    const base = n >= 0 ? qpowInt(q, n) : qpowInt(qconj(q), -n);
    return qnormalize([base[0] + eps * p[0], base[1] + eps * p[1], base[2] + eps * p[2], base[3] + eps * p[3]]);
  };
}

/** min over a grid on S³ of |qⁿ + εp| (resp. q̄): how close the deformation comes to leaving SU(2). */
export function minModulus(n: number, eps: number, p: Quat = [0.3, -0.5, 0.6, 0.2], N = 24): number {
  let m = Infinity;
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++)
      for (let k = 0; k < 2 * N; k++) {
        const chi = (Math.PI * i) / N;
        const th = (Math.PI * j) / N;
        const ph = (Math.PI * k) / N;
        const q: Quat = [Math.cos(chi), Math.sin(chi) * Math.cos(th), Math.sin(chi) * Math.sin(th) * Math.cos(ph), Math.sin(chi) * Math.sin(th) * Math.sin(ph)];
        const b = n >= 0 ? qpowInt(q, n) : qpowInt(qconj(q), -n);
        m = Math.min(m, Math.hypot(b[0] + eps * p[0], b[1] + eps * p[1], b[2] + eps * p[2], b[3] + eps * p[3]));
      }
  return m;
}

/** Degree of an SU(2) clutching map by quadrature over S³ (@rsvis/math). */
export const su2Degree = (g: (q: Quat) => Quat, nChi = 24, nTheta = 24, nPhi = 48): number => degreeQuadrature(g, nChi, nTheta, nPhi);
