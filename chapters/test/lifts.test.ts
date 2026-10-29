import { describe, expect, it } from 'vitest';
import { actU1, fromPolar, hopfMap, mulberry32, omegaC, type Vec3 } from '@rsvis/math';
import { capArea, chart1Lift, circleLoop, figureEight, holonomyAngle } from '../src/math/transport';

const rng = mulberry32(1702);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const d4 = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
/** a cap centre and radius whose cap stays inside U1 (away from the south pole) */
const randCap = (): [Vec3, number] => {
  const thc = 1.6 * rng();
  const r = 0.1 + (Math.PI - thc - 0.3) * rng() * 0.9;
  return [fromPolar(thc, 6.28 * rng()), r];
};
// Simpson (N = 400) on smooth integrands: ~1e-11; FD velocities ~1e-10. 1e-8 bounds both.
const TOL = 1e-8;

describe('Station 1.7a — horizontal lifts the book’s way (§1.7)', () => {
  it('Prop. 1.7.2: γ̃·g is horizontal and projects onto γ', () => {
    const [c, r] = randCap();
    const gamma = circleLoop(c, r);
    const l = chart1Lift(omegaC, gamma, 0, 1, 400);
    for (let k = 1; k < l.lift.length - 1; k += 37) {
      const dt = l.ts[k + 1] - l.ts[k - 1];
      const v = [0, 1, 2, 3].map((i) => (l.lift[k + 1][i] - l.lift[k - 1][i]) / dt);
      // central difference over h = 1/400: O(h²)·|γ‴| ≲ 1e-4 relative to |γ′| ~ 10
      expect(Math.abs(omegaC(l.lift[k], v))).toBeLessThan(1e-3);
      const m = hopfMap(l.lift[k]);
      const g = gamma(l.ts[k]);
      expect(Math.hypot(m[0] - g[0], m[1] - g[1], m[2] - g[2])).toBeLessThan(1e-12);
    }
  });

  it('Lemma 1.7.3/1: the lift through p·a is the lift through p, times a', () => {
    for (let k = 0; k < 10; k++) {
      const [c, r] = randCap();
      const a = 6.28 * rng();
      const l0 = chart1Lift(omegaC, circleLoop(c, r), 0, 1, 400, 0);
      const la = chart1Lift(omegaC, circleLoop(c, r), 0, 1, 400, a);
      for (let j = 0; j < l0.lift.length; j += 50) expect(d4(la.lift[j], actU1(l0.lift[j], a))).toBeLessThan(TOL);
    }
  });

  it('Rem. 1.7.5: parallel transport does not depend on the parametrisation', () => {
    for (let k = 0; k < 10; k++) {
      const [c, r] = randCap();
      const h0 = holonomyAngle(omegaC, circleLoop(c, r, 0));
      const h1 = holonomyAngle(omegaC, circleLoop(c, r, 0.8), 2000); // strongly uneven speed: finer grid
      expect(Math.abs(wrap(h0 - h1))).toBeLessThan(1e-7);
    }
  });

  it('Lemma 1.7.3/2–3: lifts concatenate, and the reversed curve lifts back to the start', () => {
    const [c, r] = randCap();
    const g = circleLoop(c, r);
    const first = chart1Lift(omegaC, g, 0, 0.4, 400);
    const second = chart1Lift(omegaC, g, 0.4, 1, 400, first.alpha[first.alpha.length - 1]);
    const whole = chart1Lift(omegaC, g, 0, 1, 1000);
    expect(Math.abs(second.alpha[second.alpha.length - 1] - whole.alpha[whole.alpha.length - 1])).toBeLessThan(TOL);
    const back = chart1Lift(omegaC, (t) => g(1 - t), 0, 1, 400, whole.alpha[whole.alpha.length - 1]);
    expect(Math.abs(back.alpha[back.alpha.length - 1])).toBeLessThan(TOL);
  });

  it('holonomy of a cap boundary = −∫∫𝓕 = −½·(enclosed area), for any centre and radius in U1', () => {
    for (let k = 0; k < 30; k++) {
      const [c, r] = randCap();
      expect(Math.abs(wrap(holonomyAngle(omegaC, circleLoop(c, r)) + 0.5 * capArea(r)))).toBeLessThan(TOL);
    }
  });

  it('figure eights: holonomy = −½·(signed area); a symmetric one has none', () => {
    for (let k = 0; k < 20; k++) {
      const c = fromPolar(1.4 * rng(), 6.28 * rng());
      const r = 0.1 + 0.5 * rng();
      const asym = k === 0 ? 0 : 0.6 * rng() - 0.3;
      const want = -0.5 * (capArea(r) - capArea(r * (1 + asym)));
      // the two lobes meet at a corner (t = ½), which falls on a Simpson panel boundary
      expect(Math.abs(wrap(holonomyAngle(omegaC, figureEight(c, r, asym), 800) - want))).toBeLessThan(TOL);
    }
  });

  it('Def. 1.7.6: holonomy over caps of growing radius sweeps the whole of U(1)', () => {
    const angles: number[] = [];
    for (let k = 0; k <= 200; k++) angles.push(holonomyAngle(omegaC, circleLoop([0, 0, 1], (k / 200) * (Math.PI - 0.01))));
    // continuous, monotone from 0 down to ≈ −2π: every phase is attained
    for (let k = 1; k < angles.length; k++) expect(angles[k]).toBeLessThan(angles[k - 1]);
    expect(angles[0]).toBeCloseTo(0, 10);
    expect(angles[angles.length - 1]).toBeLessThan(-2 * Math.PI + 1e-3);
  });
});
