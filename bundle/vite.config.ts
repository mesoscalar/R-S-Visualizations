import { defineConfig } from 'vite';

export default defineConfig({
  // Published under the gallery's site at /R-S-Visualizations/bundle/.
  base: '/R-S-Visualizations/bundle/',
  server: {
    // allow importing the sibling workspace package @rsvis/math from ../math
    fs: { allow: ['..'] },
  },
});
