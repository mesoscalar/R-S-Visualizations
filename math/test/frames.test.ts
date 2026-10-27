import { describe, expect, it } from 'vitest';
import {
  actSO2,
  blockSO2,
  cross3,
  det3,
  dot3,
  frameAngle,
  frameToSO3,
  frameToStiefel,
  matMul,
  matT,
  sectionN,
  sectionS,
  so3Log,
  stiefelOmega,
  transitionNS,
  transportFrame,
  type Frame,
  type Mat3,
} from '../src/frames';
import { hopfMap, type Vec3 } from '../src/hopf';
import { mulberry32, randomUnitQuat } from '../src/rng';
import { sampleLoop, windingNumber } from '../src/winding';

// Orthonormality and equivariance identities are O(1) bilinear expressions:
// roundoff ~1e-15; 1e-13 leaves two orders of headroom.
const RT = 1e-13;
const rng = mulberry32(118);
const randBase = (): Vec3 => hopfMap(randomUnitQuat(rng));
const d3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dM = (A: Mat3, B: Mat3) => Math.max(d3(A[0], B[0]), d3(A[1], B[1]), d3(A[2], B[2]));
const I3: Mat3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
// the sections divide by 1 ± z; keep test points where that is O(1) or state the conditioning
const condTol = (x: Vec3) => RT * (1 + 1 / Math.max(1 - Math.abs(x[2]), 1e-3));

function checkFrame(f: Frame, tol: number): void {
  expect(Math.abs(dot3(f.x, f.u1))).toBeLessThan(tol);
  expect(Math.abs(dot3(f.x, f.u2))).toBeLessThan(tol);
  expect(Math.abs(dot3(f.u1, f.u2))).toBeLessThan(tol);
  expect(Math.abs(Math.hypot(...f.u1) - 1)).toBeLessThan(tol);
  expect(d3(cross3(f.u1, f.u2), f.x)).toBeLessThan(tol); // oriented
}

describe('Frame bundle O⁺(S²) ≅ SO(3) — Ex. 1.1.4/4, 1.1.18, 1.1.24', () => {
  it('s_N and s_S are oriented orthonormal tangent frames, undefined exactly at the opposite pole', () => {
    for (let k = 0; k < 300; k++) {
      const x = randBase();
      checkFrame(sectionN(x)!, condTol(x));
      checkFrame(sectionS(x)!, condTol(x));
    }
    expect(sectionN([0, 0, -1])).toBeNull();
    expect(sectionS([0, 0, 1])).toBeNull();
  });

  it('Ex. 1.1.18: [x | u1 | u2] ∈ SO(3), and f·b ↦ [x | u1 | u2]·diag(1, b)', () => {
    for (let k = 0; k < 300; k++) {
      const x = randBase();
      const f = actSO2(sectionN(x)!, 2 * Math.PI * rng());
      const a = frameToSO3(f);
      expect(dM(matMul(matT(a), a), I3)).toBeLessThan(RT * 10);
      expect(Math.abs(det3(a) - 1)).toBeLessThan(RT * 10);
      const beta = 2 * Math.PI * rng();
      expect(dM(frameToSO3(actSO2(f, beta)), matMul(a, blockSO2(beta)))).toBeLessThan(RT * 10);
      expect(d3(a[0], x)).toBe(0); // π(a) = a e1
    }
  });

  it('κ is equivariant: frameAngle(g, f·b(β)) = frameAngle(g, f) + β (mod 2π)', () => {
    for (let k = 0; k < 300; k++) {
      const x = randBase();
      const g = sectionN(x)!;
      const b0 = 6 * rng() - 3;
      const beta = 6 * rng() - 3;
      const got = frameAngle(g, actSO2(actSO2(g, b0), beta));
      const want = b0 + beta;
      expect(Math.abs(Math.atan2(Math.sin(got - want), Math.cos(got - want)))).toBeLessThan(condTol(x));
    }
  });

  it('transition ρ_NS = π + 2φ on the equator: degree 2, twice the Hopf bundle’s', () => {
    for (let k = 0; k < 64; k++) {
      const phi = (2 * Math.PI * k) / 64;
      const r = transitionNS([Math.cos(phi), Math.sin(phi), 0])!;
      const d = r - (Math.PI + 2 * phi);
      expect(Math.abs(Math.atan2(Math.sin(d), Math.cos(d)))).toBeLessThan(RT);
    }
    for (const th of [0.4, 1.2, 2.5]) {
      const w = windingNumber(
        sampleLoop((phi) => {
          const r = transitionNS([Math.sin(th) * Math.cos(phi), Math.sin(th) * Math.sin(phi), Math.cos(th)])!;
          return [Math.cos(r), Math.sin(r)];
        }, 400),
      );
      expect(w.n).toBe(2); // the same on every latitude in U_N ∩ U_S
    }
  });

  it('so3Log inverts the axis-angle exponential, including near angle π', () => {
    const expm = (w: Vec3): Mat3 => {
      const t = Math.hypot(...w);
      const n = t > 0 ? (w.map((c) => c / t) as Vec3) : ([1, 0, 0] as Vec3);
      const c = Math.cos(t);
      const s = Math.sin(t);
      const col = (e: Vec3): Vec3 => {
        const nx = cross3(n, e);
        const nd = dot3(n, e);
        return [0, 1, 2].map((i) => c * e[i] + s * nx[i] + (1 - c) * nd * n[i]) as Vec3;
      };
      return [col([1, 0, 0]), col([0, 1, 0]), col([0, 0, 1])];
    };
    for (let k = 0; k < 200; k++) {
      const n = randBase();
      const t = k < 20 ? Math.PI - 1e-3 * rng() : Math.PI * rng() * 0.98;
      const w: Vec3 = [n[0] * t, n[1] * t, n[2] * t];
      const back = so3Log(expm(w));
      // rotations by ≈π about ±n coincide; compare the rotations, not the vectors.
      // Near π the axis is recovered from a symmetric part with conditioning
      // ~1/(π − t) ≤ 1e3·(…), hence the looser bound there.
      expect(dM(expm(back), expm(w))).toBeLessThan(k < 20 ? 1e-9 : 1e-12);
    }
  });
});

describe('Stiefel canonical connection ω_c = uᵀdu — Ex. 1.3.19/1.3.20, Rem. 1.3.21', () => {
  const tangentMotion = (f: Frame) => {
    // a random tangent vector to SO(3) at a = [u1 | u2 | x]: da = a·X, X ∈ so(3)
    const [p, q, r] = [2 * rng() - 1, 2 * rng() - 1, 2 * rng() - 1];
    const a = frameToStiefel(f);
    const X: Mat3 = [
      [0, r, -q],
      [-r, 0, p],
      [q, -p, 0],
    ];
    const da = matMul(a, X);
    return { a, X, da, df: { u1: da[0], u2: da[1] }, spin: r };
  };

  it('ω_c is so(2)-valued (u1·du2 = −u2·du1) and equals pr_𝔥∘θ, θ = aᵀda (Ex. 1.3.19 = Ex. 1.3.20)', () => {
    for (let k = 0; k < 300; k++) {
      const f = actSO2(sectionN(randBase())!, 2 * Math.PI * rng());
      const { a, da, df, spin } = tangentMotion(f);
      expect(Math.abs(dot3(f.u1, df.u2) + dot3(f.u2, df.u1))).toBeLessThan(RT);
      const theta = matMul(matT(a), da);
      // pr_𝔥 = upper-left 2×2 block; its (2,1) entry is column 0, row 1
      expect(Math.abs(stiefelOmega(f, df) - theta[0][1])).toBeLessThan(RT);
      expect(Math.abs(stiefelOmega(f, df) - spin)).toBeLessThan(RT);
    }
  });

  it('ω_c(A*) = A for the generator of SO(2), and ω_c is invariant under b ∈ SO(2) and under left SO(3)', () => {
    for (let k = 0; k < 300; k++) {
      const f = sectionN(randBase())!;
      // A* at f: d/dβ f·b(β) at 0 = (u2, −u1), generated by A = b′(0) = [[0, −1], [1, 0]],
      // whose (2,1) entry is +1
      expect(Math.abs(stiefelOmega(f, { u1: f.u2, u2: f.u1.map((c) => -c) as Vec3 }) - 1)).toBeLessThan(RT);
      const { df } = tangentMotion(f);
      const beta = 2 * Math.PI * rng();
      const c = Math.cos(beta);
      const s = Math.sin(beta);
      const fb = actSO2(f, beta);
      const dfb = {
        u1: df.u1.map((v, i) => c * v + s * df.u2[i]) as Vec3,
        u2: df.u2.map((v, i) => -s * df.u1[i] + c * v) as Vec3,
      };
      expect(Math.abs(stiefelOmega(fb, dfb) - stiefelOmega(f, df))).toBeLessThan(RT);
      const R = frameToSO3(sectionS(randBase())!); // some rotation
      const Rv = (v: Vec3) => matMul(R, [v, [0, 0, 0], [0, 0, 0]])[0];
      const fR: Frame = { x: Rv(f.x), u1: Rv(f.u1), u2: Rv(f.u2) };
      expect(Math.abs(stiefelOmega(fR, { u1: Rv(df.u1), u2: Rv(df.u2) }) - stiefelOmega(f, df))).toBeLessThan(RT);
    }
  });

  it('Rem. 1.3.21: at p0 = [e1 e2] the horizontal tangent vectors are a·[[0, −Tᵀ], [T, 0]], T ∈ R^{1×2}', () => {
    const f0: Frame = { x: [0, 0, 1], u1: [1, 0, 0], u2: [0, 1, 0] };
    for (let k = 0; k < 100; k++) {
      const { X, df, spin } = tangentMotion(f0);
      const horizontal = Math.abs(stiefelOmega(f0, df)) < RT;
      expect(horizontal).toBe(Math.abs(spin) < RT);
      // the upper-left 2×2 block of X is exactly the vertical part; T is its third row.
      // Mat3 stores columns: X[col][row], so the (2,1) entry is X[0][1].
      expect(X[0][1]).toBe(-X[1][0]);
      expect(Math.abs(X[0][1] - spin)).toBeLessThan(RT);
      expect(Math.abs(stiefelOmega(f0, df) - X[0][1])).toBeLessThan(RT);
    }
  });

  it('horizontal transport = Levi-Civita transport: around a latitude the frame turns by 2π(1 − cos θ0)', () => {
    for (const th of [0.3, 0.9, 1.5, 2.2]) {
      const xOf = (t: number): Vec3 => [Math.sin(th) * Math.cos(t), Math.sin(th) * Math.sin(t), Math.cos(th)];
      const xDot = (t: number): Vec3 => [-Math.sin(th) * Math.sin(t), Math.sin(th) * Math.cos(t), 0];
      const f0 = sectionN(xOf(0))!;
      const path = transportFrame(xOf, xDot, f0, 0, 2 * Math.PI, 4000);
      // ω_c(ḟ) = 0 along the path (checked at the midpoint by central differences)
      const k = 2000;
      const h = (2 * Math.PI) / 4000;
      const du1 = path[k + 1].u1.map((v, i) => (v - path[k - 1].u1[i]) / (2 * h)) as Vec3;
      expect(Math.abs(dot3(path[k].u2, du1))).toBeLessThan(1e-6); // FD over h ≈ 1.6e-3: O(h²) ≈ 3e-6·|u'''|, |u'''| ≲ 0.3
      const end = path[path.length - 1];
      const turn = frameAngle(f0, end);
      const want = 2 * Math.PI * (1 - Math.cos(th));
      // RK4, h = 2π/4000: global error ~1e-13·(…); 1e-9 is the integrator budget
      expect(Math.abs(Math.atan2(Math.sin(turn - want), Math.cos(turn - want)))).toBeLessThan(1e-9);
    }
  });
});
