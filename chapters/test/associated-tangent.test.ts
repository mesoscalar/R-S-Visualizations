import { describe, expect, it } from 'vitest';
import {
  actSO2,
  fromPolar,
  mulberry32,
  sampleLoop,
  sectionN,
  sectionS,
  transitionNS,
  windingNumber,
  type Vec3,
} from '@rsvis/math';
import { components, gradientField, iota, localComponents, rot2, type Vec2 } from '../src/math/associated-tangent';

// Linear algebra on O(1) vectors through the sections: roundoff ~1e-15,
// amplified ≲ 1/(1 ∓ z) by the stereographic sections; we sample |z| ≤ 0.95
// (factor ≤ 20), so 1e-13 keeps an order of headroom.
const RT = 1e-13;
const rng = mulberry32(1209);
const randMid = (): Vec3 => fromPolar(Math.acos(1.9 * rng() - 0.95), 2 * Math.PI * rng());
const d2 = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const d3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const randField = () => {
  const r = () => 2 * rng() - 1;
  const q12 = r();
  const q13 = r();
  const q23 = r();
  return gradientField([r(), r(), r()], [
    [r(), q12, q13],
    [q12, r(), q23],
    [q13, q23, r()],
  ]);
};

describe('Station 1.2b — TS² ≅ O⁺(S²) ×_{SO(2)} R² (§1.2)', () => {
  it('(1.2.3): ι_{f·b} ∘ b⁻¹ = ι_f — rotating the frame and counter-rotating the components fixes the vector', () => {
    for (let k = 0; k < 300; k++) {
      const x = randMid();
      const f = sectionN(x)!;
      const xi: Vec2 = [2 * rng() - 1, 2 * rng() - 1];
      const b = 2 * Math.PI * rng();
      expect(d3(iota(actSO2(f, b), rot2(-b, xi)), iota(f, xi))).toBeLessThan(RT);
    }
  });

  it('Rem. 1.2.9/2: ι_f is a linear iso onto T_xS² with inverse Φ̃ = components', () => {
    for (let k = 0; k < 300; k++) {
      const x = randMid();
      const f = actSO2(sectionS(x)!, 2 * Math.PI * rng());
      const xi: Vec2 = [2 * rng() - 1, 2 * rng() - 1];
      const v = iota(f, xi);
      expect(Math.abs(v[0] * x[0] + v[1] * x[1] + v[2] * x[2])).toBeLessThan(RT); // tangent
      expect(d2(components(f, v), xi)).toBeLessThan(RT);
    }
  });

  it('Prop. 1.2.6: Φ̃(f·b) = b⁻¹Φ̃(f) for a vector field', () => {
    const v = randField();
    for (let k = 0; k < 300; k++) {
      const x = randMid();
      const f = sectionN(x)!;
      const b = 2 * Math.PI * rng();
      expect(d2(components(actSO2(f, b), v(x)), rot2(-b, components(f, v(x))))).toBeLessThan(RT);
    }
  });

  it('(1.2.5): ξ_N = b(ρ_NS) ξ_S on the overlap', () => {
    const v = randField();
    for (let k = 0; k < 300; k++) {
      const x = randMid();
      const got = localComponents('N', v, x)!;
      const want = rot2(transitionNS(x)!, localComponents('S', v, x)!);
      expect(d2(got, want)).toBeLessThan(RT);
    }
  });

  it('every vector field has index sum 2: wind(ξ_N) − wind(ξ_S) on the equator = deg ρ_NS', () => {
    let used = 0;
    for (let k = 0; k < 40; k++) {
      const v = randField();
      const loop = (w: 'N' | 'S') => sampleLoop((t) => localComponents(w, v, [Math.cos(t), Math.sin(t), 0])!, 2000);
      const wN = windingNumber(loop('N'));
      const wS = windingNumber(loop('S'));
      // skip the (measure-zero, but possible for random data) fields with a zero near the equator
      if (wN.minRadius < 1e-3) continue;
      used++;
      expect(wN.n - wS.n).toBe(2);
    }
    expect(used).toBeGreaterThan(30);
    // and the classical example ∇z: zeros at both poles, each of index +1
    const gz = gradientField([0, 0, 1], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const small = (w: 'N' | 'S', th: number) =>
      windingNumber(sampleLoop((t) => localComponents(w, gz, fromPolar(th, t))!, 400)).n;
    expect(small('N', 0.05)).toBe(1); // around the north pole, chart N, positive orientation
    expect(-small('S', Math.PI - 0.05)).toBe(1); // around the south pole: φ runs negatively there
  });
});
