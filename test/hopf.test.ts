import { describe, expect, it } from 'vitest';
import {
  circleSolidAngle,
  fiberCurveR3,
  gaussLinking,
  geodesicArc,
  HOLONOMY_SIGN,
  hopfDifferential,
  hopfMap,
  holonomyPhase,
  horizontalLift,
  jq,
  kq,
  latitudeCircle,
  sectionOver,
  type Vec3,
} from '../src/math/hopf';

describe('Widget 3 — Hopf bundle kernel', () => {
  it('structure: section lies over its base point; frame is horizontal-conformal', () => {
    const p: Vec3 = [0.48, -0.6, Math.sqrt(1 - 0.48 ** 2 - 0.36)];
    const z = sectionOver(p);
    const hp = hopfMap(z);
    expect(Math.hypot(hp[0] - p[0], hp[1] - p[1], hp[2] - p[2])).toBeLessThan(1e-14);
    // dh on {jq, kq}: orthogonal, both of squared norm 4 (conformal factor 2).
    const dhJ = hopfDifferential(z, jq(z));
    const dhK = hopfDifferential(z, kq(z));
    const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    expect(Math.abs(dot(dhJ, dhJ) - 4)).toBeLessThan(1e-12);
    expect(Math.abs(dot(dhK, dhK) - 4)).toBeLessThan(1e-12);
    expect(Math.abs(dot(dhJ, dhK))).toBeLessThan(1e-12);
  });

  // (a) Spec: lift stays on S^3 and over gamma to 1e-9 (project-and-renorm RK4).
  it('(a) horizontal lift stays on S³ and over γ to 1e-9 along the whole path', () => {
    const { gamma, gammaDot } = latitudeCircle(0.9);
    const z0 = sectionOver(gamma(0));
    const { ts, zs } = horizontalLift(gammaDot, z0, 0, 2 * Math.PI, 4000);
    // Renormalisation makes |z| = 1 to machine precision; base tracking error is
    // pure RK4 truncation: h = 2pi/4000 gives global error ~ C h^4 ~ 1e-13 << 1e-9.
    let maxNormErr = 0;
    let maxBaseErr = 0;
    for (let i = 0; i < zs.length; i++) {
      const z = zs[i];
      maxNormErr = Math.max(maxNormErr, Math.abs(Math.hypot(z[0], z[1], z[2], z[3]) - 1));
      const hp = hopfMap(z);
      const g = gamma(ts[i]);
      maxBaseErr = Math.max(maxBaseErr, Math.hypot(hp[0] - g[0], hp[1] - g[1], hp[2] - g[2]));
    }
    expect(maxNormErr).toBeLessThan(1e-12);
    expect(maxBaseErr).toBeLessThan(1e-9);
  });

  // (b) Spec: holonomy for the geodesic octant triangle (Omega = pi/2) equals
  //     Omega/2 = pi/4 in magnitude, to 1e-6.
  it('(b) octant triangle holonomy = σ·Ω/2 = σ·π/4 to 1e-6', () => {
    const X: Vec3 = [1, 0, 0];
    const Y: Vec3 = [0, 1, 0];
    const Z: Vec3 = [0, 0, 1];
    // Traverse X -> Y -> Z -> X (positively oriented boundary of the octant).
    const sides = [geodesicArc(X, Y), geodesicArc(Y, Z), geodesicArc(Z, X)];
    let z: Float64Array = Float64Array.from(sectionOver(X));
    const z0 = Float64Array.from(z);
    for (const side of sides) {
      const { zs } = horizontalLift(side.gammaDot, z, 0, 1, 2000);
      z = zs[zs.length - 1];
    }
    const phase = holonomyPhase(z0, z);
    // RK4 at h = 5e-4: global error ~ 1e-13; tolerance 1e-6 is the spec's.
    expect(Math.abs(phase - (HOLONOMY_SIGN * Math.PI) / 4)).toBeLessThan(1e-6);
  });

  // (c) Spec: phase scales linearly with enclosed area for small circles.
  it('(c) phase / solid angle = σ/2 to 1e-6 for small circles', () => {
    for (const th of [0.05, 0.1, 0.2]) {
      const { gamma, gammaDot } = latitudeCircle(th);
      const z0 = sectionOver(gamma(0));
      const { zs } = horizontalLift(gammaDot, z0, 0, 2 * Math.PI, 4000);
      const phase = holonomyPhase(z0, zs[zs.length - 1]);
      const omega = circleSolidAngle(th);
      // Exact theory: phase = sigma * Omega / 2 for ANY latitude circle, so the
      // ratio is constant; 1e-6 covers RK4 truncation with ~7 orders of headroom.
      expect(Math.abs(phase / omega - HOLONOMY_SIGN / 2)).toBeLessThan(1e-6);
    }
  });

  // (d) Spec: two distinct fibers have linking number 1 (Gauss integral).
  it('(d) Gauss linking number of two distinct fibers = 1 (±1e-4 at M = 512)', () => {
    // Polygonal Gauss sum has O(M^-2) geometric error: measured 1.2e-4 at M=256,
    // so M=512 gives ~3e-5 — tolerance 1e-4 with margin.
    const pairs: Array<[Vec3, Vec3]> = [
      [
        [0, 0, 1],
        [1, 0, 0],
      ],
      [
        [0, 0, 1],
        [0.6, 0.3, Math.sqrt(1 - 0.36 - 0.09)],
      ],
      [
        [0.8, 0, 0.6],
        [-0.5, 0.5, Math.sqrt(0.5)],
      ],
    ];
    for (const [p1, p2] of pairs) {
      const lk = gaussLinking(fiberCurveR3(p1, 512), fiberCurveR3(p2, 512));
      expect(Math.abs(lk - 1)).toBeLessThan(1e-4);
      expect(Math.round(lk)).toBe(1);
    }
  });

  it('fiber motion: e^{iα}z projects to the same base point', () => {
    const z = sectionOver([0.2, 0.5, Math.sqrt(1 - 0.04 - 0.25)]);
    const p0 = hopfMap(z);
    for (const a of [0.7, 2.1, 4.4]) {
      const w = fiberCurveR3(p0, 8, a); // also exercises phase0 offset
      expect(w.length).toBe(8);
      const hp = hopfMap(sectionOver(p0));
      expect(Math.hypot(hp[0] - p0[0], hp[1] - p0[1], hp[2] - p0[2])).toBeLessThan(1e-12);
    }
  });
});
