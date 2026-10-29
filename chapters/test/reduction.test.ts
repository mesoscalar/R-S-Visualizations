import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@rsvis/math';
import {
  I2,
  add,
  connection,
  det,
  gram,
  holonomy,
  inv,
  metric,
  metricDeriv,
  mul,
  rot,
  scale,
  toQ,
  tr,
  transport,
  type M2,
  type MetricParams,
} from '../src/math/reduction';

const rng = mulberry32(1606);
const r = () => 2 * rng() - 1;
const randGL = (): M2 => {
  for (;;) {
    const x: M2 = [r(), r(), r(), r()];
    if (Math.abs(det(x)) > 0.2) return x;
  }
};
const randParams = (): MetricParams => ({ twist: Math.floor(4 * rng()) - 1, delta: 0.8 * rng(), wobble: 0.5 * r() });
const dist = (x: M2, y: M2) => Math.max(...x.map((v, i) => Math.abs(v - y[i])));
// pure 2×2 algebra on O(1) entries (conditioning ≤ 25 from |det| > 0.2): roundoff ≲ 100 ε
const ALG = 1e-12;

describe('Station 1.6a — a fibre metric as a reduction to O(2) (§1.6)', () => {
  it('Prop. 1.6.2: Φ̃(e) = eᵀhe is equivariant, Φ̃(e·a) = aᵀΦ̃(e)a', () => {
    for (let k = 0; k < 200; k++) {
      const h = metric(6.28 * rng(), randParams());
      const e = randGL();
      const a = randGL();
      expect(dist(gram(h, mul(e, a)), mul(mul(tr(a), gram(h, e)), a))).toBeLessThan(ALG);
    }
  });

  it('Q = Φ̃⁻¹(1) meets every fibre, the polar retraction lands in Q, and is O(2)-equivariant', () => {
    for (let k = 0; k < 200; k++) {
      const h = metric(6.28 * rng(), randParams());
      const e = randGL();
      const q = toQ(h, e);
      expect(dist(gram(h, q), I2)).toBeLessThan(ALG);
      const o = rng() < 0.5 ? rot(6.28 * rng()) : mul(rot(6.28 * rng()), [1, 0, 0, -1]);
      expect(dist(toQ(h, mul(e, o)), mul(q, o))).toBeLessThan(ALG);
    }
  });

  it('Q is an O(2)-bundle: two h-orthonormal frames at one point differ by an element of O(2)', () => {
    for (let k = 0; k < 200; k++) {
      const h = metric(6.28 * rng(), randParams());
      const q1 = toQ(h, randGL());
      const q2 = toQ(h, randGL());
      const a = mul(inv(q1), q2);
      expect(dist(mul(tr(a), a), I2)).toBeLessThan(ALG);
    }
  });

  it('metricDeriv is h′ (central difference, step 1e-5: truncation ~1e-10, roundoff ~1e-11)', () => {
    for (let k = 0; k < 50; k++) {
      const p = randParams();
      const s = 6.28 * rng();
      const fd = scale(1 / 2e-5, add(metric(s + 1e-5, p), scale(-1, metric(s - 1e-5, p))));
      expect(dist(metricDeriv(s, p), fd)).toBeLessThan(1e-8);
    }
  });

  it('(1.6.7): the h-connection satisfies h′ = Aᵀh + hA pointwise; the euclidean one does not', () => {
    let worst = 0;
    for (let k = 0; k < 200; k++) {
      const p = randParams();
      const s = 6.28 * rng();
      const kappa = 2 * r();
      const h = metric(s, p);
      const A = connection('h', s, p, kappa);
      expect(dist(add(mul(tr(A), h), mul(h, A)), metricDeriv(s, p))).toBeLessThan(ALG * 10);
      const B = connection('euclid', s, p, kappa);
      worst = Math.max(worst, dist(add(mul(tr(B), h), mul(h, B)), metricDeriv(s, p)));
    }
    expect(worst).toBeGreaterThan(0.1);
  });

  it('Prop. 1.6.10: Φ̃ is parallel for the compatible connection — transport keeps Q in Q around the whole loop', () => {
    for (let k = 0; k < 20; k++) {
      const p = randParams();
      const kappa = 2 * r();
      const q0 = toQ(metric(0, p), randGL());
      const { ss, frames } = transport('h', p, kappa, q0, 2 * Math.PI, 2000);
      // RK4, 2000 steps of 3.1e-3 on |A| ≲ 10: global error ~ (|A|h)⁴·|A|·2π ≈ 6e-8 worst case; measured ≤ 9e-10 over 200 random (h, κ)
      for (let i = 0; i < ss.length; i += 100) expect(dist(gram(metric(ss[i], p), frames[i]), I2)).toBeLessThan(1e-7);
    }
  });

  it('the euclidean connection is not compatible with an anisotropic h: transported frames leave Q', () => {
    const p: MetricParams = { twist: 1, delta: 0.5, wobble: 0.2 };
    const { ss, frames } = transport('euclid', p, 0.3, toQ(metric(0, p), I2), 2 * Math.PI, 2000);
    const drift = Math.max(...ss.map((s, i) => dist(gram(metric(s, p), frames[i]), I2)));
    expect(drift).toBeGreaterThan(0.5);
  });

  it('Def. 1.6.9: the holonomy of the compatible connection lies in SO(h(0)) — the connection reduces', () => {
    for (let k = 0; k < 20; k++) {
      const p = randParams();
      const hol = holonomy('h', p, 2 * r());
      const h0 = metric(0, p);
      // same RK4 budget as above; measured ≤ 2.1e-9 over 200 random (h, κ)
      expect(dist(mul(mul(tr(hol), h0), hol), h0)).toBeLessThan(1e-7);
      expect(Math.abs(det(hol) - 1)).toBeLessThan(1e-7);
    }
  });
});
