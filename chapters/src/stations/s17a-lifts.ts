/**
 * Station 1.7a — horizontal lifts and parallel transport, constructed as in
 * the proof of Prop. 1.7.2 (Def. 1.7.1, 1.7.4, 1.7.6, Lemma 1.7.3, Rem. 1.7.5).
 *
 * Left: a loop γ on S² and the moving point γ(t). Right: in S³ the arbitrary
 * lift γ̃ = s1∘γ (grey), the horizontal lift γ^h = γ̃·g (green), and at time t
 * the correction g(t) = e^{iα(t)} drawn as an orange arc along the fibre.
 */
import * as THREE from 'three';
import { actU1, omegaC, polarAngles, fromPolar, stereographic, type Vec3, type Vec4 } from '@rsvis/math';
import { capArea, chart1Lift, circleLoop, figureEight, type Lift } from '../math/transport';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, onTap } from './three-helpers';

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

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const shapeSel = document.createElement('select');
  shapeSel.innerHTML = '<option value="cap">loop: circle</option><option value="eight">loop: figure eight</option>';
  const [lr, rS] = slider('radius', 0.1, 1.4, 0.8);
  const [la, aS] = slider('lobe asymmetry', -0.4, 0.4, 0);
  const speedLabel = el('label', '', 'uneven speed');
  const speedChk = document.createElement('input');
  speedChk.type = 'checkbox';
  speedLabel.prepend(speedChk);
  const [lt, tS] = slider('t', 0, 1, 0.6);
  const play = el('button', '', '▶ run');
  controls.append(shapeSel, lr, la, speedLabel, lt, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S²: the loop γ — tap to move it'));
  paneR.appendChild(el('div', 'pane-label', 'S³: grey γ̃ = s₁∘γ, green γʰ = γ̃·g, orange: g(t) along the fibre'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.7a']));

  const sceneL = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.6], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [3.0, -3.4, 2.4], up: [0, 0, 1], maxDistance: 40 });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }),
  );
  sceneL.scene.add(sphere);
  const loopGroup = new THREE.Group();
  sceneL.scene.add(loopGroup);
  const gMark = ball(0.04, 0xffffff);
  sceneL.scene.add(gMark);
  const liftGroup = new THREE.Group();
  const nowGroup = new THREE.Group();
  sceneR.scene.add(liftGroup, nowGroup);

  let centre: Vec3 = fromPolar(0.6, -0.9);
  let gamma: (t: number) => Vec3 = circleLoop(centre, 0.8);
  let lift: Lift | null = null;
  let area = 0;

  function rebuild(): void {
    const r = parseFloat(rS.value);
    const [thc] = polarAngles(centre);
    const rr = Math.min(r, Math.PI - thc - 0.15); // keep the loop inside U1
    const eight = shapeSel.value === 'eight';
    const asym = parseFloat(aS.value);
    gamma = eight ? figureEight(centre, Math.min(rr, 0.7), asym) : circleLoop(centre, rr, speedChk.checked ? 0.8 : 0);
    area = eight ? capArea(Math.min(rr, 0.7)) - capArea(Math.min(rr, 0.7) * (1 + asym)) : capArea(rr);
    lift = chart1Lift(omegaC, gamma, 0, 1, 800);
    clearGroup(loopGroup);
    const pts: Vec3[] = [];
    for (let k = 0; k <= 400; k++) pts.push(gamma(k / 400).map((x) => x * 1.006) as Vec3);
    loopGroup.add(coloredTube(pts, pts.map(() => new THREE.Color(0x69d58c)), 0.012, false));
    clearGroup(liftGroup);
    liftGroup.add(fibreMesh(lift.tilde[0], null, 0.012, new THREE.Color(0x4a5878)));
    const tube = (zs: Vec4[], color: number, rad: number) => {
      const p3 = zs.map((z) => stereographic(z));
      liftGroup.add(coloredTube(p3, p3.map(() => new THREE.Color(color)), rad, false));
    };
    tube(lift.tilde, 0x8a93a6, 0.01);
    tube(lift.lift, 0x69d58c, 0.022);
    const start = ball(0.055, 0xffffff);
    setPos(start, stereographic(lift.lift[0]));
    const end = ball(0.06, 0xf0a35e);
    setPos(end, stereographic(lift.lift[lift.lift.length - 1]));
    liftGroup.add(start, end);
    update();
  }

  function update(): void {
    if (!lift) return;
    const t = parseFloat(tS.value);
    const k = Math.round(t * (lift.ts.length - 1));
    setPos(gMark, gamma(lift.ts[k]).map((x) => x * 1.01));
    clearGroup(nowGroup);
    const a = lift.alpha[k];
    const arc: Vec3[] = [];
    for (let j = 0; j <= 60; j++) arc.push(stereographic(actU1(lift.tilde[k], (a * j) / 60)));
    if (Math.abs(a) > 1e-4) nowGroup.add(coloredTube(arc, arc.map(() => new THREE.Color(0xf0a35e)), 0.018, false));
    const p = ball(0.05, 0x8a93a6);
    setPos(p, stereographic(lift.tilde[k]));
    const q = ball(0.06, 0x69d58c);
    setPos(q, stereographic(lift.lift[k]));
    nowGroup.add(p, q);
    const hol = lift.alpha[lift.alpha.length - 1] - lift.alpha[0];
    hudBig.textContent = `g(t) = exp(i·${a.toFixed(4)})`;
    hudSmall.textContent = `holonomy: ${hol.toFixed(6)} · −½·(signed area) = ${(-0.5 * area).toFixed(6)}`;
  }

  let anim = 0;
  play.addEventListener('click', () => {
    cancelAnimationFrame(anim);
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / 5000);
      tS.value = String(t);
      update();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  });
  onTap(sceneL, sphere, (pt) => {
    const [th, ph] = polarAngles([pt.x, pt.y, pt.z]);
    centre = fromPolar(Math.min(th, 1.8), ph);
    rebuild();
  });
  for (const s of [rS, aS]) s.addEventListener('input', rebuild);
  shapeSel.addEventListener('change', rebuild);
  speedChk.addEventListener('change', rebuild);
  tS.addEventListener('input', update);
  rebuild();

  return () => {
    cancelAnimationFrame(anim);
    sceneL.dispose();
    sceneR.dispose();
  };
}
