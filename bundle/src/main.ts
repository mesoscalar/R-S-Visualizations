/**
 * bundle — placeholder entry point.
 *
 * This subproject's spec has not arrived yet. Do not build features here until
 * it does (see bundle/CLAUDE.md and the root CLAUDE.md). The shared kernel is
 * already wired as a dependency, so when work starts it is imported like:
 *
 *   import { windingNumber } from '@rsvis/math';
 *
 * For now this only renders a placeholder so the combined Pages build produces
 * a valid page at /R-S-Visualizations/bundle/.
 */
import './style.css';

const app = document.getElementById('app')!;
app.innerHTML = `
  <main class="placeholder">
    <h1>bundle</h1>
    <p>A forthcoming instrument for the R-S-Visualizations monorepo.</p>
    <p class="dim">Spec pending — nothing built here yet.</p>
    <p class="dim"><a href="/R-S-Visualizations/">← back to the gallery</a></p>
  </main>
`;
