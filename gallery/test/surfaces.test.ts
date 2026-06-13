import { describe, expect, it } from 'vitest';
import { geodesicArc } from '../src/math/hopf';
import {
  CATENOID,
  CYLINDER,
  gaussCurvature,
  geodesicFlow,
  holonomyAngle,
  normalAt,
  PLANE,
  SPHERE,
  TORUS,
  TORUS_RADII,
  transportAlongCurve,
  transportOnSurface,
  unitSpeed,
  type Vec3,
  integrateKOverEllipse,
} from '../src/math/surfaces';

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

describe('Widget 4 — parallel transport on surfaces kernel', () => {
  it('generic Gauss curvature matches analytic values on all surfaces (1e-12)', () => {
    // K from fundamental forms vs closed forms — exact up to roundoff since all
    // derivatives are analytic.
    for (const [u, v] of [
      [0.7, 1.1],
      [2.4, 0.6],
      [5.1, 2.0],
    ]) {
      expect(Math.abs(gaussCurvature(SPHERE, u, v) - 1)).toBeLessThan(1e-12);
      expect(Math.abs(gaussCurvature(CYLINDER, u, Math.min(v, 1.3)))).toBeLessThan(1e-12);
      expect(Math.abs(gaussCurvature(PLANE, u / 4, v / 4))).toBeLessThan(1e-12);
      const { R, r } = TORUS_RADII;
      expect(
        Math.abs(gaussCurvature(TORUS, u, v) - Math.cos(v) / (r * (R + r * Math.cos(v)))),
      ).toBeLessThan(1e-12);
      const vc = Math.min(v, 1.1);
      expect(Math.abs(gaussCurvature(CATENOID, u, vc) + 1 / Math.cosh(vc) ** 4)).toBeLessThan(
        1e-12,
      );
    }
  });

  // (a) Spec: |X| preserved to 1e-9.
  it('(a) |X| and tangency preserved to 1e-9 along a wiggly torus loop', () => {
    const uv = (t: number): [number, number] => [t, 1.0 + 0.9 * Math.sin(t)];
    const uvDot = (t: number): [number, number] => [1, 0.9 * Math.cos(t)];
    // X0: tangent at uv(0) — take ru normalised.
    const ru0 = TORUS.ru(0, 1.0);
    const X0: Vec3 = [ru0[0] / norm(ru0), ru0[1] / norm(ru0), ru0[2] / norm(ru0)];
    const path = transportOnSurface(TORUS, uv, uvDot, X0, 0, 2 * Math.PI, 4000);
    // RK4 at h ~ 1.6e-3: global drift ~ h^4 ~ 1e-12, comfortably under 1e-9.
    let maxNormDrift = 0;
    let maxTangencyDrift = 0;
    for (let i = 0; i < path.length; i++) {
      const t = (2 * Math.PI * i) / (path.length - 1);
      maxNormDrift = Math.max(maxNormDrift, Math.abs(norm(path[i]) - 1));
      const [u, v] = uv(t);
      maxTangencyDrift = Math.max(maxTangencyDrift, Math.abs(dot(path[i], normalAt(TORUS, u, v))));
    }
    expect(maxNormDrift).toBeLessThan(1e-9);
    expect(maxTangencyDrift).toBeLessThan(1e-9);
  });

  // (b) Spec: sphere triangle holonomy = spherical excess to 1e-6.
  it('(b) octant triangle on the sphere: holonomy = excess = π/2 to 1e-6', () => {
    const X: Vec3 = [1, 0, 0];
    const Y: Vec3 = [0, 1, 0];
    const Z: Vec3 = [0, 0, 1];
    let vec: Vec3 = [0, 1, 0];
    for (const s of [geodesicArc(X, Y), geodesicArc(Y, Z), geodesicArc(Z, X)]) {
      // On the unit sphere the normal along the curve IS the curve: N = gamma.
      const path = transportAlongCurve(
        (t) => s.gamma(t) as Vec3,
        (t) => s.gammaDot(t) as Vec3,
        vec,
        0,
        1,
        2000,
      );
      vec = path[path.length - 1];
    }
    // Sign convention measured once: CCW traversal (X->Y->Z seen from (1,1,1),
    // outward normal) rotates the frame by +excess.
    expect(Math.abs(holonomyAngle([0, 1, 0], vec, X) - Math.PI / 2)).toBeLessThan(1e-6);
  });

  // (c) Spec: cylinder and plane have zero holonomy to 1e-9.
  it('(c) cylinder loop (around the cylinder, with wiggle) has holonomy 0 to 1e-9', () => {
    const uv = (t: number): [number, number] => [t, 0.6 * Math.sin(t)];
    const uvDot = (t: number): [number, number] => [1, 0.6 * Math.cos(t)];
    const ru0 = CYLINDER.ru(0, 0);
    const X0: Vec3 = [
      0.6 * (ru0[0] / norm(ru0)),
      0.6 * (ru0[1] / norm(ru0)) + 0, // length 1 mix of ru and rv directions
      0.8,
    ];
    const path = transportOnSurface(CYLINDER, uv, uvDot, X0, 0, 2 * Math.PI, 4000);
    const angle = holonomyAngle(X0, path[path.length - 1], normalAt(CYLINDER, 0, 0));
    expect(Math.abs(angle)).toBeLessThan(1e-9); // flat: visibly bent, zero curvature
  });

  it('(c) plane loop has holonomy exactly 0 (N constant ⇒ Ẋ = 0)', () => {
    const uv = (t: number): [number, number] => [Math.cos(t), Math.sin(t)];
    const uvDot = (t: number): [number, number] => [-Math.sin(t), Math.cos(t)];
    const X0: Vec3 = [0.3, 0.9, 0];
    const path = transportOnSurface(PLANE, uv, uvDot, X0, 0, 2 * Math.PI, 1000);
    const angle = holonomyAngle(X0, path[path.length - 1], [0, 0, 1]);
    expect(Math.abs(angle)).toBeLessThan(1e-12);
  });

  // (d) Spec: sphere Jacobi field along a unit-speed geodesic = sin t to 1e-6.
  it('(d) sphere Jacobi field J(t) = sin t to 1e-6 (J(0)=0, J\'(0)=1)', () => {
    const g = geodesicFlow(SPHERE, 0, Math.PI / 2, 1, 0, Math.PI - 0.2, 4000, true, 0, 1);
    // K = 1 exactly on the sphere, so J'' = -J integrates to sin t with RK4
    // truncation ~h^4 ~ 1e-13; spec tolerance 1e-6.
    let maxErr = 0;
    for (let i = 0; i < g.ts.length; i++) {
      maxErr = Math.max(maxErr, Math.abs(g.Js![i] - Math.sin(g.ts[i])));
    }
    expect(maxErr).toBeLessThan(1e-6);
  });

  it('Gauss–Bonnet for arbitrary loops: holonomy = ∫∫K dA on sphere/torus/catenoid (1e-6)', () => {
    // The full theorem, beyond geodesic triangles: transport around the
    // boundary of a parameter ellipse vs. the curvature integral inside it.
    const cases: Array<{ S: typeof SPHERE; u0: number; v0: number; a: number; b: number }> = [
      { S: SPHERE, u0: 1.0, v0: 1.2, a: 0.5, b: 0.4 },
      { S: TORUS, u0: 0.8, v0: 0.7, a: 0.6, b: 0.5 },
      { S: CATENOID, u0: 2.0, v0: 0.1, a: 0.5, b: 0.6 },
    ];
    for (const { S, u0, v0, a, b } of cases) {
      const uv = (t: number): [number, number] => [u0 + a * Math.cos(t), v0 + b * Math.sin(t)];
      const uvDot = (t: number): [number, number] => [-a * Math.sin(t), b * Math.cos(t)];
      const ru0 = S.ru(...uv(0));
      const X0: Vec3 = [ru0[0] / norm(ru0), ru0[1] / norm(ru0), ru0[2] / norm(ru0)];
      const path = transportOnSurface(S, uv, uvDot, X0, 0, 2 * Math.PI, 6000);
      const measured = holonomyAngle(X0, path[path.length - 1], normalAt(S, ...uv(0)));
      // CCW parameter loop & outward-normal orientation give +∫K dA, the sign
      // measured once on the octant (see test b). Compare mod 2π.
      const predicted = integrateKOverEllipse(S, u0, v0, a, b);
      const wrapped = Math.atan2(Math.sin(predicted), Math.cos(predicted));
      // RK4 transport ~1e-12; the quadrature (smooth integrand, 48x96) dominates
      // but is spectrally convergent — 1e-6 is comfortable.
      expect(Math.abs(measured - wrapped)).toBeLessThan(1e-6);
    }
  });

  it('geodesics: unit speed is preserved; sphere geodesics are great circles', () => {
    // torus geodesic: metric speed conserved to 1e-9
    const [du, dv] = unitSpeed(TORUS, 0.3, 0.9, 0.7, 0.4);
    const g = geodesicFlow(TORUS, 0.3, 0.9, du, dv, 6, 6000);
    const speedAt = (i: number): number => {
      const [u, v] = g.uvs[i];
      const ru = TORUS.ru(u, v);
      const rv = TORUS.rv(u, v);
      const E = dot(ru, ru);
      const F = dot(ru, rv);
      const G = dot(rv, rv);
      // metric speed from centred finite differences of the parameter path
      const h = 6 / (g.uvs.length - 1);
      const j = Math.max(1, Math.min(g.uvs.length - 2, i));
      const dudt = (g.uvs[j + 1][0] - g.uvs[j - 1][0]) / (2 * h);
      const dvdt = (g.uvs[j + 1][1] - g.uvs[j - 1][1]) / (2 * h);
      return Math.sqrt(E * dudt * dudt + 2 * F * dudt * dvdt + G * dvdt * dvdt);
    };
    // FD differentiation limits accuracy to ~h^2 ~ 1e-6; the underlying
    // conservation is far better (checked at 1e-4 here as a smoke test).
    expect(Math.abs(speedAt(3000) - 1)).toBeLessThan(1e-4);

    // sphere geodesic from equator stays on the equator plane to 1e-12
    const ge = geodesicFlow(SPHERE, 0, Math.PI / 2, 1, 0, Math.PI - 0.2, 4000);
    let maxZ = 0;
    for (const p of ge.points) maxZ = Math.max(maxZ, Math.abs(p[2]));
    expect(maxZ).toBeLessThan(1e-12);
  });
});
