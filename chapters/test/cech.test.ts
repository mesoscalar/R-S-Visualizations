import { describe, expect, it } from 'vitest';
import {
  actU1,
  cexpi,
  cmul,
  cconj,
  fromPolar,
  kappa1,
  kappa2,
  mulberry32,
  sampleLoop,
  section1,
  section2,
  transition12,
  windingNumber,
} from '@rsvis/math';
import {
  lambda1,
  lambda2,
  sectionCrossings,
  sectionHeight1,
  sectionHeight2,
  signedCount,
  torusPoint,
  transitionPhase,
} from '../src/math/cech';

// On the equator t = 0, so the sections are perfectly conditioned: every
// identity below is a few flops on O(1) numbers and holds to roundoff (~1e-15);
// 1e-13 leaves two orders of headroom.
const RT = 1e-13;
const rng = mulberry32(1110);
const rand = (a: number) => a * (2 * rng() - 1);
const dist4 = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
const cdist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const eq = (phi: number) => fromPolar(Math.PI / 2, phi);

describe('Station 1.1b — transition maps and Čech classes (§1.1)', () => {
  it('Hopf (n = 1) with trivial cochains: arg ρ12 = −φ, as computed from κ1κ2⁻¹ on S³', () => {
    for (let k = 0; k < 100; k++) {
      const phi = 2 * Math.PI * rng();
      const rho = transition12(eq(phi))!;
      expect(cdist(rho, cexpi(transitionPhase(1, () => 0, () => 0)(phi)))).toBeLessThan(RT);
    }
  });

  it('re-trivializing by ρ_i = e^{iλ_i} gives ρ′12 = ρ1 ρ12 ρ2⁻¹  (1.1.7)', () => {
    for (let k = 0; k < 100; k++) {
      const l1 = lambda1(rand(4), rand(4));
      const l2 = lambda2(rand(4), rand(4));
      const phi = 2 * Math.PI * rng();
      const p = actU1(section1(eq(phi))!, 2 * Math.PI * rng()); // any point of the fibre
      const k1p = cmul(cexpi(l1(phi)), kappa1(p)!); // κ′1 = ρ1 κ1
      const k2p = cmul(cexpi(l2(phi)), kappa2(p)!); // κ′2 = ρ2 κ2
      const rhoP = cmul(k1p, cconj(k2p));
      expect(cdist(rhoP, cexpi(transitionPhase(1, l1, l2)(phi)))).toBeLessThan(RT);
    }
  });

  it('the section curves drawn on the torus are the re-trivialized sections s′_i = s_i ρ_i⁻¹', () => {
    for (let k = 0; k < 100; k++) {
      const l1 = lambda1(rand(4), rand(4));
      const l2 = lambda2(rand(4), rand(4));
      const phi = 2 * Math.PI * rng();
      const s1p = actU1(section1(eq(phi))!, -l1(phi));
      const s2p = actU1(section2(eq(phi))!, -l2(phi));
      expect(dist4(torusPoint(phi, sectionHeight1(l1)(phi)), s1p)).toBeLessThan(RT);
      expect(dist4(torusPoint(phi, sectionHeight2(1, l2)(phi)), s2p)).toBeLessThan(RT);
      // and they really are sections of the new charts: κ′_i(s′_i) = 1
      expect(cdist(cmul(cexpi(l1(phi)), kappa1(s1p)!), [1, 0])).toBeLessThan(RT);
      expect(cdist(cmul(cexpi(l2(phi)), kappa2(s2p)!), [1, 0])).toBeLessThan(RT);
    }
  });

  it('Thm. 1.1.11: the signed crossing count of the two section curves is −n for every cochain', () => {
    for (const n of [-2, -1, 0, 1, 2, 3]) {
      for (let k = 0; k < 30; k++) {
        // amplitudes up to 4 > π force extra crossings that must cancel in pairs
        const l1 = lambda1(rand(4), rand(4));
        const l2 = lambda2(rand(4), rand(4));
        const D = transitionPhase(n, l1, l2);
        const cs = sectionCrossings(D);
        expect(signedCount(cs)).toBe(-n + 0); // +0 normalises IEEE −0 for n = 0
        // independent check: winding number of ρ′12 sampled along increasing φ
        const w = windingNumber(sampleLoop((phi) => cexpi(D(phi)), 2000));
        expect(w.n).toBe(-n + 0);
      }
    }
  });

  it('for the Hopf bundle the crossings are honest coincidences s′1(φ*) = s′2(φ*) in S³', () => {
    let crossings = 0;
    for (let k = 0; k < 20; k++) {
      const l1 = lambda1(rand(4), rand(4));
      const l2 = lambda2(rand(4), rand(4));
      for (const c of sectionCrossings(transitionPhase(1, l1, l2))) {
        crossings++;
        const s1p = actU1(section1(eq(c.phi))!, -l1(c.phi));
        const s2p = actU1(section2(eq(c.phi))!, -l2(c.phi));
        // bisection pins φ* to ~1e-15; |d s′_i/dφ| ≤ 1 + 6·4, so the miss is ≤ ~3e-14
        expect(dist4(s1p, s2p)).toBeLessThan(1e-12);
      }
    }
    expect(crossings).toBeGreaterThan(20); // the families really do produce crossings
  });
});
