/**
 * Station A — the complex Hopf bundle and its trivializations
 * (Def. 1.1.1, 1.1.5, Prop. 1.1.6, Ex. 1.1.20, Rem. 1.1.21/1).
 *
 * Left: the base S² ≅ CP¹ with a tap-to-place point m; the two excluded
 * points π(0,1) (south, ∉ U1) and π(1,0) (north, ∉ U2). Right: S³ projected
 * stereographically; the fibre over m coloured by the phase of the chosen
 * trivialization κ_i, the section points s_i(m) = χ_i^{-1}(m, 1), and a point
 * p = χ_i^{-1}(m, e^{iα}). The fibres over the two poles — where κ1 resp. κ2
 * is undefined — are drawn as the z-axis and the unit circle.
 */
import * as THREE from 'three';
import {
  carg,
  chiInverse,
  fromPolar,
  hopfMap,
  kappa1,
  kappa2,
  polarAngles,
  section1,
  section2,
  stereographic,
  transition12,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import { captionBlock } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, createScenePane, el, onTap, phaseColor } from './three-helpers';

const fmtPi = (x: number) => `${(x / Math.PI).toFixed(2)}π`;

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controls = el('div', 'controls');
  const chartSel = document.createElement('select');
  chartSel.innerHTML = '<option value="1">chart χ₁ (U₁ = S² ∖ south)</option><option value="2">chart χ₂ (U₂ = S² ∖ north)</option>';
  const alphaLabel = el('label', '', 'α');
  const alpha = document.createElement('input');
  alpha.type = 'range';
  alpha.min = '0';
  alpha.max = String(2 * Math.PI);
  alpha.step = '0.01';
  alpha.value = '0.8';
  alphaLabel.appendChild(alpha);
  const btnN = el('button', '', 'm → π(1,0)');
  const btnS = el('button', '', 'm → near π(0,1)');
  const torusChk = document.createElement('input');
  torusChk.type = 'checkbox';
  torusChk.checked = true;
  const torusLabel = el('label', '', 'fibres over m’s latitude');
  torusLabel.prepend(torusChk);
  controls.append(chartSel, alphaLabel, btnN, btnS, torusLabel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Base S² ≅ CP¹ — tap to move m'));
  paneR.appendChild(el('div', 'pane-label', 'Total space S³ (stereographic) — fibre π⁻¹(m)'));
  const hudL = el('div', 'hud');
  const hudLBig = el('div', 'big readout');
  const hudLSmall = el('div', 'small');
  hudL.append(hudLBig, hudLSmall);
  paneL.appendChild(hudL);
  const hudR = el('div', 'hud');
  const hudRBig = el('div', 'big readout');
  const hudRSmall = el('div', 'small readout');
  hudR.append(hudRBig, hudRSmall);
  paneR.appendChild(hudR);

  const caption = captionBlock(
    'A principal bundle is locally a product (Def. 1.1.1): over $U_1 = S^2\\setminus\\{\\pi(0,1)\\}$ the map ' +
      '$\\chi_1(z) = (\\pi(z), \\kappa_1(z))$, $\\kappa_1 = z_1/|z_1|$, identifies each fibre with $U(1)$ (Ex. 1.1.20). ' +
      'The fibre on the right is coloured by $\\arg\\kappa_i$: the hue wheel runs once around it, and moving $p$ by ' +
      '$e^{i\\alpha}$ advances the hue by $\\alpha$ — that is (1.1.2), $\\kappa_i(p\\cdot a) = \\kappa_i(p)a$. ' +
      'The marked points are the sections $s_i(m) = \\chi_i^{-1}(m,1)$ of Prop. 1.1.6 (white: $s_1$, orange: $s_2$). ' +
      '$\\kappa_1$ dies on the fibre over the south pole $\\pi(0,1)$ — the vertical red line through the projection ' +
      'point — and $\\kappa_2$ on the unit circle over $\\pi(1,0)$: no single chart covers $S^3$. ' +
      'Switching charts recolours the fibre by the constant phase $\\rho_{12}(m) = \\kappa_1\\kappa_2^{-1}$ (1.1.5); ' +
      'walk $m$ around the equator and watch it turn once (Rem. 1.1.21/2, Station B). The base is identified with ' +
      '$S^2$ through $f(z) = (2\\bar z_1 z_2,\\ |z_1|^2-|z_2|^2)$ and $s_2$ is the book\'s $g_+$ (Rem. 1.1.21/1).',
  );
  container.append(controls, panes, caption);

  // ---------- scenes ----------
  const sceneL = createScenePane(paneL, { cameraPos: [2.6, -2.2, 1.6], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [5.5, -4.5, 3.5], up: [0, 0, 1], maxDistance: 40 });

  const baseSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.8, transparent: true, opacity: 0.85 }),
  );
  sceneL.scene.add(baseSphere);
  const southMark = ball(0.06, 0xe05c5c);
  setPos(southMark, [0, 0, -1]);
  const northMark = ball(0.06, 0x6ea8fe);
  setPos(northMark, [0, 0, 1]);
  const mMark = ball(0.07, 0xffffff);
  sceneL.scene.add(southMark, northMark, mMark);
  const latGroup = new THREE.Group();
  sceneL.scene.add(latGroup);

  // fibres over the poles: κ1 undefined on π⁻¹(south) (z1 = 0), κ2 on π⁻¹(north) (z2 = 0)
  const southFibre = fibreMesh([0, 0, 1, 0], null, 0.025, new THREE.Color(0xe05c5c));
  const northFibre = fibreMesh([1, 0, 0, 0], null, 0.025, new THREE.Color(0x6ea8fe));
  sceneR.scene.add(southFibre, northFibre);
  const fibreGroup = new THREE.Group();
  const torusGroup = new THREE.Group();
  sceneR.scene.add(fibreGroup, torusGroup);
  const s1Mark = ball(0.09, 0xffffff);
  const s2Mark = ball(0.09, 0xf0a35e);
  const pMark = ball(0.13, 0x69d58c);
  sceneR.scene.add(s1Mark, s2Mark, pMark);

  // ---------- state ----------
  let m: Vec3 = fromPolar(1.1, 0.6);
  const MAX_THETA = Math.PI - 0.05; // fibres within 0.05 rad of π(0,1) leave the clip ball almost entirely

  function chart(): 1 | 2 {
    return chartSel.value === '2' ? 2 : 1;
  }

  function redrawBase(): void {
    setPos(mMark, m);
    clearGroup(latGroup);
    const [th] = polarAngles(m);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 128; k++) {
      const q = fromPolar(th, (2 * Math.PI * k) / 128);
      pts.push(new THREE.Vector3(q[0] * 1.003, q[1] * 1.003, q[2] * 1.003));
    }
    latGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8a93a6 })),
    );
  }

  function redrawFibres(): void {
    const i = chart();
    clearGroup(fibreGroup);
    clearGroup(torusGroup);
    const base = (i === 1 ? section1 : section2)(m);
    if (!base) return;
    // z(α) = s_i(m)·e^{iα}, so κ_i(z(α)) = e^{iα}: colour = α
    fibreGroup.add(fibreMesh(base, (a) => a, 0.06));
    if (torusChk.checked) {
      const [th, ph] = polarAngles(m);
      for (let k = 1; k < 12; k++) {
        const q = fromPolar(th, ph + (2 * Math.PI * k) / 12);
        const s = (i === 1 ? section1 : section2)(q);
        if (s) torusGroup.add(fibreMesh(s, null, 0.012, new THREE.Color(0x3a4560)));
      }
    }
  }

  function update(): void {
    const i = chart();
    const a = parseFloat(alpha.value);
    const p = chiInverse(i, m, [Math.cos(a), Math.sin(a)]) as Vec4 | null;
    const s1 = section1(m);
    const s2 = section2(m);
    s1Mark.visible = !!s1;
    s2Mark.visible = !!s2;
    if (s1) setPos(s1Mark, stereographic(s1));
    if (s2) setPos(s2Mark, stereographic(s2));
    pMark.visible = !!p;
    if (p) {
      setPos(pMark, stereographic(p));
      (pMark.material as THREE.MeshBasicMaterial).color = phaseColor(a);
    }

    const [th, ph] = polarAngles(m);
    hudLBig.textContent = `θ ${fmtPi(th)}, φ ${fmtPi(ph)}`;
    const inU1 = !!s1;
    const inU2 = !!s2;
    hudLSmall.textContent =
      inU1 && inU2 ? 'm ∈ U₁ ∩ U₂' : inU1 ? 'm = π(1,0) ∈ U₁ only' : 'm = π(0,1) ∈ U₂ only';

    if (!p) {
      hudRBig.textContent = `p ∉ π⁻¹(U${i})`;
      hudRSmall.textContent = `κ${i} is undefined on this fibre — switch chart`;
      return;
    }
    const k1 = kappa1(p);
    const k2 = kappa2(p);
    const rho = transition12(hopfMap(p));
    hudRBig.textContent = `arg κ${i === 1 ? '₁' : '₂'}(p) = ${fmtPi(i === 1 ? carg(k1!) : carg(k2!))}`;
    hudRSmall.textContent =
      (k1 ? `arg κ₁ = ${fmtPi(carg(k1))}` : 'κ₁ undefined') +
      '  ·  ' +
      (k2 ? `arg κ₂ = ${fmtPi(carg(k2))}` : 'κ₂ undefined') +
      (rho ? `  ·  arg ρ₁₂(m) = ${fmtPi(carg(rho))}` : '');
  }

  function setBase(q: Vec3): void {
    let [th, ph] = polarAngles(q);
    if (th > MAX_THETA) th = MAX_THETA;
    m = th < 1e-9 ? [0, 0, 1] : fromPolar(th, ph);
    redrawBase();
    redrawFibres();
    update();
  }

  onTap(sceneL, baseSphere, (pt) => setBase([pt.x, pt.y, pt.z]));
  btnN.addEventListener('click', () => setBase([0, 0, 1]));
  btnS.addEventListener('click', () => setBase(fromPolar(MAX_THETA, polarAngles(m)[1])));
  chartSel.addEventListener('change', () => {
    redrawFibres();
    update();
  });
  alpha.addEventListener('input', update);
  torusChk.addEventListener('change', redrawFibres);

  setBase(m);

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
