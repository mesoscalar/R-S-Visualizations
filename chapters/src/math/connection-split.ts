/**
 * Station G kernel — vertical and horizontal subspaces of the Hopf bundle
 * for the canonical connection ω_c (Lemma 1.3.1, Def. 1.3.2, Rem. 1.3.3,
 * Def. 1.3.4, Prop. 1.3.5; (1.3.1), (1.3.2), (1.3.6), (1.3.7); Ex. 1.3.22/1.3.23).
 *
 * At z ∈ S³: V_z = R·iz (Killing field of i ∈ u(1)), Γ_z = ker ω_c = span{jz, kz}
 * (left quaternion multiplication, see @rsvis/math hopf). For X ∈ T_z S³ with
 * ω_c(X) = i·a, (1.3.7) gives hor X = X − Ψ'_z(ω_c(X)) = X − a·iz.
 *
 * Pure module: no DOM / WebGL imports.
 */
import {
  actU1,
  fromPolar,
  hopfDifferential,
  jq,
  killingI,
  kq,
  omegaC,
  potential1Phi,
  section1,
  type Vec3,
  type Vec4,
} from '@rsvis/math';

const axpy = (a: number, x: ArrayLike<number>, y: ArrayLike<number>): Vec4 => [
  a * x[0] + y[0],
  a * x[1] + y[1],
  a * x[2] + y[2],
  a * x[3] + y[3],
];

/** ver X = Ψ'_z(ω_c(X)) = a·iz where ω_c(X) = i·a (Def. 1.3.4 read backwards). */
export function verticalPart(z: ArrayLike<number>, X: ArrayLike<number>): Vec4 {
  return axpy(omegaC(z, X), killingI(z), [0, 0, 0, 0]);
}

/** hor X = X − Ψ'_z(ω_c(X))  (1.3.7). */
export function horizontalPart(z: ArrayLike<number>, X: ArrayLike<number>): Vec4 {
  return axpy(-omegaC(z, X), killingI(z), X);
}

/**
 * Tangent vector X = cos e (cos b · jz + sin b · kz) + sin e · iz: elevation e
 * out of the horizontal plane, bearing b inside it. Used by the UI sliders.
 */
export function tangentFromAngles(z: ArrayLike<number>, e: number, b: number): Vec4 {
  const h = axpy(Math.sin(b), kq(z), axpy(Math.cos(b), jq(z), [0, 0, 0, 0]));
  return axpy(Math.sin(e), killingI(z), axpy(Math.cos(e), h, [0, 0, 0, 0]));
}

/**
 * Horizontal lift of v ∈ T_{π(z)} S² to z (Rem. 1.3.3/2). dπ maps {jz, kz}
 * orthogonally with factor 2 (asserted in @rsvis/math hopf tests), so the
 * inverse is X^h = Σ (dπ(e)·v)/4 · e over e ∈ {jz, kz}.
 */
export function horizontalLiftVector(z: ArrayLike<number>, v: Vec3): Vec4 {
  let out: Vec4 = [0, 0, 0, 0];
  for (const e of [jq(z), kq(z)]) {
    const de = hopfDifferential(z, e);
    out = axpy((de[0] * v[0] + de[1] * v[1] + de[2] * v[2]) / 4, e, out);
  }
  return out;
}

/**
 * Horizontal curves on the torus over the latitude θ0, in chart-1
 * coordinates p = s1(θ0, φ)·e^{iα}: by Prop. 1.3.11, ω_c = i(dα + 𝒜_1φ dφ)
 * there, so horizontal means α(φ) = α0 − 𝒜_1φ(θ0) φ.
 */
export function horizontalTorusCurve(theta0: number, alpha0: number): (phi: number) => Vec4 {
  const slope = -potential1Phi(theta0);
  return (phi) => actU1(section1(fromPolar(theta0, phi))!, alpha0 + slope * phi);
}

/** Curves α = const in chart 1: horizontal for the flat chart connection κ1^*θ ((1.3.8)), as dα on S²×U(1). */
export function chartFlatCurve(theta0: number, alpha0: number): (phi: number) => Vec4 {
  return (phi) => actU1(section1(fromPolar(theta0, phi))!, alpha0);
}
