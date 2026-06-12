/**
 * Widget 1 kernel — clutching construction over S^2.
 *
 * A principal U(1)-bundle over S^2 is glued from two trivial cap bundles by a
 * transition function on the equatorial overlap; its isomorphism class is the
 * homotopy class [S^1, U(1)] = pi_1(U(1)) = Z, detected by the winding number
 * of the (origin-avoiding) loop the user draws in C^*.
 *
 * Pure module: geometry of loops only, no DOM / WebGL imports.
 */

import { windingNumber, type WindingResult } from './winding';

export type Pt = [number, number];

/**
 * Closed uniform Catmull-Rom spline through the control points, sampled with
 * `per` points per segment. Returns m*per points tracing the closed loop once.
 * (C^1 spline of Lipschitz curves: winding must be sampling-density
 * independent — asserted in tests.)
 */
export function catmullRomClosed(ctrl: ReadonlyArray<Pt>, per = 24): Pt[] {
  const m = ctrl.length;
  const out: Pt[] = [];
  if (m < 3) return ctrl.slice() as Pt[];
  for (let i = 0; i < m; i++) {
    const p0 = ctrl[(i - 1 + m) % m];
    const p1 = ctrl[i];
    const p2 = ctrl[(i + 1) % m];
    const p3 = ctrl[(i + 2) % m];
    for (let k = 0; k < per; k++) {
      const u = k / per;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * u +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * u +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  return out;
}

/** Winding number of a closed control polygon, sampled through the spline. */
export function windingOfControls(ctrl: ReadonlyArray<Pt>, per = 24): WindingResult {
  return windingNumber(catmullRomClosed(ctrl, per));
}

/**
 * Control points for the preset z -> z^n (loop traced n times around U(1)).
 * For |n| >= 2 the radius breathes (+/-18%) so strands are visually distinct;
 * the modulation is bounded away from 0, so the winding is unaffected.
 * n = 0 yields a small loop around z = 1.3 not enclosing the origin.
 */
export function presetControls(n: number, pointsPerTurn = 8): Pt[] {
  if (n === 0) {
    const pts: Pt[] = [];
    for (let j = 0; j < 8; j++) {
      const t = (2 * Math.PI * j) / 8;
      pts.push([1.3 + 0.45 * Math.cos(t), 0.45 * Math.sin(t)]);
    }
    return pts;
  }
  const turns = Math.abs(n);
  const M = turns * pointsPerTurn;
  const pts: Pt[] = [];
  for (let j = 0; j < M; j++) {
    const frac = j / M; // fraction of the whole multi-turn journey
    const ang = Math.sign(n) * 2 * Math.PI * turns * frac;
    const r = turns === 1 ? 1 : 1 + 0.18 * Math.cos(2 * Math.PI * frac);
    pts.push([r * Math.cos(ang), r * Math.sin(ang)]);
  }
  return pts;
}

/**
 * Deterministic origin-crossing family for the homotopy-jump test:
 * unit circle centred at (2 - 2s, 0). For s < 1/2 the origin is outside
 * (winding 0); for s > 1/2 it is inside (winding 1); at s = 1/2 the loop
 * passes through the origin and the winding is undefined — the jump locus.
 */
export function originCrossingLoop(s: number): (t: number) => Pt {
  const cx = 2 - 2 * s;
  return (t) => [cx + Math.cos(t), Math.sin(t)];
}

/**
 * Perturbed n-fold circle c(t) = e^{i n t} (1 + p(t)) with p a trigonometric
 * polynomial. If sum |coeffs| < 1 then Re(1 + p) > 0, so the factor (1 + p)
 * never encircles 0 and the winding remains exactly n (used by the
 * homotopy-invariance test).
 */
export function perturbedCircle(
  n: number,
  coeffs: ReadonlyArray<{ k: number; a: number; b: number }>,
): (t: number) => Pt {
  return (t) => {
    let p = 0;
    for (const { k, a, b } of coeffs) p += a * Math.cos(k * t) + b * Math.sin(k * t);
    const r = 1 + p;
    const c = Math.cos(n * t);
    const s = Math.sin(n * t);
    return [r * c, r * s];
  };
}

/**
 * Transition function values along the equator from a sampled loop:
 * g(phi) = c(phi)/|c(phi)| in U(1), returned as the angle arg c(phi).
 * `samples` must trace the loop once; phi is matched by index.
 */
export function transitionAngles(samples: ReadonlyArray<Pt>): Float64Array {
  const out = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = Math.atan2(samples[i][1], samples[i][0]);
  return out;
}
