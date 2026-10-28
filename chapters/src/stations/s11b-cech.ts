/**
 * Station 1.1b — transition maps and Čech classes
 * ((1.1.5)–(1.1.7), Prop. 1.1.10, Thm. 1.1.11, Rem. 1.1.12, Cor. 1.1.13, Rem. 1.1.21/2).
 *
 * Left (2D): the torus over the equator in chart-1 coordinates (φ, α), with
 * the two (re-trivialized) section curves s′1, s′2. Their crossings are the
 * zeros of arg ρ′12; the signed count is the class of the cocycle.
 * Right (3D, n = 1 only): the same torus inside S³ — the Clifford torus of
 * Hopf fibres — with the same two curves.
 */
import * as THREE from 'three';
import { stereographic, type Vec3 } from '@rsvis/math';
import {
  lambda1,
  lambda2,
  sectionCrossings,
  sectionHeight1,
  sectionHeight2,
  signedCount,
  torusPoint,
  transitionPhase,
  type Phase,
} from '../math/cech';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, phaseColorCss } from './three-helpers';

const TAU = 2 * Math.PI;
const mod = (x: number) => ((x % TAU) + TAU) % TAU;

function slider(label: string, min: number, max: number, value: number): [HTMLLabelElement, HTMLInputElement] {
  const l = el('label', '', label);
  const s = document.createElement('input');
  s.type = 'range';
  s.min = String(min);
  s.max = String(max);
  s.step = '0.01';
  s.value = String(value);
  l.appendChild(s);
  return [l, s];
}

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const nSel = document.createElement('select');
  for (const n of [-2, -1, 0, 1, 2, 3]) {
    const o = document.createElement('option');
    o.value = String(n);
    o.textContent = n === 1 ? 'ρ₁₂ = e^(−iφ) (Hopf)' : n === 0 ? 'ρ₁₂ = 1 (product)' : `ρ₁₂ = e^(${-n}iφ)`;
    nSel.appendChild(o);
  }
  nSel.value = '1';
  const [la1, a1] = slider('ρ₁: a', -4, 4, 0);
  const [lb1, b1] = slider('b', -4, 4, 0);
  const [la2, a2] = slider('ρ₂: a', -4, 4, 0);
  const [lb2, b2] = slider('b', -4, 4, 0);
  const reset = el('button', '', 'reset cochains');
  const shake = el('button', '', 'random cochains');
  controls.append(nSel, la1, lb1, la2, lb2, reset, shake);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'π⁻¹(equator) in chart 1: φ → , α = arg κ₁ ↑'));
  const labelR = el('div', 'pane-label', 'The same torus in S³ (stereographic)');
  paneR.appendChild(labelR);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);

  const canvas = document.createElement('canvas');
  paneL.appendChild(canvas);

  const caption = explainer(EXPLAINERS['1.1b']);
  container.append(controls, panes, caption);

  // ---------- 3D ----------
  const scene = createScenePane(paneR, { cameraPos: [2.4, -3.2, 2.4], up: [0, 0, 1] });
  const NU = 96;
  const NV = 48;
  {
    const pos = new Float32Array((NU + 1) * (NV + 1) * 3);
    const idx: number[] = [];
    for (let i = 0; i <= NU; i++) {
      for (let j = 0; j <= NV; j++) {
        pos.set(stereographic(torusPoint((TAU * i) / NU, (TAU * j) / NV)), (i * (NV + 1) + j) * 3);
        if (i < NU && j < NV) {
          const a = i * (NV + 1) + j;
          const b = (i + 1) * (NV + 1) + j;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const surf = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x2a3550, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    );
    scene.scene.add(surf);
    // a few Hopf fibres (φ fixed, α running) for orientation
    for (let i = 0; i < 12; i++) {
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 96; j++) {
        const p = stereographic(torusPoint((TAU * i) / 12, (TAU * j) / 96));
        pts.push(new THREE.Vector3(p[0], p[1], p[2]));
      }
      scene.scene.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4a5878 })),
      );
    }
  }
  const curves3 = new THREE.Group();
  scene.scene.add(curves3);

  // ---------- state & drawing ----------
  let st: { n: number; l1: Phase; l2: Phase } = { n: 1, l1: () => 0, l2: () => 0 };

  function read(): void {
    st = {
      n: parseInt(nSel.value, 10),
      l1: lambda1(parseFloat(a1.value), parseFloat(b1.value)),
      l2: lambda2(parseFloat(a2.value), parseFloat(b2.value)),
    };
  }

  function draw2D(): void {
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
    const pad = { l: 34, r: 14, t: 74, b: 30 };
    const side = Math.min(W - pad.l - pad.r, H - pad.t - pad.b);
    const x0 = pad.l + (W - pad.l - pad.r - side) / 2;
    const y0 = pad.t;
    const X = (phi: number) => x0 + (phi / TAU) * side;
    const Y = (alpha: number) => y0 + side - (mod(alpha) / TAU) * side;

    // background: hue = arg κ1 = α, as in Station 1.1a
    for (let j = 0; j < 64; j++) {
      ctx.fillStyle = phaseColorCss((TAU * (j + 0.5)) / 64, 18);
      ctx.fillRect(x0, y0 + side - ((j + 1) / 64) * side, side, side / 64 + 0.5);
    }
    ctx.strokeStyle = '#232a3b';
    ctx.strokeRect(x0, y0, side, side);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('0', x0 - 4, y0 + side + 16);
    ctx.fillText('2π', x0 + side - 10, y0 + side + 16);
    ctx.fillText('φ', x0 + side / 2, y0 + side + 18);
    ctx.fillText('α', x0 - 22, y0 + side / 2);

    const curve = (h: Phase, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let prev: number | null = null;
      for (let i = 0; i <= 720; i++) {
        const phi = (TAU * i) / 720;
        const a = mod(h(phi));
        if (prev !== null && Math.abs(a - prev) > Math.PI) ctx.moveTo(X(phi), Y(a));
        else if (i === 0) ctx.moveTo(X(phi), Y(a));
        else ctx.lineTo(X(phi), Y(a));
        prev = a;
      }
      ctx.stroke();
    };
    curve(sectionHeight1(st.l1), '#ffffff');
    curve(sectionHeight2(st.n, st.l2), '#f0a35e');

    const cs = sectionCrossings(transitionPhase(st.n, st.l1, st.l2));
    for (const c of cs) {
      const signGamma = -c.sign; // γ runs with φ = −t
      ctx.fillStyle = signGamma > 0 ? '#69d58c' : '#e05c5c';
      ctx.beginPath();
      ctx.arc(X(c.phi), Y(sectionHeight1(st.l1)(c.phi)), 6, 0, TAU);
      ctx.fill();
    }
    const deg = -signedCount(cs) + 0;
    hudBig.textContent = `deg ρ′₁₂ = ${deg > 0 ? '+' : ''}${deg}`;
    hudSmall.textContent = `${cs.length} crossing${cs.length === 1 ? '' : 's'} · ${cs.filter((c) => c.sign < 0).length} (+) / ${cs.filter((c) => c.sign > 0).length} (−) along γ`;
  }

  function draw3D(): void {
    clearGroup(curves3);
    const hopf = st.n === 1;
    labelR.textContent = hopf
      ? 'The same torus in S³ (stereographic): white s′₁, orange s′₂'
      : `n = ${st.n}: Prop. 1.1.10 still builds the bundle, but its total space is not S³ — 2D view only`;
    if (!hopf) return;
    const tube = (h: Phase, color: number) => {
      const pts: Vec3[] = [];
      for (let i = 0; i < 360; i++) {
        const phi = (TAU * i) / 360;
        pts.push(stereographic(torusPoint(phi, h(phi))));
      }
      curves3.add(coloredTube(pts, pts.map(() => new THREE.Color(color)), 0.025, true));
    };
    tube(sectionHeight1(st.l1), 0xffffff);
    tube(sectionHeight2(1, st.l2), 0xf0a35e);
    for (const c of sectionCrossings(transitionPhase(1, st.l1, st.l2))) {
      const b = ball(0.07, -c.sign > 0 ? 0x69d58c : 0xe05c5c);
      setPos(b, stereographic(torusPoint(c.phi, sectionHeight1(st.l1)(c.phi))));
      curves3.add(b);
    }
  }

  function update(): void {
    read();
    draw2D();
    draw3D();
  }

  for (const s of [a1, b1, a2, b2]) s.addEventListener('input', update);
  nSel.addEventListener('change', update);
  reset.addEventListener('click', () => {
    for (const s of [a1, b1, a2, b2]) s.value = '0';
    update();
  });
  shake.addEventListener('click', () => {
    for (const s of [a1, b1, a2, b2]) s.value = (8 * Math.random() - 4).toFixed(2);
    update();
  });
  const ro = new ResizeObserver(draw2D);
  ro.observe(paneL);
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
