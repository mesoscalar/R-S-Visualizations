/**
 * Station 2.4a — constant sectional curvature (Def. 2.4.1–2.4.3, Prop. 2.4.2,
 * Rem. 2.4.4).
 *
 * Left: the conformal model of the surface of curvature k with a geodesic
 * triangle (tap to move the nearest corner) and a fan of geodesics from one
 * corner. Right: how far apart two geodesics leaving a point at angle δ are
 * after time t, for the chosen k against k = −1, 0, +1.
 */
import { angleAt, distance, geodesicPoint, segment, spreadExact, triangleArea, type Cx } from '../math/constant-curvature';
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
      return { ctx, W, H };
    },
  };
}

const EXTENT = 1.25;
const DELTA = 0.5;
const TMAX = 3;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lk, kS] = slider('curvature k', -1, 1, 0.6);
  const [ld, dS] = slider('fan length', 0.2, 2.5, 1.2);
  controls.append(lk, ld);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const Lp = canvasPane(paneL);
  const Rp = canvasPane(paneR);
  paneL.appendChild(el('div', 'pane-label', 'conformal model of curvature k — tap to move a corner'));
  paneR.appendChild(el('div', 'pane-label', 'separation of two geodesics at angle δ = 0.5'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['2.4a']));

  const corners: Cx[] = [
    [-0.45, -0.3],
    [0.5, -0.25],
    [0.05, 0.5],
  ];
  const geom = (W: number, H: number) => {
    const s = Math.min(W, H - 80) / (2 * EXTENT);
    return { s, cx: W / 2, cy: H / 2 + 34 };
  };

  function drawLeft(): void {
    const { ctx, W, H } = Lp.begin();
    const k = parseFloat(kS.value);
    const { s, cx, cy } = geom(W, H);
    const P = (z: Cx): [number, number] => [cx + s * z[0], cy - s * z[1]];
    if (Math.abs(k) > 1e-3) {
      // k > 0: the equator |z| = 1/√k; k < 0: the ideal boundary |z| = 1/√−k
      ctx.strokeStyle = k > 0 ? '#2a3247' : '#5a4060';
      ctx.setLineDash(k > 0 ? [4, 4] : []);
      ctx.beginPath();
      ctx.arc(cx, cy, s / Math.sqrt(Math.abs(k)), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const len = parseFloat(dS.value);
    for (let j = 0; j < 16; j++) {
      const a = (2 * Math.PI * j) / 16;
      ctx.strokeStyle = '#2f3850';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const [x, y] = P(geodesicPoint(k, corners[0], a, (len * i) / 60));
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const sides = [segment(k, corners[0], corners[1]), segment(k, corners[1], corners[2]), segment(k, corners[2], corners[0])];
    ctx.fillStyle = k > 0 ? 'rgba(240,163,94,0.18)' : k < 0 ? 'rgba(94,140,240,0.18)' : 'rgba(200,200,200,0.12)';
    ctx.beginPath();
    sides.flat().forEach((z, i) => (i ? ctx.lineTo(...P(z)) : ctx.moveTo(...P(z))));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e6e9ef';
    ctx.lineWidth = 2;
    ctx.stroke();
    const names = ['α', 'β', 'γ'];
    const ang = [angleAt(k, corners[0], corners[1], corners[2]), angleAt(k, corners[1], corners[2], corners[0]), angleAt(k, corners[2], corners[0], corners[1])];
    corners.forEach((c, i) => {
      const [x, y] = P(c);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`${names[i]} = ${((ang[i] * 180) / Math.PI).toFixed(1)}°`, x + 8, y - 8);
    });
    const area = triangleArea(k, corners[0], corners[1], corners[2]);
    const excess = ang[0] + ang[1] + ang[2] - Math.PI;
    hudBig.textContent = `α + β + γ − π = ${excess.toFixed(5)}`;
    hudSmall.textContent = `k · Area = ${(k * area).toFixed(5)} · Area = ${area.toFixed(4)} · sides ${[0, 1, 2]
      .map((i) => distance(k, corners[i], corners[(i + 1) % 3]).toFixed(3))
      .join(', ')}`;
  }

  function drawRight(): void {
    const { ctx, W, H } = Rp.begin();
    const k = parseFloat(kS.value);
    const pad = { l: 44, r: 18, t: 40, b: 34 };
    const X = (t: number) => pad.l + (t / TMAX) * (W - pad.l - pad.r);
    const YMAX = 2.2;
    const Y = (d: number) => H - pad.b - (Math.min(d, YMAX) / YMAX) * (H - pad.t - pad.b);
    ctx.strokeStyle = '#232a3b';
    for (const d of [0, 1, 2]) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(d));
      ctx.lineTo(X(TMAX), Y(d));
      ctx.stroke();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    for (const d of [0, 1, 2]) ctx.fillText(String(d), 18, Y(d) + 4);
    for (const t of [0, 1, 2, 3]) ctx.fillText(String(t), X(t) - 3, H - 14);
    ctx.fillText('t', X(TMAX) - 10, H - 28);
    const curve = (kk: number, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t = (TMAX * i) / 200;
        const d = spreadExact(kk, DELTA, t);
        if (d > YMAX) break;
        const [x, y] = [X(t), Y(d)];
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    };
    curve(1, '#5a4530', 1);
    curve(0, '#3a4560', 1);
    curve(-1, '#2f3f66', 1);
    curve(k, '#f0a35e', 2.5);
    // the same distance measured in the model, as a check on the exact formula
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i <= 6; i++) {
      const t = (TMAX * i) / 6;
      if (k > 0 && t > Math.PI / Math.sqrt(k)) break;
      const d = distance(k, geodesicPoint(k, [0, 0], 0, t), geodesicPoint(k, [0, 0], DELTA, t));
      if (!Number.isFinite(d)) break;
      ctx.beginPath();
      ctx.arc(X(t), Y(d), 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.fillText('faint: k = +1 (bends back), 0 (straight), −1 (blows up) · dots: distances measured in the model', 12, H - 2);
  }

  function update(): void {
    drawLeft();
    drawRight();
  }

  Lp.canvas.addEventListener('click', (ev) => {
    const rect = Lp.canvas.getBoundingClientRect();
    const { s, cx, cy } = geom(rect.width, rect.height);
    const z: Cx = [(ev.clientX - rect.left - cx) / s, -(ev.clientY - rect.top - cy) / s];
    const k = parseFloat(kS.value);
    // keep corners inside |k||z|² ≤ 0.8 so the chart stays well conditioned
    const lim = k < 0 ? Math.sqrt(0.8 / -k) : 1.2;
    const n = Math.hypot(...z);
    const zz: Cx = n > lim ? [(lim * z[0]) / n, (lim * z[1]) / n] : z;
    let best = 0;
    corners.forEach((c, i) => {
      if (Math.hypot(c[0] - zz[0], c[1] - zz[1]) < Math.hypot(corners[best][0] - zz[0], corners[best][1] - zz[1])) best = i;
    });
    corners[best] = zz;
    update();
  });
  kS.addEventListener('input', () => {
    const k = parseFloat(kS.value);
    if (k < 0) {
      const lim = Math.sqrt(0.8 / -k);
      for (let i = 0; i < 3; i++) {
        const n = Math.hypot(...corners[i]);
        if (n > lim) corners[i] = [(lim * corners[i][0]) / n, (lim * corners[i][1]) / n];
      }
    }
    update();
  });
  dS.addEventListener('input', update);
  const ro = new ResizeObserver(update);
  ro.observe(paneL);
  update();

  return () => ro.disconnect();
}
