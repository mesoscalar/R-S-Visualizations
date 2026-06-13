/**
 * Widget 5 kernel — degree of maps S^3 -> S^3 ≅ SU(2) and pi_3(SU(2)) ≅ Z.
 *
 * f_n(q) = q^n on unit quaternions has degree n. Numerically:
 *   deg f = (1/2 pi^2) ∫_{S^3} det(Df |_{o.n. frames}) dV,   Vol(S^3) = 2 pi^2,
 * where Df is computed by central finite differences along geodesics in the
 * left-translation frame {iq, jq, kq} at the source and expressed in the frame
 * {if, jf, kf} at the target — consistent orientations on both sides.
 *
 * Estimators: product Gauss–Legendre quadrature on hyperspherical coordinates
 * (headline number; spectral for these smooth integrands), seeded plain Monte
 * Carlo with a sigma/sqrt(N) error estimate, and a deterministic Halton
 * quasi-Monte Carlo cross-check.
 *
 * Pure module: no DOM / WebGL imports.
 */

import { integrateS3, qnormalize, qpowInt, randomUnitQuat, type Quat, type Rng } from '@rsvis/math';

export type MapS3 = (q: Quat) => Quat;

export function mapPow(n: number): MapS3 {
  return (q) => qpowInt(q, n);
}

/**
 * Smooth nonvanishing perturbation of f_n: normalize(q^n + eps V(q)) with a
 * fixed quadratic V; |V| <= ~2 on S^3, so |eps| < 0.5 keeps the sum away from
 * zero and the family is a homotopy — the degree cannot change.
 */
export function perturbedPow(n: number, eps: number): MapS3 {
  return (q) => {
    const p = qpowInt(q, n);
    const [w, x, y, z] = q;
    const V: Quat = [x * y - z, w * z + x, y * z - w * x, w * y + 0.3 * z];
    return qnormalize([p[0] + eps * V[0], p[1] + eps * V[1], p[2] + eps * V[2], p[3] + eps * V[3]]);
  };
}

const iq = (z: Quat): Quat => [-z[1], z[0], -z[3], z[2]];
const jq = (z: Quat): Quat => [-z[2], z[3], z[0], -z[1]];
const kq = (z: Quat): Quat => [-z[3], -z[2], z[1], z[0]];
const dot4 = (a: Quat, b: Quat): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

/**
 * deg-integrand det(Df) at q in the left-translation frames.
 * Central differences along geodesics c_a(t) = cos(t) q + sin(t) e_a:
 * per-entry error O(h^2) with h = 1e-5 -> ~1e-10, far below all tolerances;
 * rounding error ~1e-16/h = 1e-11 — balanced choice.
 */
export function degreeIntegrand(f: MapS3, q: Quat, h = 1e-5): number {
  const fq = f(q);
  const target = [iq(fq), jq(fq), kq(fq)];
  const source = [iq(q), jq(q), kq(q)];
  const M: number[][] = [[], [], []];
  const ch = Math.cos(h);
  const sh = Math.sin(h);
  for (let a = 0; a < 3; a++) {
    const e = source[a];
    const qp: Quat = [
      ch * q[0] + sh * e[0],
      ch * q[1] + sh * e[1],
      ch * q[2] + sh * e[2],
      ch * q[3] + sh * e[3],
    ];
    const qm: Quat = [
      ch * q[0] - sh * e[0],
      ch * q[1] - sh * e[1],
      ch * q[2] - sh * e[2],
      ch * q[3] - sh * e[3],
    ];
    const fp = f(qp);
    const fm = f(qm);
    const d: Quat = [
      (fp[0] - fm[0]) / (2 * h),
      (fp[1] - fm[1]) / (2 * h),
      (fp[2] - fm[2]) / (2 * h),
      (fp[3] - fm[3]) / (2 * h),
    ];
    for (let b = 0; b < 3; b++) M[a][b] = dot4(d, target[b]);
  }
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  );
}

/** Degree by product Gauss–Legendre quadrature over S^3. */
export function degreeQuadrature(f: MapS3, nChi = 32, nTheta = 32, nPhi = 64): number {
  const v = integrateS3((p) => degreeIntegrand(f, p as Quat), nChi, nTheta, nPhi);
  return v / (2 * Math.PI * Math.PI);
}

/** Seeded plain Monte Carlo with standard-error estimate. */
export function degreeMC(f: MapS3, N: number, rng: Rng): { mean: number; stderr: number } {
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < N; i++) {
    const g = degreeIntegrand(f, randomUnitQuat(rng));
    s1 += g;
    s2 += g * g;
  }
  const mean = s1 / N;
  const variance = Math.max(0, s2 / N - mean * mean);
  return { mean, stderr: Math.sqrt(variance / N) };
}

/** Halton low-discrepancy sequence (deterministic). */
function halton(index: number, base: number): number {
  let r = 0;
  let f = 1 / base;
  let i = index;
  while (i > 0) {
    r += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return r;
}

/**
 * Inverse CDF of the chi marginal density (2/pi) sin^2(chi) on [0, pi],
 * F(chi) = (chi - sin chi cos chi)/pi. Bisection (F' vanishes at the
 * endpoints, so Newton is unsafe there); 48 halvings give ~1e-14.
 */
function chiFromUniform(u: number): number {
  let lo = 0;
  let hi = Math.PI;
  for (let k = 0; k < 48; k++) {
    const mid = (lo + hi) / 2;
    const Fv = (mid - Math.sin(mid) * Math.cos(mid)) / Math.PI;
    if (Fv < u) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Deterministic quasi-Monte Carlo (Halton bases 2, 3, 5 -> hyperspherical
 * inverse-CDF sampling). Empirical error ~(log N)^3/N; see test for the
 * measured value at the stated N.
 */
export function degreeQMC(f: MapS3, N: number): number {
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const chi = chiFromUniform(halton(i, 2));
    const cosTheta = 2 * halton(i, 3) - 1;
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    const phi = 2 * Math.PI * halton(i, 5);
    const sChi = Math.sin(chi);
    const q: Quat = [
      Math.cos(chi),
      sChi * cosTheta,
      sChi * sinTheta * Math.cos(phi),
      sChi * sinTheta * Math.sin(phi),
    ];
    acc += degreeIntegrand(f, q);
  }
  // E[g] over uniform S^3 = (1/Vol) ∫ g dV = deg (the 2 pi^2 cancels)
  return acc / N;
}

// ---------- preimages ----------

function solve3(M: number[][], b: number[]): [number, number, number] | null {
  const a = [
    [M[0][0], M[1][0], M[2][0], b[0]],
    [M[0][1], M[1][1], M[2][1], b[1]],
    [M[0][2], M[1][2], M[2][2], b[2]],
  ];
  // Gaussian elimination with partial pivoting on the transposed system
  for (let c = 0; c < 3; c++) {
    let piv = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
    if (Math.abs(a[piv][c]) < 1e-13) return null;
    [a[c], a[piv]] = [a[piv], a[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const fct = a[r][c] / a[c][c];
      for (let k = c; k < 4; k++) a[r][k] -= fct * a[c][k];
    }
  }
  return [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
}

/**
 * Tangent-space Newton for f(q) = p on S^3. Returns the converged point or
 * null. Solves sum_a delta_a M[a][b] = r_b with the FD Jacobian M, then steps
 * along the geodesic in direction Delta = sum delta_a e_a (damped).
 */
export function newtonPreimage(f: MapS3, p: Quat, q0: Quat, maxIter = 60): Quat | null {
  let q: Quat = qnormalize(q0);
  for (let iter = 0; iter < maxIter; iter++) {
    const fq = f(q);
    const r: Quat = [p[0] - fq[0], p[1] - fq[1], p[2] - fq[2], p[3] - fq[3]];
    const resid = Math.hypot(...r);
    if (resid < 1e-12) return q;
    const target = [iq(fq), jq(fq), kq(fq)];
    const source = [iq(q), jq(q), kq(q)];
    const h = 1e-5;
    const ch = Math.cos(h);
    const sh = Math.sin(h);
    const M: number[][] = [[], [], []];
    for (let a = 0; a < 3; a++) {
      const e = source[a];
      const fp = f([
        ch * q[0] + sh * e[0],
        ch * q[1] + sh * e[1],
        ch * q[2] + sh * e[2],
        ch * q[3] + sh * e[3],
      ]);
      const fm = f([
        ch * q[0] - sh * e[0],
        ch * q[1] - sh * e[1],
        ch * q[2] - sh * e[2],
        ch * q[3] - sh * e[3],
      ]);
      const d: Quat = [
        (fp[0] - fm[0]) / (2 * h),
        (fp[1] - fm[1]) / (2 * h),
        (fp[2] - fm[2]) / (2 * h),
        (fp[3] - fm[3]) / (2 * h),
      ];
      for (let b = 0; b < 3; b++) M[a][b] = dot4(d, target[b]);
    }
    const rb = [dot4(r, target[0]), dot4(r, target[1]), dot4(r, target[2])];
    const sol = solve3(M, rb);
    if (!sol) return null;
    let [d0, d1, d2] = sol;
    const stepLen = Math.hypot(d0, d1, d2);
    if (stepLen > 0.5) {
      // damping keeps the geodesic step in the basin
      d0 *= 0.5 / stepLen;
      d1 *= 0.5 / stepLen;
      d2 *= 0.5 / stepLen;
    }
    const D: Quat = [
      d0 * source[0][0] + d1 * source[1][0] + d2 * source[2][0],
      d0 * source[0][1] + d1 * source[1][1] + d2 * source[2][1],
      d0 * source[0][2] + d1 * source[1][2] + d2 * source[2][2],
      d0 * source[0][3] + d1 * source[1][3] + d2 * source[2][3],
    ];
    q = qnormalize([q[0] + D[0], q[1] + D[1], q[2] + D[2], q[3] + D[3]]);
  }
  return null;
}

/** Distinct preimages of p under f from seeded random starts, deduplicated. */
export function findPreimages(f: MapS3, p: Quat, rng: Rng, nSeeds = 80): Quat[] {
  const found: Quat[] = [];
  for (let s = 0; s < nSeeds; s++) {
    const root = newtonPreimage(f, p, randomUnitQuat(rng));
    if (!root) continue;
    let dup = false;
    for (const g of found) {
      const d = Math.hypot(root[0] - g[0], root[1] - g[1], root[2] - g[2], root[3] - g[3]);
      if (d < 1e-4) {
        dup = true;
        break;
      }
    }
    if (!dup) found.push(root);
  }
  return found;
}

// ---------- preimage foliation (for the renderer) ----------

/**
 * Great circle through p avoiding ±1: C(s) = cos(s) p + sin(s) e with e ⟂ p
 * and e ⟂ 1 (so ±1 are never on the circle, which therefore consists of
 * regular values of every q -> q^n).
 */
export function circleThrough(p: Quat): (s: number) => Quat {
  const one: Quat = [1, 0, 0, 0];
  // seed vector not parallel to span(p, 1)
  let w: Quat = [0, 0, 1, 0];
  if (Math.abs(p[2]) > 0.9) w = [0, 1, 0, 0];
  const pe = dot4(w, p);
  const eRaw: Quat = [w[0] - pe * p[0], w[1] - pe * p[1], w[2] - pe * p[2], w[3] - pe * p[3]];
  // remove the component along (1 - <1,p>p) to keep ±1 off the circle
  const u1: Quat = [
    one[0] - p[0] * p[0],
    -p[0] * p[1],
    -p[0] * p[2],
    -p[0] * p[3],
  ];
  const n1 = Math.hypot(...u1);
  if (n1 > 1e-9) {
    const u1n: Quat = [u1[0] / n1, u1[1] / n1, u1[2] / n1, u1[3] / n1];
    const c = dot4(eRaw, u1n);
    eRaw[0] -= c * u1n[0];
    eRaw[1] -= c * u1n[1];
    eRaw[2] -= c * u1n[2];
    eRaw[3] -= c * u1n[3];
  }
  const e = qnormalize(eRaw);
  return (s) => [
    Math.cos(s) * p[0] + Math.sin(s) * e[0],
    Math.cos(s) * p[1] + Math.sin(s) * e[1],
    Math.cos(s) * p[2] + Math.sin(s) * e[2],
    Math.cos(s) * p[3] + Math.sin(s) * e[3],
  ];
}

/**
 * Closed-form preimage branches of the circle C under q -> q^n: writing
 * C(s) = exp(u(s) psi(s)) with psi in (0, pi) (valid since C avoids ±1),
 * branch k is q_k(s) = exp(u(s) (psi(s) + 2 pi k)/n), k = 0..n-1 — n disjoint
 * closed curves, the visible incarnation of deg = n.
 */
export function powBranches(C: (s: number) => Quat, n: number, M = 240): Quat[][] {
  const branches: Quat[][] = [];
  for (let k = 0; k < n; k++) branches.push([]);
  for (let i = 0; i < M; i++) {
    const s = (2 * Math.PI * i) / M;
    const c = C(s);
    const psi = Math.acos(Math.max(-1, Math.min(1, c[0])));
    const vs = Math.hypot(c[1], c[2], c[3]);
    const u: [number, number, number] =
      vs > 1e-12 ? [c[1] / vs, c[2] / vs, c[3] / vs] : [1, 0, 0];
    for (let k = 0; k < n; k++) {
      const th = (psi + 2 * Math.PI * k) / n;
      branches[k].push([
        Math.cos(th),
        Math.sin(th) * u[0],
        Math.sin(th) * u[1],
        Math.sin(th) * u[2],
      ]);
    }
  }
  return branches;
}

/**
 * Continuation tracing of f^{-1}(C) from a starting root q0 over C(0)
 * (Newton at each step, warm-started) — used for perturbed maps where no
 * closed form exists. Returns null if the tracker loses the curve.
 */
export function traceBranch(
  f: MapS3,
  C: (s: number) => Quat,
  q0: Quat,
  M = 240,
): Quat[] | null {
  const out: Quat[] = [];
  let q = q0;
  for (let i = 0; i <= M; i++) {
    const s = (2 * Math.PI * i) / M;
    const root = newtonPreimage(f, C(s), q, 30);
    if (!root) return null;
    out.push(root);
    q = root;
  }
  return out;
}
