/**
 * Station 2.4a kernel — surfaces of constant curvature k (Def. 2.4.1–2.4.3,
 * Rem. 2.4.4) in one conformal chart: g = λ²|dz|², λ = 2/(1 + k|z|²)
 * (the stereographic sphere of radius 1/√k, the plane with metric 4|dz|²,
 * or the Poincaré disk of radius 1/√−k). The maps
 *   T_p(z) = (z − p)/(1 + k p̄ z)
 * are isometries moving p to 0, and geodesics through 0 are radial lines,
 * so geodesic segments, distances and areas are exact.
 *
 * Points are complex numbers [re, im]. Pure module: no DOM / WebGL imports.
 */
export type Cx = [number, number];

const mul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a: Cx, b: Cx): Cx => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const conj = (a: Cx): Cx => [a[0], -a[1]];
const abs = (a: Cx) => Math.hypot(a[0], a[1]);

/** T_p and its inverse. */
export function isometryTo0(k: number, p: Cx): { T: (z: Cx) => Cx; Tinv: (u: Cx) => Cx } {
  const kp = conj(p).map((c) => k * c) as Cx;
  return {
    T: (z) => div([z[0] - p[0], z[1] - p[1]], [1 + mul(kp, z)[0], mul(kp, z)[1]]),
    Tinv: (u) => div([u[0] + p[0], u[1] + p[1]], [1 - mul(kp, u)[0], -mul(kp, u)[1]]),
  };
}

/** tan_k(x) = tan(√k x)/√k (k > 0), x (k = 0), tanh(√−k x)/√−k (k < 0), and its inverse. */
const tanK = (k: number, x: number) => (k > 1e-12 ? Math.tan(Math.sqrt(k) * x) / Math.sqrt(k) : k < -1e-12 ? Math.tanh(Math.sqrt(-k) * x) / Math.sqrt(-k) : x);
const atanK = (k: number, y: number) => (k > 1e-12 ? Math.atan(Math.sqrt(k) * y) / Math.sqrt(k) : k < -1e-12 ? Math.atanh(Math.sqrt(-k) * y) / Math.sqrt(-k) : y);

/** Riemannian distance. */
export function distance(k: number, z: Cx, w: Cx): number {
  return 2 * atanK(k, abs(isometryTo0(k, z).T(w)));
}

/** The point at distance t from p in the (Euclidean) direction angle a — the unit-speed geodesic γ(t). */
export function geodesicPoint(k: number, p: Cx, a: number, t: number): Cx {
  const r = tanK(k, t / 2);
  return isometryTo0(k, p).Tinv([r * Math.cos(a), r * Math.sin(a)]);
}

/** n + 1 points along the geodesic segment from p to q. */
export function segment(k: number, p: Cx, q: Cx, n = 64): Cx[] {
  const { T, Tinv } = isometryTo0(k, p);
  const w = T(q);
  return Array.from({ length: n + 1 }, (_, i) => Tinv([(w[0] * i) / n, (w[1] * i) / n]));
}

/** Interior angle at p between the geodesics to q and r (true angles: the chart is conformal). */
export function angleAt(k: number, p: Cx, q: Cx, r: Cx): number {
  const { T } = isometryTo0(k, p);
  const a = T(q);
  const b = T(r);
  return Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]));
}

/**
 * Area of the geodesic triangle (a, b, c): by Green, ∮ 2(x dy − y dx)/(1 + k|z|²),
 * since d of that form is λ² dx∧dy. Each side z(s) = T⁻¹(s·w) is integrated with
 * Simpson's rule on N panels using the exact derivative z′(s) = (1 + k|p|²) w/(1 − k p̄ s w)².
 */
export function triangleArea(k: number, a: Cx, b: Cx, c: Cx, N = 200): number {
  let total = 0;
  for (const [p, q] of [
    [a, b],
    [b, c],
    [c, a],
  ] as const) {
    const { T, Tinv } = isometryTo0(k, p);
    const w = T(q);
    const f = (s: number) => {
      const u: Cx = [s * w[0], s * w[1]];
      const z = Tinv(u);
      const kp: Cx = [k * p[0], -k * p[1]];
      const den = mul([1 - mul(kp, u)[0], -mul(kp, u)[1]], [1 - mul(kp, u)[0], -mul(kp, u)[1]]);
      const dz = div([(1 + k * (p[0] * p[0] + p[1] * p[1])) * w[0], (1 + k * (p[0] * p[0] + p[1] * p[1])) * w[1]], den);
      return (2 * (z[0] * dz[1] - z[1] * dz[0])) / (1 + k * (z[0] * z[0] + z[1] * z[1]));
    };
    const h = 1 / N;
    let sum = f(0) + f(1);
    for (let i = 1; i < N; i++) sum += (i % 2 ? 4 : 2) * f(i * h);
    total += (sum * h) / 3;
  }
  return Math.abs(total);
}

/** Separation of two unit-speed geodesics from one point at angle δ, after time t (law of cosines of curvature k). */
export function spreadExact(k: number, delta: number, t: number): number {
  if (Math.abs(k) < 1e-12) return 2 * t * Math.sin(delta / 2);
  if (k > 0) {
    const s = Math.sqrt(k);
    const c = Math.cos(s * t) ** 2 + Math.sin(s * t) ** 2 * Math.cos(delta);
    return Math.acos(Math.max(-1, Math.min(1, c))) / s;
  }
  const s = Math.sqrt(-k);
  const c = Math.cosh(s * t) ** 2 - Math.sinh(s * t) ** 2 * Math.cos(delta);
  return Math.acosh(Math.max(1, c)) / s;
}
