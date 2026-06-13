/**
 * Shared ODE integrators: classical fixed-step RK4 and adaptive RKF45
 * (Runge–Kutta–Fehlberg 4(5) with step-size control).
 *
 * Pure module: no DOM / WebGL imports. All widget kernels integrate through
 * these routines so that accuracy is controlled in exactly one place.
 */

export type Deriv = (t: number, y: Float64Array) => Float64Array;

/** Optional post-step projection (e.g. renormalise onto a sphere). */
export type Project = (y: Float64Array) => void;

/** One classical RK4 step. Returns a new array. */
export function rk4Step(f: Deriv, t: number, y: Float64Array, h: number): Float64Array {
  const n = y.length;
  const k1 = f(t, y);
  const y2 = new Float64Array(n);
  for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k1[i];
  const k2 = f(t + 0.5 * h, y2);
  const y3 = new Float64Array(n);
  for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * h * k2[i];
  const k3 = f(t + 0.5 * h, y3);
  const y4 = new Float64Array(n);
  for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
  const k4 = f(t + h, y4);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}

/**
 * Fixed-step RK4 from t0 to t1 in nSteps steps, with optional projection
 * applied after every step (project-and-renorm pattern for manifold ODEs).
 * Returns the final state.
 */
export function integrateRK4(
  f: Deriv,
  t0: number,
  y0: Float64Array,
  t1: number,
  nSteps: number,
  project?: Project,
): Float64Array {
  const h = (t1 - t0) / nSteps;
  let y: Float64Array = Float64Array.from(y0);
  let t = t0;
  for (let s = 0; s < nSteps; s++) {
    y = rk4Step(f, t, y, h);
    if (project) project(y);
    t = t0 + (s + 1) * h;
  }
  return y;
}

/**
 * Fixed-step RK4 with dense output: returns all intermediate states
 * (nSteps+1 samples including endpoints) for animation / path rendering.
 */
export function integrateRK4Path(
  f: Deriv,
  t0: number,
  y0: Float64Array,
  t1: number,
  nSteps: number,
  project?: Project,
): { ts: Float64Array; ys: Float64Array[] } {
  const h = (t1 - t0) / nSteps;
  const ts = new Float64Array(nSteps + 1);
  const ys: Float64Array[] = [Float64Array.from(y0)];
  let y: Float64Array = Float64Array.from(y0);
  ts[0] = t0;
  for (let s = 0; s < nSteps; s++) {
    y = rk4Step(f, t0 + s * h, y, h);
    if (project) project(y);
    ts[s + 1] = t0 + (s + 1) * h;
    ys.push(Float64Array.from(y));
  }
  return { ts, ys };
}

// Runge–Kutta–Fehlberg 4(5) Butcher tableau.
const C = [0, 1 / 4, 3 / 8, 12 / 13, 1, 1 / 2];
const A = [
  [],
  [1 / 4],
  [3 / 32, 9 / 32],
  [1932 / 2197, -7200 / 2197, 7296 / 2197],
  [439 / 216, -8, 3680 / 513, -845 / 4104],
  [-8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40],
];
const B5 = [16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55];
const B4 = [25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0];

export interface AdaptiveOptions {
  tol?: number; // local error tolerance per step (absolute, per component, RMS)
  hInit?: number;
  hMin?: number;
  hMax?: number;
  maxSteps?: number;
  project?: Project;
}

/**
 * Adaptive RKF45 from t0 to t1. Advances with the 5th-order solution
 * (local extrapolation); the 4th/5th difference drives step control:
 * h <- 0.9 h (tol/err)^{1/5}, clamped to [0.2, 5] x previous h.
 */
export function integrateRKF45(
  f: Deriv,
  t0: number,
  y0: Float64Array,
  t1: number,
  opts: AdaptiveOptions = {},
): { y: Float64Array; steps: number; rejected: number } {
  const tol = opts.tol ?? 1e-10;
  const dir = Math.sign(t1 - t0) || 1;
  const span = Math.abs(t1 - t0);
  let h = dir * Math.min(opts.hInit ?? span / 100, span);
  const hMin = opts.hMin ?? span * 1e-14;
  const hMax = opts.hMax ?? span;
  const maxSteps = opts.maxSteps ?? 1_000_000;

  const n = y0.length;
  let y: Float64Array = Float64Array.from(y0);
  let t = t0;
  let steps = 0;
  let rejected = 0;
  const k: Float64Array[] = [];

  while (dir * (t1 - t) > 1e-15 * span && steps < maxSteps) {
    if (dir * (t + h - t1) > 0) h = t1 - t; // do not overshoot
    // stages
    for (let s = 0; s < 6; s++) {
      const ys = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let acc = y[i];
        for (let j = 0; j < s; j++) acc += h * A[s][j] * k[j][i];
        ys[i] = acc;
      }
      k[s] = f(t + C[s] * h, ys);
    }
    // 5th-order candidate and RMS of the 4/5 difference
    const y5 = new Float64Array(n);
    let errSq = 0;
    for (let i = 0; i < n; i++) {
      let acc5 = y[i];
      let diff = 0;
      for (let s = 0; s < 6; s++) {
        acc5 += h * B5[s] * k[s][i];
        diff += h * (B5[s] - B4[s]) * k[s][i];
      }
      y5[i] = acc5;
      errSq += diff * diff;
    }
    const err = Math.sqrt(errSq / n);
    if (err <= tol || Math.abs(h) <= hMin) {
      t += h;
      y = y5;
      if (opts.project) opts.project(y);
      steps++;
    } else {
      rejected++;
    }
    const factor = err > 0 ? 0.9 * Math.pow(tol / err, 0.2) : 5;
    h *= Math.min(5, Math.max(0.2, factor));
    if (Math.abs(h) > hMax) h = dir * hMax;
    if (Math.abs(h) < hMin) h = dir * hMin;
  }
  return { y, steps, rejected };
}
