/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Project-pages base path. The two sibling projects are published at
  // parallel paths under the repo's Pages root:
  //   gallery → /R-S-Visualizations/gallery/
  //   bundle  → /R-S-Visualizations/bundle/   (see bundle/vite.config.ts)
  // A small static landing page at the bare root links to both.
  base: '/R-S-Visualizations/gallery/',
  server: {
    // allow importing the sibling workspace package @rsvis/math from ../math
    fs: { allow: ['..'] },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
