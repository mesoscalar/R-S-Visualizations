/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Project-pages base path: the gallery sits at the site root,
  // https://<user>.github.io/R-S-Visualizations/ . The sibling `bundle`
  // project is published under /R-S-Visualizations/bundle/ (see its config).
  base: '/R-S-Visualizations/',
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
