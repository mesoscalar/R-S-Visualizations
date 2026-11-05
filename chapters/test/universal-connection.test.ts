import { describe, expect, it } from 'vitest';
import { mulberry32, omegaC } from '@rsvis/math';
import { omegaPU } from '../src/math/affine-connections';
import { localMap, minWeight, omegaCanonical, potential, universalMap } from '../src/math/universal-connection';
import type { U1Connection } from '../src/math/transport';

const rng = mulberry32(3801);
const CONNS: [string, U1Connection][] = [
  ['ω_c', omegaC],
  ['ω_PU', omegaPU(-0.6, 0.2)],
];
const LAMBDA = 12;
const randS3 = () => {
  const v = [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const n = Math.hypot(...v);
  return v.map((c) => c / n);
};
const randTangent = (p: number[]) => {
  const v = [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const d = v.reduce((s, x, i) => s + x * p[i], 0);
  return v.map((x, i) => x - d * p[i]);
};

describe('Station 3.8a — universal connections (§3.8)', () => {
  it('λ = 12 is admissible: every weight r² stays positive on both chart regions', () => {
    for (const [, w] of CONNS) expect(minWeight(w, LAMBDA)).toBeGreaterThan(0.05);
  });

  it('Lemma 3.8.2 (k = 1): Σ|fⱼ|² = 1 and Σ f̄ⱼ dfⱼ = 𝒜 on each chart', () => {
    for (const [, w] of CONNS)
      for (const c of [1, 2] as const)
        for (let k = 0; k < 30; k++) {
          const [u, v] = [1.6 * (rng() - 0.5), 1.6 * (rng() - 0.5)];
          const f = localMap(w, c, u, v, LAMBDA);
          expect(Math.abs(f.reduce((s, x) => s + x * x, 0) - 1)).toBeLessThan(1e-13);
          const h = 1e-6;
          for (const [du, dv, idx] of [
            [h, 0, 0],
            [0, h, 1],
          ] as const) {
            const fp = localMap(w, c, u + du, v + dv, LAMBDA);
            const fm = localMap(w, c, u - du, v - dv, LAMBDA);
            const df = fp.map((x, i) => (x - fm[i]) / (2 * h));
            // the identity is algebraically exact; the outer central difference (h = 1e-6, truncation ~h²λ³ ≈ 2e-9)
            // dominates — measured ≤ 5.7e-11 over 200 points (the worst-case roundoff bound is not attained)
            expect(Math.abs(omegaCanonical(f, df) - potential(w, c, u, v)[idx])).toBeLessThan(1e-8);
          }
        }
  });

  it('Thm. 3.8.4: ϑ lands in S¹⁵ ⊂ C⁸ and is U(1)-equivariant, ϑ(p·e^{iα}) = ϑ(p)·e^{iα}', () => {
    for (const [, w] of CONNS) {
      const th = universalMap(w, LAMBDA);
      for (let k = 0; k < 50; k++) {
        const p = randS3();
        const t = th(p);
        expect(Math.abs(t.reduce((s, x) => s + x * x, 0) - 1)).toBeLessThan(1e-12);
        const a = 2 * Math.PI * rng();
        const [c, s] = [Math.cos(a), Math.sin(a)];
        const pa = [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2] * c - p[3] * s, p[2] * s + p[3] * c];
        const ta = th(pa);
        // the potential is a central difference with h = 1e-6, so roundoff in π(p) (~1e-16) reaches r² as
        // ~1e-16/h/(2λ) ≈ 4e-12, and the components shift by about that much; measured ≤ 4.1e-12
        for (let j = 0; j < 16; j += 2) {
          expect(Math.abs(ta[j] - (t[j] * c - t[j + 1] * s))).toBeLessThan(5e-11);
          expect(Math.abs(ta[j + 1] - (t[j] * s + t[j + 1] * c))).toBeLessThan(5e-11);
        }
      }
    }
  });

  it('Thm. 3.8.4: ϑ*(u†du) = ω on every tangent vector of S³, for ω_c and for the glued ω_PU', () => {
    for (const [, w] of CONNS) {
      const th = universalMap(w, LAMBDA);
      let worst = 0;
      for (let k = 0; k < 100; k++) {
        const p = randS3();
        const X = randTangent(p);
        const h = 1e-6;
        const curve = (t: number) => {
          const q = p.map((x, i) => x + t * X[i]);
          const n = Math.hypot(...q);
          return q.map((x) => x / n);
        };
        const tp = th(curve(h));
        const tm = th(curve(-h));
        const dth = tp.map((x, i) => (x - tm[i]) / (2 * h));
        worst = Math.max(worst, Math.abs(omegaCanonical(th(p), dth) - w(p, X)));
      }
      // central difference of ϑ (h = 1e-6): truncation ~h²λ³ ≈ 2e-9; measured ≤ 1.4e-10 over 400 random (p, X)
      expect(worst).toBeLessThan(1e-7);
    }
  });
});
