/**
 * Winding number of a closed polyline in C^* about the origin.
 *
 * For a closed polygon with vertices p_0 ... p_{m-1} (p_m = p_0), none at the
 * origin and no edge passing exactly through it, the total argument change is
 *   sum_i atan2( cross(p_i, p_{i+1}), dot(p_i, p_{i+1}) ),
 * each term being the principal-branch increment in (-pi, pi]. The sum is
 * exactly 2*pi*(integer); this is the discrete version of
 *   n = (1/2 pi) closed-integral d(arg c).
 *
 * Pure module: no DOM / WebGL imports.
 */

export interface WindingResult {
  /** Rounded integer winding number. */
  n: number;
  /** Raw total angle / 2 pi before rounding (diagnostic; |raw - n| ~ 1e-16 * m). */
  raw: number;
  /** Minimum distance from any vertex to the origin (0 means ill-defined). */
  minRadius: number;
}

export function windingNumber(points: ReadonlyArray<readonly [number, number]>): WindingResult {
  const m = points.length;
  if (m < 3) return { n: 0, raw: 0, minRadius: Infinity };
  let total = 0;
  let minRadius = Infinity;
  for (let i = 0; i < m; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % m];
    const r = Math.hypot(ax, ay);
    if (r < minRadius) minRadius = r;
    const cross = ax * by - ay * bx;
    const dot = ax * bx + ay * by;
    total += Math.atan2(cross, dot);
  }
  const raw = total / (2 * Math.PI);
  return { n: Math.round(raw), raw, minRadius };
}

/** Sample a parametric loop c: [0, 2 pi) -> C at m uniform points. */
export function sampleLoop(
  c: (t: number) => [number, number],
  m: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < m; i++) pts.push(c((2 * Math.PI * i) / m));
  return pts;
}
