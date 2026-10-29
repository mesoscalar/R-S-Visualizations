/**
 * Station 1.7b kernel — holonomy bundles (Prop. 1.7.12, Def. 1.7.13,
 * Rem. 1.7.14, Thm. 1.7.15, Rem. 1.7.16).
 *
 * The holonomy bundle P_{p0}(Γ) is the set of points reachable from p0 by
 * horizontal curves. We sample it: random piecewise-geodesic walks on S²
 * (kept inside U1 so the chart construction of Prop. 1.7.2 applies) are
 * lifted horizontally from p0, and their endpoints are collected.
 *
 * Pure module: no DOM / WebGL imports.
 */
import { type Rng, type Vec3, type Vec4 } from '@rsvis/math';
import { chart1Lift, type U1Connection } from './transport';

/** Great-circle step of length L from x in the tangent direction d (unit, ⟂ x). */
function geodesicStep(x: Vec3, d: Vec3, L: number): Vec3 {
  return [0, 1, 2].map((i) => Math.cos(L) * x[i] + Math.sin(L) * d[i]) as Vec3;
}

function randomTangent(x: Vec3, rng: Rng): Vec3 {
  const r: Vec3 = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const dd = r[0] * x[0] + r[1] * x[1] + r[2] * x[2];
  const t: Vec3 = [r[0] - dd * x[0], r[1] - dd * x[1], r[2] - dd * x[2]];
  const n = Math.hypot(...t);
  return [t[0] / n, t[1] / n, t[2] / n];
}

/**
 * A random walk of nSeg geodesic segments of length L starting at m0, never
 * entering the cap z < zMin (a step that would is redrawn). Returns the
 * piecewise-geodesic path parametrised by t ∈ [0, 1], one segment per 1/nSeg.
 */
export function randomWalk(m0: Vec3, nSeg: number, L: number, rng: Rng, zMin = -0.75): (t: number) => Vec3 {
  const nodes: Vec3[] = [m0];
  const dirs: Vec3[] = [];
  for (let k = 0; k < nSeg; k++) {
    const x = nodes[k];
    let d = randomTangent(x, rng);
    for (let tries = 0; tries < 50; tries++) {
      let ok = true;
      for (let j = 1; j <= 8; j++) if (geodesicStep(x, d, (L * j) / 8)[2] < zMin) ok = false;
      if (ok) break;
      d = randomTangent(x, rng);
    }
    dirs.push(d);
    nodes.push(geodesicStep(x, d, L));
  }
  return (t) => {
    const s = Math.min(nSeg - 1e-12, Math.max(0, t * nSeg));
    const k = Math.floor(s);
    return geodesicStep(nodes[k], dirs[k], L * (s - k));
  };
}

export interface Reach {
  /** endpoints of the horizontal lifts */
  ends: Vec4[];
  /** a few complete lifted paths, for drawing */
  paths: Vec4[][];
}

/** Endpoints of horizontal lifts from p0 = s1(m0)·e^{iα0} of `count` random walks. */
export function reachable(
  omega: U1Connection,
  m0: Vec3,
  alpha0: number,
  count: number,
  nSeg: number,
  L: number,
  rng: Rng,
  keepPaths = 0,
): Reach {
  const ends: Vec4[] = [];
  const paths: Vec4[][] = [];
  for (let k = 0; k < count; k++) {
    const walk = randomWalk(m0, nSeg, L, rng);
    // Simpson panels: 2 per … 16 per segment, aligned with the corners at t = j/nSeg
    const lift = chart1Lift(omega, walk, 0, 1, 16 * nSeg, alpha0);
    ends.push(lift.lift[lift.lift.length - 1]);
    if (k < keepPaths) paths.push(lift.lift);
  }
  return { ends, paths };
}

/** Fraction of `bins` equal arcs of U(1) hit by the phases arg κ1 of the given points. */
export function phaseCoverage(points: ReadonlyArray<ArrayLike<number>>, bins = 36): number {
  const hit = new Set<number>();
  for (const z of points) {
    const a = Math.atan2(z[1], z[0]);
    hit.add(Math.min(bins - 1, Math.floor(((a + Math.PI) / (2 * Math.PI)) * bins)));
  }
  return hit.size / bins;
}

/**
 * Mean resultant length |⟨e^{i arg κ1}⟩| of the phases: 1 when all points sit on
 * one leaf κ1 = const, ≈ √(π/4N) for N phases spread uniformly over U(1).
 */
export function meanResultant(points: ReadonlyArray<ArrayLike<number>>): number {
  let c = 0;
  let s = 0;
  for (const z of points) {
    const a = Math.atan2(z[1], z[0]);
    c += Math.cos(a);
    s += Math.sin(a);
  }
  return Math.hypot(c, s) / points.length;
}

function slerp(a: Vec3, b: Vec3, s: number): Vec3 {
  const c = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const w = Math.acos(c);
  if (w < 1e-12) return a;
  const k0 = Math.sin((1 - s) * w) / Math.sin(w);
  const k1 = Math.sin(s * w) / Math.sin(w);
  return [0, 1, 2].map((i) => k0 * a[i] + k1 * b[i]) as Vec3;
}

/** Unit tangent at m pointing toward the north pole (or along x at the poles). */
function northward(m: Vec3): Vec3 {
  const e: Vec3 = [-m[0] * m[2], -m[1] * m[2], 1 - m[2] * m[2]];
  const n = Math.hypot(...e);
  return n < 1e-9 ? [1, 0, 0] : [e[0] / n, e[1] / n, e[2] / n];
}

/**
 * A "lasso" from m0 to m: along the great circle to m, out to distance r,
 * once around the circle of radius r about m (sense +1 ccw / −1 cw seen from
 * outside), back to m. The out-and-back legs cancel in the holonomy, so the
 * lift arrives at the fibre over m rotated, relative to the plain path, by
 * −sense·½·capArea(r) (Station 1.7a).
 */
export function lassoPath(m0: Vec3, m: Vec3, r: number, sense: 1 | -1): (t: number) => Vec3 {
  const e1 = northward(m);
  const e2: Vec3 = [m[1] * e1[2] - m[2] * e1[1], m[2] * e1[0] - m[0] * e1[2], m[0] * e1[1] - m[1] * e1[0]];
  const onCircle = (u: number): Vec3 =>
    [0, 1, 2].map((i) => Math.cos(r) * m[i] + Math.sin(r) * (Math.cos(u) * e1[i] + sense * Math.sin(u) * e2[i])) as Vec3;
  const q = onCircle(0);
  return (t) => {
    if (t < 0.25) return slerp(m0, m, t / 0.25);
    if (t < 0.375) return slerp(m, q, (t - 0.25) / 0.125);
    if (t < 0.875) return onCircle((2 * Math.PI * (t - 0.375)) / 0.5);
    return slerp(q, m, (t - 0.875) / 0.125);
  };
}

/**
 * Radius and sense of the lasso that turns the arrival phase by δ ∈ (−π, π]:
 * δ ≤ 0 ccw with π(1 − cos r) = −δ; δ > 0 cw with π(1 − cos r) = δ. So r ≤ π/2.
 */
export function lassoFor(delta: number): { r: number; sense: 1 | -1 } {
  const d = Math.atan2(Math.sin(delta), Math.cos(delta));
  return { r: Math.acos(1 - Math.abs(d) / Math.PI), sense: d <= 0 ? 1 : -1 };
}
