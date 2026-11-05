/**
 * Book manifest for Chapter 4 of Rudolph & Schmidt, Differential Geometry and
 * Mathematical Physics, Part II (Springer 2017).
 *
 * Every number, title and page here was read off the book itself (pp. 257–352);
 * nothing is guessed. Gists are one-line paraphrases, not quotations.
 * Only §§4.6 and 4.7 are itemised: the stations for this chapter were chosen
 * from them; the other sections carry their table-of-contents entries.
 */
import type { BookSection, Station } from './types';

const D = 'Definition' as const;
const P = 'Proposition' as const;
const T = 'Theorem' as const;
const L = 'Lemma' as const;
const C = 'Corollary' as const;
const E = 'Example' as const;
const R = 'Remark' as const;

export const CHAPTER = {
  num: 4,
  title: 'Cohomology Theory of Fibre Bundles. Characteristic Classes',
};

export const SECTIONS: BookSection[] = [
  { num: '4.1', title: 'Basics', page: 258, items: [] },
  { num: '4.2', title: 'Characteristic Classes for the Classical Groups', page: 267, items: [] },
  { num: '4.3', title: 'Whitney Sum Formula and Splitting Principle', page: 284, items: [] },
  { num: '4.4', title: 'Field Restriction and Field Extension', page: 297, items: [] },
  { num: '4.5', title: 'Characteristic Classes for Manifolds', page: 308, items: [] },
  {
    num: '4.6',
    title: 'The Weil Homomorphism',
    page: 311,
    items: [
      { kind: L, num: '4.6.1', page: 313, gist: 'Polarization identifies invariant polynomials on $\\mathfrak g$ with symmetric invariant multilinear forms.' },
      { kind: L, num: '4.6.2', page: 313, gist: '$\\pi^*$ identifies forms on $M$ with $G$-invariant horizontal forms on $P$, and $d$ preserves the latter.' },
      { kind: R, num: '4.6.3', page: 314, gist: 'In a basis, $h_\\alpha(\\xi)$ plugs the coefficient 2-forms of $\\alpha$ into $\\xi$ with wedge products (4.6.7).' },
      { kind: L, num: '4.6.4', page: 314, gist: '$h_\\alpha$ is an algebra homomorphism; for the curvature, $h_\\Omega(\\xi)$ is closed and basic.' },
      { kind: L, num: '4.6.5', page: 315, gist: 'Two connections give characteristic forms differing by an exact form (transgression along $\\omega_0 + t(\\omega_1-\\omega_0)$).' },
      { kind: D, num: '4.6.6', title: 'Weil homomorphism', page: 316, gist: '$w_P: \\mathrm{Pol}_G(\\mathfrak g)\\to H^*_{dR}(M)$, $\\xi\\mapsto[h_\\Omega(\\xi)]$, independent of the connection.' },
      { kind: P, num: '4.6.7', page: 317, gist: 'Naturality: $w_P\\circ(d\\lambda)^* = f^*\\circ w_Q$ for bundle morphisms.' },
      { kind: C, num: '4.6.8', page: 318, gist: 'Isomorphic bundles have the same Weil homomorphism; $w_P(\\xi)$ is a characteristic class.' },
      { kind: L, num: '4.6.9', page: 319, gist: 'Invariant polynomials are determined by their restriction to a maximal torus (Weyl-invariant).' },
      { kind: R, num: '4.6.10', page: 322, gist: 'In practice: insert the matrix entries of $\\tfrac{i}{2\\pi}\\Omega$ into the polynomial, with wedge products.' },
      { kind: T, num: '4.6.11', page: 323, gist: 'For $U(n)$-bundles, $w_P(\\sigma_k^U) = c_k(P)$: Chern classes are Chern–Weil forms.' },
      { kind: C, num: '4.6.12', page: 326, gist: 'Chern numbers are integrals of the Chern–Weil forms over cycles.' },
      { kind: L, num: '4.6.13', page: 328, gist: 'Restricting the elementary symmetric polynomials from $\\mathfrak u(n)$ to $\\mathfrak o(n)$: odd ones vanish.' },
      { kind: T, num: '4.6.14', page: 328, gist: 'For $O(n)$, $w_P(\\sigma_k^O) = p_k(P)$; for $SO(2l)$ the Pfaffian gives the Euler class.' },
      { kind: C, num: '4.6.15', page: 330, gist: 'Pontryagin numbers as integrals of Chern–Weil forms.' },
      { kind: T, num: '4.6.16', page: 330, gist: 'The same for $Sp(n)$-bundles and their Pontryagin classes.' },
      { kind: C, num: '4.6.17', page: 330, gist: 'Symplectic Pontryagin numbers as integrals.' },
      { kind: L, num: '4.6.18', page: 332, gist: 'Characteristic forms of vector bundles: algebra homomorphism and naturality under vertical morphisms.' },
      { kind: L, num: '4.6.19', page: 333, gist: 'The curvature endomorphism form of an associated vector bundle computes the same forms.' },
      { kind: C, num: '4.6.20', page: 334, gist: 'Characteristic classes of vector bundles from the curvature of any compatible connection.' },
      { kind: R, num: '4.6.21', page: 334, gist: 'Total Chern form $\\det(\\mathbb 1 + \\tfrac{i}{2\\pi}R)$.' },
      { kind: E, num: '4.6.22', page: 335, gist: 'A trace formula for $p_1$ of the adjoint bundle.' },
    ],
  },
  {
    num: '4.7',
    title: 'Genera',
    page: 336,
    items: [
      { kind: P, num: '4.7.1', page: 338, gist: 'A power series $q$ with $q(0) = 1$ defines a multiplicative characteristic class, the $q$-genus.' },
      { kind: R, num: '4.7.2', page: 339, gist: 'By the splitting principle a genus is fixed by its value on line bundles.' },
      { kind: E, num: '4.7.3', title: 'Genera of vector bundles', page: 339, gist: 'Todd genus ($x/(1-e^{-x})$), $L$-genus ($\\sqrt x/\\tanh\\sqrt x$: $L_1 = p_1/3$) and $\\hat A$-genus.' },
      { kind: R, num: '4.7.4', page: 343, gist: 'The Chern character $\\operatorname{tr}\\exp(\\tfrac{i}{2\\pi}R)$ from a connection.' },
      { kind: L, num: '4.7.5', page: 344, gist: '$\\mathrm{ch}(L_1\\oplus\\dots\\oplus L_n) = \\sum e^{c_1(L_i)}$.' },
      { kind: P, num: '4.7.6', page: 344, gist: '$\\mathrm{ch}$ is additive on sums and multiplicative on tensor products.' },
    ],
  },
  { num: '4.8', title: 'The Postnikov Tower and Bundle Classification', page: 345, items: [] },
];

export const STATIONS: Station[] = [
  {
    id: '4.6a',
    section: '4.6',
    title: 'Chern–Weil: the integral does not care which connection',
    items: ['4.6.5', '4.6.6', '4.6.8', '4.6.11', '4.6.12'],
    summary: 'Curvature densities move freely as the connection changes, but their integrals — $c_1 = -1$ on the Hopf bundle, charge 1 for $SU(2)$ — do not: the difference is exact, and for the instanton it is a Chern–Simons flux.',
  },
  {
    id: '4.7a',
    section: '4.7',
    title: 'Characteristic numbers of $\\mathbb CP^2$ and the signature',
    items: ['4.7.1', '4.7.3'],
    summary: 'Integrate Chern–Weil forms of the Fubini–Study curvature: $\\chi = c_2 = 3$, $c_1^2 = 9$, $p_1 = 3$, and the $L$-genus gives signature $p_1/3 = 1$, which flips with the orientation.',
  },
];
