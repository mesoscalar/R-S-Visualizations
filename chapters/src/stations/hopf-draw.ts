/**
 * Drawing helpers for the Hopf bundle in stereographic S³ → R³ (projection
 * from (0, 0, 0, 1), i.e. z2 = i, which lies on the fibre over the south pole).
 * Shared by the Chapter 1 stations; geometry comes from @rsvis/math.
 */
import * as THREE from 'three';
import { actU1, stereographic, type Vec3, type Vec4 } from '@rsvis/math';
import { coloredTube, phaseColor } from './three-helpers';

/** Points farther than this from the origin are clipped (fibres near the south pole). */
export const CLIP_R = 9;

export interface FibrePiece {
  pts: Vec3[];
  /** Fibre parameter α of each point, z(α) = z0 · e^{iα}. */
  alphas: number[];
  closed: boolean;
}

/** The fibre through z0 sampled at N points, split where it leaves the ball of radius CLIP_R. */
export function fibrePieces(z0: ArrayLike<number>, N = 256): FibrePiece[] {
  const pieces: FibrePiece[] = [];
  let cur: FibrePiece | null = null;
  let clipped = false;
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N;
    const p = stereographic(actU1(z0, a));
    if (Math.hypot(...p) > CLIP_R) {
      clipped = true;
      cur = null;
      continue;
    }
    if (!cur) {
      cur = { pts: [], alphas: [], closed: false };
      pieces.push(cur);
    }
    cur.pts.push(p);
    cur.alphas.push(a);
  }
  if (!clipped && pieces.length === 1) pieces[0].closed = true;
  // a clipped fibre that wraps through i = 0 is split in two; glue the ends
  if (clipped && pieces.length > 1) {
    const first = pieces[0];
    const last = pieces[pieces.length - 1];
    if (first.alphas[0] === 0 && last.alphas[last.alphas.length - 1] === (2 * Math.PI * (N - 1)) / N) {
      last.pts.push(...first.pts);
      last.alphas.push(...first.alphas.map((a) => a + 2 * Math.PI));
      pieces.shift();
    }
  }
  return pieces;
}

/** Tube(s) along the fibre through z0, coloured by `phaseOf(α)` on the hue wheel. */
export function fibreMesh(
  z0: Vec4,
  phaseOf: ((alpha: number) => number) | null,
  radius = 0.03,
  flat = new THREE.Color(0x8a93a6),
): THREE.Group {
  const g = new THREE.Group();
  for (const piece of fibrePieces(z0)) {
    if (piece.pts.length < 2) continue;
    const cols = piece.alphas.map((a) => (phaseOf ? phaseColor(phaseOf(a)) : flat));
    g.add(coloredTube(piece.pts, cols, radius, piece.closed));
  }
  return g;
}

export function ball(radius: number, color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 12), new THREE.MeshBasicMaterial({ color }));
}

export function setPos(obj: THREE.Object3D, p: ArrayLike<number>): void {
  obj.position.set(p[0], p[1], p[2]);
}
