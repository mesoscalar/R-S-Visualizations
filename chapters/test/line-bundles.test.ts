import { describe, expect, it } from 'vitest';
import {
  actU1,
  cexpi,
  cmul,
  fromPolar,
  hopfMap,
  mulberry32,
  randomUnitQuat,
  sampleLoop,
  transition12,
  windingNumber,
  type Cx,
  type Vec3,
} from '@rsvis/math';
import { liftOf, linearForm, localRep, sectionLn, zeroCells } from '../src/math/line-bundles';

const rng = mulberry32(1206);
const randBase = (): Vec3 => hopfMap(randomUnitQuat(rng));
const cabs = (a: Cx) => Math.hypot(a[0], a[1]);
const cdist = (a: Cx, b: Cx) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Φ̃ values are products of ≤ 3 linear forms plus εB, all O(1–10): the
// identities below hold to roundoff ~1e-15·|Φ̃|; 1e-12 is a safe absolute bound.
const RT = 1e-12;

describe('Station F — sections of L_n are equivariant maps (§1.2)', () => {
  it('(1.2.9): Φ̃(z e^{iα}) = e^{−inα} Φ̃(z) for every n and perturbation', () => {
    for (const n of [-3, -2, -1, 0, 1, 2, 3]) {
      for (let k = 0; k < 40; k++) {
        const Phi = sectionLn(n, [randBase(), randBase(), randBase()], 3 * rng());
        const z = randomUnitQuat(rng);
        const a = 2 * Math.PI * rng();
        expect(cdist(Phi(actU1(z, a)), cmul(cexpi(-n * a), Phi(z)))).toBeLessThan(RT);
      }
    }
  });

  it('ℓ_r vanishes on the whole fibre over r and nowhere else: |ℓ_r(z)| = |π(z) − r|/2', () => {
    for (let k = 0; k < 50; k++) {
      const r = randBase();
      const l = linearForm(r);
      for (let j = 0; j < 8; j++) {
        // on the fibre over r
        expect(cabs(l(actU1(liftOf(r), 2 * Math.PI * rng())))).toBeLessThan(RT);
        // anywhere: |ℓ_r(z)|² = 1 − |⟨u, z⟩|² = (1 − ⟨π(z), r⟩)/2 = (chordal distance)²/4
        const z = randomUnitQuat(rng);
        const q = hopfMap(z);
        const d = Math.hypot(q[0] - r[0], q[1] - r[1], q[2] - r[2]);
        expect(Math.abs(cabs(l(z)) - d / 2)).toBeLessThan(RT);
      }
    }
  });

  it('Rem. 1.2.15: φ1 = ρ12ⁿ φ2 on U1 ∩ U2', () => {
    for (const n of [-3, -1, 0, 2, 3]) {
      const Phi = sectionLn(n, [randBase(), randBase(), randBase()], 1.5);
      for (let k = 0; k < 50; k++) {
        const m = fromPolar(0.1 + (Math.PI - 0.2) * rng(), 2 * Math.PI * rng());
        const rho = transition12(m)!;
        let rhoN: Cx = [1, 0];
        for (let j = 0; j < Math.abs(n); j++) rhoN = cmul(rhoN, n > 0 ? rho : [rho[0], -rho[1]]);
        expect(cdist(localRep(Phi, 1, m)!, cmul(rhoN, localRep(Phi, 2, m)!))).toBeLessThan(1e-11);
      }
    }
  });

  it('Ex. 1.2.4/3: a product of sections of L_m and L_n is a section of L_{m+n}', () => {
    for (const [m, n] of [[-1, -2], [2, -1], [1, 1], [-3, 3]] as const) {
      const A = sectionLn(m, [randBase(), randBase(), randBase()], 0.7);
      const B = sectionLn(n, [randBase(), randBase(), randBase()], 0.4);
      for (let k = 0; k < 20; k++) {
        const z = randomUnitQuat(rng);
        const a = 2 * Math.PI * rng();
        const lhs = cmul(A(actU1(z, a)), B(actU1(z, a)));
        expect(cdist(lhs, cmul(cexpi(-(m + n) * a), cmul(A(z), B(z))))).toBeLessThan(RT);
      }
    }
  });

  it('unperturbed: the zeros are exactly the chosen points, each of index −sign(n)', () => {
    for (const n of [-2, -1, 1, 2]) {
      const roots: Vec3[] = [fromPolar(0.7, 0.3), fromPolar(2.1, 2.2)];
      const cells = zeroCells(sectionLn(n, roots, 0), 60, 120);
      expect(cells.length).toBe(Math.abs(n));
      for (const c of cells) {
        expect(c.index).toBe(-Math.sign(n));
        const p = fromPolar(c.theta, c.phi);
        // cell half-diagonal on a 60×120 grid ≈ 0.037 rad
        expect(Math.min(...roots.slice(0, Math.abs(n)).map((r) => Math.hypot(p[0] - r[0], p[1] - r[1], p[2] - r[2])))).toBeLessThan(0.04);
      }
    }
  });

  it('the signed zero count is −n for every perturbation (it is the degree of ρ12ⁿ)', () => {
    for (const n of [-3, -2, -1, 0, 1, 2, 3]) {
      for (let k = 0; k < 8; k++) {
        const Phi = sectionLn(n, [randBase(), randBase(), randBase()], 4 * rng());
        const total = zeroCells(Phi, 60, 120).reduce((s, c) => s + c.index, 0);
        expect(total).toBe(-n + 0);
        // independent check by the argument principle on the equator: the north
        // cap has wind(φ1), the south cap −wind(φ2); a zero on the equator itself
        // has probability 0 for random data, and windingNumber reports minRadius.
        const w1 = windingNumber(sampleLoop((t) => localRep(Phi, 1, fromPolar(Math.PI / 2, t))!, 2000));
        const w2 = windingNumber(sampleLoop((t) => localRep(Phi, 2, fromPolar(Math.PI / 2, t))!, 2000));
        expect(w1.minRadius).toBeGreaterThan(1e-6);
        expect(w1.n - w2.n).toBe(-n + 0);
      }
    }
  });

  it('n = 0, ε > 2: Φ̃ = 1 + ε z̄1z2 has a ± pair of zeros — a trivial bundle can still have zeros', () => {
    const cells = zeroCells(sectionLn(0, [], 3), 60, 120);
    expect(cells.length).toBe(2);
    expect(cells.map((c) => c.index).sort()).toEqual([-1, 1]);
    expect(zeroCells(sectionLn(0, [], 1.5), 60, 120).length).toBe(0); // ε < 2: nowhere zero
  });
});
