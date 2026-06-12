/**
 * Quaternion algebra on H = R^4, components [w, x, y, z] (w scalar part).
 *
 * Unit quaternions = S^3 = SU(2) under the identification
 *   q = w + xi + yj + zk  <->  (z1, z2) = (w + ix, y + iz) in C^2,
 * matching the task convention S^3 = {(z1,z2) : |z1|^2 + |z2|^2 = 1}.
 *
 * Pure module: no DOM / WebGL imports.
 */

export type Quat = [number, number, number, number];

export const QONE: Quat = [1, 0, 0, 0];

export function qmul(a: ArrayLike<number>, b: ArrayLike<number>): Quat {
  const [aw, ax, ay, az] = [a[0], a[1], a[2], a[3]];
  const [bw, bx, by, bz] = [b[0], b[1], b[2], b[3]];
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
  ];
}

export function qconj(a: ArrayLike<number>): Quat {
  return [a[0], -a[1], -a[2], -a[3]];
}

export function qnorm(a: ArrayLike<number>): number {
  return Math.hypot(a[0], a[1], a[2], a[3]);
}

export function qscale(a: ArrayLike<number>, s: number): Quat {
  return [a[0] * s, a[1] * s, a[2] * s, a[3] * s];
}

export function qadd(a: ArrayLike<number>, b: ArrayLike<number>): Quat {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

export function qdot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

export function qnormalize(a: ArrayLike<number>): Quat {
  const n = qnorm(a);
  if (n === 0) throw new Error('cannot normalise zero quaternion');
  return qscale(a, 1 / n);
}

/** Integer power by repeated multiplication (exact group operation, no exp/log branch issues). */
export function qpowInt(q: Quat, n: number): Quat {
  if (!Number.isInteger(n)) throw new Error('qpowInt requires integer exponent');
  if (n === 0) return [...QONE];
  let base: Quat = n > 0 ? q : qscale(qconj(q), 1 / (qnorm(q) ** 2));
  let e = Math.abs(n);
  let acc: Quat = [...QONE];
  while (e > 0) {
    if (e & 1) acc = qmul(acc, base);
    base = qmul(base, base);
    e >>= 1;
  }
  return acc;
}

/** exp of a quaternion (general; for pure-imaginary v this lands on S^3). */
export function qexp(a: ArrayLike<number>): Quat {
  const vn = Math.hypot(a[1], a[2], a[3]);
  const ew = Math.exp(a[0]);
  if (vn < 1e-300) return [ew, 0, 0, 0];
  const s = (ew * Math.sin(vn)) / vn;
  return [ew * Math.cos(vn), s * a[1], s * a[2], s * a[3]];
}

/** Principal log of a nonzero quaternion. */
export function qlog(a: ArrayLike<number>): Quat {
  const n = qnorm(a);
  const vn = Math.hypot(a[1], a[2], a[3]);
  const w = Math.log(n);
  if (vn < 1e-300) {
    if (a[0] < 0) return [w, Math.PI, 0, 0]; // log(-1) = i*pi (principal choice)
    return [w, 0, 0, 0];
  }
  const th = Math.atan2(vn, a[0]);
  const s = th / vn;
  return [w, s * a[1], s * a[2], s * a[3]];
}

/** Rotate a 3-vector by a unit quaternion: v -> q v q^{-1}. */
export function qrotate(q: Quat, v: [number, number, number]): [number, number, number] {
  const p = qmul(qmul(q, [0, v[0], v[1], v[2]]), qconj(q));
  return [p[1], p[2], p[3]];
}

/** Unit quaternion from axis (need not be unit) and angle. */
export function qfromAxisAngle(axis: [number, number, number], angle: number): Quat {
  const n = Math.hypot(axis[0], axis[1], axis[2]);
  if (n === 0) return [...QONE];
  const s = Math.sin(angle / 2) / n;
  return [Math.cos(angle / 2), s * axis[0], s * axis[1], s * axis[2]];
}

/**
 * C^2 <-> H dictionary for the Hopf bundle:
 * (z1, z2) = (w + ix, y + iz). State vectors elsewhere use
 * Float64Array [Re z1, Im z1, Re z2, Im z2] which equals [w, x, y, z].
 */
export function quatToC2(q: Quat): { z1: [number, number]; z2: [number, number] } {
  return { z1: [q[0], q[1]], z2: [q[2], q[3]] };
}
