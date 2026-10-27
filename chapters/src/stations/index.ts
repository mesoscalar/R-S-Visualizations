/**
 * Lazy loaders for the station renderers, keyed by station id (see
 * STATIONS in ../book/ch1.ts). A station without a loader is listed as
 * "in progress" on the contents page.
 */
import type { StationModule } from '../book/ch1';

export const LOADERS: Record<string, () => Promise<StationModule>> = {
  A: () => import('./a-hopf'),
  B: () => import('./b-cech'),
  F: () => import('./f-sections'),
};
