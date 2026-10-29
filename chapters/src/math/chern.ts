/**
 * Station 2.6a kernel — the Chern connection of the tautological line bundle
 * over CP¹ in the chart [1 : z] (Def. 2.6.7, Prop. 2.6.8, Def. 2.6.9,
 * Cor. 2.6.10; (2.6.6), (2.6.7)).
 *
 * Holomorphic frame e(z) = (1, z) ∈ C², Hermitean metric from C²:
 * H = h(e, e) = 1 + |z|². For a line bundle H is real, so (2.6.7) reads
 *   𝒜 = ∂ log H = z̄ dz/(1 + |z|²),   𝓕 = ∂̄𝒜 = −dz∧dz̄/(1 + |z|²)².
 * Tangent vectors X = (X₁, X₂) ∈ R² act by dz(X) = X₁ + iX₂; complex numbers
 * are [re, im]. Pure module: no DOM / WebGL imports.
 */
export type Cx = [number, number];
type V2 = [number, number];

const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

export const metricH = (z: Cx): number => 1 + z[0] * z[0] + z[1] * z[1];

/** 𝒜(X) = z̄ dz(X)/(1 + |z|²). */
export function chernA(z: Cx, X: V2): Cx {
  const w = cmul([z[0], -z[1]], [X[0], X[1]]);
  const H = metricH(z);
  return [w[0] / H, w[1] / H];
}

/** 𝓕(∂x, ∂y) in closed form: −(dz∧dz̄)(∂x, ∂y)/(1+|z|²)² = 2i/(1+|z|²)². */
export const chernF12 = (z: Cx): Cx => [0, 2 / metricH(z) ** 2];

/** The unitary frame ê = e/√H as a point of S³ ⊂ C² ([re₁, im₁, re₂, im₂]). */
export function unitaryFrame(z: Cx): [number, number, number, number] {
  const s = 1 / Math.sqrt(metricH(z));
  return [s, 0, s * z[0], s * z[1]];
}

/**
 * Parallel transport of φ = c·e around the loop z(t) (t ∈ [0, 1]):
 * ċ = −𝒜(ż)c (RK4 on N steps). Returns the coefficients c(t).
 */
export function transportCoefficient(z: (t: number) => Cx, zdot: (t: number) => V2, c0: Cx, N = 400): Cx[] {
  const f = (t: number, c: Cx): Cx => {
    const a = chernA(z(t), zdot(t));
    const p = cmul(a, c);
    return [-p[0], -p[1]];
  };
  const out: Cx[] = [c0];
  let c = c0;
  const h = 1 / N;
  for (let n = 0; n < N; n++) {
    const t = n * h;
    const k1 = f(t, c);
    const k2 = f(t + h / 2, [c[0] + (h / 2) * k1[0], c[1] + (h / 2) * k1[1]]);
    const k3 = f(t + h / 2, [c[0] + (h / 2) * k2[0], c[1] + (h / 2) * k2[1]]);
    const k4 = f(t + h, [c[0] + h * k3[0], c[1] + h * k3[1]]);
    c = [c[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), c[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    out.push(c);
  }
  return out;
}

/** Circle loop z(t) = z₀ + r e^{2πit}. */
export function circleLoop(z0: Cx, r: number): { z: (t: number) => Cx; zdot: (t: number) => V2 } {
  const w = 2 * Math.PI;
  return {
    z: (t) => [z0[0] + r * Math.cos(w * t), z0[1] + r * Math.sin(w * t)],
    zdot: (t) => [-w * r * Math.sin(w * t), w * r * Math.cos(w * t)],
  };
}

/** ∫∫ over the disk |z − z₀| < r of Im 𝓕₁₂ = 2/(1+|z|²)² (midpoint rule on an n × n polar grid). */
export function fluxThroughDisk(z0: Cx, r: number, n = 400): number {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const rho = ((i + 0.5) / n) * r;
    for (let j = 0; j < n; j++) {
      const a = ((j + 0.5) / n) * 2 * Math.PI;
      const z: Cx = [z0[0] + rho * Math.cos(a), z0[1] + rho * Math.sin(a)];
      s += chernF12(z)[1] * rho;
    }
  }
  return s * (r / n) * ((2 * Math.PI) / n);
}
