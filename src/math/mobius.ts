/**
 * Widget 7 kernel — cylinder vs Möbius band as Z/2-bundles over S^1.
 *
 * The band glued from two trivial pieces over overlapping arcs with transition
 * functions ±1; the isomorphism class is the product of the transition signs
 * around the circle (Čech H^1(S^1, Z/2) = Z/2), invariant under coboundaries.
 * Continuous sections of the Möbius band are exactly the antiperiodic
 * functions f(u + 2π) = -f(u) — spanned by half-integer harmonics — and every
 * such function has a zero (in fact an odd number of transverse zeros).
 *
 * Pure module: no DOM / WebGL imports.
 */

export type Vec3 = [number, number, number];

/** Cylinder over the unit circle, |t| <= 1 (half-width w). */
export function cylinderPoint(u: number, t: number, w = 0.45): Vec3 {
  return [Math.cos(u), Math.sin(u), w * t];
}

/** Standard Möbius embedding: the fiber turns by π as u advances by 2π. */
export function mobiusPoint(u: number, t: number, w = 0.45): Vec3 {
  const r = 1 + w * t * Math.cos(u / 2);
  return [r * Math.cos(u), r * Math.sin(u), w * t * Math.sin(u / 2)];
}

/** Fiber direction ∂/∂t at t = 0 of the Möbius embedding. */
export function mobiusFiberDir(u: number, w = 0.45): Vec3 {
  return [w * Math.cos(u / 2) * Math.cos(u), w * Math.cos(u / 2) * Math.sin(u), w * Math.sin(u / 2)];
}

/** Fiber direction of the cylinder (constant). */
export function cylinderFiberDir(_u: number, w = 0.45): Vec3 {
  return [0, 0, w];
}

/**
 * Antiperiodic function on the circle (a section of the Möbius band):
 * f(u) = Σ a_k cos((k + 1/2) u) + b_k sin((k + 1/2) u).
 */
export function antiperiodicSection(
  coeffs: ReadonlyArray<{ a: number; b: number }>,
): (u: number) => number {
  return (u) => {
    let f = 0;
    coeffs.forEach(({ a, b }, k) => {
      f += a * Math.cos((k + 0.5) * u) + b * Math.sin((k + 0.5) * u);
    });
    return f;
  };
}

/** Locations of sign changes of f on [0, 2π) sampled at n points (bisected). */
export function zeroCrossings(f: (u: number) => number, n = 2048): number[] {
  const zeros: number[] = [];
  for (let i = 0; i < n; i++) {
    const u0 = (2 * Math.PI * i) / n;
    const u1 = (2 * Math.PI * (i + 1)) / n;
    const f0 = f(u0);
    const f1 = i + 1 === n ? -f(0) : f(u1); // antiperiodic wrap for the last cell
    if (f0 === 0) zeros.push(u0);
    else if (f0 * f1 < 0) {
      let lo = u0;
      let hi = u1;
      let flo = f0;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        const fm = mid >= 2 * Math.PI ? -f(mid - 2 * Math.PI) : f(mid);
        if (flo * fm <= 0) hi = mid;
        else {
          lo = mid;
          flo = fm;
        }
      }
      zeros.push((lo + hi) / 2);
    }
  }
  return zeros;
}

/**
 * Čech class of a Z/2-bundle over S^1 given the transition signs on the
 * (cyclically ordered) overlaps: the product, in {+1, -1}.
 */
export function bundleClass(transitions: ReadonlyArray<1 | -1>): 1 | -1 {
  let p = 1;
  for (const t of transitions) p *= t;
  return p as 1 | -1;
}

/**
 * Coboundary action: re-trivialising chart i by ε_i ∈ {±1} replaces the
 * transition on the overlap between consecutive charts i, i+1 by
 * ε_i t_i ε_{i+1} (indices mod N). The class is invariant.
 */
export function applyCoboundary(
  transitions: ReadonlyArray<1 | -1>,
  eps: ReadonlyArray<1 | -1>,
): Array<1 | -1> {
  const n = transitions.length;
  return transitions.map((t, i) => (eps[i] * t * eps[(i + 1) % n]) as 1 | -1);
}
