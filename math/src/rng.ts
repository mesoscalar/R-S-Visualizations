/**
 * Deterministic seeded PRNG (mulberry32) so every Monte Carlo experiment and
 * every randomised test is reproducible. Pure module.
 */

export type Rng = () => number; // uniform on [0, 1)

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box–Muller. */
export function gaussian(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Uniform point on S^3 (unit quaternion) from a seeded RNG. */
export function randomUnitQuat(rng: Rng): [number, number, number, number] {
  let w = 0, x = 0, y = 0, z = 0, n = 0;
  do {
    w = gaussian(rng);
    x = gaussian(rng);
    y = gaussian(rng);
    z = gaussian(rng);
    n = Math.hypot(w, x, y, z);
  } while (n < 1e-6);
  return [w / n, x / n, y / n, z / n];
}
