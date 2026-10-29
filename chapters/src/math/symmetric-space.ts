/**
 * Station 2.5a kernel — S² = SO(3)/SO(2) and H² = SO₀(1,2)/SO(2) as symmetric
 * spaces (Lemma 2.5.2, Prop. 2.5.10, Rem. 2.5.14, Def. 2.5.15, Prop. 2.5.19,
 * Ex. 2.5.27/2 and /5, Rem. 2.5.28).
 *
 * One family with ε = +1 (sphere) or −1 (hyperboloid): with η = diag(ε, 1, 1),
 * the surface is η(u, u) = ε, i.e. u₀² + u₁² + u₂² = 1 or −u₀² + u₁² + u₂² = −1
 * (u₀ > 0), with origin o = (1, 0, 0).
 * The canonical decomposition g = h ⊕ m is
 *   m ∋ M(x) = [[0, −εx₁, −εx₂], [x₁, 0, 0], [x₂, 0, 0]],
 *   h ∋ A(a) = [[0, 0, 0], [0, 0, −a], [0, a, 0]],
 * and λ is conjugation by S = 1_{1,2} = diag(−1, 1, 1) (2.5.22).
 *
 * 3×3 matrices are row-major number[9]. Pure module: no DOM / WebGL imports.
 */
export type M3 = number[];
export type V3 = [number, number, number];

export const mm = (a: M3, b: M3): M3 => {
  const c = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) c[3 * i + j] += a[3 * i + k] * b[3 * k + j];
  return c;
};
export const mv = (a: M3, v: ArrayLike<number>): V3 => [0, 1, 2].map((i) => a[3 * i] * v[0] + a[3 * i + 1] * v[1] + a[3 * i + 2] * v[2]) as V3;
export const madd = (a: M3, b: M3, s = 1): M3 => a.map((v, i) => v + s * b[i]);
export const bracket = (a: M3, b: M3): M3 => madd(mm(a, b), mm(b, a), -1);
export const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const S: M3 = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
export const ORIGIN: V3 = [1, 0, 0];

export const mPart = (eps: number, x: [number, number]): M3 => [0, -eps * x[0], -eps * x[1], x[0], 0, 0, x[1], 0, 0];
export const hPart = (a: number): M3 => [0, 0, 0, 0, 0, -a, 0, a, 0];

/** λ = Ad(S): the involutive automorphism. */
export const lambda = (X: M3): M3 => mm(mm(S, X), S);

/** The ambient form η = diag(ε, 1, 1) restricted to the tangent spaces is the metric. */
export const eta = (eps: number, u: ArrayLike<number>, v: ArrayLike<number>): number => eps * u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

/** Matrix exponential by scaling and squaring with a 20-term Taylor series. */
export function expm(X: M3): M3 {
  const n = Math.max(...X.map(Math.abs)) * 3;
  const sq = Math.max(0, Math.ceil(Math.log2(n + 1e-300)) + 1);
  const Y = X.map((v) => v / 2 ** sq);
  let term = I3.slice();
  let sum = I3.slice();
  for (let k = 1; k <= 20; k++) {
    term = mm(term, Y).map((v) => v / k);
    sum = madd(sum, term);
  }
  for (let k = 0; k < sq; k++) sum = mm(sum, sum);
  return sum;
}

/** Prop. 2.5.10/5: the geodesic t ↦ exp(tM(x))·o. */
export const geodesic = (eps: number, x: [number, number], t: number): V3 => mv(expm(mPart(eps, [t * x[0], t * x[1]])), ORIGIN);

/** The symmetry at o induced by σ = Ad(S) on G/H: s_o(u) = σ(g)·o = −S u for u = g·o. */
export const symmetryAtOrigin = (u: ArrayLike<number>): V3 => [u[0], -u[1], -u[2]];

/** The symmetry at m = g·o as a matrix: s_m = g (−S) g⁻¹ (2.5.13). */
export const symmetryAt = (g: M3, gInv: M3): M3 => mm(mm(g, S.map((v) => -v)), gInv);

/** Transvection T_t = s_{γ(t/2)} ∘ s_{γ(0)} along γ(t) = exp(tM(x))·o, as a matrix (2.5.17). */
export function transvection(eps: number, x: [number, number], t: number): M3 {
  const g = expm(mPart(eps, [(t / 2) * x[0], (t / 2) * x[1]]));
  const gInv = expm(mPart(eps, [(-t / 2) * x[0], (-t / 2) * x[1]]));
  return mm(symmetryAt(g, gInv), symmetryAt(I3, I3));
}

/**
 * Levi-Civita transport of Y along γ on the embedded surface η(u,u) = ε:
 * Ẏ = −ε η(Y, γ̇) γ (subtract the normal part of the ambient derivative). RK4.
 */
export function transportAlong(eps: number, x: [number, number], Y0: V3, t1: number, N = 400): V3 {
  const gam = (t: number): V3 => geodesic(eps, x, t);
  // d/dt exp(tM)o = M exp(tM)o
  const gdot = (t: number): V3 => mv(mPart(eps, x), gam(t));
  const f = (t: number, Y: V3): V3 => {
    const c = -eps * eta(eps, Y, gdot(t));
    const g = gam(t);
    return [c * g[0], c * g[1], c * g[2]];
  };
  let Y = Y0.slice() as V3;
  const h = t1 / N;
  const add = (a: V3, b: V3, s: number): V3 => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
  for (let n = 0; n < N; n++) {
    const t = n * h;
    const k1 = f(t, Y);
    const k2 = f(t + h / 2, add(Y, k1, h / 2));
    const k3 = f(t + h / 2, add(Y, k2, h / 2));
    const k4 = f(t + h, add(Y, k3, h));
    Y = [0, 1, 2].map((i) => Y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as V3;
  }
  return Y;
}

/**
 * Curvature at o from (2.5.10): R(x, y)z ↔ [F(x, y), M(z)] with F(x, y) = −[M(x), M(y)];
 * returns the m-component of [F(x,y), M(z)] as a vector in R².
 */
export function curvatureAtOrigin(eps: number, x: [number, number], y: [number, number], z: [number, number]): [number, number] {
  const F = bracket(mPart(eps, x), mPart(eps, y)).map((v) => -v);
  const B = bracket(F, mPart(eps, z));
  // M(w) has w in the first column
  return [B[3], B[6]];
}

/** Killing form k(X, Y) = tr(ad X ad Y) on g = h ⊕ m, in the basis (A(1), M(e₁), M(e₂)). */
export function killing(eps: number, X: M3, Y: M3): number {
  const basis = [hPart(1), mPart(eps, [1, 0]), mPart(eps, [0, 1])];
  const coords = (Z: M3): number[] => [Z[7], Z[3], Z[6]]; // a, x₁, x₂ read off A(a) + M(x)
  const ad = (Z: M3) => basis.map((b) => coords(bracket(Z, b)));
  const aX = ad(X);
  const aY = ad(Y);
  let tr = 0;
  // (ad X ad Y)_ii = Σ_j adX[j][i] · adY[i][j] with ad[j] the image of basis j
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tr += aX[j][i] * aY[i][j];
  return tr;
}
