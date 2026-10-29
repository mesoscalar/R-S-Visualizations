/**
 * Station 2.6a — the Chern connection of the tautological line bundle over
 * CP¹ (Def. 2.6.7, Prop. 2.6.8, Def. 2.6.9, Cor. 2.6.10; (2.6.6), (2.6.7)).
 *
 * Left: the chart z of CP¹, shaded by H = |e|² = 1 + |z|², with the two real
 * parts of 𝒜 drawn as fields (Re 𝒜 = ½ d log H, Im 𝒜 rotational) and a loop.
 * Right: the coefficient of a parallel section along the loop, in the
 * holomorphic frame e (orange) and in the unitary frame e/|e| (white).
 */
import { chernA, circleLoop, fluxThroughDisk, metricH, transportCoefficient, type Cx } from '../math/chern';
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
      return { ctx, W, H, dpr };
    },
  };
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const hl = Math.min(6, 0.4 * len);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(a - 0.45), y1 - hl * Math.sin(a - 0.45));
  ctx.lineTo(x1 - hl * Math.cos(a + 0.45), y1 - hl * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

const EXTENT = 2.4;
const N = 600;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lr, rS] = slider('loop radius', 0.1, 1.6, 0.8);
  const [lt, tS] = slider('t along the loop', 0, 1, 1);
  const fieldSel = document.createElement('select');
  fieldSel.innerHTML = '<option value="both">show Re 𝒜 and Im 𝒜</option><option value="re">Re 𝒜 = ½ d log H</option><option value="im">Im 𝒜</option><option value="none">no field</option>';
  controls.append(lr, lt, fieldSel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const Lp = canvasPane(paneL);
  const Rp = canvasPane(paneR);
  paneL.appendChild(el('div', 'pane-label', 'chart z of CP¹, shaded by H = 1 + |z|² — tap to move the loop'));
  paneR.appendChild(el('div', 'pane-label', 'coefficient of a parallel section: orange in e, white in e/|e|'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['2.6a']));

  let z0: Cx = [0.3, 0.2];
  let cs: Cx[] = [];
  let loop = circleLoop(z0, 0.8);

  function recompute(): void {
    loop = circleLoop(z0, parseFloat(rS.value));
    cs = transportCoefficient(loop.z, loop.zdot, [1 / Math.sqrt(metricH(loop.z(0))), 0], N);
  }

  function drawLeft(): void {
    const { ctx, W, H } = Lp.begin();
    const s = Math.min(W, H - 30) / (2 * EXTENT);
    const cx = W / 2;
    const cy = H / 2 + 12;
    const P = (z: Cx): [number, number] => [cx + s * z[0], cy - s * z[1]];
    // shading: brightness ∝ log H
    const step = 6;
    for (let py = 0; py < H; py += step)
      for (let px = 0; px < W; px += step) {
        const z: Cx = [(px - cx) / s, -(py - cy) / s];
        const v = Math.log(metricH(z)) / Math.log(1 + 2 * EXTENT * EXTENT);
        ctx.fillStyle = `rgba(94,140,240,${0.05 + 0.3 * Math.min(1, v)})`;
        ctx.fillRect(px, py, step, step);
      }
    const show = fieldSel.value;
    for (let i = -6; i <= 6; i++)
      for (let j = -6; j <= 6; j++) {
        const z: Cx = [(i * EXTENT) / 6.5, (j * EXTENT) / 6.5];
        const [x, y] = P(z);
        // dual vectors of the 1-forms Re 𝒜, Im 𝒜 for the Euclidean chart metric
        const re: Cx = [chernA(z, [1, 0])[0], chernA(z, [0, 1])[0]];
        const im: Cx = [chernA(z, [1, 0])[1], chernA(z, [0, 1])[1]];
        const k = 0.45 * s;
        if (show === 'both' || show === 're') arrow(ctx, x, y, x + k * re[0], y - k * re[1], '#69d58c');
        if (show === 'both' || show === 'im') arrow(ctx, x, y, x + k * im[0], y - k * im[1], '#b07af0');
      }
    ctx.strokeStyle = '#e6e9ef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const [x, y] = P(loop.z(i / 200));
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    const t = parseFloat(tS.value);
    for (const [tt, col] of [
      [0, '#ffffff'],
      [t, '#f0a35e'],
    ] as const) {
      const [x, y] = P(loop.z(tt));
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('green: Re 𝒜 (changes |c|) · purple: Im 𝒜 (turns c)', 12, H - 12);
  }

  function drawRight(): void {
    const { ctx, W, H } = Rp.begin();
    const s = Math.min(W, H - 60) / 3;
    const cx = W / 2;
    const cy = H / 2 + 24;
    const P = (c: Cx): [number, number] => [cx + s * c[0], cy - s * c[1]];
    ctx.strokeStyle = '#2a3247';
    ctx.beginPath();
    ctx.arc(cx, cy, s, 0, 2 * Math.PI);
    ctx.moveTo(cx - 1.4 * s, cy);
    ctx.lineTo(cx + 1.4 * s, cy);
    ctx.moveTo(cx, cy - 1.4 * s);
    ctx.lineTo(cx, cy + 1.4 * s);
    ctx.stroke();
    const k = Math.round(parseFloat(tS.value) * N);
    const unit = cs.map((c, i) => {
      const r = Math.sqrt(metricH(loop.z(i / N)));
      return [c[0] * r, c[1] * r] as Cx;
    });
    for (const [pts, col, w] of [
      [cs, '#f0a35e', 2.5],
      [unit, '#e6e9ef', 2],
    ] as const) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      for (let i = 0; i <= k; i++) {
        const [x, y] = P(pts[i]);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      const [x, y] = P(pts[k]);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    let drift = 0;
    for (let i = 0; i <= N; i++) drift = Math.max(drift, Math.abs(Math.hypot(...unit[i]) - 1));
    const end = cs[N];
    const hol = (Math.atan2(end[1], end[0]) * 180) / Math.PI;
    const flux = fluxThroughDisk(z0, parseFloat(rS.value), 200);
    const pred = (Math.atan2(-Math.sin(flux), Math.cos(flux)) * 180) / Math.PI;
    hudBig.textContent = `holonomy: ${hol.toFixed(3)}°`;
    hudSmall.textContent = `exp(−∫∫𝓕) predicts ${pred.toFixed(3)}° · max ||φ|_h − 1| = ${drift.toExponential(1)} · (i/2π)∫_{CP¹}𝓕 = −1`;
  }

  function update(): void {
    drawLeft();
    drawRight();
  }

  Lp.canvas.addEventListener('click', (ev) => {
    const rect = Lp.canvas.getBoundingClientRect();
    const s = Math.min(rect.width, rect.height - 30) / (2 * EXTENT);
    z0 = [(ev.clientX - rect.left - rect.width / 2) / s, -(ev.clientY - rect.top - rect.height / 2 - 12) / s];
    recompute();
    update();
  });
  rS.addEventListener('input', () => {
    recompute();
    update();
  });
  tS.addEventListener('input', update);
  fieldSel.addEventListener('change', update);
  const ro = new ResizeObserver(update);
  ro.observe(paneL);
  recompute();
  update();

  return () => ro.disconnect();
}
