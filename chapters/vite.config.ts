/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Published as a sibling of the gallery and bundle:
  //   /R-S-Visualizations/chapters/
  base: '/R-S-Visualizations/chapters/',
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
