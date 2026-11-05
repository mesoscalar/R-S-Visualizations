/**
 * Station 4.7a — characteristic numbers of 4-manifolds from curvature
 * (Prop. 4.7.1, Ex. 4.7.3; Thm. 4.6.11, 4.6.14 in the explainer).
 *
 * For a chosen model 4-manifold: the curvature 2-forms at one point (the
 * spaces are homogeneous), the Chern–Weil densities, and the resulting
 * numbers χ, p₁, τ = p₁/3 (and c₁², c₂ when Kähler) next to their known values.
 */
import { VOLUMES, chernDensities, eulerDensity, p1Density } from '../math/char-numbers';
import { constantCurvature, fubiniStudy, operatorMatrix, product, transform, type Tensor4 } from '../math/self-duality';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { el } from './three-helpers';

const FLIP = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? (i === 3 ? -1 : 1) : 0)));

interface Model {
  label: string;
  R: () => Tensor4;
  vol: number;
  kahler: boolean;
  known: { chi: number; tau: number; c1sq?: number; c2?: number };
}
const MODELS: Model[] = [
  { label: 'S⁴ (round)', R: () => constantCurvature(1), vol: VOLUMES.S4, kahler: false, known: { chi: 2, tau: 0 } },
  { label: 'S² × S²', R: () => product(1, 1), vol: VOLUMES.S2S2, kahler: true, known: { chi: 4, tau: 0, c1sq: 8, c2: 4 } },
  { label: 'CP² (Fubini–Study)', R: () => fubiniStudy(), vol: VOLUMES.CP2, kahler: true, known: { chi: 3, tau: 1, c1sq: 9, c2: 3 } },
  { label: 'CP² with the opposite orientation', R: () => transform(fubiniStudy(), FLIP), vol: VOLUMES.CP2, kahler: false, known: { chi: 3, tau: -1 } },
];

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const sel = document.createElement('select');
  MODELS.forEach((m, k) => {
    const o = document.createElement('option');
    o.value = String(k);
    o.textContent = m.label;
    if (k === 2) o.selected = true;
    sel.appendChild(o);
  });
  controls.append(sel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'curvature operator on Λ² at one point (rows/cols φ¹₊ φ²₊ φ³₊ | φ¹₋ φ²₋ φ³₋)'));
  paneR.appendChild(el('div', 'pane-label', 'characteristic numbers = density × volume'));
  const canvases = [paneL, paneR].map((p) => {
    const c = document.createElement('canvas');
    c.style.position = 'absolute';
    c.style.inset = '0';
    p.appendChild(c);
    return c;
  });
  container.append(controls, panes, explainer(EXPLAINERS['4.7a']));

  const begin = (pane: HTMLElement, canvas: HTMLCanvasElement) => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const W = pane.clientWidth;
    const H = pane.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  };

  function draw(): void {
    const m = MODELS[parseInt(sel.value, 10)];
    const R = m.R();
    {
      const { ctx, W, H } = begin(paneL, canvases[0]);
      const M = operatorMatrix(R);
      const cell = Math.min(44, (W - 40) / 6.5, (H - 70) / 6.5);
      const ox = (W - 6 * cell) / 2;
      const oy = 44;
      for (let a = 0; a < 6; a++)
        for (let b = 0; b < 6; b++) {
          const v = M[a][b];
          const al = Math.min(1, Math.abs(v));
          ctx.fillStyle = v >= 0 ? `rgba(240,163,94,${0.08 + 0.85 * al})` : `rgba(94,140,240,${0.08 + 0.85 * al})`;
          ctx.fillRect(ox + b * cell, oy + a * cell, cell - 2, cell - 2);
          if (Math.abs(v) > 1e-12) {
            ctx.fillStyle = '#e6e9ef';
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillText(v.toFixed(2), ox + b * cell + 4, oy + a * cell + cell / 2 + 4);
          }
        }
      ctx.strokeStyle = '#8a93a6';
      ctx.strokeRect(ox - 1, oy - 1, 3 * cell, 3 * cell);
      ctx.strokeRect(ox + 3 * cell - 1, oy + 3 * cell - 1, 3 * cell, 3 * cell);
    }
    {
      const { ctx, W } = begin(paneR, canvases[1]);
      const rows: [string, number, number | undefined, string][] = [];
      const chi = eulerDensity(R) * m.vol;
      const p1 = p1Density(R) * m.vol;
      rows.push(['χ = ∫ Pf(Ω/2π)', chi, m.known.chi, 'Euler characteristic']);
      rows.push(['p₁ = −∫ tr(Ω∧Ω)/8π²', p1, 3 * m.known.tau, 'first Pontryagin number']);
      rows.push(['τ = L₁ = p₁/3', p1 / 3, m.known.tau, 'signature (Hirzebruch)']);
      if (m.kahler) {
        const c = chernDensities(R);
        rows.push(['c₂ = ∫ (i/2π)² det Ω^C', c.c2 * m.vol, m.known.c2, '= χ for the tangent bundle']);
        rows.push(['c₁² = ∫ ((i/2π) tr Ω^C)²', c.c1sq * m.vol, m.known.c1sq, 'p₁ = c₁² − 2c₂']);
      }
      ctx.font = '14px system-ui, sans-serif';
      rows.forEach(([name, val, known, note], k) => {
        const y = 60 + k * 44;
        ctx.fillStyle = '#c9d1e0';
        ctx.fillText(name, 20, y);
        ctx.fillStyle = '#69d58c';
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillText(val.toFixed(6), W * 0.55, y);
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillStyle = '#8a93a6';
        ctx.fillText(`${note}${known !== undefined ? ` · known: ${known}` : ''}`, 20, y + 18);
        ctx.font = '14px system-ui, sans-serif';
      });
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`volume ${(m.vol / (Math.PI * Math.PI)).toFixed(4)} π² · the space is homogeneous, so density × volume is the integral`, 20, 60 + rows.length * 44 + 10);
    }
  }

  sel.addEventListener('change', draw);
  const ro = new ResizeObserver(draw);
  ro.observe(paneR);
  draw();

  return () => ro.disconnect();
}
