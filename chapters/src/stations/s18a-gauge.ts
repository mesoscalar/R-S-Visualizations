/**
 * Station 1.8a — non-abelian gauge transformations (Rem. 1.8.1, Prop. 1.8.3,
 * Rem. 1.8.6, Prop. 1.8.7, Rem. 1.8.8; (1.8.7), (1.8.8)).
 *
 * Left: over a square in R², arrows in the internal space su(2) ≅ R³ for
 * 𝒜_x, 𝒜_y or 𝓕_xy, before (ghosts) and after a gauge transformation ρ_τ.
 * Right: the internal space again, with the transport g(t) around the loop
 * drawn by its vector part; the holonomy moves on a sphere of fixed trace.
 */
import * as THREE from 'three';
import type { Quat, Vec3 } from '@rsvis/math';
import {
  circle,
  curvature,
  examplePotential,
  stationGauge,
  transformPotential,
  transportPath,
  wilson,
  type Potential,
} from '../math/gauge-su2';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, makeArrow, setArrow } from './three-helpers';

const N = 9;
const ARROW = 0.09;
const LOOP = circle(0.1, 0.05, 0.55);

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
const len = (v: Vec3) => Math.hypot(...v);

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const showSel = document.createElement('select');
  showSel.innerHTML = '<option value="F">show 𝓕_xy</option><option value="Ax">show 𝒜_x</option><option value="Ay">show 𝒜_y</option>';
  const [lt, tS] = slider('gauge τ', 0, 1, 0.6);
  const [lw, wS] = slider('how wild ρ is', 0.2, 2, 1);
  const play = el('button', '', '▶ sweep τ');
  controls.append(showSel, lt, lw, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'over R²: su(2)-arrows, grey = before, coloured = after ρ_τ; the loop c'));
  paneR.appendChild(el('div', 'pane-label', 'su(2) ≅ R³: Im g(t) around c'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.8a']));

  const sceneL = createScenePane(paneL, { cameraPos: [0.6, -2.6, 2.0], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [2.2, -2.2, 1.5], up: [0, 0, 1] });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x151b28, side: THREE.DoubleSide }),
  );
  sceneL.scene.add(plane);
  const loopPts: Vec3[] = [];
  for (let k = 0; k <= 160; k++) {
    const [x, y] = LOOP.c(k / 160);
    loopPts.push([x, y, 0.002]);
  }
  sceneL.scene.add(coloredTube(loopPts, loopPts.map(() => new THREE.Color(0x69d58c)), 0.01, false));
  const x0 = ball(0.035, 0xffffff);
  setPos(x0, [...LOOP.c(0), 0]);
  sceneL.scene.add(x0);

  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pts.push([-1 + (2 * i) / (N - 1), -1 + (2 * j) / (N - 1)]);
  const ghosts = pts.map(() => makeArrow(0x4a5570));
  const arrows = pts.map(() => makeArrow(0xf0a35e));
  for (const a of [...ghosts, ...arrows]) sceneL.scene.add(a);

  const ballGeo = new THREE.SphereGeometry(1, 24, 12);
  // the level set of tr Hol through the holonomy: a sphere of radius |Im Hol| = √(1 − (tr Hol/2)²)
  const shell = new THREE.Mesh(
    ballGeo,
    new THREE.MeshBasicMaterial({ color: 0x5e8cf0, wireframe: true, transparent: true, opacity: 0.16 }),
  );
  sceneR.scene.add(shell);
  const rGroup = new THREE.Group();
  sceneR.scene.add(rGroup);

  const A0: Potential = examplePotential(1.2, 0.7);
  const hol0 = transportPath(A0, LOOP.c, LOOP.cd, 600);

  function field(A: Potential, x: number, y: number): Vec3 {
    const which = showSel.value;
    if (which === 'F') return im(curvature(A, x, y));
    const [Ax, Ay] = A(x, y);
    return im(which === 'Ax' ? Ax : Ay);
  }

  function update(): void {
    const g = stationGauge(parseFloat(tS.value), parseFloat(wS.value));
    const A1 = transformPotential(A0, g);
    const scale = showSel.value === 'F' ? ARROW * 0.6 : ARROW;
    let dA = 0;
    let dF = 0;
    pts.forEach(([x, y], k) => {
      const v0 = field(A0, x, y);
      const v1 = field(A1, x, y);
      setArrow(ghosts[k], [x, y, 0], v0.map((c) => c * scale));
      setArrow(arrows[k], [x, y, 0], v1.map((c) => c * scale));
      if (showSel.value === 'F') dF = Math.max(dF, Math.abs(len(v1) - len(v0)));
      else dA = Math.max(dA, Math.abs(len(v1) - len(v0)));
    });
    for (const a of arrows) (a.line.material as THREE.LineBasicMaterial).color.set(showSel.value === 'F' ? 0xff5c5c : 0xf0a35e);
    for (const a of arrows) (a.cone.material as THREE.MeshBasicMaterial).color.set(showSel.value === 'F' ? 0xff5c5c : 0xf0a35e);

    const path1 = transportPath(A1, LOOP.c, LOOP.cd, 600);
    clearGroup(rGroup);
    const curve = (path: Quat[], color: number, r: number) => {
      const p = path.map(im);
      rGroup.add(coloredTube(p, p.map(() => new THREE.Color(color)), r, false));
    };
    curve(hol0, 0x8a93a6, 0.008);
    curve(path1, 0xf0a35e, 0.012);
    const h0 = hol0[hol0.length - 1];
    const h1 = path1[path1.length - 1];
    const b0 = ball(0.04, 0x8a93a6);
    setPos(b0, im(h0));
    const b1 = ball(0.05, 0xf0a35e);
    setPos(b1, im(h1));
    const o = ball(0.03, 0xffffff);
    setPos(o, [0, 0, 0]);
    rGroup.add(b0, b1, o);
    shell.scale.setScalar(Math.max(1e-3, len(im(h0))));

    hudBig.textContent = `tr Hol: ${wilson(h0).toFixed(5)} → ${wilson(h1).toFixed(5)}`;
    hudSmall.textContent =
      showSel.value === 'F'
        ? `largest change of |𝓕| on the grid: ${dF.toExponential(1)} (Ad_{ρ⁻¹} only rotates)`
        : `largest change of |𝒜| on the grid: ${dA.toFixed(3)} (the ρ⁻¹dρ term is not a rotation)`;
  }

  let anim = false;
  let dir = 1;
  play.addEventListener('click', () => {
    anim = !anim;
  });
  sceneL.onFrame((dt) => {
    if (!anim) return;
    let t = parseFloat(tS.value) + dir * 0.4 * dt;
    if (t >= 1 || t <= 0) {
      dir = -dir;
      t = Math.max(0, Math.min(1, t));
    }
    tS.value = String(t);
    update();
  });
  showSel.addEventListener('change', update);
  for (const s of [tS, wS]) s.addEventListener('input', update);
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
