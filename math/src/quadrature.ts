/**
 * Shared quadrature utilities: Gauss–Legendre on intervals, product rules on
 * S^2 and S^3 (hyperspherical), and the periodic trapezoidal rule.
 *
 * Design notes on accuracy:
 *  - Gauss–Legendre with n nodes is exact for polynomials of degree 2n-1 and
 *    converges spectrally for analytic integrands.
 *  - For 2*pi-periodic smooth integrands the uniform trapezoidal rule is
 *    spectrally accurate, so all azimuthal (phi) integrals use it.
 *
 * Pure module: no DOM / WebGL imports.
 */

export interface GLRule {
  nodes: Float64Array; // on [-1, 1]
  weights: Float64Array;
}

const glCache = new Map<number, GLRule>();

/** Gauss–Legendre nodes/weights on [-1,1] via Newton iteration on P_n. */
export function gaussLegendre(n: number): GLRule {
  const cached = glCache.get(n);
  if (cached) return cached;
  const nodes = new Float64Array(n);
  const weights = new Float64Array(n);
  const m = Math.floor((n + 1) / 2);
  for (let i = 0; i < m; i++) {
    // Initial guess (Abramowitz & Stegun 22.16.6), then Newton.
    let x = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let pp = 0;
    for (let iter = 0; iter < 100; iter++) {
      // Evaluate P_n(x) and P'_n(x) by recurrence.
      let p0 = 1;
      let p1 = x;
      for (let k = 2; k <= n; k++) {
        const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
        p0 = p1;
        p1 = p2;
      }
      pp = (n * (x * p1 - p0)) / (x * x - 1);
      const dx = p1 / pp;
      x -= dx;
      if (Math.abs(dx) < 1e-15) break;
    }
    nodes[i] = -x;
    nodes[n - 1 - i] = x;
    const w = 2 / ((1 - x * x) * pp * pp);
    weights[i] = w;
    weights[n - 1 - i] = w;
  }
  const rule = { nodes, weights };
  glCache.set(n, rule);
  return rule;
}

/** Integral of f over [a, b] with n-point Gauss–Legendre. */
export function integrateGL(f: (x: number) => number, a: number, b: number, n: number): number {
  const { nodes, weights } = gaussLegendre(n);
  const half = (b - a) / 2;
  const mid = (a + b) / 2;
  let acc = 0;
  for (let i = 0; i < n; i++) acc += weights[i] * f(mid + half * nodes[i]);
  return acc * half;
}

/** Periodic trapezoidal rule for f on [0, 2*pi) with n uniform samples. */
export function integratePeriodic(f: (x: number) => number, n: number): number {
  let acc = 0;
  const h = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) acc += f(i * h);
  return acc * h;
}

/**
 * Integral over S^2 of f(theta, phi) with respect to the round area element
 * sin(theta) dtheta dphi. Substitutes u = cos(theta) (GL in u, absorbing the
 * sin(theta) Jacobian exactly) x periodic trapezoid in phi.
 */
export function integrateS2(
  f: (theta: number, phi: number) => number,
  nTheta = 64,
  nPhi = 128,
): number {
  const { nodes, weights } = gaussLegendre(nTheta);
  const hPhi = (2 * Math.PI) / nPhi;
  let acc = 0;
  for (let i = 0; i < nTheta; i++) {
    const theta = Math.acos(nodes[i]);
    let ring = 0;
    for (let j = 0; j < nPhi; j++) ring += f(theta, j * hPhi);
    acc += weights[i] * ring * hPhi;
  }
  return acc;
}

/**
 * Integral over S^3 (radius 1, Vol = 2 pi^2) of f(p) for p in R^4, using
 * hyperspherical coordinates
 *   p = (cos chi, sin chi cos theta, sin chi sin theta cos phi, sin chi sin theta sin phi),
 *   dV = sin^2(chi) sin(theta) dchi dtheta dphi,
 * with GL in chi, GL in u = cos(theta), trapezoid in phi.
 */
export function integrateS3(
  f: (p: [number, number, number, number]) => number,
  nChi = 48,
  nTheta = 48,
  nPhi = 96,
): number {
  const chiRule = gaussLegendre(nChi);
  const uRule = gaussLegendre(nTheta);
  const hPhi = (2 * Math.PI) / nPhi;
  let acc = 0;
  for (let a = 0; a < nChi; a++) {
    // map [-1,1] -> [0, pi]
    const chi = ((chiRule.nodes[a] + 1) / 2) * Math.PI;
    const wChi = chiRule.weights[a] * (Math.PI / 2);
    const sChi = Math.sin(chi);
    const cChi = Math.cos(chi);
    for (let b = 0; b < nTheta; b++) {
      const cTheta = uRule.nodes[b];
      const sTheta = Math.sqrt(Math.max(0, 1 - cTheta * cTheta));
      const wU = uRule.weights[b];
      let ring = 0;
      for (let c = 0; c < nPhi; c++) {
        const phi = c * hPhi;
        ring += f([cChi, sChi * cTheta, sChi * sTheta * Math.cos(phi), sChi * sTheta * Math.sin(phi)]);
      }
      acc += wChi * wU * sChi * sChi * ring * hPhi;
    }
  }
  return acc;
}

/**
 * Radial integral over R^4 of a radially symmetric density:
 *   integral_{R^4} g(|x|) d^4x = 2 pi^2 integral_0^infty g(r) r^3 dr.
 * The infinite range is mapped by r = s/(1-s), s in [0,1), with Jacobian
 * dr = ds/(1-s)^2, then GL is applied in s.
 */
export function integrateR4Radial(g: (r: number) => number, n = 200): number {
  const inner = integrateGL(
    (s) => {
      const om = 1 - s;
      const r = s / om;
      return g(r) * r * r * r / (om * om);
    },
    0,
    1,
    n,
  );
  return 2 * Math.PI * Math.PI * inner;
}
