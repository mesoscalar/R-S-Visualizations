import { describe, expect, it } from 'vitest';
import { gaussLinking, hopfMap, mulberry32, type Vec3 } from '@rsvis/math';
import { boundaryLoop, endpointPhase, fibreCurve, fromW, liftLoop, loopAtNorth, preimagesOfPower, toW } from '../src/math/hopf-homotopy';

const rng = mulberry32(3201);
const d3 = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Linking number of the fibres over a and b, Richardson-extrapolated from N = 200 and 400. */
const lk = (a: Vec3, b: Vec3) => {
  const l2 = gaussLinking(fibreCurve(a, 200), fibreCurve(b, 200));
  const l4 = gaussLinking(fibreCurve(a, 400), fibreCurve(b, 400));
  return (4 * l4 - l2) / 3;
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const randBase = (): Vec3 => {
  // keep away from the south pole, whose fibre passes through the projection pole
  const z = -0.6 + 1.5 * rng();
  const a = 2 * Math.PI * rng();
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), s * Math.sin(a), z];
};

describe('Station 3.2a — the exact homotopy sequence of the Hopf fibration (§3.2)', () => {
  it('the sweep is a based 2-sphere: every loop starts and ends at N, ρ = 0 and π are constant', () => {
    for (const rho of [0, 0.3, 1.2, 2.5, Math.PI]) {
      const { gamma } = loopAtNorth(rho);
      expect(d3(gamma(0), [0, 0, 1])).toBeLessThan(1e-14);
      expect(d3(gamma(1), [0, 0, 1])).toBeLessThan(1e-14);
    }
    expect(d3(loopAtNorth(Math.PI).gamma(0.37), [0, 0, 1])).toBeLessThan(1e-14);
  });

  it('the horizontal lift covers the loop (π ∘ γ̃ = γ) and ends in the fibre over N', () => {
    for (let k = 0; k < 10; k++) {
      const rho = 0.2 + 2.7 * rng();
      const zs = liftLoop(rho, 400);
      const { gamma } = loopAtNorth(rho);
      // RK4 with 400 steps and renormalisation: drift ≲ 1e-9
      for (let i = 0; i <= 400; i += 50) expect(d3(hopfMap(zs[i]), gamma(i / 400))).toBeLessThan(1e-8);
      expect(d3(hopfMap(zs[400]), [0, 0, 1])).toBeLessThan(1e-8);
    }
  });

  it('the endpoint phase is −½·(area of the cap): α(ρ) = −π(1 − cos ρ) mod 2π', () => {
    for (let k = 0; k < 20; k++) {
      const rho = 0.05 + 3 * rng();
      // same RK4 budget; measured ≤ 1.4e-9 over 40 random ρ
      expect(Math.abs(wrap(endpointPhase(rho) + Math.PI * (1 - Math.cos(rho))))).toBeLessThan(1e-8);
    }
  });

  it('(3.2.7): ∂ of the sweep winds once around U(1) — the unwrapped phase runs from 0 to −2π', () => {
    const { alphas } = boundaryLoop(120, 400);
    expect(Math.abs(alphas[0])).toBeLessThan(1e-12);
    // the last loop is constant, so the end value is exact up to the unwrapping sum (measured 9e-16)
    expect(Math.abs(alphas[alphas.length - 1] + 2 * Math.PI)).toBeLessThan(1e-7);
  });

  it('Ex. 3.2.10: two Hopf fibres are linked once (Gauss integral)', () => {
    for (let k = 0; k < 10; k++) {
      const [p, q] = [randBase(), randBase()];
      if (d3(p, q) < 0.2) continue;
      // gaussLinking is O(N⁻²) (measured 2.0e-4 at N = 200, 5.1e-5 at 400); one Richardson step removes that term (measured ≤ 3.2e-8 over 20 random pairs)
      expect(Math.abs(Math.abs(lk(p, q)) - 1)).toBeLessThan(1e-6);
    }
  });

  it('for g∘h with g(w) = wⁿ, preimages of points are n fibres, linked n² times: Hopf invariant n²', () => {
    for (const n of [1, 2, 3]) {
      const [p, q] = [fromW([0.4, 0.3]), fromW([-0.5, 0.2])];
      const P = preimagesOfPower(p, n);
      const Q = preimagesOfPower(q, n);
      for (const m of P) {
        const w = toW(m);
        const r = Math.hypot(...w) ** n;
        const a = n * Math.atan2(w[1], w[0]);
        expect(d3(fromW([r * Math.cos(a), r * Math.sin(a)]), p)).toBeLessThan(1e-12);
      }
      let total = 0;
      for (const a of P) for (const b of Q) total += lk(a, b);
      expect(Math.abs(Math.abs(total) - n * n)).toBeLessThan(1e-6 * n * n);
    }
  });
});
