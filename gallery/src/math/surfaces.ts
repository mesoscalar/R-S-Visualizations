/**
 * Widget 4 kernel — parallel transport, geodesics, Jacobi fields on immersed
 * surfaces, all in the EXTRINSIC formulation of the task spec:
 *
 *   transport:  Xdot = -<X, Ndot> N        (N the unit normal along the curve)
 *   geodesics:  gammaddot parallel to N    (solved in parameter space via the
 *                                           first fundamental form 2x2 system)
 *   Jacobi:     J'' + K J = 0 along a unit-speed geodesic
 *
 * Gauss curvature is computed GENERICALLY from the fundamental forms
 *   K = (L N - M^2) / (E G - F^2)
 * and tested against the analytic values for sphere/cylinder/torus/catenoid —
 * no per-surface curvature is hard-coded into the transport math.
 *
 * Pure module: no DOM / WebGL imports.
 */

import { gaussLegendre, integrateRK4Path } from '@rsvis/math';

export type Vec3 = [number, number, number];

export interface Surface {
  id: string;
  name: string;
  point(u: number, v: number): Vec3;
  ru(u: number, v: number): Vec3;
  rv(u: number, v: number): Vec3;
  ruu(u: number, v: number): Vec3;
  ruv(u: number, v: number): Vec3;
  rvv(u: number, v: number): Vec3;
  uRange: [number, number];
  vRange: [number, number];
  uPeriodic: boolean;
  vPeriodic: boolean;
}

const TWO_PI = 2 * Math.PI;

export const SPHERE: Surface = {
  id: 'sphere',
  name: 'Sphere',
  // u = azimuth, v = colatitude (poles excluded from vRange)
  point: (u, v) => [Math.sin(v) * Math.cos(u), Math.sin(v) * Math.sin(u), Math.cos(v)],
  ru: (u, v) => [-Math.sin(v) * Math.sin(u), Math.sin(v) * Math.cos(u), 0],
  rv: (u, v) => [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), -Math.sin(v)],
  ruu: (u, v) => [-Math.sin(v) * Math.cos(u), -Math.sin(v) * Math.sin(u), 0],
  ruv: (u, v) => [-Math.cos(v) * Math.sin(u), Math.cos(v) * Math.cos(u), 0],
  rvv: (u, v) => [-Math.sin(v) * Math.cos(u), -Math.sin(v) * Math.sin(u), -Math.cos(v)],
  uRange: [0, TWO_PI],
  vRange: [0.08, Math.PI - 0.08],
  uPeriodic: true,
  vPeriodic: false,
};

export const CYLINDER: Surface = {
  id: 'cylinder',
  name: 'Cylinder',
  point: (u, v) => [Math.cos(u), Math.sin(u), v],
  ru: (u) => [-Math.sin(u), Math.cos(u), 0],
  rv: () => [0, 0, 1],
  ruu: (u) => [-Math.cos(u), -Math.sin(u), 0],
  ruv: () => [0, 0, 0],
  rvv: () => [0, 0, 0],
  uRange: [0, TWO_PI],
  vRange: [-1.4, 1.4],
  uPeriodic: true,
  vPeriodic: false,
};

const TR = 1.25; // torus big radius
const tr = 0.5; // torus small radius

export const TORUS: Surface = {
  id: 'torus',
  name: 'Torus',
  point: (u, v) => [
    (TR + tr * Math.cos(v)) * Math.cos(u),
    (TR + tr * Math.cos(v)) * Math.sin(u),
    tr * Math.sin(v),
  ],
  ru: (u, v) => [
    -(TR + tr * Math.cos(v)) * Math.sin(u),
    (TR + tr * Math.cos(v)) * Math.cos(u),
    0,
  ],
  rv: (u, v) => [-tr * Math.sin(v) * Math.cos(u), -tr * Math.sin(v) * Math.sin(u), tr * Math.cos(v)],
  ruu: (u, v) => [
    -(TR + tr * Math.cos(v)) * Math.cos(u),
    -(TR + tr * Math.cos(v)) * Math.sin(u),
    0,
  ],
  ruv: (u, v) => [tr * Math.sin(v) * Math.sin(u), -tr * Math.sin(v) * Math.cos(u), 0],
  rvv: (u, v) => [
    -tr * Math.cos(v) * Math.cos(u),
    -tr * Math.cos(v) * Math.sin(u),
    -tr * Math.sin(v),
  ],
  uRange: [0, TWO_PI],
  vRange: [0, TWO_PI],
  uPeriodic: true,
  vPeriodic: true,
};
export const TORUS_RADII = { R: TR, r: tr };

export const CATENOID: Surface = {
  id: 'catenoid',
  name: 'Catenoid',
  point: (u, v) => [Math.cosh(v) * Math.cos(u), Math.cosh(v) * Math.sin(u), v],
  ru: (u, v) => [-Math.cosh(v) * Math.sin(u), Math.cosh(v) * Math.cos(u), 0],
  rv: (u, v) => [Math.sinh(v) * Math.cos(u), Math.sinh(v) * Math.sin(u), 1],
  ruu: (u, v) => [-Math.cosh(v) * Math.cos(u), -Math.cosh(v) * Math.sin(u), 0],
  ruv: (u, v) => [-Math.sinh(v) * Math.sin(u), Math.sinh(v) * Math.cos(u), 0],
  rvv: (u, v) => [Math.cosh(v) * Math.cos(u), Math.cosh(v) * Math.sin(u), 0],
  uRange: [0, TWO_PI],
  vRange: [-1.15, 1.15],
  uPeriodic: true,
  vPeriodic: false,
};

export const PLANE: Surface = {
  id: 'plane',
  name: 'Plane',
  point: (u, v) => [u, v, 0],
  ru: () => [1, 0, 0],
  rv: () => [0, 1, 0],
  ruu: () => [0, 0, 0],
  ruv: () => [0, 0, 0],
  rvv: () => [0, 0, 0],
  uRange: [-1.5, 1.5],
  vRange: [-1.5, 1.5],
  uPeriodic: false,
  vPeriodic: false,
};

export const SURFACES: Surface[] = [SPHERE, CYLINDER, TORUS, CATENOID, PLANE];

// ---------- pointwise geometry ----------

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

/** Unit normal r_u x r_v / |r_u x r_v|. */
export function normalAt(S: Surface, u: number, v: number): Vec3 {
  const n = cross(S.ru(u, v), S.rv(u, v));
  return scale(n, 1 / norm(n));
}

/**
 * Directional derivative of the unit normal: dN(du, dv), via
 * N' = (n' - N <N, n'>)/|n| with n = r_u x r_v.
 */
export function normalDerivAt(S: Surface, u: number, v: number, du: number, dv: number): Vec3 {
  const ru = S.ru(u, v);
  const rv = S.rv(u, v);
  const n = cross(ru, rv);
  const ln = norm(n);
  const N = scale(n, 1 / ln);
  // n' = (r_uu du + r_uv dv) x r_v + r_u x (r_uv du + r_vv dv)
  const ruu = S.ruu(u, v);
  const ruv = S.ruv(u, v);
  const rvv = S.rvv(u, v);
  const d1: Vec3 = [
    ruu[0] * du + ruv[0] * dv,
    ruu[1] * du + ruv[1] * dv,
    ruu[2] * du + ruv[2] * dv,
  ];
  const d2: Vec3 = [
    ruv[0] * du + rvv[0] * dv,
    ruv[1] * du + rvv[1] * dv,
    ruv[2] * du + rvv[2] * dv,
  ];
  const np: Vec3 = [0, 0, 0];
  const c1 = cross(d1, rv);
  const c2 = cross(ru, d2);
  np[0] = c1[0] + c2[0];
  np[1] = c1[1] + c2[1];
  np[2] = c1[2] + c2[2];
  const radial = dot(N, np);
  return [(np[0] - N[0] * radial) / ln, (np[1] - N[1] * radial) / ln, (np[2] - N[2] * radial) / ln];
}

/** Gauss curvature from the fundamental forms (generic, no hard-coding). */
export function gaussCurvature(S: Surface, u: number, v: number): number {
  const ru = S.ru(u, v);
  const rv = S.rv(u, v);
  const N = normalAt(S, u, v);
  const E = dot(ru, ru);
  const F = dot(ru, rv);
  const G = dot(rv, rv);
  const L = dot(S.ruu(u, v), N);
  const M = dot(S.ruv(u, v), N);
  const Nf = dot(S.rvv(u, v), N);
  return (L * Nf - M * M) / (E * G - F * F);
}

// ---------- parallel transport ----------

/**
 * Transport X0 along a curve given by its unit normal N(t) and dN/dt:
 * Xdot = -<X, Ndot> N. Returns the X path (no projection or renormalisation:
 * tangency and |X| conservation are accuracy checks, not enforced).
 */
export function transportAlongCurve(
  N: (t: number) => Vec3,
  Ndot: (t: number) => Vec3,
  X0: Vec3,
  t0: number,
  t1: number,
  nSteps: number,
): Vec3[] {
  const f = (t: number, y: Float64Array): Float64Array => {
    const Nv = N(t);
    const Nd = Ndot(t);
    const c = y[0] * Nd[0] + y[1] * Nd[1] + y[2] * Nd[2];
    return Float64Array.of(-c * Nv[0], -c * Nv[1], -c * Nv[2]);
  };
  const { ys } = integrateRK4Path(f, t0, Float64Array.from(X0), t1, nSteps);
  return ys.map((y) => [y[0], y[1], y[2]] as Vec3);
}

/** Transport along a parameter-space curve t -> (u, v) with derivative. */
export function transportOnSurface(
  S: Surface,
  uv: (t: number) => [number, number],
  uvDot: (t: number) => [number, number],
  X0: Vec3,
  t0: number,
  t1: number,
  nSteps: number,
): Vec3[] {
  return transportAlongCurve(
    (t) => {
      const [u, v] = uv(t);
      return normalAt(S, u, v);
    },
    (t) => {
      const [u, v] = uv(t);
      const [du, dv] = uvDot(t);
      return normalDerivAt(S, u, v, du, dv);
    },
    X0,
    t0,
    t1,
    nSteps,
  );
}

/**
 * Signed rotation angle from X0 to X1 in the tangent plane oriented by N0
 * (both should be tangent at the same point; angle in (-pi, pi]).
 */
export function holonomyAngle(X0: Vec3, X1: Vec3, N0: Vec3): number {
  const Y0 = cross(N0, X0);
  return Math.atan2(dot(X1, Y0), dot(X1, X0));
}

// ---------- geodesics and Jacobi fields ----------

/**
 * Geodesic flow in parameter space: state (u, v, du, dv); the accelerations
 * solve the first-fundamental-form system
 *   E uddot + F vddot = -<c, r_u>,  F uddot + G vddot = -<c, r_v>,
 * with c = u'^2 r_uu + 2 u'v' r_uv + v'^2 r_vv  (equivalent to gammaddot || N).
 * Optionally carries a Jacobi field: state extended by (J, J'), J'' = -K J.
 */
export function geodesicFlow(
  S: Surface,
  u0: number,
  v0: number,
  du0: number,
  dv0: number,
  T: number,
  nSteps: number,
  withJacobi = false,
  J0 = 0,
  dJ0 = 1,
): {
  ts: Float64Array;
  uvs: Array<[number, number]>;
  points: Vec3[];
  Js?: Float64Array;
} {
  const f = (_t: number, y: Float64Array): Float64Array => {
    const [u, v, du, dv] = [y[0], y[1], y[2], y[3]];
    const ru = S.ru(u, v);
    const rv = S.rv(u, v);
    const ruu = S.ruu(u, v);
    const ruv = S.ruv(u, v);
    const rvv = S.rvv(u, v);
    const E = dot(ru, ru);
    const F = dot(ru, rv);
    const G = dot(rv, rv);
    const c: Vec3 = [
      du * du * ruu[0] + 2 * du * dv * ruv[0] + dv * dv * rvv[0],
      du * du * ruu[1] + 2 * du * dv * ruv[1] + dv * dv * rvv[1],
      du * du * ruu[2] + 2 * du * dv * ruv[2] + dv * dv * rvv[2],
    ];
    const b1 = -dot(c, ru);
    const b2 = -dot(c, rv);
    const det = E * G - F * F;
    const ddu = (b1 * G - b2 * F) / det;
    const ddv = (b2 * E - b1 * F) / det;
    if (!withJacobi) return Float64Array.of(du, dv, ddu, ddv);
    const K = gaussCurvature(S, u, v);
    return Float64Array.of(du, dv, ddu, ddv, y[5], -K * y[4]);
  };
  const y0 = withJacobi
    ? Float64Array.of(u0, v0, du0, dv0, J0, dJ0)
    : Float64Array.of(u0, v0, du0, dv0);
  const { ts, ys } = integrateRK4Path(f, 0, y0, T, nSteps);
  const uvs = ys.map((y) => [y[0], y[1]] as [number, number]);
  const points = uvs.map(([u, v]) => S.point(u, v));
  const out: { ts: Float64Array; uvs: Array<[number, number]>; points: Vec3[]; Js?: Float64Array } =
    { ts, uvs, points };
  if (withJacobi) out.Js = Float64Array.from(ys.map((y) => y[4]));
  return out;
}

/**
 * ∫∫ K dA over the image of the parameter-space ellipse
 * (u0 + a ρ cos α, v0 + b ρ sin α), ρ ∈ [0,1] — the Gauss–Bonnet prediction
 * for the holonomy of its boundary loop. Area element √(EG − F²) du dv;
 * Gauss–Legendre in ρ × periodic trapezoid in α (smooth integrand).
 */
export function integrateKOverEllipse(
  S: Surface,
  u0: number,
  v0: number,
  a: number,
  b: number,
  nR = 48,
  nA = 96,
): number {
  let acc = 0;
  const hA = TWO_PI / nA;
  const { nodes, weights } = gaussLegendre(nR);
  for (let i = 0; i < nR; i++) {
    const rho = (nodes[i] + 1) / 2;
    const wR = weights[i] / 2;
    for (let j = 0; j < nA; j++) {
      const al = j * hA;
      const u = u0 + a * rho * Math.cos(al);
      const v = v0 + b * rho * Math.sin(al);
      const ru = S.ru(u, v);
      const rv = S.rv(u, v);
      const E = dot(ru, ru);
      const F = dot(ru, rv);
      const G = dot(rv, rv);
      const jac = a * b * rho; // ellipse polar coordinates
      acc += wR * hA * gaussCurvature(S, u, v) * Math.sqrt(E * G - F * F) * jac;
    }
  }
  return acc;
}

/** Normalise (du, dv) to unit speed in the surface metric. */
export function unitSpeed(
  S: Surface,
  u: number,
  v: number,
  du: number,
  dv: number,
): [number, number] {
  const ru = S.ru(u, v);
  const rv = S.rv(u, v);
  const E = dot(ru, ru);
  const F = dot(ru, rv);
  const G = dot(rv, rv);
  const s = Math.sqrt(E * du * du + 2 * F * du * dv + G * dv * dv);
  return [du / s, dv / s];
}
