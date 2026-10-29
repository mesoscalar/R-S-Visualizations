import { describe, expect, it } from 'vitest';
import { actU1, frameAngle, fromPolar, mulberry32, omegaC, randomUnitQuat, section1, sectionN, transportFrame, type Vec3 } from '@rsvis/math';
import { chartFlat1 } from '../src/math/affine-connections';
import { curvatureC } from '../src/math/curvature';
import { lassoFor, lassoPath, meanResultant, phaseCoverage, reachable } from '../src/math/holonomy-bundle';
import { chart1Lift } from '../src/math/transport';

const m0 = fromPolar(1.0, 0.3);

describe('Station 1.7b — holonomy bundles and Ambrose–Singer (§1.7)', () => {
  it('flat connection: every horizontally reachable point lies on the leaf κ1 = κ1(p0) (holonomy trivial)', () => {
    const r = reachable(chartFlat1, m0, 0.7, 60, 8, 0.35, mulberry32(1));
    for (const z of r.ends) expect(Math.abs(Math.atan2(z[1], z[0]) - 0.7)).toBeLessThan(1e-10);
    expect(phaseCoverage(r.ends)).toBeLessThanOrEqual(1 / 36);
  });

  it('ω_c: random horizontal walks spread over the fibres as they get longer', () => {
    // mean resultant of the endpoint phases: 1 on a single leaf, ≈ 0.05 for 300
    // uniform phases. Measured (seed 2): 0.977 / 0.733 / 0.237 at 2 / 10 / 40 rad.
    const R = [
      [5, 0.4],
      [20, 0.5],
      [80, 0.5],
    ].map(([n, L]) => meanResultant(reachable(omegaC, m0, 0.7, 300, n, L, mulberry32(2)).ends));
    expect(R[0]).toBeGreaterThan(R[1]);
    expect(R[1]).toBeGreaterThan(R[2]);
    expect(R[2]).toBeLessThan(0.5);
  });

  it('Prop. 1.7.12, Rem. 1.7.14: every point of S³ is horizontally reachable from p0 (constructive)', () => {
    const rng = mulberry32(5);
    for (let k = 0; k < 20; k++) {
      const m = fromPolar(0.1 + 1.3 * rng(), 6.28 * rng()); // caps of radius ≤ π/2 stay in U1
      const beta = 6.28 * rng() - 3.14;
      const plain = chart1Lift(omegaC, (t) => lassoPath(m0, m, 0, 1)(t), 0, 1, 800, 0.7);
      const arrive = plain.alpha[plain.alpha.length - 1];
      const { r, sense } = lassoFor(beta - arrive);
      const lift = chart1Lift(omegaC, lassoPath(m0, m, r, sense), 0, 1, 1600, 0.7);
      const end = lift.lift[lift.lift.length - 1];
      const target = actU1(section1(m)!, beta);
      // Simpson on a piecewise-smooth path with kinks on panel boundaries: ~1e-10
      expect(Math.hypot(...end.map((c, i) => c - target[i]))).toBeLessThan(1e-8);
    }
  });

  it('Thm. 1.7.15 (Ambrose–Singer) for ω_c: curvature values are nonzero, so they span u(1) = Lie(holonomy)', () => {
    const rng = mulberry32(3);
    for (let k = 0; k < 50; k++) {
      const z = randomUnitQuat(rng);
      // two orthonormal horizontal vectors jz, kz: Ω(jz, kz) = dω_c(jz, kz) = ±2
      const j = [-z[2], z[3], z[0], -z[1]];
      const kk = [-z[3], -z[2], z[1], z[0]];
      expect(Math.abs(Math.abs(curvatureC(z, j, kk)) - 2)).toBeLessThan(1e-13);
    }
  });

  it('Exercise 1.7.6(b): the reductive connection on SO(3) → S² has holonomy SO(2) (all rotation angles occur)', () => {
    const angles: number[] = [];
    for (let k = 1; k <= 60; k++) {
      const th = (k / 60) * (Math.PI - 0.05);
      const xOf = (t: number): Vec3 => [Math.sin(th) * Math.cos(t), Math.sin(th) * Math.sin(t), Math.cos(th)];
      const xDot = (t: number): Vec3 => [-Math.sin(th) * Math.sin(t), Math.sin(th) * Math.cos(t), 0];
      const path = transportFrame(xOf, xDot, sectionN(xOf(0))!, 0, 2 * Math.PI, 800);
      angles.push(frameAngle(path[0], path[path.length - 1]));
    }
    // the rotation angle 2π(1 − cos θ) mod 2π takes values all around the circle
    const bins = new Set(angles.map((a) => Math.floor(((a + Math.PI) / (2 * Math.PI)) * 12)));
    expect(bins.size).toBeGreaterThanOrEqual(11);
  });
});
