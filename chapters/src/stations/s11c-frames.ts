/**
 * Station 1.1c — frame bundles (Ex. 1.1.4/4, Ex. 1.1.14, Ex. 1.1.18, Def. 1.1.19; Prop. 1.1.6).
 *
 * Left: S² with the local frame field s_N or s_S (each singular at one pole)
 * and the frame f = s(x)·b(β) at a tapped point. Right: the total space
 * O⁺(S²) ≅ SO(3) (Ex. 1.1.18) drawn as the ball of radius π (axis·angle,
 * antipodal boundary points identified); the fibre over x is a closed curve.
 */
import * as THREE from 'three';
import {
  actSO2,
  fromPolar,
  frameToSO3,
  polarAngles,
  sectionN,
  sectionS,
  so3Log,
  transitionNS,
  type Frame,
  type Vec3,
} from '@rsvis/math';
import { captionBlock } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, createScenePane, el, fibonacciSphere, makeArrow, onTap, setArrow } from './three-helpers';

const TAU = 2 * Math.PI;
const fmtPi = (x: number) => `${(x / Math.PI).toFixed(2)}π`;

/** Points of the fibre over x in the π-ball, split where the curve jumps across the boundary. */
function fibreInBall(f: Frame, N = 240): Vec3[][] {
  const pieces: Vec3[][] = [];
  let cur: Vec3[] = [];
  let prev: Vec3 | null = null;
  for (let k = 0; k <= N; k++) {
    const p = so3Log(frameToSO3(actSO2(f, (TAU * k) / N)));
    if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]) > 1) {
      pieces.push(cur);
      cur = [];
    }
    cur.push(p);
    prev = p;
  }
  pieces.push(cur);
  return pieces.filter((c) => c.length > 1);
}

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const secSel = document.createElement('select');
  secSel.innerHTML =
    '<option value="N">section s_N (on S² ∖ south)</option><option value="S">section s_S (on S² ∖ north)</option>';
  const bl = el('label', '', 'f = s(x)·b(β), β');
  const beta = document.createElement('input');
  beta.type = 'range';
  beta.min = '0';
  beta.max = String(TAU);
  beta.step = '0.01';
  beta.value = '0';
  bl.appendChild(beta);
  controls.append(secSel, bl);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S² with a local frame field — tap to pick x (orange u₁, cyan u₂)'));
  paneR.appendChild(el('div', 'pane-label', 'O⁺(S²) ≅ SO(3) as the π-ball; white: fibre over x'));
  const hudL = el('div', 'hud');
  const hudLBig = el('div', 'big readout');
  const hudLSmall = el('div', 'small readout');
  hudL.append(hudLBig, hudLSmall);
  paneL.appendChild(hudL);

  const caption = captionBlock(
    'A point of the frame bundle over $x$ is an ordered basis of $T_xS^2$ (Ex. 1.1.14); taking orthonormal, ' +
      'oriented frames gives $O^+(S^2)$ (Ex. 1.1.18, Def. 1.1.19), with $SO(2)$ acting on the right by rotating the frame ' +
      '(the slider). A frame $(u_1,u_2)$ at $x$ completes $x$ to an orthonormal basis, so $f\\mapsto[x\\,|\\,u_1\\,|\\,u_2]$ ' +
      'identifies $O^+(S^2)$ with $SO(3)$, the right action becoming right multiplication by $\\mathrm{diag}(1,b)$ ' +
      '(Ex. 1.1.18) — the same bundle as $SO(3)\\to SO(3)/SO(2)$ of Ex. 1.1.4/4. On the right $SO(3)$ is the ball of radius $\\pi$ ' +
      '(rotation axis × angle, antipodes on the boundary glued), and each fibre is a closed curve in it. The two frame fields are ' +
      'the normalised coordinate frames of the two stereographic charts; each spins twice around the pole it omits. ' +
      'No frame field covers all of $S^2$ — by Prop. 1.1.6 that is the nontriviality of $O^+(S^2)$ (the hairy ball theorem in bundle language) — and the ' +
      'transition map $\\rho_{NS} = \\pi + 2\\varphi$ on the equator has degree 2, twice the Hopf bundle\'s ' +
      '(Station 1.1b). That 2 is the Euler number of $S^2$, and $SO(3) \\cong S^3/\\{\\pm1\\}$ is the Hopf total space divided by $\\pm1$.',
  );
  container.append(controls, panes, caption);

  const sceneL = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.4], up: [0, 0, 1] });
  const sceneR = createScenePane(paneR, { cameraPos: [6.5, -6.5, 4.5], up: [0, 0, 1], maxDistance: 40 });

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }),
  );
  sceneL.scene.add(sphere);
  const fieldGroup = new THREE.Group();
  sceneL.scene.add(fieldGroup);
  const xMark = ball(0.04, 0xffffff);
  const big1 = makeArrow(0xf0a35e);
  const big2 = makeArrow(0x6ec6fe);
  sceneL.scene.add(xMark, big1, big2);

  // π-ball shell (antipodal identification on the boundary)
  sceneR.scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(Math.PI, 48, 24),
      new THREE.MeshBasicMaterial({ color: 0x3a4560, wireframe: true, transparent: true, opacity: 0.25 }),
    ),
  );
  const ballGroup = new THREE.Group();
  sceneR.scene.add(ballGroup);
  const pMark = ball(0.12, 0x69d58c);
  sceneR.scene.add(pMark);

  const samples = fibonacciSphere(260);
  let x: Vec3 = fromPolar(1.0, 0.7);

  const section = () => (secSel.value === 'S' ? sectionS : sectionN);

  function drawField(): void {
    clearGroup(fieldGroup);
    const s = section();
    for (const p of samples) {
      const f = s(p);
      if (!f) continue;
      const [th] = polarAngles(p);
      if ((secSel.value === 'N' && th > Math.PI - 0.12) || (secSel.value === 'S' && th < 0.12)) continue;
      const a1 = makeArrow(0xf0a35e);
      const a2 = makeArrow(0x6ec6fe);
      setArrow(a1, p.map((c) => c * 1.005), f.u1.map((c) => c * 0.11));
      setArrow(a2, p.map((c) => c * 1.005), f.u2.map((c) => c * 0.11));
      fieldGroup.add(a1, a2);
    }
  }

  function drawBall(): void {
    clearGroup(ballGroup);
    // context: fibres over a few base points, via whichever section is defined
    for (const [th, ph] of [
      [0.3, 0],
      [1.0, 2.0],
      [1.6, 4.0],
      [2.3, 1.0],
      [2.8, 3.0],
    ]) {
      const p = fromPolar(th, ph);
      const f = sectionN(p) ?? sectionS(p)!;
      for (const piece of fibreInBall(f)) {
        ballGroup.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(piece.map((q) => new THREE.Vector3(...q))),
            new THREE.LineBasicMaterial({ color: 0x4a5878 }),
          ),
        );
      }
    }
    const f = sectionN(x) ?? sectionS(x)!;
    for (const piece of fibreInBall(f)) {
      ballGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(piece.map((q) => new THREE.Vector3(...q))),
          new THREE.LineBasicMaterial({ color: 0xffffff }),
        ),
      );
    }
  }

  function update(): void {
    setPos(xMark, x);
    const s0 = section()(x);
    const f = s0 ? actSO2(s0, parseFloat(beta.value)) : null;
    big1.visible = big2.visible = pMark.visible = !!f;
    if (f) {
      setArrow(big1, x, f.u1.map((c) => c * 0.4));
      setArrow(big2, x, f.u2.map((c) => c * 0.4));
      setPos(pMark, so3Log(frameToSO3(f)));
    }
    const rho = transitionNS(x);
    hudLBig.textContent = rho === null ? 'x is a pole: one chart only' : `ρ_NS(x) = ${fmtPi(((rho % TAU) + TAU) % TAU)}`;
    hudLSmall.textContent = f
      ? 'deg ρ_NS on any latitude = 2'
      : `s_${secSel.value} is undefined here — switch section`;
  }

  onTap(sceneL, sphere, (pt) => {
    const r = Math.hypot(pt.x, pt.y, pt.z);
    x = [pt.x / r, pt.y / r, pt.z / r];
    drawBall();
    update();
  });
  secSel.addEventListener('change', () => {
    drawField();
    update();
  });
  beta.addEventListener('input', update);
  drawField();
  drawBall();
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
