/**
 * Station 1.7b — the holonomy bundle and Ambrose–Singer
 * (Def. 1.7.6, Prop. 1.7.12, Def. 1.7.13, Rem. 1.7.14, Thm. 1.7.15, Rem. 1.7.16, Prop. 1.7.20).
 *
 * Right: the endpoints of many random horizontal paths from p0 — a sample of
 * the holonomy bundle P_{p0}. For ω_c the cloud thickens to fill S³; for the
 * flat connection it stays on one 2-dimensional leaf. A "lasso" path reaches
 * any chosen point exactly.
 */
import * as THREE from 'three';
import {
  actU1,
  fromPolar,
  hopfMap,
  mulberry32,
  omegaC,
  polarAngles,
  section1,
  stereographic,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import { chartFlat1 } from '../math/affine-connections';
import { lassoFor, lassoPath, meanResultant, reachable } from '../math/holonomy-bundle';
import { chart1Lift, type U1Connection } from '../math/transport';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, onTap } from './three-helpers';

const M0: Vec3 = fromPolar(1.0, -0.8);
const ALPHA0 = 0.7;

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const connSel = document.createElement('select');
  connSel.innerHTML = '<option value="c">ω_c (curved)</option><option value="flat">κ₁*θ (flat)</option>';
  const lenLabel = el('label', '', 'path length');
  const len = document.createElement('input');
  len.type = 'range';
  len.min = '2';
  len.max = '60';
  len.step = '1';
  len.value = '20';
  lenLabel.appendChild(len);
  const betaLabel = el('label', '', 'target phase β');
  const beta = document.createElement('input');
  beta.type = 'range';
  beta.min = String(-Math.PI);
  beta.max = String(Math.PI);
  beta.step = '0.01';
  beta.value = '2.0';
  betaLabel.appendChild(beta);
  const reset = el('button', '', 'restart cloud');
  controls.append(connSel, lenLabel, reset, betaLabel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S²: start m₀ (white), a few walks, the lasso to the target (orange) — tap to move the target'));
  paneR.appendChild(el('div', 'pane-label', 'S³: endpoints of horizontal paths from p₀; orange: the lasso lands on the target'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.7b']));

  const sceneL = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.6], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [3.2, -3.6, 2.6], up: [0, 0, 1], maxDistance: 40 });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }),
  );
  sceneL.scene.add(sphere);
  const m0Mark = ball(0.04, 0xffffff);
  setPos(m0Mark, M0.map((x) => x * 1.01));
  sceneL.scene.add(m0Mark);
  const walkGroup = new THREE.Group();
  const lassoL = new THREE.Group();
  sceneL.scene.add(walkGroup, lassoL);

  const MAXP = 1500;
  const cloudPos = new Float32Array(MAXP * 3);
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
  cloudGeo.setDrawRange(0, 0);
  const cloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({ color: 0x69d58c, size: 0.035 }));
  sceneR.scene.add(cloud);
  sceneR.scene.add(fibreMesh(section1(M0)!, null, 0.012, new THREE.Color(0x8a93a6)));
  const p0Mark = ball(0.06, 0xffffff);
  setPos(p0Mark, stereographic(actU1(section1(M0)!, ALPHA0)));
  sceneR.scene.add(p0Mark);
  const lassoR = new THREE.Group();
  sceneR.scene.add(lassoR);

  let target: Vec3 = fromPolar(0.5, 0.6);
  let ends: Vec4[] = [];
  let rng = mulberry32(7);
  let anim = 0;

  const omega = (): U1Connection => (connSel.value === 'flat' ? chartFlat1 : omegaC);

  function restart(): void {
    cancelAnimationFrame(anim);
    ends = [];
    rng = mulberry32(7);
    cloudGeo.setDrawRange(0, 0);
    clearGroup(walkGroup);
    const n = parseInt(len.value, 10);
    // three of the walks, drawn on the base
    for (const path of reachable(omega(), M0, ALPHA0, 3, n, 0.5, mulberry32(99), 3).paths) {
      const pts = path.map((z) => hopfMap(z).map((x) => x * 1.006) as Vec3);
      walkGroup.add(coloredTube(pts, pts.map(() => new THREE.Color(0x4a7a5a)), 0.006, false));
    }
    const step = () => {
      const batch = reachable(omega(), M0, ALPHA0, 15, n, 0.5, rng).ends;
      for (const z of batch) {
        if (ends.length >= MAXP) break;
        cloudPos.set(stereographic(z), ends.length * 3);
        ends.push(z);
      }
      cloudGeo.attributes.position.needsUpdate = true;
      cloudGeo.setDrawRange(0, ends.length);
      hudBig.textContent = `${ends.length} endpoints`;
      hudSmall.textContent = `mean resultant of phases R = ${meanResultant(ends).toFixed(3)} (1: one leaf; →0: spread over the fibres)`;
      if (ends.length < MAXP) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function drawLasso(): void {
    clearGroup(lassoL);
    clearGroup(lassoR);
    const b = parseFloat(beta.value);
    const om = omega();
    const plain = chart1Lift(om, lassoPath(M0, target, 0, 1), 0, 1, 800, ALPHA0);
    const arrive = plain.alpha[plain.alpha.length - 1];
    let path = lassoPath(M0, target, 0, 1);
    if (connSel.value === 'c') {
      const { r, sense } = lassoFor(b - arrive);
      path = lassoPath(M0, target, r, sense);
    }
    const lift = chart1Lift(om, path, 0, 1, 1600, ALPHA0);
    const base: Vec3[] = [];
    for (let k = 0; k <= 400; k++) base.push(path(k / 400).map((x) => x * 1.008) as Vec3);
    lassoL.add(coloredTube(base, base.map(() => new THREE.Color(0xf0a35e)), 0.01, false));
    const tm = ball(0.04, 0xf0a35e);
    setPos(tm, target.map((x) => x * 1.01));
    lassoL.add(tm);
    const p3 = lift.lift.map((z) => stereographic(z));
    lassoR.add(coloredTube(p3, p3.map(() => new THREE.Color(0xf0a35e)), 0.015, false));
    lassoR.add(fibreMesh(section1(target)!, null, 0.01, new THREE.Color(0x7a5a3a)));
    const goal = ball(0.07, 0xffffff);
    setPos(goal, stereographic(actU1(section1(target)!, connSel.value === 'c' ? b : arrive)));
    lassoR.add(goal);
  }

  onTap(sceneL, sphere, (pt) => {
    const [th, ph] = polarAngles([pt.x, pt.y, pt.z]);
    target = fromPolar(Math.min(th, 1.45), ph);
    drawLasso();
  });
  connSel.addEventListener('change', () => {
    restart();
    drawLasso();
  });
  len.addEventListener('change', restart);
  reset.addEventListener('click', restart);
  beta.addEventListener('input', drawLasso);
  restart();
  drawLasso();

  return () => {
    cancelAnimationFrame(anim);
    sceneL.dispose();
    sceneR.dispose();
  };
}
