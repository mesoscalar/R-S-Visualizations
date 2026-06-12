import { describe, expect, it } from 'vitest';
import {
  antiperiodicSection,
  applyCoboundary,
  bundleClass,
  cylinderPoint,
  mobiusFiberDir,
  mobiusPoint,
  zeroCrossings,
} from '../src/math/mobius';
import { mulberry32 } from '../src/math/rng';

describe('Widget 7 — Möbius band kernel (orientation bookkeeping)', () => {
  it('Möbius embedding flips the fiber after one loop: m(u+2π, t) = m(u, −t)', () => {
    for (const u of [0, 0.7, 2.2, 4.9]) {
      for (const t of [-1, -0.3, 0.6, 1]) {
        const a = mobiusPoint(u + 2 * Math.PI, t);
        const b = mobiusPoint(u, -t);
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-12);
        // cylinder, by contrast, is honestly periodic
        const c = cylinderPoint(u + 2 * Math.PI, t);
        const d = cylinderPoint(u, t);
        expect(Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2])).toBeLessThan(1e-12);
      }
    }
    // fiber direction is antiperiodic too
    const f0 = mobiusFiberDir(0.5);
    const f1 = mobiusFiberDir(0.5 + 2 * Math.PI);
    expect(Math.hypot(f0[0] + f1[0], f0[1] + f1[1], f0[2] + f1[2])).toBeLessThan(1e-12);
  });

  it('every continuous Möbius section has an odd number of zeros (50 seeded trials)', () => {
    const rng = mulberry32(77);
    for (let trial = 0; trial < 50; trial++) {
      const coeffs = [0, 1, 2].map(() => ({ a: 2 * rng() - 1, b: 2 * rng() - 1 }));
      const zeros = zeroCrossings(antiperiodicSection(coeffs));
      expect(zeros.length).toBeGreaterThanOrEqual(1); // the forced zero
      expect(zeros.length % 2).toBe(1); // transverse zeros of antiperiodic f come in odd number
    }
  });

  it('the cylinder admits a nonvanishing section (the contrast)', () => {
    const f = (u: number) => 1.5 + Math.cos(u); // periodic, never 0
    let minAbs = Infinity;
    for (let i = 0; i < 2048; i++) minAbs = Math.min(minAbs, Math.abs(f((2 * Math.PI * i) / 2048)));
    expect(minAbs).toBeGreaterThan(0.4);
  });

  it('Čech Z/2 class: cylinder (+1) vs Möbius (−1), coboundary-invariant', () => {
    expect(bundleClass([1, 1])).toBe(1);
    expect(bundleClass([1, -1])).toBe(-1);
    const rng = mulberry32(13);
    for (let trial = 0; trial < 40; trial++) {
      const n = 2 + Math.floor(rng() * 4);
      const transitions = Array.from({ length: n }, () => (rng() < 0.5 ? 1 : -1) as 1 | -1);
      const eps = Array.from({ length: n }, () => (rng() < 0.5 ? 1 : -1) as 1 | -1);
      expect(bundleClass(applyCoboundary(transitions, eps))).toBe(bundleClass(transitions));
    }
  });
});
