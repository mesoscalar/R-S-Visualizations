import { describe, expect, it } from 'vitest';
import { integrateRK4, integrateRKF45 } from '../src/ode';

describe('RK4 fixed-step', () => {
  it('solves dy/dt = y to 4th-order accuracy (e^1 with 1000 steps)', () => {
    // Global RK4 error ~ C h^4; h = 1e-3 gives ~1e-12 against machine-known e.
    const y = integrateRK4((_t, y) => Float64Array.of(y[0]), 0, Float64Array.of(1), 1, 1000);
    expect(Math.abs(y[0] - Math.E)).toBeLessThan(1e-11);
  });

  it('shows 4th-order convergence on the harmonic oscillator', () => {
    const f = (_t: number, y: Float64Array) => Float64Array.of(y[1], -y[0]);
    const err = (n: number) => {
      const y = integrateRK4(f, 0, Float64Array.of(1, 0), 2 * Math.PI, n);
      return Math.hypot(y[0] - 1, y[1] - 0);
    };
    const e1 = err(100);
    const e2 = err(200);
    const order = Math.log2(e1 / e2);
    expect(order).toBeGreaterThan(3.8); // halving h must cut error ~16x
    expect(order).toBeLessThan(4.3);
  });
});

describe('RKF45 adaptive', () => {
  it('meets a 1e-10 local tolerance globally within 100x on y\' = cos t', () => {
    const r = integrateRKF45((t) => Float64Array.of(Math.cos(t)), 0, Float64Array.of(0), 10, {
      tol: 1e-10,
    });
    expect(Math.abs(r.y[0] - Math.sin(10))).toBeLessThan(1e-8);
  });

  it('adapts steps: stiff-ish problem uses more steps at tight tolerance', () => {
    const f = (t: number, y: Float64Array) => Float64Array.of(-50 * (y[0] - Math.cos(t)));
    const loose = integrateRKF45(f, 0, Float64Array.of(0), 3, { tol: 1e-4 });
    const tight = integrateRKF45(f, 0, Float64Array.of(0), 3, { tol: 1e-10 });
    expect(tight.steps).toBeGreaterThan(loose.steps);
    // exact solution: y = (50/2501)(50 cos t + sin t) - (2500/2501) e^{-50 t}
    const exact = (50 / 2501) * (50 * Math.cos(3) + Math.sin(3)) - (2500 / 2501) * Math.exp(-150);
    expect(Math.abs(tight.y[0] - exact)).toBeLessThan(1e-8);
  });

  it('supports projection (norm renormalisation on a circle ODE)', () => {
    const f = (_t: number, y: Float64Array) => Float64Array.of(-y[1], y[0]);
    const project = (y: Float64Array) => {
      const n = Math.hypot(y[0], y[1]);
      y[0] /= n;
      y[1] /= n;
    };
    const r = integrateRKF45(f, 0, Float64Array.of(1, 0), 1000, { tol: 1e-9, project });
    expect(Math.abs(Math.hypot(r.y[0], r.y[1]) - 1)).toBeLessThan(1e-12);
  });
});
