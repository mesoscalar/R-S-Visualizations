/**
 * Station 3.8a — a universal connection made explicit (Def. 3.8.1,
 * Lemma 3.8.2, 3.8.3, Thm. 3.8.4).
 *
 * Left: S² shaded by the partition of unity (chart 1 blue, chart 2 orange),
 * with a loop and the current point. Right: the eight complex components of
 * ϑ(γʰ(t)) ∈ S¹⁵ ⊂ C⁸ along the ω-horizontal lift γʰ of the loop, as dials.
 */
import * as THREE from 'three';
import { omegaC, type Vec3 } from '@rsvis/math';
import { omegaPU } from '../math/affine-connections';
import { chart1Lift, circleLoop, type U1Connection } from '../math/transport';
import { THETA_A, THETA_B, omegaCanonical, psi, universalMap } from '../math/universal-connection';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el } from './three-helpers';

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

const CONNS: Record<string, { label: string; omega: U1Connection }> = {
  c: { label: 'ω = ω_c (the Hopf connection)', omega: omegaC },
  pu: { label: 'ω = ω_PU (glued from two flat pieces)', omega: omegaPU(-0.6, 0.2) },
};
const LAMBDA = 12;
const N = 400;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const connSel = document.createElement('select');
  for (const [k, c] of Object.entries(CONNS)) {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = c.label;
    connSel.appendChild(o);
  }
  const [lc, cS] = slider('loop centre (polar angle)', 0, 1.2, 0.9);
  const [lr, rS] = slider('loop radius', 0.2, 1.2, 0.8);
  const [lt, tS] = slider('t', 0, 1, 0.3);
  const play = el('button', '', '▶ run');
  controls.append(connSel, lc, lr, lt, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S²: blue = chart 1, orange = chart 2 (partition of unity)'));
  paneR.appendChild(el('div', 'pane-label', 'ϑ(γʰ(t)) ∈ S¹⁵ ⊂ C⁸: eight complex components'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['3.8a']));

  const scene = createScenePane(paneL, { cameraPos: [2.2, -2.4, 1.8], up: [0, 0, 1] });
  const geo = new THREE.SphereGeometry(1, 96, 48);
  geo.rotateX(Math.PI / 2);
  const cols = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const blue = new THREE.Color(0x2f4f8a);
  const orange = new THREE.Color(0x8a5a2f);
  const tmp = new THREE.Color();
  for (let k = 0; k < geo.attributes.position.count; k++) {
    const th = Math.acos(Math.max(-1, Math.min(1, geo.attributes.position.getZ(k))));
    const w = Math.sin(psi(th)) ** 2;
    tmp.copy(blue).lerp(orange, w);
    cols.set([tmp.r, tmp.g, tmp.b], 3 * k);
  }
  scene.scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })));
  for (const th of [THETA_A, THETA_B]) {
    const ring: Vec3[] = Array.from({ length: 121 }, (_, i) => [Math.sin(th) * Math.cos((2 * Math.PI * i) / 120) * 1.004, Math.sin(th) * Math.sin((2 * Math.PI * i) / 120) * 1.004, Math.cos(th) * 1.004]);
    scene.scene.add(coloredTube(ring, ring.map(() => new THREE.Color(0x8a93a6)), 0.005, true));
  }
  const dyn = new THREE.Group();
  scene.scene.add(dyn);

  let images: number[][] = [];
  let residual = 0;
  let gapLift = 0;
  let gapImage = 0;
  let loopPts: Vec3[] = [];

  function recompute(): void {
    const omega = CONNS[connSel.value].omega;
    const c0 = parseFloat(cS.value);
    const loop = circleLoop([Math.sin(c0), 0, Math.cos(c0)], parseFloat(rS.value));
    loopPts = Array.from({ length: N + 1 }, (_, i) => loop(i / N));
    const lift = chart1Lift(omega, loop, 0, 1, N);
    const th = universalMap(omega, LAMBDA);
    images = lift.lift.map((z) => th(z));
    // the image curve should be horizontal for u†du: ω_c(dϑ) ≈ 0 (central differences in t)
    residual = 0;
    let speed = 0;
    for (let i = 1; i < N; i++) {
      const d = images[i + 1].map((x, j) => (x - images[i - 1][j]) * (N / 2));
      residual = Math.max(residual, Math.abs(omegaCanonical(images[i], d)));
      speed = Math.max(speed, Math.hypot(...d));
    }
    residual /= speed;
    const z0 = lift.lift[0];
    const z1 = lift.lift[N];
    gapLift = Math.atan2(z0[0] * z1[1] - z0[1] * z1[0] + z0[2] * z1[3] - z0[3] * z1[2], z0[0] * z1[0] + z0[1] * z1[1] + z0[2] * z1[2] + z0[3] * z1[3]);
    const a = images[0];
    const b = images[N];
    let re = 0;
    let im = 0;
    for (let j = 0; j < 16; j += 2) {
      re += a[j] * b[j] + a[j + 1] * b[j + 1];
      im += a[j] * b[j + 1] - a[j + 1] * b[j];
    }
    gapImage = Math.atan2(im, re);
  }

  function draw(): void {
    const k = Math.round(parseFloat(tS.value) * N);
    clearGroup(dyn);
    dyn.add(coloredTube(loopPts.map((p) => p.map((c) => c * 1.008) as Vec3), loopPts.map(() => new THREE.Color(0xe6e9ef)), 0.01, false));
    const b = ball(0.045, 0xf0a35e);
    setPos(b, loopPts[k].map((c) => c * 1.01) as Vec3);
    dyn.add(b);

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
    const v = images[k];
    const R = Math.min((W - 40) / 9, (H - 190) / 4.6);
    for (let j = 0; j < 8; j++) {
      const row = Math.floor(j / 4);
      const col = j % 4;
      const cx = 40 + R * 1.15 + col * 2.2 * R;
      const cy = 150 + R + row * 2.9 * R;
      ctx.strokeStyle = row === 0 ? '#2f4f8a' : '#8a5a2f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.stroke();
      const re = v[2 * j];
      const im = v[2 * j + 1];
      // the full radius stands for modulus 0.6
      const s = R / 0.6;
      ctx.strokeStyle = '#e6e9ef';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + s * re, cy - s * im);
      ctx.stroke();
      ctx.fillStyle = '#e6e9ef';
      ctx.beginPath();
      ctx.arc(cx + s * re, cy - s * im, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('top row: √φ₁ · f⁽¹⁾(π(p)) κ₁(p) — chart 1', 40, 142);
    ctx.fillText('bottom row: √φ₂ · f⁽²⁾(π(p)) κ₂(p) — chart 2', 40, 142 + 2.9 * R);
    hudBig.textContent = `holonomy ${((gapLift * 180) / Math.PI).toFixed(3)}°`;
    hudSmall.textContent = `upstairs in S¹⁵: ${((gapImage * 180) / Math.PI).toFixed(3)}° · |u†du(dϑ/dt)|/|dϑ/dt| ≤ ${residual.toExponential(1)} along the lift`;
  }

  let anim = false;
  play.addEventListener('click', () => {
    anim = true;
    tS.value = '0';
  });
  scene.onFrame((dt) => {
    if (!anim) return;
    const t = parseFloat(tS.value) + 0.15 * dt;
    if (t >= 1) anim = false;
    tS.value = String(Math.min(1, t));
    draw();
  });
  const full = () => {
    recompute();
    draw();
  };
  connSel.addEventListener('change', full);
  for (const s of [cS, rS]) s.addEventListener('input', full);
  tS.addEventListener('input', () => {
    anim = false;
    draw();
  });
  const ro = new ResizeObserver(draw);
  ro.observe(paneR);
  full();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
