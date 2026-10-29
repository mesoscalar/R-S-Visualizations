import { describe, expect, it } from 'vitest';
import {
  fromPolar,
  hopfDifferential,
  hopfMap,
  horizontalLift,
  killingI,
  mulberry32,
  omegaC,
  randomUnitQuat,
  section1,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import { chartFlat1, omegaPU } from '../src/math/affine-connections';
import { horizontalLiftVector } from '../src/math/connection-split';
import { chartCoefficient, curvatureC, dOmegaC } from '../src/math/curvature';
import { chart1Lift, holonomyAngle, rectangleLoop } from '../src/math/transport';

const RT = 1e-13; // bilinear identities in O(1) numbers: roundoff ~1e-15
const rng = mulberry32(1406);
const randTangent = (z: Vec4): Vec4 => {
  const r: Vec4 = [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const d = r[0] * z[0] + r[1] * z[1] + r[2] * z[2] + r[3] * z[3];
  return [r[0] - d * z[0], r[1] - d * z[1], r[2] - d * z[2], r[3] - d * z[3]];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

describe('Station 1.4a — curvature of the Hopf connection (§1.4)', () => {
  it('structure equation (1.4.9) for U(1): dω_c vanishes on a vertical vector, so Ω = dω_c', () => {
    for (let k = 0; k < 300; k++) {
      const z = randomUnitQuat(rng);
      const X = randTangent(z);
      const Y = randTangent(z);
      expect(Math.abs(dOmegaC(killingI(z), X))).toBeLessThan(RT); // Ω(A*, ·) = 0 = dω(A*, ·)
      expect(Math.abs(curvatureC(z, X, Y) - dOmegaC(X, Y))).toBeLessThan(RT);
    }
  });

  it('Exercise 1.4.2 (complex): Ω = π^*𝓕 with 𝓕 = (i/2)·(area form of S²), i.e. (i/2) sin θ dθ∧dφ', () => {
    for (let k = 0; k < 300; k++) {
      const z = randomUnitQuat(rng);
      const X = randTangent(z);
      const Y = randTangent(z);
      const m = hopfMap(z);
      const area = m[0] * cross(hopfDifferential(z, X), hopfDifferential(z, Y))[0] +
        m[1] * cross(hopfDifferential(z, X), hopfDifferential(z, Y))[1] +
        m[2] * cross(hopfDifferential(z, X), hopfDifferential(z, Y))[2];
      expect(Math.abs(curvatureC(z, X, Y) - 0.5 * area)).toBeLessThan(RT);
    }
  });

  it('(1.4.5): ver[Xʰ, Yʰ] = −Ψ′(Ω(Xʰ, Yʰ)) for horizontal lifts of rotation fields', () => {
    // fields on R⁴ ∖ 0, homogeneous of degree 1 and tangent to the spheres
    const lift = (axis: Vec3) => (q: Vec4): Vec4 => {
      const n = Math.hypot(...q);
      const z = q.map((c) => c / n) as Vec4;
      return horizontalLiftVector(z, cross(axis, hopfMap(z))).map((c) => c * n) as Vec4;
    };
    const Xh = lift([1, 0, 0]);
    const Yh = lift([0, 1, 0]);
    // Lie bracket [X, Y] = DY·X − DX·Y with central-difference Jacobians, h = 1e-5:
    // truncation ~1e-10, roundoff ~1e-11 per entry; 1e-7 bounds the error.
    const h = 1e-5;
    const D = (F: (q: Vec4) => Vec4, q: Vec4, v: Vec4): Vec4 => {
      const p = F(q.map((c, i) => c + h * v[i]) as Vec4);
      const m = F(q.map((c, i) => c - h * v[i]) as Vec4);
      return p.map((c, i) => (c - m[i]) / (2 * h)) as Vec4;
    };
    for (let k = 0; k < 100; k++) {
      const z = randomUnitQuat(rng);
      const X = Xh(z);
      const Y = Yh(z);
      const a = D(Yh, z, X);
      const b = D(Xh, z, Y);
      const br = a.map((c, i) => c - b[i]);
      // ver part of the bracket, measured by ω_c (Ψ′_z(i·c) = c·iz)
      expect(Math.abs(omegaC(z, br) - -curvatureC(z, X, Y))).toBeLessThan(1e-7);
    }
  });

  it('Prop. 1.7.2 construction agrees with an independent RK4 horizontal lift on S³', () => {
    const th = 1.1;
    const gamma = (t: number): Vec3 => fromPolar(th + 0.4 * Math.sin(2 * Math.PI * t), 2 * Math.PI * t);
    const book = chart1Lift(omegaC, gamma, 0, 1, 800);
    const gDot = (t: number): Vec3 => {
      const e = 1e-6;
      const p = gamma(t + e);
      const m = gamma(t - e);
      return [(p[0] - m[0]) / (2 * e), (p[1] - m[1]) / (2 * e), (p[2] - m[2]) / (2 * e)];
    };
    const rk = horizontalLift(gDot, section1(gamma(0))!, 0, 1, 4000);
    const zEnd = rk.zs[rk.zs.length - 1];
    const bEnd = book.lift[book.lift.length - 1];
    // Simpson N = 800 (~1e-12) vs RK4 4000 steps with FD velocities (~1e-10)
    expect(Math.hypot(...zEnd.map((c, i) => c - bEnd[i]))).toBeLessThan(1e-8);
  });

  it('a horizontal lift around a coordinate rectangle misses by −∫∫𝓕 (Stokes), for three connections', () => {
    const pu = omegaPU(-0.6, 0.2);
    const conns = [
      ['c', omegaC],
      ['pu', pu],
      ['flat', chartFlat1],
    ] as const;
    for (let k = 0; k < 20; k++) {
      const th = 0.2 + 2.3 * rng();
      const ph = 6.28 * rng();
      const eps = 0.05 + 0.5 * rng();
      for (const [kind, om] of conns) {
        const gap = holonomyAngle(om, rectangleLoop(th, ph, eps), 400);
        const stokes = -eps * (chartCoefficient(kind, th + eps) - chartCoefficient(kind, th));
        // Simpson panels align with the corners; error ~1e-10 for these smooth edges
        expect(Math.abs(gap - stokes)).toBeLessThan(1e-8);
      }
    }
  });

  it('curvature is holonomy per unit area: gap/ε² → −𝓕_θφ = −½ sin θ0 as ε → 0', () => {
    for (const th of [0.4, 1.2, 2.3]) {
      const eps = 1e-3;
      const gap = holonomyAngle(omegaC, rectangleLoop(th, 0.7, eps), 400);
      // exact gap = −(ε/2)(cos θ0 − cos(θ0+ε)) = −(ε²/2)(sin θ0 + O(ε)): relative O(ε) = 1e-3
      expect(Math.abs(gap / (eps * eps) + 0.5 * Math.sin(th))).toBeLessThan(2e-3);
    }
  });

  it('the flat chart connection is integrable: its horizontal lifts stay on a level set of κ1', () => {
    for (let k = 0; k < 20; k++) {
      const loop = rectangleLoop(0.3 + 2 * rng(), 6.28 * rng(), 0.6);
      const l = chart1Lift(chartFlat1, loop, 0, 1, 200, 0.4);
      for (const z of l.lift) expect(Math.abs(Math.atan2(z[1], z[0]) - 0.4)).toBeLessThan(1e-12);
    }
  });
});
