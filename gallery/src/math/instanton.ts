/**
 * Widget 6 kernel — BPST one-instanton topological charge density.
 *
 *   q(x) = (6/pi^2) rho^4 / (|x - a|^2 + rho^2)^4,   ∫_{R^4} q d^4x = 1
 *
 * for every centre a and scale rho — the noncompact moduli direction squeezes
 * the bump but cannot change the charge. Radial reduction (the density is
 * radially symmetric about a):  ∫ q d^4x = 2 pi^2 ∫_0^∞ q(r) r^3 dr.
 *
 * Pure module: no DOM / WebGL imports.
 */

import { gaussLegendre, integrateR4Radial } from '@rsvis/math';

export type Vec4 = [number, number, number, number];

/** Density at radial distance r from the centre. */
export function bpstRadial(r: number, rho: number): number {
  const d = r * r + rho * rho;
  return ((6 / (Math.PI * Math.PI)) * rho ** 4) / (d * d * d * d);
}

export function bpstDensity(x: Vec4, a: Vec4, rho: number): number {
  const r = Math.hypot(x[0] - a[0], x[1] - a[1], x[2] - a[2], x[3] - a[3]);
  return bpstRadial(r, rho);
}

/** Total charge by the radial reduction (exact symmetry, cheap quadrature). */
export function totalCharge(rho: number, n = 200): number {
  return integrateR4Radial((r) => bpstRadial(r, rho), n);
}

/**
 * Scheme cross-check: full 4D tensor Gauss–Legendre with the rational map
 * x = s/(1-s^2) per axis (handles the 1/r^8 tail), centre offset included —
 * validates the radial reduction independently.
 */
export function totalCharge4D(a: Vec4, rho: number, nPerAxis = 24): number {
  const { nodes, weights } = gaussLegendre(nPerAxis);
  const xs = new Float64Array(nPerAxis);
  const ws = new Float64Array(nPerAxis);
  for (let i = 0; i < nPerAxis; i++) {
    const s = nodes[i];
    const om = 1 - s * s;
    xs[i] = s / om;
    ws[i] = (weights[i] * (1 + s * s)) / (om * om);
  }
  let acc = 0;
  for (let i = 0; i < nPerAxis; i++) {
    for (let j = 0; j < nPerAxis; j++) {
      for (let k = 0; k < nPerAxis; k++) {
        let inner = 0;
        for (let l = 0; l < nPerAxis; l++) {
          inner += ws[l] * bpstDensity([xs[i], xs[j], xs[k], xs[l]], a, rho);
        }
        acc += ws[i] * ws[j] * ws[k] * inner;
      }
    }
  }
  return acc;
}

/**
 * Density sampled on an m^3 grid over the 3D slice x_4 = x4, cube of
 * half-extent `half` centred on (a_1, a_2, a_3). m should be odd so the grid
 * contains the centre exactly. Returns flat values (i-major) and the argmax.
 */
export function sliceGrid(
  a: Vec4,
  rho: number,
  x4: number,
  half: number,
  m: number,
): { values: Float64Array; max: number; argmax: [number, number, number]; step: number } {
  const values = new Float64Array(m * m * m);
  const step = (2 * half) / (m - 1);
  let max = -Infinity;
  let argmax: [number, number, number] = [0, 0, 0];
  let idx = 0;
  for (let i = 0; i < m; i++) {
    const x = a[0] - half + i * step;
    for (let j = 0; j < m; j++) {
      const y = a[1] - half + j * step;
      for (let k = 0; k < m; k++) {
        const z = a[2] - half + k * step;
        const v = bpstDensity([x, y, z, x4], a, rho);
        values[idx++] = v;
        if (v > max) {
          max = v;
          argmax = [i, j, k];
        }
      }
    }
  }
  return { values, max, argmax, step };
}

/** Analytic peak of the slice x_4 = c: at (a1, a2, a3), value q(|c - a4|). */
export function slicePeak(a: Vec4, rho: number, x4: number): number {
  return bpstRadial(Math.abs(x4 - a[3]), rho);
}
