/**
 * Widget 3 kernel — Hopf bundle S^3 -> S^2: fibers, connection, holonomy.
 *
 * Conventions. S^3 = {(z1, z2) in C^2 : |z1|^2 + |z2|^2 = 1}; the state vector
 * is [a, b, c, d] = [Re z1, Im z1, Re z2, Im z2], which equals the quaternion
 * q = a + bi + cj + dk of src/math/quaternion.ts. Hopf map
 *   h(z1, z2) = (2 Re(conj(z1) z2), 2 Im(conj(z1) z2), |z1|^2 - |z2|^2).
 * Standard connection omega = Im(conj(z1) dz1 + conj(z2) dz2); a curve is
 * horizontal iff zdot is R^4-orthogonal to both q and iq (complex-scalar i).
 *
 * Key structural fact used throughout: left multiplication by i, j, k gives an
 * orthonormal frame {iq, jq, kq} of T_q S^3 in which iq spans the VERTICAL
 * space and {jq, kq} span the HORIZONTAL space; dh is conformal with factor 2
 * on the horizontal space (asserted in tests). The horizontal lift ODE is then
 *   zdot = (dh(jq) . pdot)/4 * jq + (dh(kq) . pdot)/4 * kq.
 *
 * Pure module: no DOM / WebGL imports.
 */

import { integrateRK4Path } from '@rsvis/math';

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export function hopfMap(z: ArrayLike<number>): Vec3 {
  const [a, b, c, d] = [z[0], z[1], z[2], z[3]];
  return [2 * (a * c + b * d), 2 * (a * d - b * c), a * a + b * b - c * c - d * d];
}

/** Differential dh_z(v) (h is quadratic, so this is exact, not FD). */
export function hopfDifferential(z: ArrayLike<number>, v: ArrayLike<number>): Vec3 {
  const [a, b, c, d] = [z[0], z[1], z[2], z[3]];
  const [va, vb, vc, vd] = [v[0], v[1], v[2], v[3]];
  return [
    2 * (va * c + a * vc + vb * d + b * vd),
    2 * (va * d + a * vd - vb * c - b * vc),
    2 * (a * va + b * vb - c * vc - d * vd),
  ];
}

/** Complex-scalar multiplication e^{i alpha} (z1, z2) — motion along the fiber. */
export function fiberPoint(z: ArrayLike<number>, alpha: number): Vec4 {
  const co = Math.cos(alpha);
  const si = Math.sin(alpha);
  return [
    z[0] * co - z[1] * si,
    z[0] * si + z[1] * co,
    z[2] * co - z[3] * si,
    z[2] * si + z[3] * co,
  ];
}

/** iq, jq, kq by left quaternion multiplication (orthonormal tangent frame). */
export function iq(z: ArrayLike<number>): Vec4 {
  return [-z[1], z[0], -z[3], z[2]];
}
export function jq(z: ArrayLike<number>): Vec4 {
  return [-z[2], z[3], z[0], -z[1]];
}
export function kq(z: ArrayLike<number>): Vec4 {
  return [-z[3], -z[2], z[1], z[0]];
}

/**
 * A point of the fiber over p in S^2 via the standard section away from the
 * south pole: with p = (sin t cos f, sin t sin f, cos t),
 *   z = (cos(t/2), sin(t/2) e^{i f})  i.e.  [cos(t/2), 0, sin(t/2) cos f, sin(t/2) sin f].
 */
export function sectionOver(p: Vec3): Vec4 {
  const t = Math.acos(Math.max(-1, Math.min(1, p[2])));
  const f = Math.atan2(p[1], p[0]);
  const ch = Math.cos(t / 2);
  const sh = Math.sin(t / 2);
  return [ch, 0, sh * Math.cos(f), sh * Math.sin(f)];
}

/** Renormalise a 4-vector onto S^3 in place (project-and-renorm step). */
export function renormS3(y: Float64Array): void {
  const n = Math.hypot(y[0], y[1], y[2], y[3]);
  y[0] /= n;
  y[1] /= n;
  y[2] /= n;
  y[3] /= n;
}

/**
 * Horizontal lift of the base curve gamma over [t0, t1] starting at z0
 * (which must satisfy h(z0) = gamma(t0)). Fixed-step RK4 with renormalisation
 * after every step; gammaDot must be the exact derivative.
 */
export function horizontalLift(
  gammaDot: (t: number) => Vec3,
  z0: ArrayLike<number>,
  t0: number,
  t1: number,
  nSteps: number,
): { ts: Float64Array; zs: Float64Array[] } {
  const f = (t: number, y: Float64Array): Float64Array => {
    const pd = gammaDot(t);
    const J = jq(y);
    const K = kq(y);
    const dhJ = hopfDifferential(y, J);
    const dhK = hopfDifferential(y, K);
    // dh is conformal (factor 2) on the horizontal space: <dhJ, dhJ> = 4 etc.
    const x = (dhJ[0] * pd[0] + dhJ[1] * pd[1] + dhJ[2] * pd[2]) / 4;
    const yk = (dhK[0] * pd[0] + dhK[1] * pd[1] + dhK[2] * pd[2]) / 4;
    return Float64Array.of(
      x * J[0] + yk * K[0],
      x * J[1] + yk * K[1],
      x * J[2] + yk * K[2],
      x * J[3] + yk * K[3],
    );
  };
  const { ts, ys } = integrateRK4Path(
    f,
    t0,
    Float64Array.from(z0 as ArrayLike<number>),
    t1,
    nSteps,
    renormS3,
  );
  return { ts, zs: ys };
}

/**
 * Phase Delta with zEnd ~ e^{i Delta} zStart (both in one fiber):
 * Delta = arg <zStart, zEnd>_{C^2}.
 */
export function holonomyPhase(zStart: ArrayLike<number>, zEnd: ArrayLike<number>): number {
  const [a, b, c, d] = [zStart[0], zStart[1], zStart[2], zStart[3]];
  const [e, f, g, h] = [zEnd[0], zEnd[1], zEnd[2], zEnd[3]];
  // <z, w> = conj(z1) w1 + conj(z2) w2
  const re = a * e + b * f + c * g + d * h;
  const im = a * f - b * e + c * h - d * g;
  return Math.atan2(im, re);
}

/**
 * Orientation sign sigma in holonomy = e^{i sigma Omega / 2}.
 * Determined numerically once (lift around a small CCW circle about the north
 * pole, theta0 = 0.2: measured phase = -Omega/2 to 8 digits) and hard-coded:
 * with our conventions (omega = Im<z, dz>, loop traversed with increasing
 * azimuth seen from +z) the holonomy phase is NEGATIVE: sigma = -1.
 */
export const HOLONOMY_SIGN = -1;

/** Solid angle enclosed by a circle of angular radius theta0 about its axis. */
export function circleSolidAngle(theta0: number): number {
  return 2 * Math.PI * (1 - Math.cos(theta0));
}

/** Latitude circle of angular radius theta0 about +z, azimuth s in [0, 2 pi]. */
export function latitudeCircle(theta0: number): {
  gamma: (s: number) => Vec3;
  gammaDot: (s: number) => Vec3;
} {
  const st = Math.sin(theta0);
  const ct = Math.cos(theta0);
  return {
    gamma: (s) => [st * Math.cos(s), st * Math.sin(s), ct],
    gammaDot: (s) => [-st * Math.sin(s), st * Math.cos(s), 0],
  };
}

/** Great-circle arc from A to B (must be orthogonal), s in [0, 1]. */
export function geodesicArc(A: Vec3, B: Vec3, sMax = Math.PI / 2): {
  gamma: (s: number) => Vec3;
  gammaDot: (s: number) => Vec3;
} {
  return {
    gamma: (s) => [
      A[0] * Math.cos(s * sMax) + B[0] * Math.sin(s * sMax),
      A[1] * Math.cos(s * sMax) + B[1] * Math.sin(s * sMax),
      A[2] * Math.cos(s * sMax) + B[2] * Math.sin(s * sMax),
    ],
    gammaDot: (s) => [
      sMax * (-A[0] * Math.sin(s * sMax) + B[0] * Math.cos(s * sMax)),
      sMax * (-A[1] * Math.sin(s * sMax) + B[1] * Math.cos(s * sMax)),
      sMax * (-A[2] * Math.sin(s * sMax) + B[2] * Math.cos(s * sMax)),
    ],
  };
}

/** Stereographic projection R^4 ⊃ S^3 -> R^3 from the pole (0, 0, 0, 1). */
export function stereographic(z: ArrayLike<number>): Vec3 {
  const denom = 1 - z[3];
  const eps = Math.abs(denom) < 1e-9 ? (denom >= 0 ? 1e-9 : -1e-9) : denom;
  return [z[0] / eps, z[1] / eps, z[2] / eps];
}

/** Sample the full fiber over p as M stereographically projected points. */
export function fiberCurveR3(p: Vec3, M = 200, phase0 = 0): Vec3[] {
  const z = sectionOver(p);
  const out: Vec3[] = [];
  for (let i = 0; i < M; i++) {
    out.push(stereographic(fiberPoint(z, phase0 + (2 * Math.PI * i) / M)));
  }
  return out;
}

/**
 * Gauss linking integral of two disjoint closed polylines (midpoint rule over
 * segment pairs — spectrally accurate for smooth well-separated curves):
 *   Lk = (1/4 pi) sum_ij ((mi - mj) . (di x dj)) / |mi - mj|^3.
 */
export function gaussLinking(c1: ReadonlyArray<Vec3>, c2: ReadonlyArray<Vec3>): number {
  let acc = 0;
  const n1 = c1.length;
  const n2 = c2.length;
  for (let i = 0; i < n1; i++) {
    const a0 = c1[i];
    const a1 = c1[(i + 1) % n1];
    const mi = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, (a0[2] + a1[2]) / 2];
    const di = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]];
    for (let j = 0; j < n2; j++) {
      const b0 = c2[j];
      const b1 = c2[(j + 1) % n2];
      const mj = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2, (b0[2] + b1[2]) / 2];
      const dj = [b1[0] - b0[0], b1[1] - b0[1], b1[2] - b0[2]];
      const rx = mi[0] - mj[0];
      const ry = mi[1] - mj[1];
      const rz = mi[2] - mj[2];
      const r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
      const cx = di[1] * dj[2] - di[2] * dj[1];
      const cy = di[2] * dj[0] - di[0] * dj[2];
      const cz = di[0] * dj[1] - di[1] * dj[0];
      acc += (rx * cx + ry * cy + rz * cz) / r3;
    }
  }
  return acc / (4 * Math.PI);
}
