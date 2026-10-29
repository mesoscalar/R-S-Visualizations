/**
 * Station 1.4a — curvature is the failure of horizontal loops to close
 * (Def. 1.4.6, Rem. 1.4.7, Prop. 1.4.9, Rem. 1.4.15; (1.4.5), (1.4.16)–(1.4.19)).
 *
 * Left: S² coloured by the curvature density of the chosen connection, with a
 * coordinate rectangle. Right: in S³, the arbitrary lift s1∘γ of the rectangle
 * (grey) and its horizontal lift (green); the horizontal lift returns to the
 * starting fibre displaced by −∫∫𝓕.
 */
import * as THREE from 'three';
import { omegaC, polarAngles, stereographic, type Vec3 } from '@rsvis/math';
import { chartFlat1, omegaPU } from '../math/affine-connections';
import { chartCoefficient, curvatureDensity, type ConnKind } from '../math/curvature';
import { chart1Lift, rectangleLoop, type U1Connection } from '../math/transport';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, onTap } from './three-helpers';

const CONNS: Record<ConnKind, { label: string; omega: U1Connection }> = {
  c: { label: 'ω_c (Ex. 1.3.22)', omega: omegaC },
  pu: { label: 'ω_PU (glued, Station 1.3c)', omega: omegaPU(-0.6, 0.2) },
  flat: { label: 'κ₁*θ (flat, on π⁻¹(U₁) only)', omega: chartFlat1 },
};

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const connSel = document.createElement('select');
  for (const [k, c] of Object.entries(CONNS)) {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = c.label;
    connSel.appendChild(o);
  }
  const epsLabel = el('label', '', 'rectangle size ε');
  const eps = document.createElement('input');
  eps.type = 'range';
  eps.min = '0.05';
  eps.max = '1.4';
  eps.step = '0.01';
  eps.value = '0.7';
  epsLabel.appendChild(eps);
  controls.append(connSel, epsLabel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S² coloured by curvature density — tap to move the rectangle'));
  paneR.appendChild(el('div', 'pane-label', 'S³: grey s₁∘γ, green horizontal lift; ○ start, ● end'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);

  container.append(controls, panes, explainer(EXPLAINERS['1.4a']));

  const sceneL = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.5], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [2.8, -3.2, 2.2], up: [0, 0, 1], maxDistance: 40 });
  const sphereGeo = new THREE.SphereGeometry(1, 96, 48);
  sphereGeo.rotateX(Math.PI / 2);
  const cols = new Float32Array(sphereGeo.attributes.position.count * 3);
  sphereGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const sphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  sceneL.scene.add(sphere);
  const rectGroup = new THREE.Group();
  sceneL.scene.add(rectGroup);
  const liftGroup = new THREE.Group();
  sceneR.scene.add(liftGroup);

  let theta0 = 0.9;
  let phi0 = -1.2;

  function paint(): void {
    const kind = connSel.value as ConnKind;
    const pos = sphereGeo.attributes.position;
    const c = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const z = Math.max(-1, Math.min(1, pos.getZ(k)));
      const th = Math.acos(z);
      const d = th < 1e-3 || th > Math.PI - 1e-3 || kind === 'flat' ? (kind === 'c' ? 0.5 : 0) : curvatureDensity(kind, th);
      // density 0 → dark, ½ (the round value) → mid orange, larger → bright
      c.setHSL(0.08, 0.85, 0.08 + 0.55 * Math.min(1, d / 1.2));
      if (kind === 'flat' && th > Math.PI - 0.05) c.set(0x553333); // outside U1
      cols.set([c.r, c.g, c.b], k * 3);
    }
    sphereGeo.attributes.color.needsUpdate = true;
  }

  function update(): void {
    const kind = connSel.value as ConnKind;
    const e = Math.min(parseFloat(eps.value), Math.PI - 0.12 - theta0);
    const loop = rectangleLoop(theta0, phi0, e);
    clearGroup(rectGroup);
    const rpts: Vec3[] = [];
    for (let k = 0; k <= 200; k++) rpts.push(loop(k / 200).map((x) => x * 1.006) as Vec3);
    rectGroup.add(coloredTube(rpts, rpts.map(() => new THREE.Color(0x69d58c)), 0.012, false));

    clearGroup(liftGroup);
    const lift = chart1Lift(CONNS[kind].omega, loop, 0, 1, 400);
    liftGroup.add(fibreMesh(lift.tilde[0], null, 0.015, new THREE.Color(0x8a93a6)));
    const tube = (pts: ArrayLike<number>[], color: number, r: number) => {
      const p3 = pts.map((z) => stereographic(z));
      liftGroup.add(coloredTube(p3, p3.map(() => new THREE.Color(color)), r, false));
    };
    tube(lift.tilde, 0x8a93a6, 0.012);
    tube(lift.lift, 0x69d58c, 0.025);
    const s = ball(0.06, 0xffffff);
    setPos(s, stereographic(lift.lift[0]));
    const f = ball(0.07, 0xf0a35e);
    setPos(f, stereographic(lift.lift[lift.lift.length - 1]));
    liftGroup.add(s, f);

    const gap = lift.alpha[lift.alpha.length - 1] - lift.alpha[0];
    const stokes = -e * (chartCoefficient(kind, theta0 + e) - chartCoefficient(kind, theta0));
    const area = e * (Math.cos(theta0) - Math.cos(theta0 + e));
    hudBig.textContent = `gap Δα = ${gap.toFixed(5)}`;
    hudSmall.textContent = `−∫∫𝓕 (Stokes) = ${stokes.toFixed(5)} · gap / area = ${(gap / area).toFixed(4)}`;
  }

  onTap(sceneL, sphere, (pt) => {
    const [th, ph] = polarAngles([pt.x, pt.y, pt.z]);
    theta0 = Math.max(0.05, Math.min(th, Math.PI - 0.3));
    phi0 = ph;
    update();
  });
  connSel.addEventListener('change', () => {
    paint();
    update();
  });
  eps.addEventListener('input', update);
  paint();
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
