/**
 * Station 2.1a — torsion (Def. 2.1.10, Prop. 2.1.19, Def. 2.1.20, Prop. 2.1.22,
 * Rem. 2.1.29, 2.1.30; (2.1.33), (2.1.55), (2.1.58), (2.1.60)).
 *
 * Left: a chart with a fan of geodesics from p and, along one of them, the
 * parallel frame for τ = 0 (grey) and for the chosen τ (colour). Right: a zoom
 * on the geodesic parallelogram at p: X then Y (green), Y then X (orange), the
 * gap between the endpoints and the prediction −ε²T(X, Y) (dashed).
 */
import { conformalLC, geodesicTransport, parallelogram, torsion, withTorsion, type Christoffel, type V2 } from '../math/linear-connections';
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

/** A canvas filling its pane, redrawn at device resolution. */
function canvasPane(pane: HTMLElement): { canvas: HTMLCanvasElement; begin: () => { ctx: CanvasRenderingContext2D; W: number; H: number } } {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  pane.appendChild(canvas);
  return {
    canvas,
    begin: () => {
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
    },
  };
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width: number, dash: number[] = []): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 1) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(y1 - y0, x1 - x0);
  const hl = Math.min(9, 0.35 * len);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
  ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}

function polyline(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width: number, dash: number[] = []): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

const R2 = (a: number): V2 => [Math.cos(a), Math.sin(a)];
const EXTENT = 1.6;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const curvedSel = document.createElement('select');
  curvedSel.innerHTML = '<option value="1">base: round sphere chart</option><option value="0">base: flat plane</option>';
  const [lt, tauS] = slider('torsion τ', -3, 3, 1.5);
  const [lb, betaS] = slider('direction of t', -Math.PI, Math.PI, 0.6);
  const [la, alphaS] = slider('X, Y angle', -Math.PI, Math.PI, 0.3);
  const [le, epsS] = slider('ε', 0.02, 0.5, 0.1);
  controls.append(curvedSel, lt, lb, la, le);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const L = canvasPane(paneL);
  const R = canvasPane(paneR);
  paneL.appendChild(el('div', 'pane-label', 'geodesics from p (tap to move p); parallel frames: grey τ = 0, colour τ'));
  paneR.appendChild(el('div', 'pane-label', 'parallelogram at p'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['2.1a']));

  let p: V2 = [-0.35, -0.25];

  function conns(): { base: Christoffel; twisted: Christoffel; tau: number } {
    const base = conformalLC(parseFloat(curvedSel.value));
    const tau = parseFloat(tauS.value);
    return { base, twisted: withTorsion(base, tau, R2(parseFloat(betaS.value))), tau };
  }

  function drawLeft(): void {
    const { ctx, W, H } = L.begin();
    const s = Math.min(W, H - 30) / (2 * EXTENT);
    const cx = W / 2;
    const cy = H / 2 + 12;
    const P = (x: V2): [number, number] => [cx + s * x[0], cy - s * x[1]];
    const { base, twisted } = conns();
    if (curvedSel.value === '1') {
      // the equator |x| = 1 of the stereographic chart
      ctx.strokeStyle = '#2a3247';
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, 2 * Math.PI);
      ctx.stroke();
    }
    for (let k = 0; k < 12; k++) {
      const g = geodesicTransport(base, p, R2((2 * Math.PI * k) / 12), [], 1.4, 80);
      polyline(ctx, g.x.map(P), '#3a4560', 1.2);
    }
    const v0 = R2(parseFloat(alphaS.value));
    const frame0: V2[] = [v0, R2(parseFloat(alphaS.value) + Math.PI / 2)];
    const g0 = geodesicTransport(base, p, v0, frame0, 1.4, 140);
    const g1 = geodesicTransport(twisted, p, v0, frame0, 1.4, 140);
    polyline(ctx, g1.x.map(P), '#e6e9ef', 2);
    const fs = 0.22 * s;
    for (let i = 0; i <= 140; i += 20) {
      const [x, y] = P(g1.x[i]);
      for (const [Ys, col] of [
        [g0.Y, '#4a5570'],
        [g1.Y, ''],
      ] as const) {
        arrow(ctx, x, y, x + fs * Ys[0][i][0], y - fs * Ys[0][i][1], col || '#69d58c', col ? 1.2 : 2);
        arrow(ctx, x, y, x + fs * Ys[1][i][0], y - fs * Ys[1][i][1], col || '#5e8cf0', col ? 1.2 : 2);
      }
    }
    const [px, py] = P(p);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('white: a geodesic, with γ̇ = u(t)x for its parallel frame u(t)', 12, H - 12);
  }

  function drawRight(): void {
    const { ctx, W, H } = R.begin();
    const { base, twisted } = conns();
    const eps = parseFloat(epsS.value);
    const a = parseFloat(alphaS.value);
    const X = R2(a);
    const Y = R2(a + Math.PI / 2);
    const q = parallelogram(twisted, p, X, Y, eps, 80);
    const q0 = parallelogram(base, p, X, Y, eps, 80);
    const s = (0.32 * Math.min(W, H)) / eps;
    const cx = W / 2 - 0.4 * eps * s;
    const cy = H / 2 + 0.4 * eps * s + 20;
    const P = (x: V2): [number, number] => [cx + s * (x[0] - p[0]), cy - s * (x[1] - p[1])];
    polyline(ctx, q0.pathXY.map(P), '#3a4560', 1, [3, 3]);
    polyline(ctx, q0.pathYX.map(P), '#3a4560', 1, [3, 3]);
    polyline(ctx, q.pathXY.map(P), '#69d58c', 2.5);
    polyline(ctx, q.pathYX.map(P), '#f0a35e', 2.5);
    const T = torsion(twisted, p, X, Y);
    const [ax, ay] = P(q.qYX);
    const [bx, by] = P(q.qXY);
    arrow(ctx, ax, ay, bx, by, '#ff5c5c', 2);
    arrow(ctx, ax, ay, ax - s * eps * eps * T[0], ay + s * eps * eps * T[1], '#ffffff', 1.2, [4, 3]);
    const [px, py] = P(p);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('red: the gap q_XY − q_YX · dashed white: −ε²T(X,Y) · dotted grey: the same with τ = 0', 12, H - 12);
    const gap: V2 = [q.qXY[0] - q.qYX[0], q.qXY[1] - q.qYX[1]];
    const pred: V2 = [-eps * eps * T[0], -eps * eps * T[1]];
    hudBig.textContent = `|gap| / ε² = ${(Math.hypot(...gap) / eps ** 2).toFixed(4)}`;
    hudSmall.textContent =
      `|T(X,Y)| = ${Math.hypot(...T).toFixed(4)} · |gap − (−ε²T)| / ε² = ${(Math.hypot(gap[0] - pred[0], gap[1] - pred[1]) / eps ** 2).toFixed(4)} · ` +
      `τ = 0 gap / ε² = ${(Math.hypot(q0.qXY[0] - q0.qYX[0], q0.qXY[1] - q0.qYX[1]) / eps ** 2).toFixed(4)}`;
  }

  function update(): void {
    drawLeft();
    drawRight();
  }

  L.canvas.addEventListener('click', (ev) => {
    const rect = L.canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const s = Math.min(W, H - 30) / (2 * EXTENT);
    const x: V2 = [(ev.clientX - rect.left - W / 2) / s, -(ev.clientY - rect.top - H / 2 - 12) / s];
    const n = Math.hypot(...x);
    p = n > 1.2 ? [(1.2 * x[0]) / n, (1.2 * x[1]) / n] : x;
    update();
  });
  curvedSel.addEventListener('change', update);
  for (const sl of [tauS, betaS, alphaS, epsS]) sl.addEventListener('input', update);
  const ro = new ResizeObserver(update);
  ro.observe(paneL);
  update();

  return () => ro.disconnect();
}
