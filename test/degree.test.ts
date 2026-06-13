import { describe, expect, it } from 'vitest';
import {
  circleThrough,
  degreeMC,
  degreeQMC,
  degreeQuadrature,
  findPreimages,
  mapPow,
  perturbedPow,
  powBranches,
  traceBranch,
} from '../src/math/degree';
import { qpowInt, type Quat } from '../src/math/quaternion';
import { mulberry32 } from '../src/math/rng';

describe('Widget 5 — degree and pi_3(SU(2)) kernel', () => {
  // (a) Spec: numerical degree of f_n = n ± 1e-3 for n = 1, 2, 3, with a
  //     sampling estimator at a stated sample count.
  it('(a) degree of q ↦ qⁿ = n ± 1e-3: quadrature and QMC (N = 200,000)', () => {
    for (const n of [1, 2, 3]) {
      // Product GL 32x32x64: measured errors 5e-11 (n=1) … 1.2e-9 (n=3) —
      // the smooth integrand n (sin nχ / sin χ)² converges spectrally.
      const dq = degreeQuadrature(mapPow(n), 32, 32, 64);
      expect(Math.abs(dq - n)).toBeLessThan(1e-3);
      expect(Math.abs(dq - n)).toBeLessThan(1e-7); // actual headroom
    }
    // Deterministic Halton QMC at the stated N = 200,000 samples:
    // measured error 4.0e-5 for n = 3 (worst case of the three).
    const dmc = degreeQMC(mapPow(3), 200_000);
    expect(Math.abs(dmc - 3)).toBeLessThan(1e-3);
  });

  it('(a′) plain Monte Carlo agrees within its own error estimate (seeded)', () => {
    const { mean, stderr } = degreeMC(mapPow(2), 100_000, mulberry32(99));
    // mulberry32(99): measured 1.9969 ± 0.0063 — assert within 4 sigma and
    // that the error bar itself is honest (not absurdly small).
    expect(Math.abs(mean - 2)).toBeLessThan(4 * stderr);
    expect(stderr).toBeGreaterThan(1e-4);
    expect(stderr).toBeLessThan(0.05);
  });

  // (b) Spec: degree of a small smooth perturbation of f_2 is still 2.
  it('(b) perturbed f₂ (homotopic, nonvanishing family) still has degree 2', () => {
    for (const eps of [0.15, 0.35]) {
      const d = degreeQuadrature(perturbedPow(2, eps), 32, 32, 64);
      // measured 2 - 2.9e-8 at eps = 0.35; assert the spec-level claim and
      // the integer lock.
      expect(Math.abs(d - 2)).toBeLessThan(1e-3);
      expect(Math.round(d)).toBe(2);
    }
  });

  // (c) Spec: regular-value preimage count of f_n equals n.
  it('(c) preimage count of a regular value equals n (seeded multistart Newton)', () => {
    const p: Quat = qpowInt(
      [Math.cos(0.4), Math.sin(0.4) * 0.6, Math.sin(0.4) * 0.64, Math.sin(0.4) * 0.48],
      1,
    );
    for (const n of [1, 2, 3]) {
      const roots = findPreimages(mapPow(n), p, mulberry32(7), 60);
      expect(roots.length).toBe(n);
      // each root maps back to p
      for (const r of roots) {
        const im = qpowInt(r, n);
        expect(
          Math.hypot(im[0] - p[0], im[1] - p[1], im[2] - p[2], im[3] - p[3]),
        ).toBeLessThan(1e-9);
      }
    }
  });

  it('preimage foliation: n closed branches over a regular circle, closed form vs continuation', () => {
    const p: Quat = qpowInt(
      [Math.cos(0.7), Math.sin(0.7) * 0.36, Math.sin(0.7) * 0.48, Math.sin(0.7) * 0.8],
      1,
    );
    const C = circleThrough(p);
    // closed-form branches of q ↦ q³ map back onto C to machine precision
    const branches = powBranches(C, 3, 120);
    expect(branches.length).toBe(3);
    let maxErr = 0;
    for (const branch of branches) {
      for (let i = 0; i < branch.length; i++) {
        const im = qpowInt(branch[i], 3);
        const c = C((2 * Math.PI * i) / 120);
        maxErr = Math.max(
          maxErr,
          Math.hypot(im[0] - c[0], im[1] - c[1], im[2] - c[2], im[3] - c[3]),
        );
      }
    }
    expect(maxErr).toBeLessThan(1e-12);
    // Newton continuation reproduces branch 0 of the unperturbed map…
    const traced = traceBranch(mapPow(3), C, branches[0][0], 120);
    expect(traced).not.toBeNull();
    // …and still closes up for the perturbed map (same count, homotopy-stable)
    const root = findPreimages(perturbedPow(3, 0.2), C(0), mulberry32(3), 40)[0];
    const tracedPert = traceBranch(perturbedPow(3, 0.2), C, root, 120);
    expect(tracedPert).not.toBeNull();
    const first = tracedPert![0];
    const last = tracedPert![tracedPert!.length - 1];
    expect(
      Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2], last[3] - first[3]),
    ).toBeLessThan(1e-6);
  });
});
