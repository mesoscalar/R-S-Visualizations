/**
 * Widget registry: the gallery renders cards from this list and lazy-loads a
 * widget module on navigation. A widget module exports
 *   mount(container: HTMLElement): () => void   (returns a cleanup function).
 */

export interface WidgetEntry {
  id: string;
  num: number;
  title: string;
  /** The theorem the widget demonstrates (card subtitle, may contain LaTeX via $...$). */
  subtitle: string;
  /** Lazy loader; undefined while the widget is not built yet. */
  load?: () => Promise<{ mount: (container: HTMLElement) => () => void }>;
}

export const WIDGETS: WidgetEntry[] = [
  {
    id: 'clutching',
    num: 1,
    title: 'Clutching laboratory',
    subtitle:
      'Principal $U(1)$-bundles over $S^2$ are classified by the winding number of the equatorial transition function: $[S^1, U(1)] \\cong \\mathbb{Z}$.',
    load: () => import('./widgets/clutching'),
  },
  {
    id: 'chern-weil',
    num: 2,
    title: 'Chern–Weil on the monopole bundle',
    subtitle:
      'The first Chern number $\\tfrac{1}{2\\pi}\\int_{S^2} F = n$ is invariant under any global deformation $A \\mapsto A + a$ of the connection.',
    load: () => import('./widgets/chern-weil'),
  },
  {
    id: 'hopf',
    num: 3,
    title: 'Hopf bundle: fibers, connection, holonomy',
    subtitle:
      'Holonomy of the standard connection on $S^3 \\to S^2$ around a loop enclosing solid angle $\\Omega$ is $e^{-i\\Omega/2}$; distinct fibers are linked circles.',
    load: () => import('./widgets/hopf'),
  },
  {
    id: 'transport',
    num: 4,
    title: 'Parallel transport and holonomy on surfaces',
    subtitle:
      'Gauss–Bonnet: the holonomy angle equals $\\int K\\,dA$ — the cylinder bends but does not curve; Jacobi fields measure geodesic spreading.',
    load: () => import('./widgets/transport'),
  },
  {
    id: 'degree',
    num: 5,
    title: 'Degree and $\\pi_3(SU(2)) \\cong \\mathbb{Z}$',
    subtitle:
      '$q \\mapsto q^n$ has degree $n$ as a map $S^3 \\to S^3$: the integral of $\\det Df$ over $S^3$ is locked to $2\\pi^2 n$ under perturbation.',
    load: () => import('./widgets/degree'),
  },
  {
    id: 'instanton',
    num: 6,
    title: 'BPST instanton density',
    subtitle:
      'The one-instanton charge density integrates to exactly 1 for every scale $\\rho$ — the noncompact moduli direction squeezes but cannot leak.',
    load: () => import('./widgets/instanton'),
  },
  {
    id: 'mobius',
    num: 7,
    title: 'Möbius band as the nontrivial $\\mathbb{Z}/2$-bundle',
    subtitle:
      'Cylinder vs Möbius over $S^1$: a $\\pm 1$ transition function, and the forced zero of any continuous section of the Möbius band.',
  },
];
