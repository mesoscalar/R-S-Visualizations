/**
 * Station 1.4b — the curvature of the quaternionic Hopf bundle (Exercise 1.4.2;
 * Ex. 1.1.22, Prop. 1.4.9, 1.4.11, Rem. 1.4.12, 1.4.15).
 *
 * Left: the radial profile of the curvature in the chart x = q₂q₁⁻¹ ∈ R⁴ —
 * charge per unit radius and the accumulated charge, which tends to 1.
 * Right: su(2) ≅ R³ with the six components 𝓕_μν at the chosen point x,
 * coloured in ⋆-pairs (01|23, 02|31, 03|12); in the second chart (ghosts:
 * the first chart) they are rotated by Ad_{g⁻¹}, g = x̄/|x|.
 */
import * as THREE from 'three';
import { qconj, qmul, type Quat, type Vec3 } from '@rsvis/math';
import {
  bianchiResidual,
  bpstCurvature,
  bpstPotential,
  chargeDensity,
  components,
  gauge12,
} from '../math/quaternionic-hopf';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball } from './hopf-draw';
import { createScenePane, el, makeArrow, setArrow } from './three-helpers';

const RMAX = 4;
const COLORS = [0xff5c5c, 0x69d58c, 0x5e8cf0];
const LABELS = ['𝓕₀₁ | 𝓕₂₃', '𝓕₀₂ | 𝓕₃₁', '𝓕₀₃ | 𝓕₁₂'];
const SCALE = 0.55;

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

const im = (q: Quat): Vec3 => [q[1], q[2], q[3]];
const radialDensity = (r: number) => chargeDensity(components((m, n) => bpstCurvature([r, 0, 0, 0], m, n)));

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lr, rS] = slider('|x|', 0, RMAX, 0.8);
  const [lc, cS] = slider('direction χ', 0, Math.PI, 1.0);
  const [lp, pS] = slider('direction ψ', -Math.PI, Math.PI, 0.7);
  const chartSel = document.createElement('select');
  chartSel.innerHTML = '<option value="1">chart s₁ (around x = 0)</option><option value="2">chart s₂ (around ∞)</option>';
  controls.append(lr, lc, lp, chartSel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'radial profile in the chart x ∈ R⁴'));
  paneR.appendChild(el('div', 'pane-label', 'su(2) ≅ R³: the six components 𝓕_μν(x)'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneL.appendChild(canvas);
  const legend = el('div', 'small readout');
  legend.style.position = 'absolute';
  legend.style.left = '12px';
  legend.style.bottom = '10px';
  legend.innerHTML = LABELS.map((t, k) => `<span style="color:#${COLORS[k].toString(16)}">■ ${t}</span>`).join(' &nbsp; ');
  paneR.appendChild(legend);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.4b']));

  const scene = createScenePane(paneR, { cameraPos: [1.5, -1.65, 1.1], up: [0, 0, 1], minDistance: 0.8 });
  const axesMat = new THREE.LineBasicMaterial({ color: 0x2a3247 });
  for (const v of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...v).multiplyScalar(-1.1), new THREE.Vector3(...v).multiplyScalar(1.1)]);
    scene.scene.add(new THREE.Line(g, axesMat));
  }
  scene.scene.add(ball(0.03, 0xffffff));
  const main = [0, 1, 2, 3, 4, 5].map((k) => makeArrow(COLORS[k % 3]));
  const ghosts = [0, 1, 2, 3, 4, 5].map(() => makeArrow(0x4a5570));
  const tips = [3, 4, 5].map((k) => ball(0.045, COLORS[k % 3]));
  for (const o of [...main, ...ghosts, ...tips]) scene.scene.add(o);

  // cumulative charge on a fixed grid (trapezoid; the plot only needs pixel accuracy)
  const NG = 400;
  const rs = Array.from({ length: NG + 1 }, (_, k) => (RMAX * k) / NG);
  const perR = rs.map((r) => radialDensity(r) * 2 * Math.PI * Math.PI * r ** 3);
  const cum = [0];
  for (let k = 1; k <= NG; k++) cum.push(cum[k - 1] + ((perR[k] + perR[k - 1]) / 2) * (RMAX / NG));

  function point(): Quat {
    const r = parseFloat(rS.value);
    const c = parseFloat(cS.value);
    const p = parseFloat(pS.value);
    return [r * Math.cos(c), r * Math.sin(c) * Math.cos(p), r * Math.sin(c) * Math.sin(p) * 0.8, r * Math.sin(c) * Math.sin(p) * 0.6];
  }

  function update(): void {
    const x = point();
    const F1 = components((m, n) => bpstCurvature(x, m, n));
    const two = chartSel.value === '2' && Math.hypot(...x) > 1e-6;
    const g = two ? gauge12(x) : ([1, 0, 0, 0] as Quat);
    const F = F1.map((f) => qmul(qmul(qconj(g), f), g));
    F.forEach((f, k) => {
      setArrow(main[k], [0, 0, 0], im(f).map((c) => c * SCALE));
      if (k >= 3) tips[k - 3].position.set(...(im(f).map((c) => c * SCALE) as Vec3));
    });
    F1.forEach((f, k) => {
      ghosts[k].visible = two;
      if (two) setArrow(ghosts[k], [0, 0, 0], im(f).map((c) => c * SCALE));
    });
    const asd = Math.max(...[0, 1, 2].map((k) => Math.hypot(...im(F[k]).map((c, i) => c + im(F[k + 3])[i]))));
    const r = Math.hypot(...x);
    const k = Math.min(NG, Math.round((r / RMAX) * NG));
    hudBig.textContent = `charge inside |x| < ${r.toFixed(2)}: ${cum[k].toFixed(4)}`;
    hudSmall.textContent =
      `|𝓕₀₁| = ${Math.hypot(...im(F[0])).toFixed(4)} · max |𝓕₀ₐ + ⋆𝓕₀ₐ| = ${asd.toExponential(1)} · ` +
      `Bianchi residual ${bianchiResidual(bpstPotential, bpstCurvature, x).toExponential(1)}`;
    drawPlot(r);
  }

  function drawPlot(rNow = parseFloat(rS.value)): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const W = paneL.clientWidth;
    const H = paneL.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 44, r: 18, t: 40, b: 34 };
    const X = (r: number) => pad.l + (r / RMAX) * (W - pad.l - pad.r);
    const Y = (v: number) => pad.t + ((1.15 - v) / 1.2) * (H - pad.t - pad.b);
    ctx.strokeStyle = '#232a3b';
    for (const v of [0, 0.5, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(v));
      ctx.lineTo(X(RMAX), Y(v));
      ctx.stroke();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    for (const v of [0, 0.5, 1]) ctx.fillText(String(v), 14, Y(v) + 4);
    for (const r of [0, 1, 2, 3, 4]) ctx.fillText(String(r), X(r) - 3, H - 14);
    ctx.fillText('|x|', X(RMAX) - 18, H - 28);
    const curve = (vals: number[], color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      vals.forEach((v, k) => (k ? ctx.lineTo(X(rs[k]), Y(v)) : ctx.moveTo(X(rs[k]), Y(v))));
      ctx.stroke();
    };
    curve(perR, '#f0a35e', 2);
    curve(cum, '#69d58c', 2.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(rNow), Y(1.15));
    ctx.lineTo(X(rNow), Y(-0.05));
    ctx.stroke();
    ctx.fillStyle = '#f0a35e';
    ctx.fillText('charge per unit radius', X(0.9), Y(0.62));
    ctx.fillStyle = '#69d58c';
    ctx.fillText('charge inside radius |x|', X(2.0), Y(0.9));
  }

  for (const s of [rS, cS, pS]) s.addEventListener('input', update);
  chartSel.addEventListener('change', update);
  const ro = new ResizeObserver(() => drawPlot());
  ro.observe(paneL);
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
