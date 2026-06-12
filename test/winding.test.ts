import { describe, expect, it } from 'vitest';
import { sampleLoop, windingNumber } from '../src/math/winding';

describe('winding number (shared utility smoke tests)', () => {
  it('unit circle winds once', () => {
    const r = windingNumber(sampleLoop((t) => [Math.cos(t), Math.sin(t)], 100));
    expect(r.n).toBe(1);
    expect(Math.abs(r.raw - 1)).toBeLessThan(1e-12);
  });

  it('clockwise circle winds -1', () => {
    const r = windingNumber(sampleLoop((t) => [Math.cos(-t), Math.sin(-t)], 100));
    expect(r.n).toBe(-1);
  });

  it('loop not enclosing the origin winds 0', () => {
    const r = windingNumber(sampleLoop((t) => [3 + Math.cos(t), Math.sin(t)], 100));
    expect(r.n).toBe(0);
    expect(Math.abs(r.raw)).toBeLessThan(1e-12);
  });

  it('square path (non-smooth) winds once', () => {
    const pts: Array<[number, number]> = [
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ];
    expect(windingNumber(pts).n).toBe(1);
  });
});
