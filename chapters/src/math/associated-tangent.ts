/**
 * Station 1.2b kernel — TS² as the bundle associated with the frame bundle,
 * TS² ≅ O⁺(S²) ×_{SO(2)} R² (Def. 1.2.1, Rem. 1.2.3, Prop. 1.2.6, Rem. 1.2.9/2; (1.2.2)–(1.2.5)).
 *
 * ι_f(ξ) = ξ1 u1 + ξ2 u2 identifies R² with the fibre over x (1.2.2), and
 * [(f·b, b⁻¹ξ)] = [(f, ξ)] (Rem. 1.2.3/2, (1.2.3)). A vector field v is the
 * equivariant map Φ̃(f) = (v·u1, v·u2), Φ̃(f·b) = b⁻¹Φ̃(f) (Prop. 1.2.6), and
 * its local representatives ξ_N = Φ̃∘s_N, ξ_S = Φ̃∘s_S obey ξ_N = b(ρ_NS) ξ_S (1.2.5).
 *
 * Pure module: no DOM / WebGL imports.
 */
import { dot3, sectionN, sectionS, type Frame, type Vec3 } from '@rsvis/math';

export type Vec2 = [number, number];

export function rot2(beta: number, v: Vec2): Vec2 {
  const c = Math.cos(beta);
  const s = Math.sin(beta);
  return [c * v[0] - s * v[1], s * v[0] + c * v[1]];
}

/** ι_f(ξ) = ξ1 u1 + ξ2 u2. */
export function iota(f: Frame, xi: Vec2): Vec3 {
  return [0, 1, 2].map((i) => xi[0] * f.u1[i] + xi[1] * f.u2[i]) as Vec3;
}

/** Φ̃(f) = components of v in the frame f. */
export function components(f: Frame, v: Vec3): Vec2 {
  return [dot3(v, f.u1), dot3(v, f.u2)];
}

/** Tangent gradient field of h(x) = a·x + xᵀQx (Q symmetric), projected onto T_xS². */
export function gradientField(a: Vec3, Q: [Vec3, Vec3, Vec3]): (x: Vec3) => Vec3 {
  return (x) => {
    const g: Vec3 = [0, 1, 2].map((i) => a[i] + 2 * dot3(Q[i], x)) as Vec3;
    const n = dot3(g, x);
    return [g[0] - n * x[0], g[1] - n * x[1], g[2] - n * x[2]];
  };
}

export function localComponents(which: 'N' | 'S', v: (x: Vec3) => Vec3, x: Vec3): Vec2 | null {
  const f = which === 'N' ? sectionN(x) : sectionS(x);
  return f ? components(f, v(x)) : null;
}
