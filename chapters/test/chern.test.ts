import { describe, expect, it } from 'vitest';
import { mulberry32, omegaC } from '@rsvis/math';
import { chernA, chernF12, circleLoop, fluxThroughDisk, metricH, transportCoefficient, unitaryFrame, type Cx } from '../src/math/chern';

const rng = mulberry32(2601);
const r = () => 2 * rng() - 1;
const rz = (s = 1.5): Cx => [s * r(), s * r()];
const H = 1e-5;
// one central difference with step 1e-5 on O(1) smooth functions: truncation ~1e-10, roundoff ~1e-11
const FD = 1e-8;

describe('Station 2.6a — the Chern connection of the tautological bundle (§2.6)', () => {
  it('(2.6.6): compatibility with h, dH = 𝒜̄H + H𝒜, i.e. d log H = 2 Re 𝒜', () => {
    for (let n = 0; n < 200; n++) {
      const z = rz();
      const X: [number, number] = [r(), r()];
      const dlogH = (Math.log(metricH([z[0] + H * X[0], z[1] + H * X[1]])) - Math.log(metricH([z[0] - H * X[0], z[1] - H * X[1]]))) / (2 * H);
      expect(Math.abs(dlogH - 2 * chernA(z, X)[0])).toBeLessThan(FD);
    }
  });

  it('Def. 2.6.7: 𝒜 is of type (1,0), 𝒜(JX) = i𝒜(X), so ∇^{0,1} = ∂̄ on holomorphic frames', () => {
    for (let n = 0; n < 200; n++) {
      const z = rz();
      const X: [number, number] = [r(), r()];
      const a = chernA(z, X);
      const b = chernA(z, [-X[1], X[0]]);
      expect(Math.hypot(b[0] + a[1], b[1] - a[0])).toBeLessThan(1e-15);
    }
  });

  it('Cor. 2.6.10: 𝓕 = ∂̄𝒜 = d𝒜 = 2i/(1+|z|²)² dx∧dy, of type (1,1)', () => {
    for (let n = 0; n < 200; n++) {
      const z = rz();
      const d1A2 = chernA([z[0] + H, z[1]], [0, 1]).map((v, i) => (v - chernA([z[0] - H, z[1]], [0, 1])[i]) / (2 * H));
      const d2A1 = chernA([z[0], z[1] + H], [1, 0]).map((v, i) => (v - chernA([z[0], z[1] - H], [1, 0])[i]) / (2 * H));
      const F = chernF12(z);
      expect(Math.hypot(d1A2[0] - d2A1[0] - F[0], d1A2[1] - d2A1[1] - F[1])).toBeLessThan(FD);
    }
  });

  it('the unitary gauge is the Hopf connection of Chapter 1: 𝒜 − ½ d log H = i·ω_c(ê_* X)', () => {
    for (let n = 0; n < 200; n++) {
      const z = rz();
      const X: [number, number] = [r(), r()];
      const e = unitaryFrame(z);
      const ep = unitaryFrame([z[0] + H * X[0], z[1] + H * X[1]]);
      const em = unitaryFrame([z[0] - H * X[0], z[1] - H * X[1]]);
      const de = e.map((_, i) => (ep[i] - em[i]) / (2 * H));
      // 𝒜 − ½ d log H = i Im 𝒜
      expect(Math.abs(omegaC(e, de) - chernA(z, X)[1])).toBeLessThan(FD);
    }
  });

  it('transport keeps h(φ, φ) = |c|²H, and the holonomy around a circle is exp(−∫∫𝓕)', () => {
    for (let n = 0; n < 20; n++) {
      const z0 = rz(1);
      const rad = 0.2 + rng();
      const loop = circleLoop(z0, rad);
      const cs = transportCoefficient(loop.z, loop.zdot, [1, 0], 800);
      for (let i = 0; i < cs.length; i += 100) {
        const norm = (cs[i][0] ** 2 + cs[i][1] ** 2) * metricH(loop.z(i / 800));
        // RK4 with 800 steps: relative error ≲ 1e-10
        expect(Math.abs(norm - metricH(loop.z(0)) * 1)).toBeLessThan(1e-8);
      }
      const end = cs[cs.length - 1];
      const angle = Math.atan2(end[1], end[0]);
      const flux = fluxThroughDisk(z0, rad, 400);
      const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
      // midpoint rule on a 400 × 400 polar grid: O(n⁻²) ≈ 1e-6 relative
      expect(Math.abs(wrap(angle + flux))).toBeLessThan(1e-5);
    }
  });

  it('the first Chern number (i/2π)∫𝓕 of the tautological bundle is −1', () => {
    // ∫ over C of 2/(1+r²)² = 2π: radial Simpson in r = tan s
    const N = 400;
    const f = (s: number) => {
      if (s >= Math.PI / 2) return 0;
      const rr = Math.tan(s);
      return (2 / (1 + rr * rr) ** 2) * 2 * Math.PI * rr * (1 + rr * rr);
    };
    const h = Math.PI / 2 / N;
    let sum = f(0) + f(Math.PI / 2);
    for (let k = 1; k < N; k++) sum += (k % 2 ? 4 : 2) * f(k * h);
    const imIntegral = (sum * h) / 3;
    // (i/2π)·(i·imIntegral) = −imIntegral/2π; Simpson O(N⁻⁴) ≈ 1e-11
    expect(Math.abs(-imIntegral / (2 * Math.PI) + 1)).toBeLessThan(1e-9);
  });
});
