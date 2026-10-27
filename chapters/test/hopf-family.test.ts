import { describe, expect, it } from 'vitest';
import { degreeQuadrature, mulberry32, qmul, randomUnitQuat, type Quat } from '@rsvis/math';
import {
  cochainExponent,
  cochainTransition,
  liftEndpoint,
  quatAct,
  quatKappa,
  quatTransition,
  realHopf,
  realKappa,
  realTransition,
  slice,
  type QPair,
} from '../src/math/hopf-family';

// Quaternion products of O(1) unit quaternions: roundoff ~1e-15; 1e-13 bound.
const RT = 1e-13;
const rng = mulberry32(1122);
const dq = (a: Quat, b: Quat) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
const randS7 = (): QPair => {
  const a = randomUnitQuat(rng);
  const b = randomUnitQuat(rng);
  const t = rng();
  const c = Math.sqrt(t);
  const s = Math.sqrt(1 - t);
  return [
    [c * a[0], c * a[1], c * a[2], c * a[3]],
    [s * b[0], s * b[1], s * b[2], s * b[3]],
  ];
};

describe('Station 1.1d — the Hopf family and the universal covering (§1.1)', () => {
  it('K = R: S¹ → RP¹ is 2:1 with fibres {±x}; ρ12 = sign(x1x2) is +1 on one arc, −1 on the other', () => {
    for (let k = 0; k < 100; k++) {
      const s = 2 * Math.PI * rng();
      const x: [number, number] = [Math.cos(s), Math.sin(s)];
      const m = realHopf(x);
      const mm = realHopf([-x[0], -x[1]]);
      expect(Math.hypot(m[0] - mm[0], m[1] - mm[1])).toBe(0); // O(1) acts within fibres
      expect(realKappa(1, [-x[0], -x[1]])).toBe(-realKappa(1, x)!); // κ(x·(−1)) = κ(x)·(−1)
      // the base angle is 2s; on the upper arc (0, π) of RP¹ ≅ S¹ the transition is +1
      const baseAngle = Math.atan2(m[1], m[0]);
      expect(realTransition(x)).toBe(baseAngle > 0 ? 1 : -1);
    }
    // Čech class with this 2-set cover: ρ(upper arc)·ρ(lower arc), invariant under constant
    // 0-cochains ε_i ∈ {±1} (U_i connected): ε1ρε2 multiplies both arcs by ε1ε2.
    const up = realTransition([Math.cos(0.4), Math.sin(0.4)])!;
    const down = realTransition([Math.cos(-0.4), Math.sin(-0.4)])!;
    for (const e1 of [1, -1])
      for (const e2 of [1, -1]) expect(e1 * up * e2 * (e1 * down * e2)).toBe(-1); // ≠ +1: nontrivial
  });

  it('K = H: κ_i(q·u) = κ_i(q)u, and ρ12 = κ1κ2⁻¹ is constant on fibres', () => {
    for (let k = 0; k < 300; k++) {
      const q = randS7();
      const u = randomUnitQuat(rng);
      const qu = quatAct(q, u);
      expect(dq(quatKappa(1, qu)!, qmul(quatKappa(1, q)!, u))).toBeLessThan(RT);
      expect(dq(quatKappa(2, qu)!, qmul(quatKappa(2, q)!, u))).toBeLessThan(RT);
      expect(dq(quatTransition(qu)!, quatTransition(q)!)).toBeLessThan(RT);
    }
  });

  it('K = H: the slice σ(w) meets each equatorial fibre once and there ρ12 = w', () => {
    for (let k = 0; k < 300; k++) {
      const w = randomUnitQuat(rng);
      expect(dq(quatTransition(slice(w))!, w)).toBeLessThan(RT);
      // any point (a, b) with |a| = |b| = 1/√2 is σ(w)·u for exactly one u: u = √2·b, w = a b⁻¹·…
      const a = randomUnitQuat(rng).map((c) => c * Math.SQRT1_2) as Quat;
      const b = randomUnitQuat(rng).map((c) => c * Math.SQRT1_2) as Quat;
      const u = b.map((c) => c * Math.SQRT2) as Quat;
      const ww = quatTransition([a, b])!;
      const back = quatAct(slice(ww), u);
      expect(dq(back[0], a) + dq(back[1], b)).toBeLessThan(RT);
    }
  });

  it('Rem. 1.1.23/1: the transition has degree 1 on S³, under any 0-cochain (1.1.7)', () => {
    // Product Gauss–Legendre quadrature of det Df (shared degree kernel), spectral for
    // smooth maps. Measured |deg − 1| for the four maps below at grids 12·12·24 /
    // 16·16·32 / 32·32·64: worst case (amplitude 1.5) 1.0e-1 / 1.1e-2 / 4.4e-8 —
    // geometric convergence. At the default 32·32·64 grid, 1e-4 sits three orders
    // above the measured error and far below the 0.5 that separates integers.
    expect(Math.abs(degreeQuadrature((w) => quatTransition(slice(w))!) - 1)).toBeLessThan(1e-4);
    for (const [c1, c2, ph] of [
      [0.5, -0.3, 0.2],
      [1.2, 0.8, 1.7],
      [-1.5, 1.5, 3.0],
    ]) {
      const f = cochainTransition(cochainExponent(c1, ph), cochainExponent(c2, -ph));
      expect(Math.abs(degreeQuadrature(f) - 1)).toBeLessThan(1e-4);
    }
  });

  it('Ex. 1.1.26: lifting a loop of winding n to R moves the endpoint by the deck transformation 2πn', () => {
    for (const n of [-3, -1, 0, 1, 2, 4]) {
      const wobble = 0.6 * rng();
      const c = (s: number): [number, number] => {
        const a = n * s + wobble * Math.sin(3 * s);
        return [Math.cos(a), Math.sin(a)];
      };
      const t0 = 10 * rng();
      // each step's increment is exact (atan2 of a small rotation), so the sum is exact to roundoff
      expect(Math.abs(liftEndpoint(c, t0) - (t0 + 2 * Math.PI * n))).toBeLessThan(1e-11);
    }
  });
});
