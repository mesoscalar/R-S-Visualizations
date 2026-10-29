import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@rsvis/math';
import {
  J,
  PHI,
  add,
  bianchiResidual,
  commutator,
  constantCurvature,
  fromOperator,
  fubiniStudy,
  hodge,
  inner,
  mmul,
  product,
  quatMult,
  ricci,
  scale,
  sectional,
  singerThorpe,
  tensor,
  transform,
  transpose,
  type M4,
  type Tensor4,
} from '../src/math/self-duality';

const rng = mulberry32(2801);
const r = () => 2 * rng() - 1;
const dist = (a: M4, b: M4) => Math.max(...a.flat().map((v, i) => Math.abs(v - b.flat()[i])));
const r4 = () => [r(), r(), r(), r()];
// all quantities are finite sums of O(1) products: roundoff ≲ 1e-14
const ALG = 1e-12;

/** A random algebraic curvature tensor: random symmetric S on Λ², minus its component along ⋆ (the first Bianchi identity in 4D). */
function randomCurvature(): Tensor4 {
  const S = [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0, 0, 0, 0]);
  for (let a = 0; a < 6; a++)
    for (let b = a; b < 6; b++) {
      const v = r();
      S[a][b] = v;
      S[b][a] = v;
    }
  // ⋆ = diag(1,1,1,−1,−1,−1) in the basis PHI; remove ⟨S, ⋆⟩⋆/6
  const t = (S[0][0] + S[1][1] + S[2][2] - S[3][3] - S[4][4] - S[5][5]) / 6;
  for (let a = 0; a < 6; a++) S[a][a] -= (a < 3 ? 1 : -1) * t;
  return fromOperator(S);
}

const MODELS: [string, Tensor4][] = [
  ['S⁴', constantCurvature(1)],
  ['S²×S²', product(1, 1)],
  ['CP²', fubiniStudy()],
  ['S²×H²', product(1, -1)],
];

describe('Station 2.8a — self-duality in four dimensions (§2.8)', () => {
  it('Rem. 2.8.1: φ^a_± is an orthonormal basis of Λ² with ⋆φ^a_± = ±φ^a_±, and ⋆⋆ = id (2.8.7)', () => {
    PHI.forEach((p, a) => {
      expect(dist(hodge(p), scale(a < 3 ? 1 : -1, p))).toBeLessThan(ALG);
      PHI.forEach((q, b) => expect(Math.abs(inner(p, q) - (a === b ? 1 : 0))).toBeLessThan(ALG));
    });
    const w = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i < j ? r() : 0)));
    const ww = add(w, transpose(w), -1);
    expect(dist(hodge(hodge(ww)), ww)).toBeLessThan(ALG);
  });

  it('(2.8.6): so(4) = Λ²₊ ⊕ Λ²₋ as commuting copies of so(3)', () => {
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) {
        expect(dist(commutator(PHI[a], PHI[3 + b]), scale(0, PHI[0]))).toBeLessThan(ALG);
        // [Λ²±, Λ²±] ⊂ Λ²±: the commutator is (anti-)self-dual again
        for (const off of [0, 3]) {
          const c = commutator(PHI[off + a], PHI[off + b]);
          expect(dist(hodge(c), scale(off ? -1 : 1, c))).toBeLessThan(ALG);
        }
      }
  });

  it('left multiplication by i, j, k is self-dual (L_i is the book’s J) and right multiplication is anti-self-dual (x = x₁ + x₂i + x₃j + x₄k)', () => {
    for (const q of [1, 2, 3] as const) {
      const L = quatMult('L', q);
      const R = quatMult('R', q);
      expect(dist(hodge(L), L)).toBeLessThan(ALG);
      expect(dist(hodge(R), scale(-1, R))).toBeLessThan(ALG);
      expect(dist(mmul(L, R), mmul(R, L))).toBeLessThan(ALG);
    }
    expect(dist(quatMult('L', 1), J)).toBeLessThan(ALG);
  });

  it('Lemma 2.8.2 / Cor. 2.8.3: for every orthogonal complex structure J in Λ²₊, anti-self-dual forms are J-invariant (type (1,1))', () => {
    // the book's J = diag(J₁, J₁) is self-dual in this identification
    expect(dist(hodge(J), J)).toBeLessThan(ALG);
    for (let n = 0; n < 50; n++) {
      const u = [r(), r(), r()];
      const nu = Math.hypot(...u);
      const Jn = PHI.slice(0, 3).reduce((s, p, a) => add(s, scale(u[a] / nu, p)), scale(0, PHI[0]));
      const Jc = scale(Math.SQRT2, Jn); // unit self-dual form ↦ complex structure (J² = −1)
      expect(dist(mmul(Jc, Jc), scale(-1, [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? 1 : 0)))))).toBeLessThan(ALG);
      const v = [r(), r(), r()];
      const beta = PHI.slice(3).reduce((s, p, a) => add(s, scale(v[a], p)), scale(0, PHI[0]));
      expect(dist(mmul(mmul(transpose(Jc), beta), Jc), beta)).toBeLessThan(ALG);
      // self-dual forms orthogonal to J are J-anti-invariant: Λ^{2,0} ⊕ Λ^{0,2}
      const w = [r(), r(), r()];
      let alpha = PHI.slice(0, 3).reduce((s, p, a) => add(s, scale(w[a], p)), scale(0, PHI[0]));
      alpha = add(alpha, Jn, -inner(alpha, Jn));
      expect(dist(mmul(mmul(transpose(Jc), alpha), Jc), scale(-1, alpha))).toBeLessThan(ALG);
    }
  });

  it('the model tensors satisfy the first Bianchi identity, and CP² has K ∈ [¼, 1] with K(X, JX) = 1', () => {
    for (const [, R] of MODELS) expect(bianchiResidual(R)).toBeLessThan(ALG);
    for (let n = 0; n < 5; n++) expect(bianchiResidual(randomCurvature())).toBeLessThan(ALG);
    const FS = fubiniStudy();
    for (let n = 0; n < 100; n++) {
      const [X, Y] = [r4(), r4()];
      const K = sectional(FS, X, Y);
      expect(K).toBeGreaterThan(0.25 - ALG);
      expect(K).toBeLessThan(1 + ALG);
      const JX = [0, 1, 2, 3].map((i) => J[i].reduce((s, v, k) => s + v * X[k], 0));
      expect(Math.abs(sectional(FS, X, JX) - 1)).toBeLessThan(ALG);
    }
  });

  it('Prop. 2.4.2: polarisation recovers ⟨R(X,Y)Z,W⟩ from α(X,Y) = ⟨R(X,Y)X,Y⟩', () => {
    for (let n = 0; n < 50; n++) {
      const R = randomCurvature();
      const q = (X: number[], Y: number[], Z: number[], W: number[]) => {
        let s = 0;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) s += R[i][j][k][l] * X[i] * Y[j] * Z[k] * W[l];
        return s;
      };
      const al = (X: number[], Y: number[]) => q(X, Y, X, Y);
      const p = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
      const [X, Y, Z, W] = [r4(), r4(), r4(), r4()];
      const rhs =
        al(p(X, W), p(Y, Z)) - al(p(X, W), Y) - al(p(X, W), Z) - al(X, p(Y, Z)) - al(W, p(Y, Z)) + al(X, Z) + al(W, Y) -
        al(p(Y, W), p(X, Z)) + al(p(Y, W), X) + al(p(Y, W), Z) + al(Y, p(X, Z)) + al(W, p(X, Z)) - al(Y, Z) - al(W, X);
      expect(Math.abs(-6 * q(X, Y, Z, W) - rhs)).toBeLessThan(1e-10);
    }
  });

  it('Lemma 2.8.5: tr A = tr C = −Sc/4, for the models and for random curvature tensors', () => {
    for (const R of [...MODELS.map((m) => m[1]), ...[0, 1, 2, 3, 4].map(randomCurvature)]) {
      const st = singerThorpe(R);
      const { Sc } = ricci(R);
      expect(Math.abs(st.trA + Sc / 4)).toBeLessThan(ALG);
      expect(Math.abs(st.trC + Sc / 4)).toBeLessThan(ALG);
    }
  });

  it('Thm. 2.8.7 / Rem. 2.8.8: R = −(Sc/12)·1 + B + W rebuilds (2.8.26), and Σ_i W_ijki = 0', () => {
    for (let n = 0; n < 10; n++) {
      const R = randomCurvature();
      const st = singerThorpe(R);
      const { Ric, Sc } = ricci(R);
      // W as a tensor from the block-diagonal operator W₊ ⊕ W₋
      const Wop = [0, 1, 2, 3, 4, 5].map((a) => [0, 1, 2, 3, 4, 5].map((b) => (a < 3 && b < 3 ? st.Wp[a][b] : a >= 3 && b >= 3 ? st.Wm[a - 3][b - 3] : 0)));
      const W = fromOperator(Wop);
      for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) expect(Math.abs([0, 1, 2, 3].reduce((s, i) => s + W[i][j][k][i], 0))).toBeLessThan(ALG);
      const d = (a: number, b: number) => (a === b ? 1 : 0);
      const rebuilt = tensor(
        (i, j, k, l) =>
          (Sc / 6) * (d(j, l) * d(i, k) - d(j, k) * d(i, l)) +
          0.5 * (Ric[i][l] * d(j, k) + Ric[j][k] * d(i, l) - Ric[i][k] * d(j, l) - Ric[j][l] * d(i, k)) +
          W[i][j][k][l],
      );
      expect(Math.max(...rebuilt.flat(3).map((v, i) => Math.abs(v - R.flat(3)[i])))).toBeLessThan(ALG);
    }
  });

  it('Def. 2.8.9 / Ex. 2.8.10: S⁴ has W = 0; CP² is self-dual (W₋ = 0, W₊ ≠ 0) and reversing its orientation swaps them; B = 0 exactly for the Einstein models', () => {
    const st = (R: Tensor4) => singerThorpe(R);
    const s4 = st(constantCurvature(1));
    expect(s4.normWp + s4.normWm + s4.normB).toBeLessThan(ALG);
    const cp = st(fubiniStudy());
    expect(cp.normWm).toBeLessThan(ALG);
    expect(cp.normWp).toBeGreaterThan(0.1);
    expect(cp.normB).toBeLessThan(ALG);
    const flip = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? (i === 3 ? -1 : 1) : 0)));
    const cpBar = st(transform(fubiniStudy(), flip));
    expect(cpBar.normWp).toBeLessThan(ALG);
    expect(Math.abs(cpBar.normWm - cp.normWp)).toBeLessThan(ALG);
    const s2s2 = st(product(1, 1));
    expect(s2s2.normB).toBeLessThan(ALG);
    expect(s2s2.normWp).toBeGreaterThan(0.1);
    expect(s2s2.normWm).toBeGreaterThan(0.1);
    expect(st(product(1, -1)).normB).toBeGreaterThan(0.1);
  });
});
