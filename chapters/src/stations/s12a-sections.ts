/**
 * Station 1.2a — sections of associated line bundles are equivariant functions
 * (Prop. 1.2.5, 1.2.6, 1.2.8, Ex. 1.2.4/3, Rem. 1.2.15; (1.2.5), (1.2.8), (1.2.9)).
 *
 * Left: the base S², coloured by the local representative φ_i = Φ̃∘s_i
 * (hue = arg, brightness = |Φ̃|), with the zeros of the section and their
 * indices. Right: fibres in S³ coloured by arg Φ̃ — the hue turns −n times
 * around every fibre, which is the equivariance (1.2.9).
 */
import * as THREE from 'three';
import { carg, fromPolar, polarAngles, section1, section2, type Vec3 } from '@rsvis/math';
import { localRep, sectionLn, zeroCells, type Equivariant } from '../math/line-bundles';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, createScenePane, el, onTap } from './three-helpers';

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const nSel = document.createElement('select');
  for (const n of [-3, -2, -1, 0, 1, 2, 3]) {
    const o = document.createElement('option');
    o.value = String(n);
    o.textContent = `L${n < 0 ? '₋' : ''}${'₀₁₂₃'[Math.abs(n)]}  (n = ${n})`;
    nSel.appendChild(o);
  }
  nSel.value = '-2';
  const chartSel = document.createElement('select');
  chartSel.innerHTML = '<option value="1">show φ₁ = Φ̃∘s₁</option><option value="2">show φ₂ = Φ̃∘s₂</option>';
  const epsLabel = el('label', '', 'perturbation ε');
  const eps = document.createElement('input');
  eps.type = 'range';
  eps.min = '0';
  eps.max = '4';
  eps.step = '0.02';
  eps.value = '0';
  epsLabel.appendChild(eps);
  controls.append(nSel, chartSel, epsLabel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Base S²: local representative φᵢ — tap to move the nearest zero'));
  paneR.appendChild(el('div', 'pane-label', 'S³: arg Φ̃ along fibres (white: fibres where Φ̃ ≡ 0)'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);

  const caption = explainer(EXPLAINERS['1.2a']);
  container.append(controls, panes, caption);

  // ---------- scenes ----------
  const sceneL = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.5], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [5.5, -4.5, 3.5], up: [0, 0, 1], maxDistance: 40 });

  const NT = 64;
  const NP = 128;
  const sphereGeo = new THREE.SphereGeometry(1, NP, NT);
  sphereGeo.rotateX(Math.PI / 2); // Three's sphere poles are on y; ours on z
  const colors = new Float32Array(sphereGeo.attributes.position.count * 3);
  sphereGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  sceneL.scene.add(sphere);
  const zeroGroup = new THREE.Group();
  sceneL.scene.add(zeroGroup);
  const fibreGroup = new THREE.Group();
  sceneR.scene.add(fibreGroup);

  // ---------- state ----------
  const roots: Vec3[] = [fromPolar(0.8, 0.4), fromPolar(1.9, 2.5), fromPolar(2.4, -1.7)];
  let Phi: Equivariant = () => [0, 0];
  let n = -2;

  function paintBase(): void {
    const i = chartSel.value === '2' ? 2 : 1;
    const pos = sphereGeo.attributes.position;
    let maxAbs = 1e-9;
    const vals: Array<[number, number] | null> = [];
    for (let k = 0; k < pos.count; k++) {
      const m: Vec3 = [pos.getX(k), pos.getY(k), pos.getZ(k)];
      const v = localRep(Phi, i, m);
      vals.push(v);
      if (v) maxAbs = Math.max(maxAbs, Math.hypot(v[0], v[1]));
    }
    const c = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const v = vals[k];
      if (!v) {
        c.set(0x555555);
      } else {
        const r = Math.hypot(v[0], v[1]) / maxAbs;
        const h = (((carg(v) / (2 * Math.PI)) % 1) + 1) % 1;
        c.setHSL(h, 0.75, 0.06 + 0.52 * Math.pow(r, 0.7));
      }
      colors.set([c.r, c.g, c.b], k * 3);
    }
    sphereGeo.attributes.color.needsUpdate = true;
  }

  function update(): void {
    n = parseInt(nSel.value, 10);
    Phi = sectionLn(n, roots, parseFloat(eps.value));
    paintBase();

    clearGroup(zeroGroup);
    const cells = zeroCells(Phi, 40, 80);
    for (const c of cells) {
      const b = ball(0.05, c.index > 0 ? 0x69d58c : 0xe05c5c);
      setPos(b, fromPolar(c.theta, c.phi).map((x) => x * 1.02));
      zeroGroup.add(b);
    }
    const total = cells.reduce((s, c) => s + c.index, 0) + 0;
    hudBig.textContent = `Σ ind = ${total}`;
    hudSmall.textContent = `${cells.length} zero${cells.length === 1 ? '' : 's'} · ${cells.filter((c) => c.index > 0).length} (+) / ${cells.filter((c) => c.index < 0).length} (−) · −n = ${-n + 0}`;

    clearGroup(fibreGroup);
    // fibres over a grid of base points, coloured by arg Φ̃(s(m) e^{iα}) = arg φ(m) − nα
    for (const th of [0.6, 1.3, 2.0]) {
      for (let k = 0; k < 5; k++) {
        const m = fromPolar(th, (2 * Math.PI * k) / 5 + th);
        const s = section1(m) ?? section2(m)!;
        const v = Phi(s);
        if (Math.hypot(v[0], v[1]) < 1e-3) continue;
        const a0 = carg(v);
        fibreGroup.add(fibreMesh(s, (a) => a0 - n * a, 0.022));
      }
    }
    for (const c of cells) {
      const m = fromPolar(c.theta, c.phi);
      fibreGroup.add(fibreMesh(section1(m) ?? section2(m)!, null, 0.035, new THREE.Color(0xffffff)));
    }
  }

  onTap(sceneL, sphere, (pt) => {
    if (n === 0) return;
    const p: Vec3 = [pt.x, pt.y, pt.z];
    const r = Math.hypot(...p);
    const q: Vec3 = [p[0] / r, p[1] / r, p[2] / r];
    const k = Math.abs(n);
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < k; j++) {
      const d = Math.hypot(roots[j][0] - q[0], roots[j][1] - q[1], roots[j][2] - q[2]);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    const [th, ph] = polarAngles(q);
    roots[best] = fromPolar(Math.min(th, Math.PI - 0.02), ph);
    update();
  });
  nSel.addEventListener('change', update);
  chartSel.addEventListener('change', paintBase);
  eps.addEventListener('input', update);
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
