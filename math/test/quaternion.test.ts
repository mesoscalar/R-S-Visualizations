import { describe, expect, it } from 'vitest';
import {
  qexp,
  qfromAxisAngle,
  qlog,
  qmul,
  qnorm,
  qpowInt,
  qrotate,
  type Quat,
} from '../src/quaternion';
import { mulberry32, randomUnitQuat } from '../src/rng';

const rng = mulberry32(20260612);

describe('quaternion algebra', () => {
  it('satisfies i*j = k, j*k = i, k*i = j, i^2 = -1', () => {
    const i: Quat = [0, 1, 0, 0];
    const j: Quat = [0, 0, 1, 0];
    const k: Quat = [0, 0, 0, 1];
    expect(qmul(i, j)).toEqual([0, 0, 0, 1]);
    expect(qmul(j, k)).toEqual([0, 1, 0, 0]);
    expect(qmul(k, i)).toEqual([0, 0, 1, 0]);
    expect(qmul(i, i)).toEqual([-1, 0, 0, 0]);
  });

  it('is multiplicative on norms and associative (100 random triples, 1e-12)', () => {
    // Products of unit-scale entries: float error per multiply ~ few ulp, so 1e-12 is generous.
    for (let trial = 0; trial < 100; trial++) {
      const a = randomUnitQuat(rng);
      const b = randomUnitQuat(rng);
      const c = randomUnitQuat(rng);
      expect(Math.abs(qnorm(qmul(a, b)) - qnorm(a) * qnorm(b))).toBeLessThan(1e-12);
      const lhs = qmul(qmul(a, b), c);
      const rhs = qmul(a, qmul(b, c));
      for (let m = 0; m < 4; m++) expect(Math.abs(lhs[m] - rhs[m])).toBeLessThan(1e-12);
    }
  });

  it('computes integer powers consistently with repeated multiplication', () => {
    const q = randomUnitQuat(rng);
    let acc: Quat = [...q];
    for (let n = 2; n <= 6; n++) {
      acc = qmul(acc, q);
      const p = qpowInt(q, n);
      for (let m = 0; m < 4; m++) expect(Math.abs(p[m] - acc[m])).toBeLessThan(1e-12);
    }
    const inv = qpowInt(q, -1);
    const idn = qmul(q, inv);
    expect(Math.abs(idn[0] - 1)).toBeLessThan(1e-12);
  });

  it('exp/log are mutually inverse near the identity (1e-12)', () => {
    for (let trial = 0; trial < 20; trial++) {
      const v: Quat = [0, rng() - 0.5, rng() - 0.5, rng() - 0.5];
      const q = qexp(v);
      expect(Math.abs(qnorm(q) - 1)).toBeLessThan(1e-12); // pure-imaginary exp lands on S^3
      const w = qlog(q);
      for (let m = 0; m < 4; m++) expect(Math.abs(w[m] - v[m])).toBeLessThan(1e-12);
    }
  });

  it('rotates vectors: axis-angle pi/2 about z maps x to y (1e-15)', () => {
    const q = qfromAxisAngle([0, 0, 1], Math.PI / 2);
    const v = qrotate(q, [1, 0, 0]);
    expect(Math.abs(v[0])).toBeLessThan(1e-15);
    expect(Math.abs(v[1] - 1)).toBeLessThan(1e-15);
    expect(Math.abs(v[2])).toBeLessThan(1e-15);
  });
});
