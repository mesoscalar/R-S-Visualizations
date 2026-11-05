/**
 * Station 3.2a — the exact homotopy sequence of the Hopf fibration
 * (Def. 3.2.1, Cor. 3.2.5, Thm. 3.2.8, Ex. 3.2.10; (3.2.6), (3.2.7)).
 *
 * Mode ∂: left, S² with a sweep of loops at the north pole (a based 2-sphere);
 * right, S³ with the horizontal lift of the current loop and the endpoints of
 * all lifts so far, which run once around the fibre over N.
 * Mode π₃: the preimages of two points under g∘h, g(w) = wⁿ, as fibres in S³,
 * and their total linking number n².
 */
import * as THREE from 'three';
import { gaussLinking, hopfMap, stereographic, type Vec3 } from '@rsvis/math';
import { Z0, boundaryLoop, fibreCurve, fromW, liftLoop, loopAtNorth, preimagesOfPower } from '../math/hopf-homotopy';
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

const clip = (p: Vec3): Vec3 => {
  const n = Math.hypot(...p);
  return n > 6 ? (p.map((c) => (6 * c) / n) as Vec3) : p;
};

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const modeSel = document.createElement('select');
  modeSel.innerHTML = '<option value="d">∂ : π₂(S²) → π₁(U(1)) — lift a sweep of loops</option><option value="l">π₃(S²) = ℤ — linking of fibres</option>';
  const [lr, rS] = slider('sweep ρ', 0, Math.PI, 1.6);
  const play = el('button', '', '▶ sweep');
  const nSel = document.createElement('select');
  nSel.innerHTML = [1, 2, 3].map((n) => `<option value="${n}">g(w) = w${n === 1 ? '' : n === 2 ? '²' : '³'}</option>`).join('');
  const [lq, qS] = slider('move q', -Math.PI, Math.PI, 0.8);
  controls.append(modeSel, lr, play, nSel, lq);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  const labelL = el('div', 'pane-label', '');
  const labelR = el('div', 'pane-label', '');
  paneL.appendChild(labelL);
  paneR.appendChild(labelR);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['3.2a']));

  const sceneL = createScenePane(paneL, { cameraPos: [1.4, -2.0, 2.6], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [2.6, -3.4, 3.4], up: [0, 0, 1], maxDistance: 40 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }));
  sceneL.scene.add(sphere);
  const gL = new THREE.Group();
  const gR = new THREE.Group();
  sceneL.scene.add(gL);
  sceneR.scene.add(gR);

  const sweep = boundaryLoop(120, 300);
  const tube = (g: THREE.Group, pts: Vec3[], color: number, r: number, closed = false) =>
    g.add(coloredTube(pts, pts.map(() => new THREE.Color(color)), r, closed));

  function drawBoundary(): void {
    labelL.textContent = 'S²: loops at the north pole N sweeping the sphere once';
    labelR.textContent = 'S³: grey = the fibre over N; green = the lift of the current loop';
    const rho = parseFloat(rS.value);
    clearGroup(gL);
    clearGroup(gR);
    for (let k = 1; k < 12; k++) {
      const r = (Math.PI * k) / 12;
      if (r > rho) break;
      const { gamma } = loopAtNorth(r);
      const pts = Array.from({ length: 121 }, (_, i) => gamma(i / 120).map((c) => c * 1.004) as Vec3);
      tube(gL, pts, 0x3a4560, 0.006);
    }
    const { gamma } = loopAtNorth(rho);
    tube(gL, Array.from({ length: 201 }, (_, i) => gamma(i / 200).map((c) => c * 1.006) as Vec3), 0xf0a35e, 0.014);
    const n = ball(0.04, 0xffffff);
    setPos(n, [0, 0, 1.01]);
    gL.add(n);

    tube(gR, fibreCurve([0, 0, 1], 200), 0x8a93a6, 0.02, true);
    const lift = liftLoop(rho, 300);
    tube(gR, lift.map((z) => clip(stereographic(z))), 0x69d58c, 0.025);
    const k = Math.min(120, Math.round((rho / Math.PI) * 120));
    for (let i = 0; i <= k; i += 4) {
      const a = sweep.alphas[i];
      const b = ball(0.05, 0xf0a35e);
      setPos(b, stereographic([Math.cos(a), Math.sin(a), 0, 0]));
      gR.add(b);
    }
    const z0 = ball(0.07, 0xffffff);
    setPos(z0, stereographic(Z0));
    gR.add(z0);
    const end = lift[lift.length - 1];
    const e = ball(0.08, 0x69d58c);
    setPos(e, stereographic(end));
    gR.add(e);
    const area = 2 * Math.PI * (1 - Math.cos(rho));
    hudBig.textContent = `endpoint phase so far: ${(sweep.alphas[k] / (2 * Math.PI)).toFixed(3)} turns`;
    hudSmall.textContent = `area enclosed by the loop ${area.toFixed(3)} (of 4π) · phase = −½·area · fibre point drift |h(z̃(1)) − N| = ${Math.hypot(...hopfMap(end).map((c, i) => c - [0, 0, 1][i])).toExponential(1)}`;
  }

  function drawLinking(): void {
    const n = parseInt(nSel.value, 10);
    labelL.textContent = 'S²: green = g⁻¹(p), blue = g⁻¹(q) for g(w) = wⁿ';
    labelR.textContent = 'S³: their Hopf fibres = the preimages of p and q under g∘h';
    clearGroup(gL);
    clearGroup(gR);
    const p = fromW([1.0 * Math.cos(-0.7), 1.0 * Math.sin(-0.7)]);
    const a = parseFloat(qS.value);
    const q = fromW([0.7 * Math.cos(a - 2.2), 0.7 * Math.sin(a - 2.2)]);
    const P = preimagesOfPower(p, n);
    const Q = preimagesOfPower(q, n);
    for (const [pts, color] of [
      [P, 0x69d58c],
      [Q, 0x5e8cf0],
    ] as const) {
      for (const m of pts) {
        const b = ball(0.045, color);
        setPos(b, m.map((c) => c * 1.01) as Vec3);
        gL.add(b);
        tube(gR, fibreCurve(m, 160).map(clip), color, 0.03, true);
      }
    }
    // gaussLinking is O(N⁻²); one Richardson step between N = 120 and 240 removes that term
    let total = 0;
    for (const x of P)
      for (const y of Q) {
        const l1 = gaussLinking(fibreCurve(x, 120), fibreCurve(y, 120));
        const l2 = gaussLinking(fibreCurve(x, 240), fibreCurve(y, 240));
        total += (4 * l2 - l1) / 3;
      }
    hudBig.textContent = `total linking number = ${total.toFixed(4)}`;
    hudSmall.textContent = `n² = ${n * n} · each green fibre links each blue one once (Gauss integral, Richardson-extrapolated)`;
  }

  function update(): void {
    const d = modeSel.value === 'd';
    for (const x of [lr, play]) x.style.display = d ? '' : 'none';
    for (const x of [nSel, lq]) x.style.display = d ? 'none' : '';
    if (d) drawBoundary();
    else drawLinking();
  }

  let anim = false;
  play.addEventListener('click', () => {
    anim = true;
    rS.value = '0';
  });
  sceneL.onFrame((dt) => {
    if (!anim) return;
    const r = parseFloat(rS.value) + 0.5 * dt;
    if (r >= Math.PI) anim = false;
    rS.value = String(Math.min(Math.PI, r));
    update();
  });
  modeSel.addEventListener('change', update);
  nSel.addEventListener('change', update);
  qS.addEventListener('input', update);
  rS.addEventListener('input', () => {
    anim = false;
    update();
  });
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
