/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Project-pages base path: site is served at https://<user>.github.io/R-S-Visualizations/
  base: '/R-S-Visualizations/',
  build: {
    chunkSizeWarningLimit: 1200,
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
