import { describe, expect, it } from 'vitest';
import {
  catmullRomClosed,
  insertPointNearest,
  nearestEdge,
  originCrossingLoop,
  perturbedCircle,
  presetControls,
  removePoint,
  windingOfControls,
  type Pt,
} from '../src/math/clutching';
import { mulberry32, sampleLoop, windingNumber } from '@rsvis/math';

describe('Widget 1 — clutching laboratory kernel', () => {
  // (a) Spec: winding of z -> z^n at 400 sample points equals n exactly, |n| <= 5.
  it('(a) winding of z^n sampled at 400 points equals n exactly for |n| <= 5', () => {
    for (let n = -5; n <= 5; n++) {
      if (n === 0) continue; // z^0 is the constant loop 1; no winding to measure
      const r = windingNumber(sampleLoop((t) => [Math.cos(n * t), Math.sin(n * t)], 400));
      expect(r.n).toBe(n);
      // Polygon winding is an exact integer; raw drift is pure roundoff (~400 ulp).
      expect(Math.abs(r.raw - n)).toBeLessThan(1e-12);
    }
    // and the constant-loop stand-in for n = 0: a loop missing the origin
    expect(windingNumber(sampleLoop((t) => [1 + 0.3 * Math.cos(t), 0.3 * Math.sin(t)], 400)).n).toBe(0);
  });

  // (b) Spec: invariance under 50 random smooth perturbations bounded away from 0.
  it('(b) winding invariant under 50 seeded smooth perturbations with |c| >= 0.3', () => {
    const rng = mulberry32(11);
    for (let trial = 0; trial < 50; trial++) {
      const n = Math.floor(rng() * 7) - 3; // n in [-3, 3]
      if (n === 0) continue;
      // 4 harmonics, total amplitude <= 0.7 < 1 keeps Re(1+p) >= 0.3 > 0.
      const budget = 0.7;
      const coeffs = [1, 2, 3, 4].map((k, _i, arr) => {
        const amp = budget / arr.length;
        return { k, a: (2 * rng() - 1) * amp * 0.5, b: (2 * rng() - 1) * amp * 0.5 };
      });
      const r = windingNumber(sampleLoop(perturbedCircle(n, coeffs), 800));
      expect(r.n).toBe(n);
      expect(r.minRadius).toBeGreaterThan(0.29);
    }
  });

  // (c) Spec: deterministic origin-crossing deformation changes n by exactly +-1.
  it('(c) crossing the origin jumps the winding by exactly one', () => {
    const before = [0.0, 0.2, 0.4, 0.45].map(
      (s) => windingNumber(sampleLoop(originCrossingLoop(s), 400)).n,
    );
    const after = [0.55, 0.6, 0.8, 1.0].map(
      (s) => windingNumber(sampleLoop(originCrossingLoop(s), 400)).n,
    );
    // frozen on each side of the crossing…
    expect(new Set(before).size).toBe(1);
    expect(new Set(after).size).toBe(1);
    // …and jumps by exactly one at it.
    expect(before[0]).toBe(0);
    expect(after[0]).toBe(1);
    expect(after[0] - before[0]).toBe(1);
  });

  // (d) Spec: sampling-density independence (200 vs 2000) for Lipschitz curves.
  it('(d) winding independent of sample density for Lipschitz curves', () => {
    const rng = mulberry32(7);
    const curves: Array<(t: number) => [number, number]> = [
      (t) => [Math.cos(t) * (1 + 0.4 * Math.cos(3 * t)), Math.sin(t) * (1 + 0.4 * Math.cos(3 * t))],
      (t) => [Math.cos(2 * t) + 0.2 * Math.cos(5 * t), Math.sin(2 * t) + 0.2 * Math.sin(7 * t)],
      perturbedCircle(-2, [{ k: 3, a: 0.3, b: -0.2 }]),
    ];
    for (let i = 0; i < 10; i++) {
      const n = Math.floor(rng() * 5) - 2 || 1;
      curves.push(perturbedCircle(n, [{ k: 2, a: 0.5 * rng(), b: -0.4 * rng() }]));
    }
    for (const c of curves) {
      const coarse = windingNumber(sampleLoop(c, 200)).n;
      const fine = windingNumber(sampleLoop(c, 2000)).n;
      expect(coarse).toBe(fine);
    }
  });

  it('preset control polygons reproduce their nominal winding through the spline', () => {
    for (let n = -2; n <= 3; n++) {
      const r = windingOfControls(presetControls(n));
      expect(r.n).toBe(n);
      expect(r.minRadius).toBeGreaterThan(0.5); // safely away from the origin
    }
  });

  it('catmull-rom spline interpolates its control points', () => {
    const ctrl: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    const per = 16;
    const pts = catmullRomClosed(ctrl, per);
    expect(pts.length).toBe(ctrl.length * per);
    for (let i = 0; i < ctrl.length; i++) {
      const p = pts[i * per];
      expect(Math.hypot(p[0] - ctrl[i][0], p[1] - ctrl[i][1])).toBeLessThan(1e-12);
    }
  });

  // Editing the control polygon is the "draw a loop" interaction. The kernel
  // ops must (i) preserve traversal order and (ii) leave the winding class
  // unchanged when a vertex is added on/near the existing curve — refinement
  // is a homotopy, so the topology cannot move.
  it('nearestEdge picks the edge under the click point', () => {
    const square: Pt[] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
    expect(nearestEdge(square, [0, 1.2])).toBe(0); // top edge (v0 -> v1)
    expect(nearestEdge(square, [-1.2, 0])).toBe(1); // left edge (v1 -> v2)
    expect(nearestEdge(square, [1.2, 0])).toBe(3); // right edge (v3 -> v0)
  });

  it('insertPointNearest keeps traversal order and the winding number', () => {
    for (let n = -3; n <= 3; n++) {
      if (n === 0) continue;
      let ctrl = presetControls(n);
      const before = windingOfControls(ctrl).n;
      // insert several vertices very close to the current curve
      for (let k = 0; k < 5; k++) {
        const samples = catmullRomClosed(ctrl, 8);
        const onCurve = samples[(k * 7) % samples.length];
        const jitter: Pt = [onCurve[0] + 1e-3, onCurve[1] - 1e-3];
        const res = insertPointNearest(ctrl, jitter);
        ctrl = res.ctrl;
        // the inserted vertex is exactly the one we asked for
        expect(ctrl[res.index]).toEqual(jitter);
      }
      expect(windingOfControls(ctrl).n).toBe(before);
    }
  });

  it('removePoint deletes a vertex but refuses to drop below the minimum', () => {
    const ctrl = presetControls(2); // 16 points
    const fewer = removePoint(ctrl, 3);
    expect(fewer.length).toBe(ctrl.length - 1);
    // removing down to 3 is allowed; the 4th removal is refused
    let tri: Pt[] = [
      [1, 0],
      [-0.5, 0.9],
      [-0.5, -0.9],
    ];
    tri = removePoint(tri, 0);
    expect(tri.length).toBe(3);
  });
});
