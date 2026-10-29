/**
 * Book manifest for Chapter 2 of Rudolph & Schmidt, Differential Geometry and
 * Mathematical Physics, Part II (Springer 2017).
 *
 * Every number, title and page here was read off the book itself (pp. 93–188);
 * nothing is guessed. Gists are one-line paraphrases, not quotations.
 * Sections 2.2, 2.3 and 2.7 carry only their table-of-contents entries: the
 * stations for this chapter were chosen from §§2.1, 2.4, 2.5, 2.6 and 2.8.
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
  num: 2,
  title: 'Linear Connections and Riemannian Geometry',
};

export const SECTIONS: BookSection[] = [
  {
    num: '2.1',
    title: 'Linear Connections',
    page: 94,
    items: [
      { kind: D, num: '2.1.1', page: 94, gist: 'A linear connection on $M$ is a principal connection on the frame bundle $L(M)$; it induces connections on all tensor bundles.' },
      { kind: R, num: '2.1.2', page: 94, gist: 'A frame $u$ is an isomorphism $u:\\mathbb R^n\\to T_{\\pi(u)}M$.' },
      { kind: D, num: '2.1.3', title: 'Soldering form', page: 95, gist: '$\\theta(X) = u^{-1}(\\pi\'(X))$: the components of the projected vector in the frame $u$.' },
      { kind: P, num: '2.1.4', page: 95, gist: '$\\theta$ is horizontal of type $\\sigma_n^0$: $\\Psi_a^*\\theta = a^{-1}\\theta$.' },
      { kind: R, num: '2.1.5', page: 95, gist: 'On $M$, $\\theta$ becomes the tautological 1-form $X\\mapsto X$.' },
      { kind: D, num: '2.1.6', title: 'Horizontal standard vector field', page: 95, gist: '$B(x)_u$ is the horizontal lift of $u(x)$ to $u$.' },
      { kind: P, num: '2.1.7', page: 95, gist: '$\\theta(B(x)) = x$, $\\Psi_{a*}B(x) = B(a^{-1}x)$, and $B(x)$ vanishes nowhere for $x\\neq 0$.' },
      { kind: R, num: '2.1.8', page: 96, gist: 'The $B(e_i)$ span the horizontal distribution; $B(x)$ is fixed by $\\theta(B(x)) = x$, $\\omega(B(x)) = 0$.' },
      { kind: L, num: '2.1.9', page: 96, gist: '$[A^*, B(x)] = B(Ax)$.' },
      { kind: D, num: '2.1.10', title: 'Torsion form', page: 96, gist: '$\\Theta = D_\\omega\\theta$, a horizontal $\\mathbb R^n$-valued 2-form.' },
      { kind: P, num: '2.1.11', title: 'Structure Equations', page: 96, gist: '$d\\omega = -[\\omega,\\omega]+\\Omega$ on pairs, and $d\\theta(X,Y) = -(\\omega(X)\\theta(Y) - \\omega(Y)\\theta(X)) + \\Theta(X,Y)$.' },
      { kind: R, num: '2.1.12', page: 97, gist: 'Compactly $d\\omega = -\\omega\\wedge\\omega + \\Omega$, $d\\theta = -\\omega\\wedge\\theta + \\Theta$; in components (2.1.15).' },
      { kind: P, num: '2.1.13', title: 'Bianchi Identities', page: 97, gist: '$D_\\omega\\Omega = 0$ and $D_\\omega\\Theta = \\Omega\\wedge\\theta$.' },
      { kind: R, num: '2.1.14', page: 97, gist: '$\\omega+\\theta$ is an affine connection with curvature $\\Omega+\\Theta$; $\\{B_i, E_j{}^{i*}\\}$ is a global parallelism of $L(M)$.' },
      { kind: D, num: '2.1.15', page: 99, gist: 'The torsion tensor $\\mathrm T$ and curvature tensor $\\mathrm R$ on $M$ corresponding to $\\Theta$ and $\\Omega$.' },
      { kind: R, num: '2.1.16', page: 99, gist: 'Curvature and torsion mappings $R(u) = \\Omega_u\\circ b(u)$, $T(u) = \\Theta_u\\circ b(u)$ and their equivariance.' },
      { kind: R, num: '2.1.17', page: 100, gist: '$(\\nabla_XY)(m) = u(X^*_u(\\theta(Y^*)))$; $\\nabla$ extends to all tensor fields.' },
      { kind: P, num: '2.1.18', page: 101, gist: '$\\nabla_X$ on tensors is fixed by: $\\nabla_X f = X(f)$, derivation of the tensor algebra, commutes with contractions.' },
      { kind: P, num: '2.1.19', page: 101, gist: '$\\mathrm R(X,Y) = [\\nabla_X,\\nabla_Y] - \\nabla_{[X,Y]}$ and $\\mathrm T(X,Y) = \\nabla_XY - \\nabla_YX - [X,Y]$.' },
      { kind: D, num: '2.1.20', title: 'Geodesic', page: 102, gist: 'A curve with $\\nabla_{d/dt}\\dot\\gamma = 0$.' },
      { kind: P, num: '2.1.21', page: 102, gist: 'Affine reparametrisations of geodesics are geodesics.' },
      { kind: P, num: '2.1.22', page: 102, gist: 'Geodesics are exactly the projections of integral curves of horizontal standard vector fields.' },
      { kind: C, num: '2.1.23', page: 103, gist: 'Through each $(m, X)$ there is a unique geodesic.' },
      { kind: C, num: '2.1.24', page: 103, gist: 'A linear connection is complete iff every $B(x)$ is a complete vector field; then $\\exp(X) = \\gamma_X(1)$.' },
      { kind: R, num: '2.1.25', page: 103, gist: 'Without completeness, $\\exp$ is still a local diffeomorphism near $0\\in T_mM$.' },
      { kind: L, num: '2.1.26', page: 104, gist: 'For a local frame $e$ with coframe $\\vartheta$: $e^*\\theta = \\vartheta^i\\otimes e_i$.' },
      { kind: R, num: '2.1.27', page: 104, gist: 'Christoffel symbols $\\Gamma^i{}_{jk}$ and their inhomogeneous transformation law; local curvature (2.1.42) and torsion (2.1.44).' },
      { kind: R, num: '2.1.28', page: 106, gist: 'Local representatives of $\\Omega,\\mathrm R$ and of $\\Theta,\\mathrm T$ coincide.' },
      { kind: R, num: '2.1.29', title: 'Holonomic frame', page: 106, gist: 'In coordinates: $\\mathrm T^i{}_{jk} = \\Gamma^i{}_{jk} - \\Gamma^i{}_{kj}$, transport $\\dot X^k + \\Gamma^k{}_{ij}\\dot x^iX^j = 0$, geodesics $\\ddot x^k + \\Gamma^k{}_{ij}\\dot x^i\\dot x^j = 0$.' },
      { kind: R, num: '2.1.30', page: 107, gist: 'Normal coordinates; transport around a small loop changes $X$ by $-\\tfrac12 R^i{}_{jkl}X^lf^{jk}$; geodesics as free fall.' },
    ],
  },
  { num: '2.2', title: 'H-Structures and Compatible Connections', page: 108, items: [] },
  { num: '2.3', title: 'Curvature and Holonomy', page: 127, items: [] },
  {
    num: '2.4',
    title: 'Sectional Curvature',
    page: 138,
    items: [
      { kind: D, num: '2.4.1', title: 'Sectional curvature', page: 139, gist: '$K(\\Sigma) = \\langle R(X,Y)Y,X\\rangle/(\\|X\\|^2\\|Y\\|^2-\\langle X,Y\\rangle^2)$ on non-degenerate 2-planes.' },
      { kind: P, num: '2.4.2', page: 139, gist: '$K$ determines $R$ (by polarisation); $K\\equiv k$ at $m$ iff $R(X,Y)Z = k(\\langle Y,Z\\rangle X - \\langle X,Z\\rangle Y)$.' },
      { kind: D, num: '2.4.3', page: 140, gist: 'Spaces of constant curvature $k$.' },
      { kind: R, num: '2.4.4', page: 140, gist: 'Schur: pointwise constant implies constant for $\\dim\\ge 3$; spheres of radius $r$ have $k = 1/r^2$.' },
    ],
  },
  {
    num: '2.5',
    title: 'Symmetric Spaces',
    page: 141,
    items: [
      { kind: L, num: '2.5.1', page: 141, gist: 'An $H$-invariant curvature $F$ makes $\\mathfrak h\\oplus V$ a Lie algebra with $[x,y] = -F(x,y)$.' },
      { kind: L, num: '2.5.2', page: 142, gist: 'An involutive automorphism $\\lambda$ splits $\\mathfrak g = \\mathfrak h\\oplus\\mathfrak m$ with $[\\mathfrak h,\\mathfrak m]\\subset\\mathfrak m$, $[\\mathfrak m,\\mathfrak m]\\subset\\mathfrak h$.' },
      { kind: D, num: '2.5.3', page: 143, gist: 'Symmetric Lie algebras $(\\mathfrak g,\\lambda)$: orthogonal, effective, irreducible.' },
      { kind: P, num: '2.5.4', page: 143, gist: 'The Lie algebra built from a locally symmetric space is an irreducible orthogonal symmetric Lie algebra.' },
      { kind: P, num: '2.5.5', page: 143, gist: 'Irreducible symmetric Lie algebras: $\\mathfrak g$ simple, $\\tilde{\\mathfrak g}\\oplus\\tilde{\\mathfrak g}$ with the swap, or $[\\mathfrak m,\\mathfrak m] = 0$.' },
      { kind: R, num: '2.5.6', page: 144, gist: 'Irreducible iff $\\mathfrak h = [\\mathfrak m,\\mathfrak m]$; then $\\mathfrak g$ is semisimple.' },
      { kind: D, num: '2.5.7', page: 144, gist: 'Compact or non-compact type: the Killing form is negative or positive definite on $\\mathfrak m$.' },
      { kind: R, num: '2.5.8', page: 144, gist: 'Every irreducible orthogonal symmetric Lie algebra is of one of the two types.' },
      { kind: L, num: '2.5.9', page: 145, gist: 'On $G\\to G/H$, the $\\mathfrak m$-part of the Maurer–Cartan form is the soldering form.' },
      { kind: P, num: '2.5.10', page: 146, gist: 'On $G/H$: Levi-Civita is the canonical connection, curvature $F(x,y) = -[x,y]$, holonomy $H$, and geodesics are $\\pi(g\\exp(tx))$, $x\\in\\mathfrak m$.' },
      { kind: C, num: '2.5.11', page: 147, gist: '$G/H$ is complete, irreducible and locally symmetric.' },
      { kind: L, num: '2.5.12', page: 147, gist: '$\\lambda$ induces an isometry $s$ with isolated fixed point $[1]$ and $s\' = -\\mathrm{id}$ there.' },
      { kind: R, num: '2.5.13', page: 148, gist: 'The automorphism $\\sigma$ descends to $G$ and preserves $H$.' },
      { kind: R, num: '2.5.14', page: 148, gist: 'The symmetry $s_m$ reverses geodesics through $m$: $s_m(\\gamma(t)) = \\gamma(-t)$.' },
      { kind: D, num: '2.5.15', title: 'Riemannian globally symmetric space', page: 149, gist: 'Every point is an isolated fixed point of an involutive isometry $s_m$.' },
      { kind: P, num: '2.5.16', page: 149, gist: 'Each irreducible orthogonal symmetric Lie algebra gives a unique homothety class of simply connected symmetric spaces.' },
      { kind: C, num: '2.5.17', page: 149, gist: 'Locally symmetric spaces are locally isometric to the model $G/H$.' },
      { kind: P, num: '2.5.18', page: 149, gist: 'Globally symmetric spaces are complete: reflect a geodesic past its end.' },
      { kind: P, num: '2.5.19', page: 150, gist: 'Transvections $T_t = s_{\\gamma(t/2)}\\circ s_{\\gamma(0)}$ slide $\\gamma$ along itself, act as parallel transport, and form a one-parameter group.' },
      { kind: C, num: '2.5.20', page: 150, gist: 'Geodesics are orbits of one-parameter isometry groups; $I_0(M)$ is transitive.' },
      { kind: P, num: '2.5.21', page: 150, gist: 'An effective transitive isometric group of an irreducible symmetric space is $I_0(M)$.' },
      { kind: P, num: '2.5.22', page: 151, gist: 'Conversely, a simply connected irreducible symmetric space determines its symmetric Lie algebra.' },
      { kind: R, num: '2.5.23', page: 152, gist: 'Riemannian symmetric pairs $(G, H, \\sigma)$ with $(G^\\sigma)_0\\subset H\\subset G^\\sigma$.' },
      { kind: T, num: '2.5.24', page: 152, gist: 'Simply connected irreducible symmetric spaces ↔ irreducible orthogonal symmetric Lie algebras (Tables 2.1, 2.2).' },
      { kind: R, num: '2.5.25', page: 152, gist: 'The Euclidean type $[\\mathfrak m,\\mathfrak m] = 0$ is flat.' },
      { kind: P, num: '2.5.26', page: 154, gist: 'Compact type: compact Einstein, $K\\ge 0$; non-compact type: Einstein, $K\\le 0$, diffeomorphic to $\\mathbb R^n$.' },
      { kind: E, num: '2.5.27', page: 154, gist: 'Grassmannians, $S^n = SO(n+1)/SO(n)$, $SO(2n)/U(n)$, $SU(n)/SO(n)$ and hyperbolic space $SO_0(1,n)/SO(n)$.' },
      { kind: R, num: '2.5.28', page: 157, gist: 'For $S^n$, $F(x,y) = x\\wedge y$: constant sectional curvature 1.' },
    ],
  },
  {
    num: '2.6',
    title: 'Compatible Connections on Vector Bundles',
    page: 158,
    items: [
      { kind: R, num: '2.6.1', page: 159, gist: 'Every Riemannian or Hermitean vector bundle admits a compatible connection; reduce to a $G$-invariant inner product on the fibre.' },
      { kind: D, num: '2.6.2', page: 159, gist: 'Holomorphic vector bundles: holomorphic transition functions.' },
      { kind: R, num: '2.6.3', page: 159, gist: 'Complex frame bundles; linear-algebra constructions stay holomorphic.' },
      { kind: D, num: '2.6.4', title: 'Holomorphic tangent bundle', page: 160, gist: 'Transition functions are the holomorphic Jacobians.' },
      { kind: P, num: '2.6.5', page: 160, gist: '$T^{1,0}M$ is naturally the holomorphic tangent bundle.' },
      { kind: P, num: '2.6.6', page: 160, gist: 'The Dolbeault operator $\\bar\\partial_E$ on $E$-valued $(p,q)$-forms.' },
      { kind: D, num: '2.6.7', page: 161, gist: '$\\nabla$ is compatible with the holomorphic structure if $\\nabla^{0,1} = \\bar\\partial_E$.' },
      { kind: P, num: '2.6.8', page: 161, gist: 'A holomorphic Hermitean bundle has exactly one connection compatible with both structures.' },
      { kind: D, num: '2.6.9', title: 'Chern connection', page: 162, gist: 'That unique connection.' },
      { kind: C, num: '2.6.10', page: 162, gist: 'In a holomorphic frame: $\\mathcal A = \\bar H^{-1}\\partial\\bar H$ (type $(1,0)$) and $\\mathcal F = \\bar\\partial\\mathcal A$ (type $(1,1)$).' },
      { kind: E, num: '2.6.11', page: 162, gist: 'On a Kähler manifold the Chern connection of $TM$ is the Levi-Civita connection.' },
      { kind: T, num: '2.6.12', page: 162, gist: 'A Hermitean connection with $(1,1)$ curvature defines a holomorphic structure for which it is the Chern connection.' },
    ],
  },
  { num: '2.7', title: 'Hodge Theory. The Weitzenboeck Formula', page: 164, items: [] },
  {
    num: '2.8',
    title: 'Four-Dimensional Riemannian Geometry. Self-duality',
    page: 181,
    items: [
      { kind: R, num: '2.8.1', page: 183, gist: 'Orthonormal bases $\\varphi^i_\\pm$ of $\\Lambda^2_\\pm$; $S^2_0T^*\\cong\\Lambda^2_+\\otimes\\Lambda^2_-$.' },
      { kind: L, num: '2.8.2', page: 184, gist: '$\\Lambda^2_+ = \\mathbb C\\beta\\oplus\\Lambda^{2,0}\\oplus\\Lambda^{0,2}$ and $\\Lambda^2_- = \\Lambda^{1,1}_0$ for a compatible complex structure.' },
      { kind: C, num: '2.8.3', page: 185, gist: 'A 2-form on $\\mathbb R^4$ is anti-self-dual iff it is of type $(1,1)$ for every compatible complex structure.' },
      { kind: L, num: '2.8.4', page: 185, gist: '$S^2(\\Lambda^2T^*)$ splits into $SO(4)$-irreducibles $S^{0,0}\\oplus S^{0,0}\\oplus S^{2,2}\\oplus S^{4,0}\\oplus S^{0,4}$.' },
      { kind: L, num: '2.8.5', page: 187, gist: 'In $R = \\begin{pmatrix}A & B\\\\ B^{\\mathsf T} & C\\end{pmatrix}$ on $\\Lambda^2_+\\oplus\\Lambda^2_-$: $\\operatorname{tr}A = \\operatorname{tr}C = -\\tfrac14\\mathrm{Sc}$.' },
      { kind: R, num: '2.8.6', page: 187, gist: 'The blocks are the irreducible pieces: scalar, $B\\in S^{2,2}$ (traceless Ricci), and $W_\\pm$.' },
      { kind: T, num: '2.8.7', title: 'Singer–Thorpe', page: 187, gist: '$R = -\\tfrac{\\mathrm{Sc}}{12}\\mathbb 1 + \\begin{pmatrix}0 & B\\\\ B^{\\mathsf T} & 0\\end{pmatrix} + W$ with $W = W_+\\oplus W_-$ traceless.' },
      { kind: R, num: '2.8.8', page: 188, gist: 'In an orthonormal frame, (2.8.26) splits $R_{ijkl}$ into scalar, Ricci and Weyl parts.' },
      { kind: D, num: '2.8.9', page: 188, gist: 'Self-dual if $W_- = 0$, anti-self-dual if $W_+ = 0$.' },
      { kind: E, num: '2.8.10', page: 188, gist: '$S^4$, $S^1\\times S^3$, $T^4$ have $W = 0$; $\\mathbb CP^2$ with its standard orientation is self-dual.' },
    ],
  },
];

export const STATIONS: Station[] = [
  {
    id: '2.1a',
    section: '2.1',
    title: 'Torsion: parallelograms that do not close',
    items: ['2.1.10', '2.1.19', '2.1.20', '2.1.22', '2.1.29', '2.1.30'],
    equations: ['(2.1.33)', '(2.1.55)', '(2.1.58)', '(2.1.60)'],
    summary: 'Two connections with the same geodesics: the torsion-free one closes small parallelograms, the twisted one misses by $\\varepsilon^2\\,\\mathrm T(X,Y)$.',
  },
  {
    id: '2.4a',
    section: '2.4',
    title: 'Constant curvature: triangles and spreading geodesics',
    items: ['2.4.1', '2.4.2', '2.4.3', '2.4.4'],
    summary: 'On the sphere, the plane and the hyperbolic plane, a geodesic triangle’s angle excess is $k$ times its area, and nearby geodesics spread like $\\sin$, linearly or like $\\sinh$.',
  },
  {
    id: '2.5a',
    section: '2.5',
    title: 'Symmetric spaces: $S^2$ and $H^2$ from their Lie algebras',
    items: ['2.5.2', '2.5.10', '2.5.14', '2.5.15', '2.5.19', '2.5.27', '2.5.28'],
    equations: ['(2.5.4)', '(2.5.10)', '(2.5.16)', '(2.5.17)'],
    summary: 'Split $\\mathfrak g = \\mathfrak h\\oplus\\mathfrak m$: one-parameter subgroups from $\\mathfrak m$ are geodesics, the involution is the geodesic symmetry, and $-[x,y]$ is the curvature.',
  },
];
