/**
 * Station 1.6a — a fibre metric is a reduction of the frame bundle to O(2)
 * (Prop. 1.6.2, Cor. 1.6.5, Ex. 1.6.6/2, Prop. 1.6.10, Def. 1.6.11, Ex. 1.6.12).
 *
 * Left: E = S¹ × R² drawn with each fibre in the plane spanned by the radial
 * direction and ẑ; the translucent tube is the h-unit ellipse in every fibre.
 * A frame transported around the loop by the chosen connection traces the
 * green/blue curves. Right: the fibre at s, with the Euclidean unit circle,
 * the h-unit ellipse, the transported frame and an arbitrary frame's polar
 * retraction onto Q = {eᵀhe = 1}.
 */
import * as THREE from 'three';
import type { Vec3 } from '@rsvis/math';
import {
  I2,
  apply,
  gram,
  holonomy,
  holonomyAngle,
  invSqrtSPD,
  metric,
  toQ,
  transport,
  type ConnKind,
  type M2,
  type MetricParams,
  type V2,
} from '../math/reduction';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { clearGroup, coloredTube, createScenePane, el } from './three-helpers';

const R0 = 1.6;
const FS = 0.4;
const ARB: M2 = [1.1, 0.7, 0.25, 0.8];

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

/** The fibre point v over s, embedded in R³. */
function embed(s: number, v: V2): Vec3 {
  const c = Math.cos(s);
  const n = Math.sin(s);
  return [(R0 + FS * v[0]) * c, (R0 + FS * v[0]) * n, FS * v[1]];
}

const col = (e: M2, j: number): V2 => [e[j], e[2 + j]];
const fmt = (x: number) => (Math.abs(x) < 5e-5 ? '0.000' : x.toFixed(3));

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const connSel = document.createElement('select');
  connSel.innerHTML =
    '<option value="h">∇ compatible with h</option><option value="euclid">∇ compatible with the euclidean metric</option>';
  const twistSel = document.createElement('select');
  twistSel.innerHTML = [0, 1, 2, 3].map((k) => `<option value="${k}" ${k === 1 ? 'selected' : ''}>axes turn ${k}π</option>`).join('');
  const [ld, dS] = slider('anisotropy δ', 0, 0.8, 0.45);
  const [lk, kS] = slider('skew part κ', -1.5, 1.5, 0);
  const [ls, sS] = slider('s', 0, 2 * Math.PI, 2.2);
  const play = el('button', '', '▶ go round');
  controls.append(connSel, twistSel, ld, lk, ls, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'E = S¹ × R²: tube of h-unit ellipses; transported frame green e₁, blue e₂'));
  paneR.appendChild(el('div', 'pane-label', 'the fibre at s'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.6a']));

  const scene = createScenePane(paneL, { cameraPos: [0.4, -3.6, 2.6], up: [0, 0, 1] });
  const tubeGeo = new THREE.BufferGeometry();
  const NS = 160;
  const NU = 48;
  const pos = new Float32Array((NS + 1) * (NU + 1) * 3);
  tubeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const idx: number[] = [];
  for (let i = 0; i < NS; i++)
    for (let j = 0; j < NU; j++) {
      const a = i * (NU + 1) + j;
      const b = a + NU + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  tubeGeo.setIndex(idx);
  const tube = new THREE.Mesh(
    tubeGeo,
    new THREE.MeshStandardMaterial({ color: 0x5a6a90, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
  );
  scene.scene.add(tube);
  const base: Vec3[] = [];
  for (let k = 0; k <= 200; k++) base.push(embed((2 * Math.PI * k) / 200, [0, 0]));
  scene.scene.add(coloredTube(base, base.map(() => new THREE.Color(0x8a93a6)), 0.01, false));
  const dyn = new THREE.Group();
  scene.scene.add(dyn);

  let params: MetricParams = { twist: 1, delta: 0.45, wobble: 0.25 };
  let path: { ss: number[]; frames: M2[] } = { ss: [0], frames: [I2] };
  let holInfo = '';

  function rebuild(): void {
    const delta = parseFloat(dS.value);
    // wobble ∝ δ so that δ = 0 is exactly the euclidean metric
    params = { twist: parseInt(twistSel.value, 10), delta, wobble: 0.5 * delta };
    for (let i = 0; i <= NS; i++) {
      const s = (2 * Math.PI * i) / NS;
      const hs = invSqrtSPD(metric(s, params));
      for (let j = 0; j <= NU; j++) {
        const u = (2 * Math.PI * j) / NU;
        pos.set(embed(s, apply(hs, [Math.cos(u), Math.sin(u)])), (i * (NU + 1) + j) * 3);
      }
    }
    tubeGeo.attributes.position.needsUpdate = true;
    tubeGeo.computeVertexNormals();
    const kind = connSel.value as ConnKind;
    const kappa = parseFloat(kS.value);
    path = transport(kind, params, kappa, toQ(metric(0, params), I2), 2 * Math.PI, 1200);
    let drift = 0;
    path.frames.forEach((F, i) => {
      const g = gram(metric(path.ss[i], params), F);
      drift = Math.max(drift, Math.abs(g[0] - 1), Math.abs(g[1]), Math.abs(g[3] - 1));
    });
    const hol = holonomy(kind, params, kappa);
    holInfo =
      `whole loop: ${drift.toExponential(1)}` +
      (kind === 'h' ? ` · holonomy: rotation by ${((holonomyAngle(hol, params) * 180) / Math.PI).toFixed(1)}° in SO(h)` : '');
    update();
  }

  /** Index of the transport sample nearest the slider; the display snaps s to it so h and the frame match. */
  function sampleAt(): number {
    return Math.min(path.frames.length - 1, Math.round((parseFloat(sS.value) / (2 * Math.PI)) * (path.frames.length - 1)));
  }

  function update(): void {
    const k = sampleAt();
    const s = path.ss[k];
    clearGroup(dyn);
    for (const [j, color] of [
      [0, 0x69d58c],
      [1, 0x5e8cf0],
    ] as const) {
      const pts = path.frames.slice(0, k + 1).map((F, i) => embed(path.ss[i], col(F, j)));
      if (pts.length > 1) dyn.add(coloredTube(pts, pts.map(() => new THREE.Color(color)), 0.012, false));
      const F = path.frames[k];
      const seg = [embed(s, [0, 0]), embed(s, col(F, j))];
      dyn.add(coloredTube(seg, seg.map(() => new THREE.Color(color)), 0.02, false));
    }
    const hs = invSqrtSPD(metric(s, params));
    const ring: Vec3[] = [];
    for (let j = 0; j <= 96; j++) {
      const u = (2 * Math.PI * j) / 96;
      ring.push(embed(s, apply(hs, [Math.cos(u), Math.sin(u)])));
    }
    dyn.add(coloredTube(ring, ring.map(() => new THREE.Color(0xffffff)), 0.008, false));

    const g = gram(metric(s, params), path.frames[k]);
    const off = Math.max(Math.abs(g[0] - 1), Math.abs(g[1]), Math.abs(g[3] - 1));
    hudBig.textContent = `max |eᵀhe − 1| = ${fmt(off)}`;
    hudSmall.textContent = `eᵀhe = [[${fmt(g[0])}, ${fmt(g[1])}], [${fmt(g[2])}, ${fmt(g[3])}]] · ${holInfo}`;
    drawFibre();
  }

  function drawFibre(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const W = paneR.clientWidth;
    const H = paneR.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const k = sampleAt();
    const h = metric(path.ss[k], params);
    const hs = invSqrtSPD(h);
    const sc = (0.17 * Math.min(W, H)) / 1;
    const cx = W / 2;
    const cy = H / 2 + 30;
    const P = (v: V2): [number, number] => [cx + sc * v[0], cy - sc * v[1]];
    const loop = (f: (u: number) => V2, color: string, dash: number[] = []) => {
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let j = 0; j <= 120; j++) {
        const [x, y] = P(f((2 * Math.PI * j) / 120));
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const arrow = (v: V2, color: string, width: number, dash: number[] = []) => {
      const [x0, y0] = P([0, 0]);
      const [x1, y1] = P(v);
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
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 10 * Math.cos(a - 0.4), y1 - 10 * Math.sin(a - 0.4));
      ctx.lineTo(x1 - 10 * Math.cos(a + 0.4), y1 - 10 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
    };
    loop((u) => [Math.cos(u), Math.sin(u)], '#3a4560', [4, 4]);
    loop((u) => apply(hs, [Math.cos(u), Math.sin(u)]), '#ffffff');
    const q = toQ(h, ARB);
    arrow(col(ARB, 0), '#6b7388', 1.5, [4, 3]);
    arrow(col(ARB, 1), '#6b7388', 1.5, [4, 3]);
    arrow(col(q, 0), '#b07af0', 1.5);
    arrow(col(q, 1), '#b07af0', 1.5);
    const F = path.frames[k];
    arrow(col(F, 0), '#69d58c', 3);
    arrow(col(F, 1), '#5e8cf0', 3);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#8a93a6';
    const ga = gram(h, ARB);
    ctx.fillText(
      `dashed circle: euclidean unit vectors · white: h-unit vectors · grey: a frame e with eᵀhe = [[${ga[0].toFixed(2)}, ${ga[1].toFixed(2)}], …]`,
      12,
      H - 30,
    );
    ctx.fillText('purple: its retraction e(eᵀhe)^(−1/2) onto Q · green/blue: the transported frame', 12, H - 12);
  }

  let anim = false;
  play.addEventListener('click', () => {
    anim = true;
    sS.value = '0';
  });
  scene.onFrame((dt) => {
    if (!anim) return;
    const s = parseFloat(sS.value) + 1.2 * dt;
    if (s >= 2 * Math.PI) anim = false;
    sS.value = String(Math.min(2 * Math.PI, s));
    update();
  });
  for (const x of [connSel, twistSel]) x.addEventListener('change', rebuild);
  for (const x of [dS, kS]) x.addEventListener('input', rebuild);
  sS.addEventListener('input', () => {
    anim = false;
    update();
  });
  const ro = new ResizeObserver(drawFibre);
  ro.observe(paneR);
  rebuild();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
