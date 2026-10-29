/**
 * Lazy loaders for the station renderers, keyed by station id (see
 * STATIONS in ../book/ch1.ts). A station without a loader is listed as
 * "in progress" on the contents page.
 */
import type { StationModule } from '../book';

export const LOADERS: Record<string, () => Promise<StationModule>> = {
  '1.1a': () => import('./s11a-hopf'),
  '1.1b': () => import('./s11b-cech'),
  '1.1c': () => import('./s11c-frames'),
  '1.1d': () => import('./s11d-family'),
  '1.2a': () => import('./s12a-sections'),
  '1.2b': () => import('./s12b-tangent'),
  '1.3a': () => import('./s13a-horizontal'),
  '1.3b': () => import('./s13b-gauge'),
  '1.3c': () => import('./s13c-affine'),
  '1.3d': () => import('./s13d-stiefel'),
  '1.4a': () => import('./s14a-curvature'),
  '1.7a': () => import('./s17a-lifts'),
  '1.7b': () => import('./s17b-holonomy'),
  '1.8a': () => import('./s18a-gauge'),
  '2.1a': () => import('./s21a-torsion'),
  '2.4a': () => import('./s24a-curvature'),
  '2.5a': () => import('./s25a-symmetric'),
  '1.4b': () => import('./s14b-instanton'),
  '1.5a': () => import('./s15a-koszul'),
  '1.6a': () => import('./s16a-reduction'),
};
