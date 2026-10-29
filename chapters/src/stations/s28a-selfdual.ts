/**
 * Station 2.8a — self-duality in four dimensions (Rem. 2.8.1, Cor. 2.8.3,
 * Lemma 2.8.5, Thm. 2.8.7, Def. 2.8.9, Ex. 2.8.10; (2.8.8), (2.8.22), (2.8.25)).
 *
 * Left: orbits on S³ (stereographically projected) of the rotation group
 * exp(t(a·L_i + b·R_i)) with L_i ∈ Λ²₊ (left multiplication by i) and
 * R_i ∈ Λ²₋ (right multiplication). Right: the curvature operator of a model
 * 4-manifold as a 6×6 matrix on Λ²₊ ⊕ Λ²₋ with its Singer–Thorpe blocks.
 */
import * as THREE from 'three';
import { mulberry32, stereographic, type Vec3 } from '@rsvis/math';
import {
  add,
  constantCurvature,
  expm4,
  fromOperator,
  fubiniStudy,
  product,
  quatMult,
  ricci,
  scale,
  singerThorpe,
  transform,
  type Tensor4,
} from '../math/self-duality';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { clearGroup, coloredTube, createScenePane, el, phaseColor } from './three-helpers';

const MIXES: [number, number, string][] = [
  [1, 0, 'Λ²₊ only: left multiplication by i'],
  [0, 1, 'Λ²₋ only: right multiplication by i'],
  [1, 1, 'equal parts: a rotation in one plane'],
  [1.5, 0.5, 'speeds 2 : 1 in the two planes'],
  [2.5, 0.5, 'speeds 3 : 2 — trefoils'],
];

function randomTensor(seed: number): Tensor4 {
  const rng = mulberry32(seed);
  const S = [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0, 0, 0, 0]);
  for (let a = 0; a < 6; a++)
    for (let b = a; b < 6; b++) {
      const v = 2 * rng() - 1;
      S[a][b] = v;
      S[b][a] = v;
    }
  const t = (S[0][0] + S[1][1] + S[2][2] - S[3][3] - S[4][4] - S[5][5]) / 6;
  for (let a = 0; a < 6; a++) S[a][a] -= (a < 3 ? 1 : -1) * t;
  return fromOperator(S);
}

const FLIP = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (i === j ? (i === 3 ? -1 : 1) : 0)));
const MANIFOLDS: [string, () => Tensor4][] = [
  ['S⁴ (round)', () => constantCurvature(1)],
  ['S² × S²', () => product(1, 1)],
  ['CP² (Fubini–Study, complex orientation)', () => fubiniStudy()],
  ['CP² with the opposite orientation', () => transform(fubiniStudy(), FLIP)],
  ['S² × H²', () => product(1, -1)],
  ['a random curvature tensor', () => randomTensor(Math.floor(Math.random() * 1e9))],
];

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const mixSel = document.createElement('select');
  MIXES.forEach(([, , label], k) => {
    const o = document.createElement('option');
    o.value = String(k);
    o.textContent = label;
    mixSel.appendChild(o);
  });
  const manSel = document.createElement('select');
  MANIFOLDS.forEach(([label], k) => {
    const o = document.createElement('option');
    o.value = String(k);
    o.textContent = label;
    manSel.appendChild(o);
  });
  controls.append(mixSel, manSel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'orbits of exp(t(a·L_i + b·R_i)) on S³, projected to R³'));
  paneR.appendChild(el('div', 'pane-label', 'curvature on Λ²₊ ⊕ Λ²₋'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['2.8a']));

  const scene = createScenePane(paneL, { cameraPos: [4.6, -4.9, 3.4], up: [0, 0, 1], maxDistance: 40 });
  const orbits = new THREE.Group();
  scene.scene.add(orbits);

  // starting points: on the Clifford torus |z₁| = |z₂| and off it
  const starts: number[][] = [];
  for (let k = 0; k < 10; k++) {
    const eta = k < 6 ? Math.PI / 4 : [0.5, 0.65, 0.92, 1.05][k - 6];
    const a = (2 * Math.PI * k) / 6;
    starts.push([Math.cos(eta) * Math.cos(a), Math.cos(eta) * Math.sin(a), Math.sin(eta) * Math.cos(0.7 * k), Math.sin(eta) * Math.sin(0.7 * k)]);
  }

  function drawOrbits(): void {
    clearGroup(orbits);
    const [a, b] = MIXES[parseInt(mixSel.value, 10)];
    const X = add(scale(a, quatMult('L', 1)), scale(b, quatMult('R', 1)));
    const NS = 240;
    const step = expm4(scale((2 * Math.PI) / NS, X));
    starts.forEach((x0, k) => {
      let x = x0.slice();
      const pts: Vec3[] = [];
      for (let n = 0; n <= NS; n++) {
        const p = stereographic(x) as Vec3;
        pts.push(Math.hypot(...p) > 8 ? (p.map((c) => (8 * c) / Math.hypot(...p)) as Vec3) : p);
        x = [0, 1, 2, 3].map((i) => step[i].reduce((s, v, j) => s + v * x[j], 0));
      }
      const col = phaseColor((2 * Math.PI * k) / starts.length);
      orbits.add(coloredTube(pts, pts.map(() => col), 0.025, true));
    });
  }

  let tensorNow: Tensor4 = MANIFOLDS[0][1]();

  function drawMatrix(): void {
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
    const st = singerThorpe(tensorNow);
    const { Sc } = ricci(tensorNow);
    const cell = Math.min(46, (H - 140) / 6.6, (W - 120) / 6.6);
    const ox = (W - 6 * cell) / 2;
    const oy = 104;
    const big = Math.max(1e-9, ...st.M.flat().map(Math.abs));
    for (let a = 0; a < 6; a++)
      for (let b = 0; b < 6; b++) {
        const v = st.M[a][b];
        const al = Math.min(1, Math.abs(v) / big);
        ctx.fillStyle = v >= 0 ? `rgba(240,163,94,${0.08 + 0.85 * al})` : `rgba(94,140,240,${0.08 + 0.85 * al})`;
        ctx.fillRect(ox + b * cell, oy + a * cell, cell - 2, cell - 2);
        ctx.fillStyle = '#e6e9ef';
        ctx.font = '11px system-ui, sans-serif';
        if (Math.abs(v) > 5e-13) ctx.fillText(v.toFixed(2), ox + b * cell + 4, oy + a * cell + cell / 2 + 4);
      }
    const box = (r0: number, c0: number, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + c0 * cell - 2, oy + r0 * cell - 2, 3 * cell + 2, 3 * cell + 2);
      ctx.fillStyle = color;
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(label, ox + c0 * cell + 3 * cell - 16, oy + r0 * cell + 14);
    };
    box(0, 0, '#ff5c5c', 'A');
    box(0, 3, '#69d58c', 'B');
    box(3, 0, '#69d58c', 'Bᵀ');
    box(3, 3, '#5ec8f0', 'C');
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('rows/columns: φ¹₊ φ²₊ φ³₊ | φ¹₋ φ²₋ φ³₋ (Rem. 2.8.1)', ox, oy + 6 * cell + 18);
    const tags: string[] = [];
    if (st.normB < 1e-9) tags.push('Einstein (B = 0)');
    if (st.normWm < 1e-9) tags.push('self-dual (W₋ = 0)');
    if (st.normWp < 1e-9) tags.push('anti-self-dual (W₊ = 0)');
    hudBig.textContent = `−Sc/4 = ${(-Sc / 4).toFixed(3)}`;
    hudSmall.textContent =
      `tr A = ${st.trA.toFixed(3)} · tr C = ${st.trC.toFixed(3)} · |W₊| = ${st.normWp.toFixed(3)} · |W₋| = ${st.normWm.toFixed(3)} · |B| = ${st.normB.toFixed(3)}` +
      (tags.length ? ` · ${tags.join(', ')}` : '');
  }

  mixSel.addEventListener('change', drawOrbits);
  manSel.addEventListener('change', () => {
    tensorNow = MANIFOLDS[parseInt(manSel.value, 10)][1]();
    drawMatrix();
  });
  const ro = new ResizeObserver(drawMatrix);
  ro.observe(paneR);
  drawOrbits();
  drawMatrix();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
