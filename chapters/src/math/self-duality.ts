/**
 * Station 2.8a kernel — four-dimensional self-duality (Rem. 2.8.1, Lemma 2.8.2,
 * Cor. 2.8.3, Lemma 2.8.5, Thm. 2.8.7, Rem. 2.8.8, Def. 2.8.9, Ex. 2.8.10).
 *
 * 2-forms on R⁴ are antisymmetric 4×4 matrices ω with ω = ½ω_ij θ^i∧θ^j
 * (so θ¹∧θ² has ω₁₂ = 1, ω₂₁ = −1), ⟨α, β⟩ = ½Σα_ij β_ij, volume θ¹²³⁴.
 * The same matrices are elements of so(4) acting on R⁴. Algebraic curvature
 * tensors are R[i][j][k][l] = g(R(e_i, e_j)e_k, e_l), the book's convention in
 * (2.8.26); the curvature operator on Λ² is R(φ)_kl = ½Σ R_ijkl φ_ij.
 * Indices run 0..3 for the book's 1..4. Pure module: no DOM / WebGL imports.
 */
export type M4 = number[][];
export type Tensor4 = number[][][][];

const zeros = (): M4 => [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
const range4 = [0, 1, 2, 3];

/** Levi-Civita symbol ε_ijkl. */
export function levi(i: number, j: number, k: number, l: number): number {
  const p = [i, j, k, l];
  if (new Set(p).size < 4) return 0;
  let s = 1;
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) if (p[a] > p[b]) s = -s;
  return s;
}

/** θ^i∧θ^j as a matrix. */
export function wedge(i: number, j: number): M4 {
  const m = zeros();
  m[i][j] = 1;
  m[j][i] = -1;
  return m;
}

export const add = (a: M4, b: M4, s = 1): M4 => a.map((r, i) => r.map((v, j) => v + s * b[i][j]));
export const scale = (s: number, a: M4): M4 => a.map((r) => r.map((v) => s * v));
export const inner = (a: M4, b: M4): number => 0.5 * range4.reduce((s, i) => s + range4.reduce((t, j) => t + a[i][j] * b[i][j], 0), 0);
export const mmul = (a: M4, b: M4): M4 => a.map((r) => range4.map((j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
export const transpose = (a: M4): M4 => range4.map((i) => range4.map((j) => a[j][i]));
export const commutator = (a: M4, b: M4): M4 => add(mmul(a, b), mmul(b, a), -1);

/** Hodge star on 2-forms: (⋆ω)_kl = ½ ε_ijkl ω_ij. */
export function hodge(w: M4): M4 {
  const m = zeros();
  for (const k of range4)
    for (const l of range4) {
      let s = 0;
      for (const i of range4) for (const j of range4) s += levi(i, j, k, l) * w[i][j];
      m[k][l] = 0.5 * s;
    }
  return m;
}

const r2 = Math.SQRT1_2;
/** Rem. 2.8.1: φ^1_± = (θ¹²±θ³⁴)/√2, φ^2_± = (θ¹³∓θ²⁴)/√2, φ^3_± = (θ¹⁴±θ²³)/√2; returned as [φ¹₊, φ²₊, φ³₊, φ¹₋, φ²₋, φ³₋]. */
export const PHI: M4[] = [1, -1].flatMap((sg) => [
  scale(r2, add(wedge(0, 1), wedge(2, 3), sg)),
  scale(r2, add(wedge(0, 2), wedge(1, 3), -sg)),
  scale(r2, add(wedge(0, 3), wedge(1, 2), sg)),
]);

/** Left and right multiplication by i, j, k on H ≅ R⁴ (x₁ + x₂i + x₃j + x₄k). */
export function quatMult(side: 'L' | 'R', q: 1 | 2 | 3): M4 {
  const mulQ = (a: number[], b: number[]) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
  const u = [0, 0, 0, 0];
  u[q] = 1;
  const m = zeros();
  for (const j of range4) {
    const e = [0, 0, 0, 0];
    e[j] = 1;
    const v = side === 'L' ? mulQ(u, e) : mulQ(e, u);
    for (const i of range4) m[i][j] = v[i];
  }
  return m;
}

/** 4×4 matrix exponential (scaling and squaring, 20-term Taylor). */
export function expm4(X: M4): M4 {
  const n = Math.max(...X.flat().map(Math.abs)) * 4;
  const sq = Math.max(0, Math.ceil(Math.log2(n + 1e-300)) + 1);
  const Y = scale(1 / 2 ** sq, X);
  const I: M4 = range4.map((i) => range4.map((j) => (i === j ? 1 : 0)));
  let term = I;
  let sum = I;
  for (let k = 1; k <= 20; k++) {
    term = scale(1 / k, mmul(term, Y));
    sum = add(sum, term);
  }
  for (let k = 0; k < sq; k++) sum = mmul(sum, sum);
  return sum;
}

// ---------- curvature tensors ----------

export function tensor(f: (i: number, j: number, k: number, l: number) => number): Tensor4 {
  return range4.map((i) => range4.map((j) => range4.map((k) => range4.map((l) => f(i, j, k, l)))));
}

const d = (a: number, b: number) => (a === b ? 1 : 0);

/** Constant curvature c: R(X,Y)Z = c(⟨Y,Z⟩X − ⟨X,Z⟩Y). */
export const constantCurvature = (c: number): Tensor4 => tensor((i, j, k, l) => c * (d(j, k) * d(i, l) - d(i, k) * d(j, l)));

/** Riemannian product of constant curvatures c₁ on span(e₁,e₂) and c₂ on span(e₃,e₄). */
export const product = (c1: number, c2: number): Tensor4 =>
  tensor((i, j, k, l) => {
    const b = (x: number) => (x < 2 ? 0 : 1);
    if (!(b(i) === b(j) && b(j) === b(k) && b(k) === b(l))) return 0;
    return (b(i) === 0 ? c1 : c2) * (d(j, k) * d(i, l) - d(i, k) * d(j, l));
  });

/** The book's complex structure J = diag(J₁, J₁): e₁ ↦ e₂, e₃ ↦ e₄ (Section 2.8, footnote 54). */
export const J: M4 = [
  [0, -1, 0, 0],
  [1, 0, 0, 0],
  [0, 0, 0, -1],
  [0, 0, 1, 0],
];

/**
 * Fubini–Study on CP² with holomorphic sectional curvature 1:
 * R(X,Y)Z = ¼(⟨Y,Z⟩X − ⟨X,Z⟩Y + ⟨JY,Z⟩JX − ⟨JX,Z⟩JY + 2⟨X,JY⟩JZ).
 */
export function fubiniStudy(): Tensor4 {
  const Je = (a: number) => range4.map((r) => J[r][a]);
  const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);
  const e = (a: number) => range4.map((r) => d(r, a));
  return tensor((i, j, k, l) => {
    const X = e(i);
    const Y = e(j);
    const Z = e(k);
    const W = e(l);
    return 0.25 * (dot(Y, Z) * dot(X, W) - dot(X, Z) * dot(Y, W) + dot(Je(j), Z) * dot(Je(i), W) - dot(Je(i), Z) * dot(Je(j), W) + 2 * dot(X, Je(j)) * dot(Je(k), W));
  });
}

/** R′_ijkl = O_ia O_jb O_kc O_ld R_abcd (change of orthonormal frame; O = diag(1,1,1,−1) reverses orientation). */
export function transform(R: Tensor4, O: M4): Tensor4 {
  return tensor((i, j, k, l) => {
    let s = 0;
    for (const a of range4)
      for (const b of range4)
        for (const c of range4)
          for (const e of range4) if (O[i][a] && O[j][b] && O[k][c] && O[l][e]) s += O[i][a] * O[j][b] * O[k][c] * O[l][e] * R[a][b][c][e];
    return s;
  });
}

/** The curvature operator applied to a 2-form. */
export function curvatureOperator(R: Tensor4, phi: M4): M4 {
  const m = zeros();
  for (const k of range4)
    for (const l of range4) {
      let s = 0;
      for (const i of range4) for (const j of range4) s += R[i][j][k][l] * phi[i][j];
      m[k][l] = 0.5 * s;
    }
  return m;
}

/** 6×6 matrix ⟨φ_a, R(φ_b)⟩ in the basis PHI: blocks A (++), B (+−), C (−−). */
export function operatorMatrix(R: Tensor4): number[][] {
  return PHI.map((pa) => PHI.map((pb) => inner(pa, curvatureOperator(R, pb))));
}

/** The tensor with curvature operator Σ S_ab φ_a⟨φ_b, ·⟩: R_ijkl = Σ S_ab (φ_b)_ij (φ_a)_kl. */
export function fromOperator(S: number[][]): Tensor4 {
  return tensor((i, j, k, l) => {
    let s = 0;
    for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) s += S[a][b] * PHI[b][i][j] * PHI[a][k][l];
    return s;
  });
}

/** Ric_jk = Σ_i R_ijki (Rem. 2.8.8), Sc = Σ Ric_jj. */
export function ricci(R: Tensor4): { Ric: M4; Sc: number } {
  const Ric = range4.map((j) => range4.map((k) => range4.reduce((s, i) => s + R[i][j][k][i], 0)));
  return { Ric, Sc: Ric.reduce((s, r, i) => s + r[i], 0) };
}

/** First Bianchi residual max |R_ijkl + R_jkil + R_kijl|. */
export function bianchiResidual(R: Tensor4): number {
  let m = 0;
  for (const i of range4) for (const j of range4) for (const k of range4) for (const l of range4) m = Math.max(m, Math.abs(R[i][j][k][l] + R[j][k][i][l] + R[k][i][j][l]));
  return m;
}

/** Singer–Thorpe pieces (2.8.22)–(2.8.25). */
export function singerThorpe(R: Tensor4) {
  const M = operatorMatrix(R);
  const A = [0, 1, 2].map((a) => [0, 1, 2].map((b) => M[a][b]));
  const B = [0, 1, 2].map((a) => [3, 4, 5].map((b) => M[a][b]));
  const C = [3, 4, 5].map((a) => [3, 4, 5].map((b) => M[a][b]));
  const tr = (X: number[][]) => X[0][0] + X[1][1] + X[2][2];
  const Wp = A.map((r, a) => r.map((v, b) => v - (a === b ? tr(A) / 3 : 0)));
  const Wm = C.map((r, a) => r.map((v, b) => v - (a === b ? tr(C) / 3 : 0)));
  const norm = (X: number[][]) => Math.sqrt(X.flat().reduce((s, v) => s + v * v, 0));
  return { M, A, B, C, trA: tr(A), trC: tr(C), Wp, Wm, normWp: norm(Wp), normWm: norm(Wm), normB: norm(B) };
}

/** Sectional curvature of span(X, Y) (Def. 2.4.1). */
export function sectional(R: Tensor4, X: number[], Y: number[]): number {
  let num = 0;
  for (const i of range4) for (const j of range4) for (const k of range4) for (const l of range4) num += R[i][j][k][l] * X[i] * Y[j] * Y[k] * X[l];
  const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);
  return num / (dot(X, X) * dot(Y, Y) - dot(X, Y) ** 2);
}
