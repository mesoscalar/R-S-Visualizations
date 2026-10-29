/**
 * Linear connections on a 2-dimensional chart, in the book's local conventions
 * (Rem. 2.1.29): ∇_{∂i}∂j = Γ^k_ij ∂k, torsion T^i_jk = Γ^i_jk − Γ^i_kj (2.1.55),
 * curvature (2.1.54), transport Ẋ^k + Γ^k_ij ẋ^i X^j = 0 (2.1.58) and
 * geodesics ẍ^k + Γ^k_ij ẋ^i ẋ^j = 0 (2.1.60).
 *
 * Shared by Stations 2.1a (torsion), 2.4a (constant curvature) and 2.5a.
 * Pure module: no DOM / WebGL imports.
 */
import { rk4Step } from '@rsvis/math';

export type V2 = [number, number];
/** Christoffel symbols at x: G[k][i][j] = Γ^k_ij. */
export type Christoffel = (x: V2) => number[][][];

/**
 * Levi-Civita connection of the conformal metric g = λ²δ with
 * λ = 2/(1 + k|x|²): the model surface of constant curvature k
 * (stereographic sphere for k > 0, plane for k = 0, Poincaré disk for k < 0).
 * With φ = log λ: Γ^k_ij = δ^k_i ∂_jφ + δ^k_j ∂_iφ − δ_ij ∂_kφ.
 */
export function conformalLC(k: number): Christoffel {
  return (x) => {
    const d = 1 + k * (x[0] * x[0] + x[1] * x[1]);
    const dphi = [(-2 * k * x[0]) / d, (-2 * k * x[1]) / d];
    const G = [0, 1].map((m) =>
      [0, 1].map((i) => [0, 1].map((j) => (m === i ? dphi[j] : 0) + (m === j ? dphi[i] : 0) - (i === j ? dphi[m] : 0))),
    );
    return G;
  };
}

/** Conformal factor λ² of conformalLC(k). */
export const conformalFactor = (k: number, x: V2): number => (2 / (1 + k * (x[0] * x[0] + x[1] * x[1]))) ** 2;

/** Add an antisymmetric part ½τ ε_ij t^k: the torsion becomes T^k_ij = τ ε_ij t^k, the geodesics do not change. */
export function withTorsion(base: Christoffel, tau: number, t: V2): Christoffel {
  return (x) => {
    const G = base(x);
    for (let m = 0; m < 2; m++) {
      G[m][0][1] += 0.5 * tau * t[m];
      G[m][1][0] -= 0.5 * tau * t[m];
    }
    return G;
  };
}

/** Γ(u, v)^k = Γ^k_ij u^i v^j. */
export function gammaUV(G: number[][][], u: V2, v: V2): V2 {
  return [0, 1].map((m) => {
    let s = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += G[m][i][j] * u[i] * v[j];
    return s;
  }) as V2;
}

/** Torsion tensor T(u, v)^k = (Γ^k_ij − Γ^k_ji) u^i v^j. */
export function torsion(Gam: Christoffel, x: V2, u: V2, v: V2): V2 {
  const G = Gam(x);
  return [0, 1].map((m) => {
    let s = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += (G[m][i][j] - G[m][j][i]) * u[i] * v[j];
    return s;
  }) as V2;
}

/** R^i_jkl by (2.1.54), with ∂ by central differences (step h). Returns R[i][j][k][l]. */
export function curvature(Gam: Christoffel, x: V2, h = 1e-5): number[][][][] {
  const G = Gam(x);
  const dG = [0, 1].map((a) => {
    const p = Gam([x[0] + (a === 0 ? h : 0), x[1] + (a === 1 ? h : 0)]);
    const q = Gam([x[0] - (a === 0 ? h : 0), x[1] - (a === 1 ? h : 0)]);
    return p.map((P, m) => P.map((row, i) => row.map((v, j) => (v - q[m][i][j]) / (2 * h))));
  });
  const R: number[][][][] = [];
  for (let i = 0; i < 2; i++) {
    R.push([]);
    for (let j = 0; j < 2; j++) {
      R[i].push([]);
      for (let k = 0; k < 2; k++) {
        R[i][j].push([]);
        for (let l = 0; l < 2; l++) {
          let s = dG[j][i][k][l] - dG[k][i][j][l];
          for (let m = 0; m < 2; m++) s += G[m][k][l] * G[i][j][m] - G[m][j][l] * G[i][k][m];
          R[i][j][k].push(s);
        }
      }
    }
  }
  return R;
}

/** R(u, v)w with R(e_j, e_k)e_l = R^i_jkl e_i (2.1.52). */
export function curvatureUVW(R: number[][][][], u: V2, v: V2, w: V2): V2 {
  return [0, 1].map((i) => {
    let s = 0;
    for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) s += R[i][j][k][l] * u[j] * v[k] * w[l];
    return s;
  }) as V2;
}

/** A geodesic with parallel-transported vectors: state samples (x, ẋ, Y₁, Y₂, …). */
export interface Transported {
  ts: number[];
  x: V2[];
  v: V2[];
  /** each transported vector, sampled like x */
  Y: V2[][];
}

/**
 * Integrate the geodesic (2.1.60) from (x0, v0) for time t1 together with the
 * transport (2.1.58) of the vectors Y0 along it (RK4, N steps).
 */
export function geodesicTransport(Gam: Christoffel, x0: V2, v0: V2, Y0: V2[], t1: number, N = 200): Transported {
  const nY = Y0.length;
  const f = (_t: number, s: Float64Array) => {
    const x: V2 = [s[0], s[1]];
    const v: V2 = [s[2], s[3]];
    const G = Gam(x);
    const out = new Float64Array(s.length);
    const a = gammaUV(G, v, v);
    out[0] = v[0];
    out[1] = v[1];
    out[2] = -a[0];
    out[3] = -a[1];
    for (let q = 0; q < nY; q++) {
      const g = gammaUV(G, v, [s[4 + 2 * q], s[5 + 2 * q]]);
      out[4 + 2 * q] = -g[0];
      out[5 + 2 * q] = -g[1];
    }
    return out;
  };
  let s: Float64Array = Float64Array.from([...x0, ...v0, ...Y0.flat()]);
  const h = t1 / N;
  const res: Transported = { ts: [0], x: [x0], v: [v0], Y: Y0.map((y) => [y]) };
  for (let n = 0; n < N; n++) {
    s = rk4Step(f, n * h, s, h);
    res.ts.push((n + 1) * h);
    res.x.push([s[0], s[1]]);
    res.v.push([s[2], s[3]]);
    for (let q = 0; q < nY; q++) res.Y[q].push([s[4 + 2 * q], s[5 + 2 * q]]);
  }
  return res;
}

/**
 * The geodesic "parallelogram": run ε along X, transport Y there, run ε along
 * the transported Y; and the same with X, Y swapped. To second order the two
 * endpoints differ by −ε² T(X, Y) (expand x + εX − ½ε²Γ(X,X) and Y − εΓ(X,Y)).
 */
export function parallelogram(Gam: Christoffel, p: V2, X: V2, Y: V2, eps: number, N = 100) {
  const leg = (A: V2, B: V2) => {
    const first = geodesicTransport(Gam, p, A, [B], eps, N);
    const mid = first.x[N];
    const Bt = first.Y[0][N];
    const second = geodesicTransport(Gam, mid, Bt, [], eps, N);
    return { path: [...first.x, ...second.x.slice(1)], end: second.x[N] };
  };
  const xy = leg(X, Y);
  const yx = leg(Y, X);
  return { pathXY: xy.path, pathYX: yx.path, qXY: xy.end, qYX: yx.end };
}

/** Transport w once around the coordinate square p → p + εu → p + εu + εv → p + εv → p (RK4 on (2.1.58)). */
export function squareHolonomy(Gam: Christoffel, p: V2, u: V2, v: V2, eps: number, w: V2, N = 200): V2 {
  const corners: V2[] = [p, [p[0] + eps * u[0], p[1] + eps * u[1]], [p[0] + eps * (u[0] + v[0]), p[1] + eps * (u[1] + v[1])], [p[0] + eps * v[0], p[1] + eps * v[1]]];
  let W: Float64Array = Float64Array.from(w);
  for (let c = 0; c < 4; c++) {
    const a = corners[c];
    const b = corners[(c + 1) % 4];
    const vel: V2 = [b[0] - a[0], b[1] - a[1]];
    const f = (t: number, s: Float64Array) => {
      const g = gammaUV(Gam([a[0] + t * vel[0], a[1] + t * vel[1]]), vel, [s[0], s[1]]);
      return Float64Array.from([-g[0], -g[1]]);
    };
    for (let n = 0; n < N; n++) W = rk4Step(f, n / N, W, 1 / N);
  }
  return [W[0], W[1]];
}
