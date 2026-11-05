/**
 * Station 3.4a — the Hopf bundle as a 2-universal bundle; U(1)-bundles over S²
 * as pullbacks f*(S³ → S²) (Def. 3.4.1, Thm. 3.4.6, Rem. 3.4.9, Thm. 3.4.10,
 * Ex. 3.4.17, Thm. 3.4.23).
 *
 * Left: the domain S², each point painted with the colour of its image f(x).
 * Right: the target S² = CP¹ in its own colours, with the images of three
 * latitude circles of the domain. A marked target point and its preimages.
 */
import * as THREE from 'three';
import type { Vec3 } from '@rsvis/math';
import { classMap, degreeS2, preimages, type MapParams } from '../math/classifying';
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

/** A colour for every point of the target sphere: hue = longitude, lightness = height. */
function targetColor(y: Vec3, c = new THREE.Color()): THREE.Color {
  const h = (Math.atan2(y[1], y[0]) / (2 * Math.PI) + 1) % 1;
  return c.setHSL(h, 0.75, 0.18 + 0.6 * ((1 + y[2]) / 2));
}

const Y0: Vec3 = [0.48, -0.6, 0.64];
const LATS = [0.45, Math.PI / 2, 2.3];
const LAT_COLORS = [0xffffff, 0x8a93a6, 0x3a4560];

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const nSel = document.createElement('select');
  nSel.innerHTML = [-2, -1, 0, 1, 2, 3].map((n) => `<option value="${n}" ${n === 1 ? 'selected' : ''}>deg f = ${n}</option>`).join('');
  const [lt, tS] = slider('homotopy t', 0, 1, 0);
  const [ls, sS] = slider('rotate the target', -Math.PI, Math.PI, 0);
  controls.append(nSel, lt, ls);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'domain S², painted with the colour of f(x)'));
  paneR.appendChild(el('div', 'pane-label', 'target S² = CP¹ (base of the Hopf bundle) and f(latitudes)'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['3.4a']));

  const sceneL = createScenePane(paneL, { cameraPos: [2.2, -2.4, 1.6], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [2.2, -2.4, 1.6], up: [0, 0, 1] });
  const geoL = new THREE.SphereGeometry(1, 128, 64);
  geoL.rotateX(Math.PI / 2);
  const colsL = new Float32Array(geoL.attributes.position.count * 3);
  geoL.setAttribute('color', new THREE.BufferAttribute(colsL, 3));
  sceneL.scene.add(new THREE.Mesh(geoL, new THREE.MeshBasicMaterial({ vertexColors: true })));
  const geoR = new THREE.SphereGeometry(1, 96, 48);
  geoR.rotateX(Math.PI / 2);
  const colsR = new Float32Array(geoR.attributes.position.count * 3);
  geoR.setAttribute('color', new THREE.BufferAttribute(colsR, 3));
  const tmp = new THREE.Color();
  for (let k = 0; k < geoR.attributes.position.count; k++) {
    targetColor([geoR.attributes.position.getX(k), geoR.attributes.position.getY(k), geoR.attributes.position.getZ(k)], tmp);
    colsR.set([tmp.r, tmp.g, tmp.b], 3 * k);
  }
  sceneR.scene.add(new THREE.Mesh(geoR, new THREE.MeshBasicMaterial({ vertexColors: true })));
  const gL = new THREE.Group();
  const gR = new THREE.Group();
  sceneL.scene.add(gL);
  sceneR.scene.add(gR);

  const params = (): MapParams => ({ n: parseInt(nSel.value, 10), t: parseFloat(tS.value), s: parseFloat(sS.value) });

  let degTimer = 0;
  function update(): void {
    const p = params();
    const f = classMap(p);
    const pos = geoL.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      targetColor(f([pos.getX(k), pos.getY(k), pos.getZ(k)]), tmp);
      colsL.set([tmp.r, tmp.g, tmp.b], 3 * k);
    }
    geoL.attributes.color.needsUpdate = true;

    clearGroup(gL);
    clearGroup(gR);
    LATS.forEach((th, i) => {
      const dom: Vec3[] = [];
      for (let k = 0; k <= 240; k++) {
        const ph = (2 * Math.PI * k) / 240;
        dom.push([Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]);
      }
      gL.add(coloredTube(dom.map((x) => x.map((c) => c * 1.006) as Vec3), dom.map(() => new THREE.Color(LAT_COLORS[i])), 0.01, true));
      const img = dom.map((x) => f(x).map((c) => c * 1.008) as Vec3);
      gR.add(coloredTube(img, img.map(() => new THREE.Color(LAT_COLORS[i])), 0.008, true));
    });
    // a marked target point (of the unrotated map) and its preimages
    const y = Y0;
    const yRot: Vec3 = [y[0], Math.cos(p.s) * y[1] - Math.sin(p.s) * y[2], Math.sin(p.s) * y[1] + Math.cos(p.s) * y[2]];
    const mark = ball(0.05, 0xffffff);
    setPos(mark, yRot.map((c) => c * 1.01) as Vec3);
    gR.add(mark);
    const pre = p.n === 0 ? [] : preimages({ ...p, s: 0 }, y);
    for (const x of pre) {
      const b = ball(0.05, 0xffffff);
      setPos(b, x.map((c) => c * 1.01) as Vec3);
      gL.add(b);
    }
    hudBig.textContent = 'deg f = …';
    hudSmall.textContent = `white dot: ${pre.length} preimage${pre.length === 1 ? '' : 's'}, each with orientation sign ${p.n > 0 ? '+' : p.n < 0 ? '−' : '·'}`;
    window.clearTimeout(degTimer);
    degTimer = window.setTimeout(() => {
      const d = degreeS2(f, 60);
      hudBig.textContent = `deg f = (1/4π)∫f*dA = ${d.toFixed(4)}`;
      hudSmall.textContent = `c₁(f*Hopf) = −deg f = ${(-d).toFixed(4)} · white dot: ${pre.length} preimage${pre.length === 1 ? '' : 's'}, sign ${p.n > 0 ? '+' : p.n < 0 ? '−' : '·'}`;
    }, 120);
  }

  nSel.addEventListener('change', update);
  for (const s of [tS, sS]) s.addEventListener('input', update);
  update();

  return () => {
    window.clearTimeout(degTimer);
    sceneL.dispose();
    sceneR.dispose();
  };
}
