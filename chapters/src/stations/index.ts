/**
 * Lazy loaders for the station renderers, keyed by station id (see
 * STATIONS in ../book/ch1.ts). A station without a loader is listed as
 * "in progress" on the contents page.
 */
import type { StationModule } from '../book/ch1';

export const LOADERS: Record<string, () => Promise<StationModule>> = {
  '1.1a': () => import('./s11a-hopf'),
  '1.1b': () => import('./s11b-cech'),
  '1.2a': () => import('./s12a-sections'),
  '1.3a': () => import('./s13a-horizontal'),
  '1.3b': () => import('./s13b-gauge'),
};
