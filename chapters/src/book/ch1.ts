/**
 * Book manifest for Chapter 1 of Rudolph & Schmidt, Differential Geometry and
 * Mathematical Physics, Part II (Springer 2017).
 *
 * Every number, title and page here was read off the book itself (pp. 1–36,
 * the part of the chapter supplied so far); nothing is guessed. Gists are
 * one-line paraphrases, not quotations. Sections 1.4–1.9 carry only their
 * table-of-contents entry until their pages are read.
 */

export type ItemKind =
  | 'Definition'
  | 'Proposition'
  | 'Theorem'
  | 'Lemma'
  | 'Corollary'
  | 'Example'
  | 'Remark';

export interface BookItem {
  kind: ItemKind;
  num: string;
  title?: string;
  page: number;
  gist: string;
}

export interface BookSection {
  num: string;
  title: string;
  /** First page of the section (from the table of contents). */
  page: number;
  /** Numbered items, in book order; empty while the section's pages are unread. */
  items: BookItem[];
}

export interface StationModule {
  mount: (container: HTMLElement) => () => void;
}

export interface Station {
  id: string;
  section: string;
  title: string;
  /** Item numbers (e.g. '1.1.20') the station illustrates, in book order. */
  items: string[];
  /** Equation numbers the station uses, e.g. '(1.1.5)'. */
  equations?: string[];
  summary: string;
}

const D = 'Definition' as const;
const P = 'Proposition' as const;
const T = 'Theorem' as const;
const L = 'Lemma' as const;
const C = 'Corollary' as const;
const E = 'Example' as const;
const R = 'Remark' as const;

export const CHAPTER = {
  num: 1,
  title: 'Fibre Bundles and Connections',
};

export const SECTIONS: BookSection[] = [
  {
    num: '1.1',
    title: 'Principal Bundles',
    page: 1,
    items: [
      { kind: D, num: '1.1.1', title: 'Principal bundle', page: 1, gist: 'A free Lie group action $(P,G,\\Psi)$ over $M$ that is locally $U \\times G$, equivariantly and fibre-preservingly.' },
      { kind: R, num: '1.1.2', page: 2, gist: 'Free proper actions are exactly principal bundles over their orbit space.' },
      { kind: D, num: '1.1.3', title: 'General fibre bundle', page: 2, gist: 'A surjection $E \\to M$ locally of the form $U \\times F$.' },
      { kind: E, num: '1.1.4', page: 2, gist: 'Product bundle, restriction to $U$, direct products, and $G \\to G/H$ as a principal $H$-bundle.' },
      { kind: D, num: '1.1.5', page: 3, gist: 'Sections and local sections.' },
      { kind: P, num: '1.1.6', page: 3, gist: 'Local trivializations ↔ local sections; trivial iff a global section exists.' },
      { kind: D, num: '1.1.7', title: 'Morphism', page: 3, gist: 'A pair $(\\vartheta, \\lambda)$ intertwining the actions; isomorphisms and automorphisms.' },
      { kind: R, num: '1.1.8', title: 'Special morphisms', page: 3, gist: 'Projected maps, vertical morphisms, $G$-morphisms, subbundles and reductions.' },
      { kind: R, num: '1.1.9', title: 'Pullback of principal bundles', page: 4, gist: 'The pullback $\\varphi^*P$ and the fibre product $P_1 \\times_M P_2$.' },
      { kind: P, num: '1.1.10', page: 5, gist: 'Any cocycle $\\{\\rho_{ij}\\}$ satisfying (1.1.6) is the transition system of some principal bundle.' },
      { kind: T, num: '1.1.11', page: 7, gist: 'Vertically isomorphic iff the transition maps differ by a 0-cochain as in (1.1.7).' },
      { kind: R, num: '1.1.12', title: 'Čech cohomology', page: 7, gist: '0- and 1-cocycles; the cohomology set $\\check H^1(M,G)$ as a direct limit over covers.' },
      { kind: C, num: '1.1.13', page: 8, gist: 'Vertical isomorphism classes of principal $G$-bundles over $M$ ↔ $\\check H^1(M,G)$.' },
      { kind: E, num: '1.1.14', title: 'Frame bundle of a manifold', page: 8, gist: '$L(M) \\to M$ with structure group $GL(n,\\mathbb R)$.' },
      { kind: E, num: '1.1.15', title: 'Frame bundle of a vector bundle', page: 8, gist: '$L(E)$ with structure group $GL(k,\\mathbb K)$.' },
      { kind: D, num: '1.1.16', page: 9, gist: 'Fibre metrics: (pseudo-)Riemannian and Hermitean vector bundles.' },
      { kind: R, num: '1.1.17', page: 9, gist: 'Every vector bundle admits a fibre metric (partition of unity).' },
      { kind: E, num: '1.1.18', page: 9, gist: 'Orthonormal frame bundle $O(E)$; $O^+(S^n) \\cong SO(n+1)$.' },
      { kind: D, num: '1.1.19', page: 9, gist: 'Frame bundle and orthonormal frame bundle of $E$.' },
      { kind: E, num: '1.1.20', title: 'Complex Hopf bundle', page: 10, gist: '$U(1) \\to S^3 \\to \\mathbb{C}P^1$ with trivializations $\\kappa_i = z_i/|z_i|$ and transition $\\rho_{12}$.' },
      { kind: R, num: '1.1.21', page: 11, gist: '$\\mathbb{C}P^1 \\cong S^2$ via $(2\\bar z_1 z_2, |z_1|^2 - |z_2|^2)$; the Hopf bundle is nontrivial: $\\rho_{12}$ has degree 1.' },
      { kind: E, num: '1.1.22', title: 'Quaternionic Hopf bundle', page: 12, gist: '$Sp(1) \\to S^7 \\to \\mathbb{H}P^1 \\cong S^4$.' },
      { kind: R, num: '1.1.23', page: 12, gist: 'The quaternionic Hopf bundle is nontrivial; generalisation to $S^{4n-1} \\to \\mathbb{H}P^{n-1}$.' },
      { kind: E, num: '1.1.24', title: 'Stiefel bundles', page: 12, gist: '$S_{\\mathbb K}(k,n) \\to G_{\\mathbb K}(k,n)$ with structure group $U_{\\mathbb K}(k)$.' },
      { kind: R, num: '1.1.25', page: 13, gist: '$S_{\\mathbb K}(1,n) \\cong S^{dn-1}$; the Hopf bundles are the Stiefel bundles $S_{\\mathbb K}(1,2)$.' },
      { kind: E, num: '1.1.26', title: 'Universal Covering', page: 13, gist: '$\\tilde M \\to M$ is a principal $\\pi_1(M)$-bundle.' },
    ],
  },
  {
    num: '1.2',
    title: 'Associated Bundles',
    page: 14,
    items: [
      { kind: D, num: '1.2.1', page: 15, gist: 'The associated bundle $P \\times_G F$ of a principal bundle and a $G$-manifold.' },
      { kind: P, num: '1.2.2', page: 15, gist: 'Principal bundle morphisms and representation homomorphisms induce morphisms of associated bundles.' },
      { kind: R, num: '1.2.3', page: 15, gist: 'Induced trivializations $\\xi$, the fibre maps $\\iota_p$, and transition maps $\\sigma_{\\rho_{ij}}$.' },
      { kind: E, num: '1.2.4', page: 16, gist: '$P \\times_G G/H \\cong P/H$; pullbacks; tensor products are associated with the fibre product.' },
      { kind: P, num: '1.2.5', title: 'Associated principal bundles', page: 18, gist: 'Functoriality of $P[\\lambda] = P \\times_G H$ under morphisms, pullbacks and products.' },
      { kind: P, num: '1.2.6', page: 18, gist: 'Sections of $P \\times_G F$ ↔ equivariant maps $\\tilde\\Phi : P \\to F$.' },
      { kind: C, num: '1.2.7', page: 19, gist: 'Vertical $G$-morphisms $P \\to Q$ ↔ sections of $P \\times_{G,M} Q$.' },
      { kind: P, num: '1.2.8', page: 20, gist: 'For a representation, $P \\times_G F$ is a vector bundle and sections ↔ equivariant maps linearly.' },
      { kind: R, num: '1.2.9', page: 20, gist: 'Linear structure on fibres; every vector bundle is associated with its frame bundle.' },
      { kind: D, num: '1.2.10', page: 21, gist: '$E$-valued differential forms $\\Omega^k(M,E)$.' },
      { kind: D, num: '1.2.11', page: 21, gist: 'Horizontal forms of type $\\sigma$ on $P$.' },
      { kind: P, num: '1.2.12', page: 21, gist: '$\\Omega^k_{\\sigma,\\mathrm{hor}}(P,F) \\cong \\Omega^k(M,E)$.' },
      { kind: R, num: '1.2.13', page: 22, gist: 'Module structure over $\\Omega^*(M)$.' },
      { kind: P, num: '1.2.14', page: 23, gist: 'Reconstruction of a horizontal form of type $\\sigma$ from its local representative.' },
      { kind: R, num: '1.2.15', page: 23, gist: 'Transformation of local representatives: $\\tilde\\alpha^{\\chi_j} = \\sigma_{\\rho_{jk}} \\tilde\\alpha^{\\chi_k}$; sections as local functions.' },
    ],
  },
  {
    num: '1.3',
    title: 'Connections',
    page: 24,
    items: [
      { kind: L, num: '1.3.1', page: 25, gist: 'The vertical distribution is equivariant, trivial, and equals $\\ker \\pi\'$.' },
      { kind: D, num: '1.3.2', title: 'Connection on a principal fibre bundle', page: 25, gist: 'An equivariant distribution $\\Gamma$ complementary to the vertical one.' },
      { kind: R, num: '1.3.3', page: 25, gist: 'Horizontal/vertical splitting, horizontal lifts, induced connections on associated bundles.' },
      { kind: D, num: '1.3.4', title: 'Connection form', page: 27, gist: '$\\omega_p(X) = (\\Psi_p\')^{-1}(\\mathrm{ver}\\,X)$.' },
      { kind: P, num: '1.3.5', page: 27, gist: '$\\ker\\omega = \\Gamma$, $\\omega(A^*) = A$, $\\Psi_a^*\\omega = \\mathrm{Ad}_{a^{-1}} \\circ \\omega$.' },
      { kind: P, num: '1.3.6', page: 27, gist: 'Conversely, such a 1-form defines a connection.' },
      { kind: P, num: '1.3.7', page: 27, gist: 'Every principal bundle admits a connection (partition of unity).' },
      { kind: R, num: '1.3.8', page: 28, gist: 'Connections form an affine space over $\\Omega^1_{\\mathrm{Ad},\\mathrm{hor}}(P,\\mathfrak g)$.' },
      { kind: R, num: '1.3.9', page: 28, gist: 'The connection mapping $\\omega^E$ on an associated vector bundle.' },
      { kind: R, num: '1.3.10', page: 29, gist: 'Components $A_\\mu^a$ of the local representative.' },
      { kind: P, num: '1.3.11', page: 29, gist: '$\\omega = \\mathrm{Ad}_{\\kappa^{-1}} \\pi^*\\mathcal A + \\kappa^*\\theta$: $\\omega$ is rebuilt from $\\mathcal A = s^*\\omega$.' },
      { kind: C, num: '1.3.12', page: 30, gist: 'Gauge transformation law $\\mathcal A_j = \\mathrm{Ad}_{\\rho_{ij}^{-1}} \\mathcal A_i + \\rho_{ij}^*\\theta$.' },
      { kind: P, num: '1.3.13', page: 31, gist: 'Push-forward of a connection under a morphism covering a diffeomorphism.' },
      { kind: C, num: '1.3.14', page: 32, gist: 'The $\\lambda$-extension of a connection to $Q[\\lambda]$.' },
      { kind: P, num: '1.3.15', page: 32, gist: 'Pull-back of a connection under a morphism with $\\lambda$ an isomorphism.' },
      { kind: C, num: '1.3.16', page: 33, gist: 'Pullbacks of connection forms under automorphisms and pullback bundles.' },
      { kind: R, num: '1.3.17', page: 33, gist: 'Weaker hypotheses; curvature transforms alike; connections on fibre products.' },
      { kind: E, num: '1.3.18', title: 'Canonical connection of the product bundle', page: 34, gist: '$\\omega = \\mathrm{pr}_G^*\\theta$ on $M \\times G$.' },
      { kind: E, num: '1.3.19', title: 'Reductive homogeneous space', page: 34, gist: '$\\omega_0 = \\mathrm{pr}_{\\mathfrak h} \\circ \\theta$ on $G \\to G/H$.' },
      { kind: E, num: '1.3.20', title: 'Canonical connection on the Stiefel bundle', page: 34, gist: '$\\omega_c = u^\\dagger du$.' },
      { kind: R, num: '1.3.21', page: 35, gist: 'Horizontal vectors of $\\omega_c$ at the standard frame.' },
      { kind: E, num: '1.3.22', title: 'Canonical connection on the Hopf bundle', page: 36, gist: '$\\omega_c = \\bar z_1 dz_1 + \\bar z_2 dz_2$, valued in $\\mathfrak{u}(1) = i\\mathbb R$.' },
      { kind: E, num: '1.3.23', page: 36, gist: 'The product bundle $S^2 \\times U(1)$ with $\\omega = d\\alpha$.' },
    ],
  },
  { num: '1.4', title: 'Covariant Exterior Derivative and Curvature', page: 37, items: [] },
  { num: '1.5', title: 'The Koszul Calculus', page: 45, items: [] },
  { num: '1.6', title: 'Bundle Reduction', page: 52, items: [] },
  { num: '1.7', title: 'Parallel Transport and Holonomy', page: 59, items: [] },
  { num: '1.8', title: 'Automorphisms', page: 72, items: [] },
  { num: '1.9', title: 'Invariant Connections', page: 76, items: [] },
];

export const STATIONS: Station[] = [
  {
    id: '1.1a',
    section: '1.1',
    title: 'The Hopf bundle and its trivializations',
    items: ['1.1.1', '1.1.5', '1.1.6', '1.1.20', '1.1.21'],
    equations: ['(1.1.1)', '(1.1.2)'],
    summary: 'Fibres over $S^2$ as linked circles in $S^3$; the trivializations $\\chi_i$, their phases $\\kappa_i$ and the sections $s_i$.',
  },
  {
    id: '1.1b',
    section: '1.1',
    title: 'Transition maps and Čech classes',
    items: ['1.1.10', '1.1.11', '1.1.12', '1.1.13', '1.1.21'],
    equations: ['(1.1.5)', '(1.1.6)', '(1.1.7)'],
    summary: 'The two section curves over the equator cross once: the degree of $\\rho_{12}$, untouched by any re-trivialization (1.1.7).',
  },
  {
    id: '1.1c',
    section: '1.1',
    title: 'Frame bundles',
    items: ['1.1.4', '1.1.6', '1.1.14', '1.1.18', '1.1.19'],
    summary: '$O^+(S^2)\\cong SO(3)$: frames as rotations, $SO(2)$ spinning them, two frame fields that each break at a pole, and a transition map of degree 2.',
  },
  {
    id: '1.2a',
    section: '1.2',
    title: 'Sections are equivariant functions',
    items: ['1.2.4', '1.2.5', '1.2.6', '1.2.8', '1.2.15'],
    equations: ['(1.2.5)', '(1.2.8)', '(1.2.9)'],
    summary: 'Sections of $L_n = S^3 \\times_{U(1)} \\mathbb C$ as functions on $S^3$ that twist $n$ times along every fibre — and the zeros they cannot avoid.',
  },
  {
    id: '1.2b',
    section: '1.2',
    title: 'A vector is a class [(frame, components)]',
    items: ['1.2.1', '1.2.3', '1.2.6', '1.2.9'],
    equations: ['(1.2.2)', '(1.2.3)', '(1.2.5)'],
    summary: '$TS^2 \\cong O^+(S^2)\\times_{SO(2)}\\mathbb R^2$: turn the frame, counter-turn the components, and the vector stays put.',
  },
  {
    id: '1.3a',
    section: '1.3',
    title: 'Horizontal and vertical',
    items: ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.22', '1.3.23'],
    equations: ['(1.3.1)', '(1.3.2)', '(1.3.6)', '(1.3.7)', '(1.3.20)'],
    summary: 'The splitting $T_pP = \\Gamma_p \\oplus V_p$ for $\\omega_c$ on $S^3$, and the horizontal foliation of a torus of fibres versus the flat product bundle.',
  },
  {
    id: '1.3b',
    section: '1.3',
    title: 'Local representatives and gauge transformations',
    items: ['1.3.10', '1.3.11', '1.3.12'],
    equations: ['(1.3.11)', '(1.3.14)', '(1.3.15)'],
    summary: 'The potentials $\\mathcal A_i = s_i^*\\omega_c$ on $S^2$, each singular at its missing pole, and the law $\\mathcal A_2 = \\mathcal A_1 + \\rho_{12}^*\\theta$.',
  },
];

export function findItem(num: string): BookItem | undefined {
  for (const s of SECTIONS) {
    const it = s.items.find((i) => i.num === num);
    if (it) return it;
  }
  return undefined;
}

/** Short label, e.g. "Ex. 1.1.20". */
export function itemLabel(it: BookItem): string {
  const abbr: Record<ItemKind, string> = {
    Definition: 'Def.',
    Proposition: 'Prop.',
    Theorem: 'Thm.',
    Lemma: 'Lemma',
    Corollary: 'Cor.',
    Example: 'Ex.',
    Remark: 'Rem.',
  };
  return `${abbr[it.kind]} ${it.num}`;
}
