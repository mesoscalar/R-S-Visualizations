/**
 * Book manifest for Chapter 1 of Rudolph & Schmidt, Differential Geometry and
 * Mathematical Physics, Part II (Springer 2017).
 *
 * Every number, title and page here was read off the book itself (pp. 1–92);
 * nothing is guessed. Gists are one-line paraphrases, not quotations. Section
 * 1.9 carries only its table-of-contents entry: it was deliberately skipped.
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
  {
    num: '1.4',
    title: 'Covariant Exterior Derivative and Curvature',
    page: 37,
    items: [
      { kind: D, num: '1.4.1', title: 'Covariant exterior derivative', page: 37, gist: '$D_\\omega\\alpha = d\\alpha(\\mathrm{hor}\\,\\cdot,\\dots,\\mathrm{hor}\\,\\cdot)$: differentiate, then feed only horizontal vectors.' },
      { kind: L, num: '1.4.2', page: 37, gist: '$[A^*, X]$ is horizontal for horizontal $X$, and $[A^*, Y^h] = 0$.' },
      { kind: P, num: '1.4.3', page: 38, gist: '$D_\\omega$ preserves horizontal forms of type $\\sigma$, with $D_\\omega\\tilde\\alpha = d\\tilde\\alpha + \\sigma(\\omega)\\wedge\\tilde\\alpha$ (1.4.1).' },
      { kind: R, num: '1.4.4', page: 39, gist: 'On equivariant maps: $D_\\omega\\tilde\\Phi = d\\tilde\\Phi + \\sigma(\\omega)\\circ\\tilde\\Phi$ (1.4.2).' },
      { kind: D, num: '1.4.5', page: 39, gist: 'A horizontal form of type $\\sigma$ is parallel if $D_\\omega\\tilde\\alpha = 0$.' },
      { kind: D, num: '1.4.6', title: 'Curvature form', page: 40, gist: '$\\Omega = D_\\omega\\omega$, a horizontal $\\mathfrak g$-valued 2-form of type $\\mathrm{Ad}$.' },
      { kind: R, num: '1.4.7', page: 40, gist: '$\\mathrm{ver}[X,Y] = -\\Psi\'_p(\\Omega(X,Y))$: the horizontal distribution is integrable iff $\\Omega = 0$ (flat); $\\Omega$ lives in $\\Omega^2(M,\\mathrm{Ad}(P))$.' },
      { kind: R, num: '1.4.8', page: 40, gist: 'Brackets $[\\alpha,\\beta]$ of Lie-algebra-valued forms and the matrix wedge product.' },
      { kind: P, num: '1.4.9', title: 'Structure Equation', page: 41, gist: '$d\\omega = -\\tfrac12[\\omega,\\omega] + \\Omega$.' },
      { kind: R, num: '1.4.10', page: 42, gist: 'Matrix form $d\\omega = -\\omega\\wedge\\omega + \\Omega$; curvature transforms like the connection under morphisms.' },
      { kind: P, num: '1.4.11', title: 'Bianchi Identity', page: 42, gist: '$D_\\omega\\Omega = 0$.' },
      { kind: R, num: '1.4.12', page: 42, gist: 'For type $\\mathrm{Ad}$: $D_\\omega\\tilde\\alpha = d\\tilde\\alpha + [\\omega,\\tilde\\alpha]$, so Bianchi reads $d\\Omega + [\\omega,\\Omega] = 0$.' },
      { kind: P, num: '1.4.13', page: 42, gist: '$D_\\omega\\circ D_\\omega = \\sigma(\\Omega)\\wedge\\,\\cdot$: curvature measures the failure of $D^2 = 0$.' },
      { kind: R, num: '1.4.14', page: 43, gist: 'Local covariant derivative $D_\\mu\\varphi^\\alpha = \\partial_\\mu\\varphi^\\alpha + \\mathcal A_\\mu{}^\\alpha{}_\\beta\\varphi^\\beta$.' },
      { kind: R, num: '1.4.15', page: 44, gist: 'Local curvature $\\mathcal F = d\\mathcal A + \\tfrac12[\\mathcal A,\\mathcal A]$, $\\mathcal F_j = \\mathrm{Ad}_{\\rho_{ij}^{-1}}\\mathcal F_i$; components $F_{\\mu\\nu}^a$.' },
    ],
  },
  {
    num: '1.5',
    title: 'The Koszul Calculus',
    page: 45,
    items: [
      { kind: D, num: '1.5.1', page: 45, gist: 'Covariant exterior derivative $d_\\omega$ on $\\Omega^k(M,E)$, transported from $D_\\omega$.' },
      { kind: D, num: '1.5.2', page: 45, gist: 'The covariant derivative $\\nabla^\\omega: \\Gamma^\\infty(E)\\to\\Gamma^\\infty(T^*M\\otimes E)$.' },
      { kind: P, num: '1.5.3', page: 46, gist: 'In a frame induced by a local section: $\\nabla e_\\alpha = \\mathcal A^\\beta{}_\\alpha e_\\beta$.' },
      { kind: P, num: '1.5.4', page: 46, gist: 'Leibniz rule $\\nabla(f\\Phi) = df\\otimes\\Phi + f\\nabla\\Phi$.' },
      { kind: R, num: '1.5.5', page: 47, gist: 'Local formula (1.5.8); connections on a vector bundle are the same as connections on its frame bundle.' },
      { kind: P, num: '1.5.6', page: 47, gist: '$\\nabla\\Phi(X) = \\omega^E(\\Phi\'(X))$: the covariant derivative is the vertical part of $\\Phi\'$.' },
      { kind: C, num: '1.5.7', page: 48, gist: '$\\Phi$ is parallel iff its image is everywhere horizontal.' },
      { kind: P, num: '1.5.8', page: 48, gist: '$\\nabla_X$ is additive, $C^\\infty$-linear in $X$ and a derivation in $\\Phi$.' },
      { kind: R, num: '1.5.9', page: 49, gist: '$\\nabla$ is pointwise in $X$; induced connections on duals and tensor products.' },
      { kind: D, num: '1.5.10', page: 50, gist: 'The curvature endomorphism form $R^\\nabla$ on $M$.' },
      { kind: P, num: '1.5.11', page: 50, gist: '$R^\\nabla(X,Y) = \\nabla_X\\nabla_Y - \\nabla_Y\\nabla_X - \\nabla_{[X,Y]}$.' },
      { kind: R, num: '1.5.12', page: 50, gist: '$X\\mapsto\\nabla_X$ is a Lie algebra homomorphism iff $R^\\nabla = 0$.' },
      { kind: D, num: '1.5.13', page: 51, gist: 'Sections of $E$ along a map $\\varphi: N\\to M$.' },
      { kind: D, num: '1.5.14', page: 52, gist: 'The covariant derivative along a map, $\\nabla^\\varphi_Y\\phi = \\omega^E(\\phi\'(Y))$, with a chain rule.' },
    ],
  },
  {
    num: '1.6',
    title: 'Bundle Reduction',
    page: 52,
    items: [
      { kind: P, num: '1.6.1', page: 53, gist: '$P$ reduces to $H$ iff it has a cocycle with values in the image of $H$.' },
      { kind: P, num: '1.6.2', page: 53, gist: 'An equivariant map to a transitive $G$-space defines a reduction $Q_f = \\{\\varphi = f\\}$ to the stabilizer, and conversely.' },
      { kind: R, num: '1.6.3', page: 54, gist: 'Changing $f$ conjugates the reduced structure group.' },
      { kind: P, num: '1.6.4', page: 55, gist: 'Reductions are equivalent iff their defining maps differ by a vertical automorphism.' },
      { kind: C, num: '1.6.5', page: 55, gist: 'Reductions of $P$ to $H$ $\\leftrightarrow$ sections of $P\\times_G G/H$.' },
      { kind: E, num: '1.6.6', page: 55, gist: 'Orientations reduce to $GL^+$; fibre metrics reduce to $O(k,l)$ or $U(n)$ (orthonormal frames).' },
      { kind: P, num: '1.6.7', page: 56, gist: 'Reduction does not change associated vector bundles.' },
      { kind: P, num: '1.6.8', page: 57, gist: 'For $\\mathfrak g = \\mathfrak h\\oplus\\mathfrak m$ reductive, $\\omega_{\\mathfrak h}$ restricts to a connection on $Q$ and $\\omega_{\\mathfrak m}$ to a tensorial 1-form.' },
      { kind: D, num: '1.6.9', title: 'Reducible connection', page: 58, gist: '$\\Gamma$ reduces to $Q$ if $\\vartheta^*\\omega$ is $\\mathfrak h$-valued; irreducible if $P$ reduces to no proper subgroup.' },
      { kind: P, num: '1.6.10', page: 58, gist: '$\\Gamma$ reduces to the reduction defined by $\\tilde\\Phi$ iff $\\tilde\\Phi$ is parallel.' },
      { kind: D, num: '1.6.11', title: 'Compatible connection', page: 58, gist: '$\\Gamma$ is compatible with $\\tilde\\Phi$ if it reduces to $Q$, i.e. $D_\\omega\\tilde\\Phi = 0$, $\\nabla\\Phi = 0$.' },
      { kind: E, num: '1.6.12', title: 'Connection compatible with a fibre metric', page: 59, gist: '$\\nabla h = 0$, i.e. $X\\,h(\\Phi_1,\\Phi_2) = h(\\nabla_X\\Phi_1,\\Phi_2) + h(\\Phi_1,\\nabla_X\\Phi_2)$.' },
    ],
  },
  {
    num: '1.7',
    title: 'Parallel Transport and Holonomy',
    page: 59,
    items: [
      { kind: D, num: '1.7.1', page: 60, gist: 'Lifts and horizontal lifts of curves.' },
      { kind: P, num: '1.7.2', page: 60, gist: 'Unique horizontal lift through any point: correct any lift $\\tilde\\gamma$ by $g(t)$ with $\\mathrm{Ad}_{g^{-1}}\\omega(\\dot{\\tilde\\gamma}) = -g^{-1}\\dot g$.' },
      { kind: L, num: '1.7.3', page: 61, gist: 'Horizontal lifts are equivariant and respect concatenation and inversion.' },
      { kind: D, num: '1.7.4', page: 61, gist: 'Parallel transport $\\hat\\gamma_\\Gamma: \\pi^{-1}(\\gamma(0))\\to\\pi^{-1}(\\gamma(1))$.' },
      { kind: R, num: '1.7.5', page: 61, gist: 'Independent of parametrisation; composes along concatenations.' },
      { kind: D, num: '1.7.6', page: 62, gist: 'Holonomy group $H_m(\\Gamma)$ and restricted holonomy $H^0_m(\\Gamma)$ (null-homotopic loops).' },
      { kind: R, num: '1.7.7', page: 62, gist: '$H_p(\\Gamma)$: the $a$ with $p\\cdot a$ horizontally joinable to $p$.' },
      { kind: P, num: '1.7.8', page: 63, gist: '$H_{p\\cdot a} = a^{-1}H_pa$; horizontally joinable points share holonomy.' },
      { kind: T, num: '1.7.9', page: 63, gist: '$H^0_p$ is a connected Lie subgroup, normal in $H_p$ with countable quotient.' },
      { kind: L, num: '1.7.10', page: 63, gist: 'Smoothly path-connected subgroups are connected Lie subgroups.' },
      { kind: R, num: '1.7.11', page: 64, gist: '$H_p$ is a Lie subgroup with identity component $H^0_p$; connected if $M$ is simply connected.' },
      { kind: P, num: '1.7.12', page: 65, gist: 'The points horizontally reachable from $p_0$ form a reduction to $H_{p_0}$, and $\\Gamma$ reduces to it.' },
      { kind: D, num: '1.7.13', page: 65, gist: 'The holonomy bundle $P_{p_0}(\\Gamma)$.' },
      { kind: R, num: '1.7.14', page: 66, gist: 'The holonomy bundle is the smallest reduction; $\\Gamma$ is irreducible iff $P = P_p(\\Gamma)$.' },
      { kind: T, num: '1.7.15', title: 'Ambrose–Singer', page: 66, gist: 'The holonomy Lie algebra is spanned by the curvature values $\\Omega_p(X,Y)$ on the holonomy bundle.' },
      { kind: R, num: '1.7.16', page: 67, gist: 'Flat: holonomy bundles are coverings (trivial if $M$ simply connected); irreducible connections exist when $\\dim M\\ge 2$.' },
      { kind: P, num: '1.7.17', page: 68, gist: '$\\nabla_X\\Phi = \\tfrac{d}{dt}\\big|_0(\\hat\\gamma(t))^{-1}\\Phi(\\gamma(t))$: covariant derivative from parallel transport.' },
      { kind: P, num: '1.7.18', page: 69, gist: 'Parallel transport in $E$ solves $\\nabla^\\gamma_{d/dt}\\phi = 0$.' },
      { kind: R, num: '1.7.19', title: 'Synchronous framing', page: 69, gist: 'Radial parallel frames: $\\mathcal A_i(x) \\approx -\\tfrac12 F_{ij}(0)x^j$.' },
      { kind: P, num: '1.7.20', title: 'Holonomy principle', page: 70, gist: 'Parallel sections $\\leftrightarrow$ holonomy-invariant vectors of the typical fibre.' },
    ],
  },
  {
    num: '1.8',
    title: 'Automorphisms',
    page: 72,
    items: [
      { kind: R, num: '1.8.1', page: 72, gist: 'Vertical automorphisms $\\mathrm{Aut}_M(P)$: the group of (local) gauge transformations.' },
      { kind: R, num: '1.8.2', page: 72, gist: '$\\mathrm{Hom}_G(P,G)$ = sections of $P\\times_G G$ with $G$ acting by conjugation.' },
      { kind: P, num: '1.8.3', page: 73, gist: '$u\\mapsto\\vartheta_u(p) = p\\cdot u(p)$ is an isomorphism $\\mathrm{Hom}_G(P,G)\\cong\\mathrm{Aut}_M(P)$.' },
      { kind: P, num: '1.8.4', page: 73, gist: 'Vertical automorphisms act on associated bundles: $[(p,f)]\\mapsto[(p,\\sigma_{u(p)}f)]$.' },
      { kind: C, num: '1.8.5', page: 74, gist: 'On associated vector bundles they act fibrewise linearly.' },
      { kind: R, num: '1.8.6', page: 74, gist: 'Local form $(m,f)\\mapsto(m,\\sigma_{\\rho(m)}f)$ with $\\rho = u\\circ s$.' },
      { kind: P, num: '1.8.7', page: 74, gist: '$\\vartheta^*\\omega = \\mathrm{Ad}_{u^{-1}}\\omega + u^*\\theta$, $\\vartheta^*\\Omega = \\mathrm{Ad}_{u^{-1}}\\Omega$, $D_{\\vartheta^*\\omega} = \\vartheta^*D_\\omega(\\vartheta^*)^{-1}$.' },
      { kind: R, num: '1.8.8', page: 76, gist: 'Matrix form $u^{-1}\\omega u + u^{-1}du$, $u^{-1}\\Omega u$; local $\\mathcal A\\mapsto\\mathrm{Ad}_{\\rho^{-1}}\\mathcal A + \\rho^*\\theta$, $\\mathcal F\\mapsto\\mathrm{Ad}_{\\rho^{-1}}\\mathcal F$.' },
    ],
  },
  { num: '1.9', title: 'Invariant Connections', page: 76, items: [] },
];

export const STATIONS: Station[] = [
  {
    id: '1.1a',
    section: '1.1',
    title: 'The Hopf bundle and its trivializations',
    items: ['1.1.1', '1.1.5', '1.1.6', '1.1.20', '1.1.21'],
    equations: ['(1.1.1)', '(1.1.2)'],
    summary: 'Why $S^3$ is a bundle of circles over $S^2$, and what a local trivialization and a local section actually do.',
  },
  {
    id: '1.1b',
    section: '1.1',
    title: 'Transition maps and Čech classes',
    items: ['1.1.10', '1.1.11', '1.1.12', '1.1.13', '1.1.21'],
    equations: ['(1.1.5)', '(1.1.6)', '(1.1.7)'],
    summary: 'How the transition maps between charts encode the bundle, and why one integer survives every change of trivialization.',
  },
  {
    id: '1.1c',
    section: '1.1',
    title: 'Frame bundles',
    items: ['1.1.4', '1.1.6', '1.1.14', '1.1.18', '1.1.19'],
    summary: 'Frames on $S^2$ form the group $SO(3)$; no frame field covers the whole sphere, and the two chart fields differ by a twist of degree 2.',
  },
  {
    id: '1.1d',
    section: '1.1',
    title: 'The Hopf family over R, C, H',
    items: ['1.1.22', '1.1.23', '1.1.24', '1.1.25', '1.1.26'],
    summary: 'One construction over $\\mathbb R$, $\\mathbb C$, $\\mathbb H$ gives a double cover, the Hopf bundle and $S^7\\to S^4$; plus the universal cover as a principal bundle.',
  },
  {
    id: '1.2a',
    section: '1.2',
    title: 'Sections are equivariant functions',
    items: ['1.2.4', '1.2.5', '1.2.6', '1.2.8', '1.2.15'],
    equations: ['(1.2.5)', '(1.2.8)', '(1.2.9)'],
    summary: 'A section of an associated line bundle is a function on $S^3$ that twists along the fibres, and the twist forces it to vanish somewhere.',
  },
  {
    id: '1.2b',
    section: '1.2',
    title: 'A vector is a class [(frame, components)]',
    items: ['1.2.1', '1.2.3', '1.2.6', '1.2.9'],
    equations: ['(1.2.2)', '(1.2.3)', '(1.2.5)'],
    summary: 'A tangent vector is a frame together with components, up to turning one against the other: $TS^2$ as an associated bundle.',
  },
  {
    id: '1.3a',
    section: '1.3',
    title: 'Horizontal and vertical',
    items: ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.22', '1.3.23'],
    equations: ['(1.3.1)', '(1.3.2)', '(1.3.6)', '(1.3.7)', '(1.3.20)'],
    summary: 'A connection is a choice of horizontal directions: see the split $T_pP = \\Gamma_p\\oplus V_p$ and the horizontal curves it produces.',
  },
  {
    id: '1.3b',
    section: '1.3',
    title: 'Local representatives and gauge transformations',
    items: ['1.3.10', '1.3.11', '1.3.12'],
    equations: ['(1.3.11)', '(1.3.14)', '(1.3.15)'],
    summary: 'The gauge potential is the connection pulled down by a local section; gauge changes reshape it, but its loop integrals stay put.',
  },
  {
    id: '1.3c',
    section: '1.3',
    title: 'The affine space of connections',
    items: ['1.3.5', '1.3.7', '1.3.8'],
    equations: ['(1.3.8)'],
    summary: 'Gluing flat local connections gives a global one; connections form an affine space, yet a topological total stays fixed.',
  },
  {
    id: '1.3d',
    section: '1.3',
    title: 'The canonical connection of the Stiefel bundle',
    items: ['1.3.19', '1.3.20', '1.3.21'],
    equations: ['(1.3.17)', '(1.3.18)', '(1.3.19)'],
    summary: 'The Stiefel bundle\'s canonical connection $u^\\dagger du$: horizontal means "don\'t spin", and a loop turns the frame by the enclosed area.',
  },
  {
    id: '1.4a',
    section: '1.4',
    title: 'Curvature: horizontal loops that fail to close',
    items: ['1.4.1', '1.4.6', '1.4.7', '1.4.9', '1.4.15'],
    equations: ['(1.4.5)', '(1.4.9)', '(1.4.17)', '(1.4.19)'],
    summary: 'Lift a small rectangle horizontally and it comes back displaced along the fibre: the displacement per unit area is the curvature.',
  },
  {
    id: '1.7a',
    section: '1.7',
    title: 'Horizontal lifts, the book’s way',
    items: ['1.7.1', '1.7.2', '1.7.3', '1.7.4', '1.7.5', '1.7.6'],
    equations: ['(1.7.1)', '(1.7.3)', '(1.7.4)'],
    summary: 'Take any lift of a loop and slide it along the fibres until it is horizontal: the leftover shift after one turn is the holonomy, −½ × the enclosed area.',
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
