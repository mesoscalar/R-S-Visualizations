import { describe, expect, it } from 'vitest';
import { VOLUMES, chernDensities, eulerDensity, p1Density } from '../src/math/char-numbers';
import { constantCurvature, fubiniStudy, product, transform } from '../src/math/self-duality';

const FLIP = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? (i === 3 ? -1 : 1) : 0)));
// finite sums of O(1) products times volumes ~100: roundoff ≲ 1e-12
const ALG = 1e-10;

describe('Station 4.7a — characteristic numbers from curvature (§§4.6–4.7)', () => {
  it('Thm. 4.6.14 (Euler class as the Pfaffian): χ(S⁴) = 2, χ(S² × S²) = 4, χ(CP²) = 3', () => {
    expect(Math.abs(eulerDensity(constantCurvature(1)) * VOLUMES.S4 - 2)).toBeLessThan(ALG);
    expect(Math.abs(eulerDensity(product(1, 1)) * VOLUMES.S2S2 - 4)).toBeLessThan(ALG);
    expect(Math.abs(eulerDensity(fubiniStudy()) * VOLUMES.CP2 - 3)).toBeLessThan(ALG);
  });

  it('Thm. 4.6.11 for TCP²: c₂ = 3 = χ and c₁² = 9; for S² × S²: c₂ = 4, c₁² = 8', () => {
    const cp = chernDensities(fubiniStudy());
    expect(Math.abs(cp.c2 * VOLUMES.CP2 - 3)).toBeLessThan(ALG);
    expect(Math.abs(cp.c1sq * VOLUMES.CP2 - 9)).toBeLessThan(ALG);
    const ss = chernDensities(product(1, 1));
    expect(Math.abs(ss.c2 * VOLUMES.S2S2 - 4)).toBeLessThan(ALG);
    expect(Math.abs(ss.c1sq * VOLUMES.S2S2 - 8)).toBeLessThan(ALG);
  });

  it('p₁ = c₁² − 2c₂ for the Kähler examples, and the L-genus gives the signature τ = p₁/3: 1 for CP², 0 for S⁴ and S² × S²', () => {
    const cp = chernDensities(fubiniStudy());
    expect(Math.abs(p1Density(fubiniStudy()) - (cp.c1sq - 2 * cp.c2))).toBeLessThan(ALG);
    expect(Math.abs((p1Density(fubiniStudy()) * VOLUMES.CP2) / 3 - 1)).toBeLessThan(ALG);
    expect(Math.abs(p1Density(constantCurvature(1)))).toBeLessThan(ALG);
    expect(Math.abs(p1Density(product(1, 1)))).toBeLessThan(ALG);
  });

  it('reversing the orientation of CP² flips p₁ and τ but not χ', () => {
    const R = transform(fubiniStudy(), FLIP);
    expect(Math.abs((p1Density(R) * VOLUMES.CP2) / 3 + 1)).toBeLessThan(ALG);
    expect(Math.abs(eulerDensity(R) * VOLUMES.CP2 - 3)).toBeLessThan(ALG);
  });
});
