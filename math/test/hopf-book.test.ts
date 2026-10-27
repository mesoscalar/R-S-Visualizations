import { describe, expect, it } from 'vitest';
import {
  actBy,
  actU1,
  bookLoop,
  cexpi,
  chiInverse,
  cmul,
  fromPolar,
  kappa1,
  kappa2,
  killingI,
  omegaC,
  omegaCRe,
  polarAngles,
  potential1Phi,
  potential2Phi,
  section1,
  section2,
  transition12,
  transitionAt,
  type Cx,
} from '../src/hopf-book';
import { hopfMap, type Vec3, type Vec4 } from '../src/hopf';
import { mulberry32, randomUnitQuat } from '../src/rng';
import { sampleLoop, windingNumber } from '../src/winding';

// All identities below are algebraic: each side is a handful of flops on O(1)
// numbers, so they hold to roundoff, a few ulps of 1 (~1e-15). 1e-13 leaves
// two orders of headroom without being able to hide a wrong formula (O(1) errors).
const RT = 1e-13;

// The sections divide by √(1±t), t = |z1|²−|z2|²: an absolute roundoff ε in t
// becomes a relative error ~ε/(1∓t) in s_i (condition number of √ near 0).
// Identities routed through a section at a random point therefore get the
// conditioned bound RT·(1 + 1/(1 − |t|)); first run without it measured
// 1.1e-13 on one of 200 random points — the amplification, not a wrong formula.
const condTol = (m: Vec3) => RT * (1 + 1 / Math.max(1 - Math.abs(m[2]), 1e-3));

const dist3 = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dist4 = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
const cdist = (a: Cx, b: Cx) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const rng = mulberry32(20261027);
const randS3 = (): Vec4 => randomUnitQuat(rng);
const randBase = (): Vec3 => hopfMap(randS3());

describe('Hopf bundle in R&S conventions — Ex. 1.1.20 / Rem. 1.1.21', () => {
  it('sections s_i lie on S³ over their base point, with κ_i(s_i) = 1 (Prop. 1.1.6)', () => {
    for (let k = 0; k < 200; k++) {
      const m = randBase();
      for (const s of [section1(m)!, section2(m)!]) {
        expect(Math.abs(Math.hypot(...s) - 1)).toBeLessThan(condTol(m));
        expect(dist3(hopfMap(s), m)).toBeLessThan(condTol(m));
      }
      expect(cdist(kappa1(section1(m)!)!, [1, 0])).toBeLessThan(RT);
      expect(cdist(kappa2(section2(m)!)!, [1, 0])).toBeLessThan(RT);
    }
  });

  it('sections are undefined exactly at the excluded poles π(0,1), π(1,0)', () => {
    expect(hopfMap([0, 0, 1, 0])).toEqual([0, 0, -1]); // π(0,1) = south pole ∉ U1
    expect(hopfMap([1, 0, 0, 0])).toEqual([0, 0, 1]); // π(1,0) = north pole ∉ U2
    expect(section1([0, 0, -1])).toBeNull();
    expect(section2([0, 0, 1])).toBeNull();
    expect(kappa1([0, 0, 1, 0])).toBeNull();
    expect(kappa2([1, 0, 0, 0])).toBeNull();
  });

  it('κ_i is equivariant, κ_i(Ψ_a p) = κ_i(p) a  (1.1.2)', () => {
    for (let k = 0; k < 200; k++) {
      const p = randS3();
      const alpha = 2 * Math.PI * rng();
      const q = actU1(p, alpha);
      expect(dist3(hopfMap(q), hopfMap(p))).toBeLessThan(RT); // Ψ preserves fibres
      expect(cdist(kappa1(q)!, cmul(kappa1(p)!, cexpi(alpha)))).toBeLessThan(RT);
      expect(cdist(kappa2(q)!, cmul(kappa2(p)!, cexpi(alpha)))).toBeLessThan(RT);
    }
  });

  it('χ_i is a bijection π⁻¹(U_i) ↔ U_i × U(1): p = s_i(π(p))·κ_i(p) and χ_i ∘ χ_i⁻¹ = id', () => {
    for (let k = 0; k < 200; k++) {
      const p = randS3();
      const m = hopfMap(p);
      expect(dist4(actBy(section1(m)!, kappa1(p)!), p)).toBeLessThan(condTol(m));
      expect(dist4(actBy(section2(m)!, kappa2(p)!), p)).toBeLessThan(condTol(m));
      const g = cexpi(2 * Math.PI * rng());
      for (const i of [1, 2] as const) {
        const q = chiInverse(i, m, g)!;
        expect(dist3(hopfMap(q), m)).toBeLessThan(condTol(m));
        expect(cdist((i === 1 ? kappa1 : kappa2)(q)!, g)).toBeLessThan(condTol(m));
      }
    }
  });

  it('Rem. 1.1.21/1: f ∘ g₊ = id on V₊ and g₊ ∘ f lands in the original fibre', () => {
    for (let k = 0; k < 200; k++) {
      const z = randS3();
      const m = hopfMap(z);
      expect(Math.abs(Math.hypot(...m) - 1)).toBeLessThan(RT); // image in S²
      const g = section2(m)!; // g₊
      expect(dist3(hopfMap(g), m)).toBeLessThan(condTol(m));
      // same fibre ⇔ |⟨z, g⟩_{C²}| = 1
      const re = z[0] * g[0] + z[1] * g[1] + z[2] * g[2] + z[3] * g[3];
      const im = z[0] * g[1] - z[1] * g[0] + z[2] * g[3] - z[3] * g[2];
      expect(Math.abs(Math.hypot(re, im) - 1)).toBeLessThan(condTol(m));
    }
  });

  it('ρ12 = κ1 κ2⁻¹ is constant on fibres (1.1.5) and equals e^{−iφ}', () => {
    for (let k = 0; k < 200; k++) {
      const p = randS3();
      const m = hopfMap(p);
      const rho = transition12(m)!;
      expect(cdist(transitionAt(actU1(p, 2 * Math.PI * rng()))!, rho)).toBeLessThan(condTol(m));
      const [, phi] = polarAngles(m);
      expect(cdist(rho, cexpi(-phi))).toBeLessThan(1e-12);
    }
  });

  it('Rem. 1.1.21/2: along the book loop γ, ρ12(γ(t)) = e^{it}, a loop of degree 1', () => {
    for (let k = 0; k <= 64; k++) {
      const t = (2 * Math.PI * k) / 64;
      const g = bookLoop(t);
      expect(Math.abs(hopfMap(g)[2])).toBeLessThan(RT); // γ runs on the equator ⊂ U1 ∩ U2
      expect(cdist(transitionAt(g)!, cexpi(t))).toBeLessThan(RT);
    }
    const w = windingNumber(sampleLoop((t) => transitionAt(bookLoop(t))!, 400));
    expect(w.n).toBe(1);
    expect(Math.abs(w.raw - 1)).toBeLessThan(1e-12);
  });
});

describe('Canonical connection ω_c = z̄1dz1 + z̄2dz2 — Ex. 1.3.22, Prop. 1.3.5', () => {
  const tangent = (z: Vec4): Vec4 => {
    // random tangent vector: project a random R⁴ vector off z
    const v: Vec4 = [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5];
    const d = v[0] * z[0] + v[1] * z[1] + v[2] * z[2] + v[3] * z[3];
    return [v[0] - d * z[0], v[1] - d * z[1], v[2] - d * z[2], v[3] - d * z[3]];
  };

  it('ω_c is u(1) = iR-valued on TS³ and ω_c(A*) = A for A = i', () => {
    for (let k = 0; k < 200; k++) {
      const z = randS3();
      expect(Math.abs(omegaCRe(z, tangent(z)))).toBeLessThan(RT);
      expect(Math.abs(omegaC(z, killingI(z)) - 1)).toBeLessThan(RT);
    }
  });

  it('Ψ_a^* ω_c = ω_c (Ad is trivial for U(1))', () => {
    for (let k = 0; k < 200; k++) {
      const z = randS3();
      const v = tangent(z);
      const a = 2 * Math.PI * rng();
      // Ψ_a is complex-linear, so its differential is the same map on vectors
      expect(Math.abs(omegaC(actU1(z, a), actU1(v, a)) - omegaC(z, v))).toBeLessThan(RT);
    }
  });

  it('s_i^* ω_c by numerical differentiation matches 𝒜_1 = (i/2)(1−cosθ)dφ, 𝒜_2 = −(i/2)(1+cosθ)dφ', () => {
    // Central differences, h = 1e-5: truncation ~ h² |s'''| ~ 1e-10, roundoff
    // ~ 1e-16/h ~ 1e-11; tolerance 1e-8 sits two orders above both.
    const h = 1e-5;
    for (let k = 0; k < 50; k++) {
      const th = 0.2 + (Math.PI - 0.4) * rng();
      const ph = 2 * Math.PI * rng();
      for (const [sec, pot] of [
        [section1, potential1Phi],
        [section2, potential2Phi],
      ] as const) {
        const z = sec(fromPolar(th, ph))!;
        const dPhi = sec(fromPolar(th, ph + h))!.map((x, j) => (x - sec(fromPolar(th, ph - h))![j]) / (2 * h));
        const dTh = sec(fromPolar(th + h, ph))!.map((x, j) => (x - sec(fromPolar(th - h, ph))![j]) / (2 * h));
        expect(Math.abs(omegaC(z, dPhi) - pot(th))).toBeLessThan(1e-8);
        expect(Math.abs(omegaC(z, dTh))).toBeLessThan(1e-8);
      }
    }
  });

  it('Cor. 1.3.12 on U1 ∩ U2: 𝒜_2 = 𝒜_1 + ρ12^*θ with ρ12^*θ = ρ12⁻¹dρ12 = −i dφ', () => {
    for (let k = 0; k <= 100; k++) {
      const th = 0.01 + ((Math.PI - 0.02) * k) / 100;
      expect(Math.abs(potential2Phi(th) - (potential1Phi(th) - 1))).toBeLessThan(RT);
    }
  });
});
