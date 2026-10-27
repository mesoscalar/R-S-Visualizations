/**
 * Station 1.2a kernel — sections of the line bundles L_n = S³ ×_{U(1)} C
 * associated with the Hopf bundle via σ_n(e^{iα}) = e^{inα}
 * (§1.2: Prop. 1.2.5, 1.2.6, 1.2.8, (1.2.5), (1.2.8), (1.2.9), Ex. 1.2.4/3, Rem. 1.2.15).
 *
 * By Prop. 1.2.6 a section of L_n is the same as a map Φ̃ : S³ → C with
 *   Φ̃(p·a) = σ_n(a)^{-1} Φ̃(p),  i.e.  Φ̃(z e^{iα}) = e^{−inα} Φ̃(z)   (1.2.9).
 * Its local representatives are φ_i = Φ̃ ∘ s_i (Rem. 1.2.15/3), related on
 * U1 ∩ U2 by φ1 = σ_n(ρ12) φ2 = ρ12^n φ2 (Rem. 1.2.15/1 with k = 0, cf. (1.2.5)).
 *
 * Concrete equivariant maps: for a base point r with lift u ∈ π^{-1}(r), the
 * linear form ℓ_r(z) = u2 z1 − u1 z2 vanishes exactly on the fibre over r and
 * satisfies ℓ_r(z e^{iα}) = e^{iα} ℓ_r(z), so it has n = −1; its conjugate has
 * n = +1. Products of |n| of them (conjugated for n > 0) give sections of
 * L_n vanishing over chosen points; a perturbation B of the same charge
 * moves the zeros without changing their signed count.
 *
 * Pure module: no DOM / WebGL imports.
 */
import {
  cconj,
  cmul,
  fromPolar,
  section1,
  section2,
  type Cx,
  type Vec3,
} from '@rsvis/math';

export type Equivariant = (z: ArrayLike<number>) => Cx;

const z1 = (z: ArrayLike<number>): Cx => [z[0], z[1]];
const z2 = (z: ArrayLike<number>): Cx => [z[2], z[3]];

function cpow(a: Cx, k: number): Cx {
  let r: Cx = [1, 0];
  for (let i = 0; i < k; i++) r = cmul(r, a);
  return r;
}

/** Any lift of a base point to S³ (s1 where defined, else s2). */
export function liftOf(r: Vec3): ArrayLike<number> {
  return section1(r) ?? section2(r)!;
}

/** ℓ_r(z) = u2 z1 − u1 z2: charge n = −1, zero set = π^{-1}(r). */
export function linearForm(r: Vec3): Equivariant {
  const u = liftOf(r);
  const u1 = z1(u);
  const u2 = z2(u);
  return (z) => {
    const a = cmul(u2, z1(z));
    const b = cmul(u1, z2(z));
    return [a[0] - b[0], a[1] - b[1]];
  };
}

/**
 * A section of L_n vanishing over the |n| given base points, plus ε times a
 * same-charge perturbation: B = z̄1 z2^{|n|+1} (n < 0), its conjugate (n > 0),
 * or B = z̄1 z2 (n = 0, with Φ̃ = 1 + εB). For n = 0 `roots` is ignored.
 */
export function sectionLn(n: number, roots: ReadonlyArray<Vec3>, eps: number): Equivariant {
  const k = Math.abs(n);
  const forms = roots.slice(0, k).map(linearForm);
  return (z) => {
    if (n === 0) {
      const b = cmul(cconj(z1(z)), z2(z));
      return [1 + eps * b[0], eps * b[1]];
    }
    let prod: Cx = [1, 0];
    for (const f of forms) prod = cmul(prod, f(z));
    let b = cmul(cconj(z1(z)), cpow(z2(z), k + 1));
    if (n > 0) {
      prod = cconj(prod);
      b = cconj(b);
    }
    return [prod[0] + eps * b[0], prod[1] + eps * b[1]];
  };
}

/** Local representative φ_i(m) = Φ̃(s_i(m)); null off U_i. */
export function localRep(Phi: Equivariant, i: 1 | 2, m: Vec3): Cx | null {
  const s = i === 1 ? section1(m) : section2(m);
  return s ? Phi(s) : null;
}

export interface ZeroCell {
  theta: number;
  phi: number;
  /** Index of the zero(s) inside the cell, w.r.t. the outward orientation of S². */
  index: number;
}

const dArg = (u: Cx, v: Cx) => Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);

/**
 * Change of arg f along the straight (θ, φ)-segment from a to b, bisected
 * until every step turns the argument by < π/4 (so atan2 never picks the
 * wrong branch). Exact unless a zero lies within ~2^-maxDepth of the segment.
 */
function edgeTurn(
  f: (th: number, ph: number) => Cx,
  a: [number, number],
  b: [number, number],
  fa: Cx,
  fb: Cx,
  depth = 0,
): number {
  const d = dArg(fa, fb);
  if (Math.abs(d) < Math.PI / 4 || depth >= 16) return d;
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const fm = f(mid[0], mid[1]);
  return edgeTurn(f, a, mid, fa, fm, depth + 1) + edgeTurn(f, mid, b, fm, fb, depth + 1);
}

/**
 * Locate zeros of a section and their indices on a (θ, φ) grid: each cell's
 * index is the winding of the local representative around its boundary,
 * traversed positively for the outward normal e_r = e_θ × e_φ. Northern cells
 * use φ1, southern cells φ2 (each smooth on its closed hemisphere, pole
 * included). Generic sections have no zero on a grid line; then the sum of
 * indices is exact.
 */
export function zeroCells(Phi: Equivariant, nTheta = 60, nPhi = 120): ZeroCell[] {
  const out: ZeroCell[] = [];
  const f1 = (th: number, ph: number) => localRep(Phi, 1, fromPolar(th, ph))!;
  const f2 = (th: number, ph: number) => localRep(Phi, 2, fromPolar(th, ph))!;
  const dth = Math.PI / nTheta;
  const dph = (2 * Math.PI) / nPhi;
  for (let a = 0; a < nTheta; a++) {
    const f = a < nTheta / 2 ? f1 : f2;
    for (let b = 0; b < nPhi; b++) {
      // corners in positive order: (θa,φb) → (θa+1,φb) → (θa+1,φb+1) → (θa,φb+1)
      const c: Array<[number, number]> = [
        [a * dth, b * dph],
        [(a + 1) * dth, b * dph],
        [(a + 1) * dth, (b + 1) * dph],
        [a * dth, (b + 1) * dph],
      ];
      const v = c.map(([th, ph]) => f(th, ph));
      let w = 0;
      for (let k = 0; k < 4; k++) w += edgeTurn(f, c[k], c[(k + 1) % 4], v[k], v[(k + 1) % 4]);
      const idx = Math.round(w / (2 * Math.PI));
      if (idx !== 0) out.push({ theta: (a + 0.5) * dth, phi: (b + 0.5) * dph, index: idx });
    }
  }
  return out;
}
