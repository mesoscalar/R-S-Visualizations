/**
 * Station 1.1d — the Hopf family over R, C, H and the universal covering
 * (Ex. 1.1.22, Rem. 1.1.23, Ex. 1.1.24, Rem. 1.1.25, Ex. 1.1.26).
 *
 * Left: K = R — S¹ → RP¹ ≅ S¹, drawn as the boundary of a Möbius band over its
 * core circle — or the universal covering R → S¹ as a helix. Right: K = H —
 * the transition map ρ12 on the equatorial S³ (stereographic), deformed by
 * 0-cochains, with its degree computed live.
 */
import * as THREE from 'three';
import { degreeQuadrature, qmul, qexp, stereographic, type Quat, type Vec3 } from '@rsvis/math';
import {
  cochainExponent,
  cochainTransition,
  realHopf,
  realKappa,
  realTransition,
} from '../math/hopf-family';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el } from './three-helpers';

const TAU = 2 * Math.PI;

function slider(label: string, min: number, max: number, value: number, step = 0.01): [HTMLLabelElement, HTMLInputElement] {
  const l = el('label', '', label);
  const s = document.createElement('input');
  s.type = 'range';
  s.min = String(min);
  s.max = String(max);
  s.step = String(step);
  s.value = String(value);
  l.appendChild(s);
  return [l, s];
}

/** Total-space point over base angle 2s: the Möbius-band boundary picture of S¹ → RP¹. */
const mobiusBoundary = (s: number): Vec3 => {
  const r = 1 + 0.32 * Math.cos(s);
  return [r * Math.cos(2 * s), r * Math.sin(2 * s), 0.32 * Math.sin(s)];
};

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const leftSel = document.createElement('select');
  leftSel.innerHTML = '<option value="R">K = R: S¹ → RP¹, group O(1)</option><option value="U">universal cover R → S¹, group π₁ = ℤ</option>';
  const [ls, sS] = slider('point s', 0, TAU, 0.7);
  const [ln, nS] = slider('loop winding n', -3, 3, 2, 1);
  const [lc1, c1S] = slider('H: cochain ρ₁', -1.5, 1.5, 0);
  const [lc2, c2S] = slider('ρ₂', -1.5, 1.5, 0);
  controls.append(leftSel, ls, ln, lc1, lc2);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const labelL = el('div', 'pane-label', '');
  paneL.appendChild(labelL);
  paneR.appendChild(el('div', 'pane-label', 'K = H: ρ₁₂ on the equatorial S³ = Sp(1), images of great circles (stereographic)'));
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

  const caption = explainer(EXPLAINERS['1.1d']);
  container.append(controls, panes, caption);

  const sceneL = createScenePane(paneL, { cameraPos: [2.2, -3.2, 2.4], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [4.5, -5.5, 3.5], up: [0, 0, 1], maxDistance: 40 });
  const leftGroup = new THREE.Group();
  sceneL.scene.add(leftGroup);
  const rightGroup = new THREE.Group();
  sceneR.scene.add(rightGroup);

  const line = (pts: Vec3[], color: number) =>
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color }));

  function drawReal(): void {
    labelL.textContent = 'K = R: total space S¹ (orange: κ₁ = +1, blue: κ₁ = −1) over RP¹ ≅ S¹';
    const s = parseFloat(sS.value);
    // base circle coloured by ρ12 on U1 ∩ U2 (upper arc +1, lower arc −1)
    const base: Vec3[] = [];
    const baseCols: THREE.Color[] = [];
    for (let k = 0; k <= 360; k++) {
      const a = (TAU * k) / 360;
      base.push([Math.cos(a), Math.sin(a), 0]);
      // a base point at angle a has lift x = (cos(a/2), sin(a/2))
      const r = realTransition([Math.cos(a / 2), Math.sin(a / 2)]);
      baseCols.push(new THREE.Color(r === null ? 0xffffff : r > 0 ? 0x69d58c : 0xe05c5c));
    }
    leftGroup.add(coloredTube(base, baseCols, 0.018, true));
    const tot: Vec3[] = [];
    const cols: THREE.Color[] = [];
    for (let k = 0; k < 360; k++) {
      const t = (TAU * k) / 360;
      tot.push(mobiusBoundary(t));
      cols.push(new THREE.Color(Math.cos(t) >= 0 ? 0xf0a35e : 0x6ea8fe));
    }
    leftGroup.add(coloredTube(tot, cols, 0.025, true));
    for (const [p, c] of [
      [[1, 0, 0], 0xffffff],
      [[-1, 0, 0], 0xffffff],
    ] as const) {
      const b = ball(0.05, c);
      setPos(b, p);
      leftGroup.add(b);
    }
    const x: [number, number] = [Math.cos(s), Math.sin(s)];
    const m = realHopf(x);
    const p1 = ball(0.07, 0xffffff);
    setPos(p1, mobiusBoundary(s));
    const p2 = ball(0.07, 0xffffff);
    setPos(p2, mobiusBoundary(s + Math.PI));
    const pm = ball(0.06, 0x8a93a6);
    setPos(pm, [m[0], m[1], 0]);
    leftGroup.add(p1, p2, pm, line([mobiusBoundary(s), [m[0], m[1], 0], mobiusBoundary(s + Math.PI)], 0x8a93a6));
    const k1 = realKappa(1, x);
    const k2 = realKappa(2, x);
    const r = realTransition(x);
    hudLBig.textContent = r === null ? 'ρ₁₂ undefined (excluded point)' : `ρ₁₂ = ${r > 0 ? '+1' : '−1'}`;
    hudLSmall.textContent = `fibre {x, −x} · κ₁(x) = ${k1 ?? '—'}, κ₂(x) = ${k2 ?? '—'}`;
  }

  function drawUniversal(): void {
    labelL.textContent = 'Universal covering R → S¹ (helix over the grey circle); the lift of a loop of winding n';
    const n = parseInt(nS.value, 10);
    const H = 0.11;
    const helix: Vec3[] = [];
    for (let k = 0; k <= 1200; k++) {
      const t = -4 * Math.PI + (8 * Math.PI * k) / 1200;
      helix.push([Math.cos(t), Math.sin(t), H * t]);
    }
    leftGroup.add(line(helix, 0x4a5878));
    const circ: Vec3[] = [];
    for (let k = 0; k <= 128; k++) circ.push([Math.cos((TAU * k) / 128), Math.sin((TAU * k) / 128), -1.8]);
    leftGroup.add(line(circ, 0x8a93a6));
    const t0 = parseFloat(sS.value) - Math.PI;
    if (n !== 0) {
      const lift: Vec3[] = [];
      for (let k = 0; k <= 400; k++) {
        const t = t0 + (TAU * n * k) / 400;
        lift.push([Math.cos(t), Math.sin(t), H * t]);
      }
      leftGroup.add(coloredTube(lift, lift.map(() => new THREE.Color(0xf0a35e)), 0.025, false));
    }
    const a = ball(0.07, 0xffffff);
    setPos(a, [Math.cos(t0), Math.sin(t0), H * t0]);
    const b = ball(0.07, 0xf0a35e);
    setPos(b, [Math.cos(t0), Math.sin(t0), H * (t0 + TAU * n)]);
    const base = ball(0.06, 0xffffff);
    setPos(base, [Math.cos(t0), Math.sin(t0), -1.8]);
    leftGroup.add(a, b, base);
    hudLBig.textContent = `endpoint − start = 2π·${n}`;
    hudLSmall.textContent = 'the deck transformation of the class n ∈ π₁(S¹) = ℤ';
  }

  function drawLeft(): void {
    clearGroup(leftGroup);
    if (leftSel.value === 'R') drawReal();
    else drawUniversal();
  }

  let f = cochainTransition(cochainExponent(0, 0.7), cochainExponent(0, -0.7));
  function drawRight(): void {
    clearGroup(rightGroup);
    const c1 = parseFloat(c1S.value);
    const c2 = parseFloat(c2S.value);
    f = cochainTransition(cochainExponent(c1, 0.7), cochainExponent(c2, -0.7));
    // great circles w(t) = exp(t e)·g through several points g, for e ∈ {i, j, k}
    const starts: Quat[] = [
      [1, 0, 0, 0],
      [Math.SQRT1_2, Math.SQRT1_2, 0, 0],
      [Math.SQRT1_2, 0, Math.SQRT1_2, 0],
      [0.5, 0.5, 0.5, -0.5],
    ];
    const dirs: Quat[] = [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    const palette = [0xf0a35e, 0x69d58c, 0x6ea8fe];
    for (const g of starts) {
      dirs.forEach((e, di) => {
        const pts: Vec3[] = [];
        for (let k = 0; k <= 240; k++) {
          const w = qmul(qexp([0, e[1] * ((TAU * k) / 240), e[2] * ((TAU * k) / 240), e[3] * ((TAU * k) / 240)]), g);
          const p = stereographic(f(w));
          if (Math.hypot(...p) < 8) pts.push(p);
        }
        if (pts.length > 1) rightGroup.add(line(pts, palette[di]));
      });
    }
  }

  function computeDegree(): void {
    const d = degreeQuadrature(f);
    hudRBig.textContent = `deg ρ′₁₂ = ${d.toFixed(6)}`;
    hudRSmall.textContent = 'quadrature of det Dρ′₁₂ over S³ / 2π²';
  }

  leftSel.addEventListener('change', drawLeft);
  sS.addEventListener('input', drawLeft);
  nS.addEventListener('input', drawLeft);
  for (const sl of [c1S, c2S]) {
    sl.addEventListener('input', () => {
      drawRight();
      hudRSmall.textContent = 'release the slider to recompute the degree';
    });
    sl.addEventListener('change', computeDegree);
  }
  drawLeft();
  drawRight();
  computeDegree();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
