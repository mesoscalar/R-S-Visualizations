/**
 * Station 4.6a — Chern–Weil forms do not depend on the connection
 * (Lemma 4.6.5, Def. 4.6.6, Cor. 4.6.8, Thm. 4.6.11, Cor. 4.6.12).
 *
 * Left: U(1) on the Hopf bundle: the curvature density of ω_t against the
 * polar angle, its transgression potential, and c₁. Right: SU(2) on R⁴: the
 * charge inside |x| < R for the BPST connection at scale λ, as a bulk integral
 * (curve) and as the Chern–Simons flux through |x| = R (dots).
 */
import { bpstScaled, chernNumber, coefficient, csFlux, density, transgression } from '../math/chern-weil';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { el } from './three-helpers';

function slider(label: string, min: number, max: number, value: number): [HTMLLabelElement, HTMLInputElement] {
  const l = el('label', '', label);
  const s = document.createElement('input');
  s.type = 'range';
  s.min = String(min);
  s.max = String(max);
  s.step = '0.005';
  s.value = String(value);
  l.appendChild(s);
  return [l, s];
}

function canvasPane(pane: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  pane.appendChild(canvas);
  return () => {
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
}

type Ctx = CanvasRenderingContext2D;
function axes(ctx: Ctx, W: number, H: number, xmax: number, ymin: number, ymax: number, xlabel: string) {
  const pad = { l: 44, r: 16, t: 70, b: 34 };
  const X = (x: number) => pad.l + (x / xmax) * (W - pad.l - pad.r);
  const Y = (y: number) => pad.t + ((ymax - y) / (ymax - ymin)) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#232a3b';
  ctx.lineWidth = 1;
  for (const y of [0, (ymin + ymax) / 2, ymax]) {
    ctx.beginPath();
    ctx.moveTo(X(0), Y(y));
    ctx.lineTo(X(xmax), Y(y));
    ctx.stroke();
  }
  ctx.fillStyle = '#8a93a6';
  ctx.font = '12px system-ui, sans-serif';
  for (const y of [0, ymax]) ctx.fillText(y.toFixed(1), 8, Y(y) + 4);
  ctx.fillText(xlabel, X(xmax) - 40, H - 10);
  return { X, Y };
}
function curve(ctx: Ctx, f: (x: number) => number, xmax: number, X: (x: number) => number, Y: (y: number) => number, color: string, w: number, dash: number[] = [], x0 = 0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const x = x0 + ((xmax - x0) * i) / 200;
    const [px, py] = [X(x), Y(f(x))];
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

const RMAX = 4;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lt, tS] = slider('U(1): connection t (ω_c → ω_PU)', 0, 1, 0.6);
  const [ll, lS] = slider('SU(2): instanton scale λ', 0.4, 2.5, 1);
  controls.append(lt, ll);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const beginL = canvasPane(paneL);
  const beginR = canvasPane(paneR);
  paneL.appendChild(el('div', 'pane-label', 'U(1), Hopf bundle: curvature density against the polar angle θ'));
  paneR.appendChild(el('div', 'pane-label', 'SU(2), R⁴: charge inside |x| < R'));
  const hudL = el('div', 'hud');
  const hudLBig = el('div', 'big readout');
  const hudLSmall = el('div', 'small readout');
  hudL.append(hudLBig, hudLSmall);
  paneL.appendChild(hudL);
  const hudR = el('div', 'hud');
  const hudRBig = el('div', 'big readout');
  const hudRSmall = el('div', 'small readout');
  hudR.append(hudRBig, hudRSmall);
  paneR.appendChild(hudR);
  container.append(controls, panes, explainer(EXPLAINERS['4.6a']));

  function drawLeft(): void {
    const { ctx, W, H } = beginL();
    const t = parseFloat(tS.value);
    let top = 1;
    for (let k = 1; k < 200; k++) top = Math.max(top, density(1, (Math.PI * k) / 200));
    const { X, Y } = axes(ctx, W, H, Math.PI, -0.6, 1.1 * top, 'θ (0 → π)');
    curve(ctx, (th) => density(0, th), Math.PI - 0.02, X, Y, '#5a6380', 1.2, [], 0.02);
    curve(ctx, (th) => density(1, th), Math.PI - 0.02, X, Y, '#5e8cf0', 1.2, [4, 3], 0.02);
    curve(ctx, (th) => density(t, th), Math.PI - 0.02, X, Y, '#f0a35e', 2.5, [], 0.02);
    curve(ctx, (th) => transgression(t, th), Math.PI, X, Y, '#b07af0', 1.8);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('orange: density of 𝓕_t · grey: ω_c · dashed blue: ω_PU · purple: transgression tβ', 12, H - 26);
    hudLBig.textContent = `c₁ = ${chernNumber(t).toFixed(6)}`;
    hudLSmall.textContent = `a_t(π) − a_t(0) = ${(coefficient(t, Math.PI - 1e-12) - coefficient(t, 1e-12)).toFixed(6)} · tβ vanishes at both poles`;
  }

  let token = 0;
  function drawRight(): void {
    const lam = parseFloat(lS.value);
    const bulk = (R: number) => {
      const u = 1 + (R / lam) ** 2;
      return 1 - 3 / u ** 2 + 2 / u ** 3;
    };
    const dens = (R: number) => {
      // charge per unit radius: 12 R³ λ⁴ / (λ² + R²)⁴ · (normalised so that ∫ = 1)
      return (12 * R ** 3 * lam ** 4) / (lam * lam + R * R) ** 4;
    };
    const dots: [number, number][] = [];
    const paint = () => {
      const { ctx, W, H } = beginR();
      const { X, Y } = axes(ctx, W, H, RMAX, 0, 1.2, '|x| = R');
      curve(ctx, dens, RMAX, X, Y, '#5a6380', 1.2);
      curve(ctx, bulk, RMAX, X, Y, '#69d58c', 2.5);
      ctx.fillStyle = '#ffffff';
      for (const [R, q] of dots) {
        ctx.beginPath();
        ctx.arc(X(R), Y(q), 4.5, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('green: bulk ∫ tr 𝓕∧𝓕/8π² · white: Chern–Simons flux through |x| = R · grey: charge per unit R', 12, H - 26);
    };
    paint();
    hudRBig.textContent = `total charge → 1 for every λ`;
    hudRSmall.textContent = 'computing Chern–Simons fluxes…';
    const my = ++token;
    const A = bpstScaled(lam);
    const Rs = [0.5, 1, 1.5, 2.2, 3, 3.8];
    let i = 0;
    const step = () => {
      if (my !== token || i >= Rs.length) return;
      const R = Rs[i++];
      // one Richardson step on the O(N⁻²) midpoint rule (as in the tests)
      const f = (2.25 * csFlux(A, R, 18) - csFlux(A, R, 12)) / 1.25;
      dots.push([R, f]);
      paint();
      hudRSmall.textContent = `at R = ${R}: flux ${f.toFixed(5)}, bulk ${bulk(R).toFixed(5)}`;
      window.setTimeout(step, 0);
    };
    window.setTimeout(step, 30);
  }

  tS.addEventListener('input', drawLeft);
  lS.addEventListener('change', drawRight);
  lS.addEventListener('input', () => {
    token++;
  });
  const ro = new ResizeObserver(() => {
    drawLeft();
  });
  ro.observe(paneL);
  drawLeft();
  drawRight();

  return () => {
    token++;
    ro.disconnect();
  };
}
