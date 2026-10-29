/**
 * Station 1.8a kernel — non-abelian gauge transformations of an SU(2)
 * connection on the trivial bundle over R² (Prop. 1.8.7, Rem. 1.8.8):
 *   𝒜 ↦ ρ⁻¹𝒜ρ + ρ⁻¹dρ,  𝓕 ↦ ρ⁻¹𝓕ρ,
 * with SU(2) = unit quaternions and su(2) = Im ℍ (so the matrix commutator
 * is [p, q] = pq − qp). 𝓕 = d𝒜 + ½[𝒜 ∧ 𝒜] has the single component
 * 𝓕_xy = ∂_x𝒜_y − ∂_y𝒜_x + [𝒜_x, 𝒜_y].
 *
 * Parallel transport along c: the horizontal lift is s∘c·g with
 * ġ = −𝒜(ċ)g, g(0) = 1 (Prop. 1.7.2 with Ad_{g⁻¹}𝒜(ċ) = −g⁻¹ġ).
 *
 * Pure module: no DOM / WebGL imports.
 */
import { qconj, qexp, qmul, qnormalize, type Quat } from '@rsvis/math';

/** A local connection form: (x, y) ↦ [𝒜_x, 𝒜_y], each a pure quaternion. */
export type Potential = (x: number, y: number) => [Quat, Quat];

const sub = (a: Quat, b: Quat): Quat => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const addQ = (a: Quat, b: Quat): Quat => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
const sc = (s: number, a: Quat): Quat => [s * a[0], s * a[1], s * a[2], s * a[3]];
export const bracket = (p: Quat, q: Quat): Quat => sub(qmul(p, q), qmul(q, p));
/** Ad_{ρ⁻¹}X = ρ⁻¹Xρ. */
export const adInv = (r: Quat, X: Quat): Quat => qmul(qmul(qconj(r), X), r);

/** The example potential 𝒜_x = a(−(y/2)k + b i), 𝒜_y = a((x/2)k + b j). */
export function examplePotential(a: number, b: number): Potential {
  return (x, y) => [
    [0, a * b, 0, (-a * y) / 2],
    [0, 0, a * b, (a * x) / 2],
  ];
}

/** Closed form of its curvature: 𝓕_xy = (a + 2a²b²)k + a²b(y i − x j). */
export function exampleCurvature(a: number, b: number, x: number, y: number): Quat {
  return [0, a * a * b * y, -a * a * b * x, a + 2 * a * a * b * b];
}

/** 𝓕_xy by central differences (step h). */
export function curvature(A: Potential, x: number, y: number, h = 1e-5): Quat {
  const dxAy = sc(1 / (2 * h), sub(A(x + h, y)[1], A(x - h, y)[1]));
  const dyAx = sc(1 / (2 * h), sub(A(x, y + h)[0], A(x, y - h)[0]));
  const [Ax, Ay] = A(x, y);
  return addQ(sub(dxAy, dyAx), bracket(Ax, Ay));
}

/**
 * A gauge transformation ρ = e^{α i} e^{β j} e^{γ k} with the angle functions
 * scaled by τ, and its Maurer–Cartan form ρ⁻¹dρ in closed form:
 *   ρ⁻¹dρ = Ad_{(bc)⁻¹}(i dα) + Ad_{c⁻¹}(j dβ) + k dγ.
 */
export interface Gauge {
  rho: (x: number, y: number) => Quat;
  /** [ρ⁻¹∂_xρ, ρ⁻¹∂_yρ] */
  mc: (x: number, y: number) => [Quat, Quat];
}

type Angle = { f: (x: number, y: number) => number; fx: (x: number, y: number) => number; fy: (x: number, y: number) => number };

export function makeGauge(tau: number, alpha: Angle, beta: Angle, gamma: Angle): Gauge {
  const parts = (x: number, y: number) => {
    const a = qexp([0, tau * alpha.f(x, y), 0, 0]);
    const b = qexp([0, 0, tau * beta.f(x, y), 0]);
    const c = qexp([0, 0, 0, tau * gamma.f(x, y)]);
    return { a, b, c };
  };
  return {
    rho: (x, y) => {
      const { a, b, c } = parts(x, y);
      return qmul(qmul(a, b), c);
    },
    mc: (x, y) => {
      const { b, c } = parts(x, y);
      const bc = qmul(b, c);
      const comp = (d: 'fx' | 'fy'): Quat =>
        addQ(
          addQ(adInv(bc, [0, tau * alpha[d](x, y), 0, 0]), adInv(c, [0, 0, tau * beta[d](x, y), 0])),
          [0, 0, 0, tau * gamma[d](x, y)],
        );
      return [comp('fx'), comp('fy')];
    },
  };
}

/** The station's gauge family: smooth angle functions of size ~π on the unit square. */
export function stationGauge(tau: number, wild = 1): Gauge {
  const w = wild;
  return makeGauge(
    tau,
    { f: (x, y) => w * 1.6 * Math.sin(1.3 * x + 0.4 * y), fx: (x, y) => w * 2.08 * Math.cos(1.3 * x + 0.4 * y), fy: (x, y) => w * 0.64 * Math.cos(1.3 * x + 0.4 * y) },
    { f: (x, y) => w * 1.2 * x * y, fx: (_x, y) => w * 1.2 * y, fy: (x) => w * 1.2 * x },
    { f: (x, y) => w * (1.4 * Math.cos(1.1 * y) + 0.5 * x), fx: () => w * 0.5, fy: (_x, y) => -w * 1.54 * Math.sin(1.1 * y) },
  );
}

/** Rem. 1.8.8/2: 𝒜′ = Ad_{ρ⁻¹}𝒜 + ρ*θ. */
export function transformPotential(A: Potential, g: Gauge): Potential {
  return (x, y) => {
    const r = g.rho(x, y);
    const [Ax, Ay] = A(x, y);
    const [mx, my] = g.mc(x, y);
    return [addQ(adInv(r, Ax), mx), addQ(adInv(r, Ay), my)];
  };
}

/** Composition ρ₁ρ₂ of two gauge transformations (pointwise product, Maurer–Cartan by the product rule). */
export function composeGauge(g1: Gauge, g2: Gauge): Gauge {
  return {
    rho: (x, y) => qmul(g1.rho(x, y), g2.rho(x, y)),
    mc: (x, y) => {
      const r2 = g2.rho(x, y);
      const m1 = g1.mc(x, y);
      const m2 = g2.mc(x, y);
      return [addQ(adInv(r2, m1[0]), m2[0]), addQ(adInv(r2, m1[1]), m2[1])];
    },
  };
}

/** Path-ordered transport g(t) along c: [0, 1] → R² (RK4 on ġ = −𝒜(ċ)g, renormalised each step). */
export function transportPath(
  A: Potential,
  c: (t: number) => [number, number],
  cd: (t: number) => [number, number],
  steps = 400,
): Quat[] {
  const f = (t: number, g: Quat): Quat => {
    const [x, y] = c(t);
    const [vx, vy] = cd(t);
    const [Ax, Ay] = A(x, y);
    return sc(-1, qmul(addQ(sc(vx, Ax), sc(vy, Ay)), g));
  };
  const h = 1 / steps;
  let g: Quat = [1, 0, 0, 0];
  const out: Quat[] = [g];
  for (let s = 0; s < steps; s++) {
    const t = s * h;
    const k1 = f(t, g);
    const k2 = f(t + h / 2, addQ(g, sc(h / 2, k1)));
    const k3 = f(t + h / 2, addQ(g, sc(h / 2, k2)));
    const k4 = f(t + h, addQ(g, sc(h, k3)));
    g = qnormalize(addQ(g, sc(h / 6, addQ(addQ(k1, sc(2, k2)), addQ(sc(2, k3), k4)))));
    out.push(g);
  }
  return out;
}

/** Circle of radius r about (cx, cy), counterclockwise, t ∈ [0, 1]. */
export function circle(cx: number, cy: number, r: number) {
  const w = 2 * Math.PI;
  return {
    c: (t: number): [number, number] => [cx + r * Math.cos(w * t), cy + r * Math.sin(w * t)],
    cd: (t: number): [number, number] => [-w * r * Math.sin(w * t), w * r * Math.cos(w * t)],
  };
}

/** Wilson loop: tr of the holonomy in the fundamental representation = 2·Re(Hol). */
export const wilson = (hol: Quat): number => 2 * hol[0];
