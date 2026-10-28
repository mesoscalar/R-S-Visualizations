/**
 * Station 1.3a — horizontal and vertical
 * (Lemma 1.3.1, Def. 1.3.2, Rem. 1.3.3, Def. 1.3.4, Prop. 1.3.5, Ex. 1.3.22, Ex. 1.3.23).
 *
 * Left: at a point p ∈ S³ (stereographic), the vertical line V_p (tangent to
 * the fibre), the horizontal plane Γ_p = ker ω_c, and a tangent vector X split
 * as hor X + ver X (1.3.2), (1.3.7). Right: the torus of fibres over p's
 * latitude with its horizontal foliation — for ω_c, or for the flat chart
 * connection κ1^*θ that looks like dα on S²×U(1) (Ex. 1.3.23).
 */
import * as THREE from 'three';
import {
  actU1,
  fromPolar,
  jq,
  killingI,
  kq,
  omegaC,
  potential1Phi,
  section1,
  stereographic,
  type Vec3,
  type Vec4,
} from '@rsvis/math';
import {
  chartFlatCurve,
  horizontalPart,
  horizontalTorusCurve,
  tangentFromAngles,
  verticalPart,
} from '../math/connection-split';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el } from './three-helpers';

const PHI0 = 0.6;
const TAU = 2 * Math.PI;

/** Differential of the stereographic projection (z0,z1,z2)/(1 − z3) — exact. */
function dStereo(z: ArrayLike<number>, v: ArrayLike<number>): Vec3 {
  const d = 1 - z[3];
  return [
    v[0] / d + (z[0] * v[3]) / (d * d),
    v[1] / d + (z[1] * v[3]) / (d * d),
    v[2] / d + (z[2] * v[3]) / (d * d),
  ];
}

function slider(label: string, min: number, max: number, value: number): [HTMLLabelElement, HTMLInputElement] {
  const l = el('label', '', label);
  const s = document.createElement('input');
  s.type = 'range';
  s.min = String(min);
  s.max = String(max);
  s.step = '0.01';
  s.value = String(value);
  l.appendChild(s);
  return [l, s];
}

function arrow(color: number): THREE.ArrowHelper {
  return new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.12, 0.07);
}

function setArrow(a: THREE.ArrowHelper, from: Vec3, vec: Vec3): void {
  const len = Math.hypot(...vec);
  a.visible = len > 1e-6;
  if (!a.visible) return;
  a.position.set(...from);
  a.setDirection(new THREE.Vector3(...vec).normalize());
  a.setLength(len, Math.min(0.12, 0.4 * len), Math.min(0.07, 0.25 * len));
}

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lTh, th] = slider('base θ', 0.25, 2.5, 1.0);
  const [lAl, al] = slider('p along fibre', 0, TAU, 0.3);
  const [lE, eSl] = slider('X: tilt', -1.5, 1.5, 0.6);
  const [lB, bSl] = slider('X: bearing', 0, TAU, 0.8);
  const connSel = document.createElement('select');
  connSel.innerHTML =
    '<option value="c">ω_c = z̄₁dz₁ + z̄₂dz₂ (Ex. 1.3.22)</option><option value="flat">κ₁*θ = i dα — like S²×U(1) (Ex. 1.3.23)</option>';
  controls.append(lTh, lAl, lE, lB, connSel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'T_pS³ = Γ_p ⊕ V_p — white X, green hor X, pink ver X'));
  paneR.appendChild(el('div', 'pane-label', 'Fibres over p’s latitude and the horizontal curves'));
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

  const caption = explainer(EXPLAINERS['1.3a']);
  container.append(controls, panes, caption);

  const sceneL = createScenePane(paneL, { cameraPos: [3.2, -3.0, 2.2], up: [0, 0, 1], maxDistance: 40 });
  const sceneR = createScenePane(paneR, { cameraPos: [3.6, -4.0, 3.0], up: [0, 0, 1], maxDistance: 40 });

  // ---------- left ----------
  const fibreL = new THREE.Group();
  sceneL.scene.add(fibreL);
  const pBall = ball(0.06, 0xffffff);
  sceneL.scene.add(pBall);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0x69d58c, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  const discRim = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 48 }, (_, k) => new THREE.Vector3(Math.cos((TAU * k) / 48), Math.sin((TAU * k) / 48), 0)),
    ),
    new THREE.LineBasicMaterial({ color: 0x69d58c }),
  );
  sceneL.scene.add(disc, discRim);
  const aX = arrow(0xffffff);
  const aH = arrow(0x69d58c);
  const aV = arrow(0xe07ad8);
  const vLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xe07ad8 }));
  sceneL.scene.add(aX, aH, aV, vLine);

  // ---------- right ----------
  const torusR = new THREE.Group();
  sceneR.scene.add(torusR);
  const pBallR = ball(0.07, 0xffffff);
  sceneR.scene.add(pBallR);

  function z0(): Vec4 {
    return actU1(section1(fromPolar(parseFloat(th.value), PHI0))!, parseFloat(al.value));
  }

  function updateLeft(): void {
    const z = z0();
    const P = stereographic(z);
    setPos(pBall, P);
    clearGroup(fibreL);
    fibreL.add(fibreMesh(z, null, 0.02, new THREE.Color(0x8a93a6)));

    // all vectors are drawn at a common scale: |dStereo(iz)| ↦ 0.5
    const scale = 0.5 / Math.hypot(...dStereo(z, killingI(z)));
    const S = (v: ArrayLike<number>): Vec3 => dStereo(z, v).map((x) => x * scale) as Vec3;
    const ej = S(jq(z));
    const ek = S(kq(z));
    const r = Math.hypot(...ej); // = |ek| (conformal), the disc radius
    const nrm = new THREE.Vector3(...ej).cross(new THREE.Vector3(...ek)).normalize();
    disc.position.set(...P);
    disc.scale.setScalar(r);
    disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm);
    discRim.position.copy(disc.position);
    discRim.scale.copy(disc.scale);
    discRim.quaternion.copy(disc.quaternion);

    const vi = S(killingI(z));
    vLine.geometry.dispose();
    vLine.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(P[0] - 1.6 * vi[0], P[1] - 1.6 * vi[1], P[2] - 1.6 * vi[2]),
      new THREE.Vector3(P[0] + 1.6 * vi[0], P[1] + 1.6 * vi[1], P[2] + 1.6 * vi[2]),
    ]);

    const X = tangentFromAngles(z, parseFloat(eSl.value), parseFloat(bSl.value));
    const h = horizontalPart(z, X);
    const v = verticalPart(z, X);
    setArrow(aX, P, S(X));
    setArrow(aH, P, S(h));
    const Sh = S(h);
    setArrow(aV, [P[0] + Sh[0], P[1] + Sh[1], P[2] + Sh[2]], S(v));
    const a = omegaC(z, X);
    hudLBig.textContent = `ω_c(X) = ${a.toFixed(3)} i`;
    hudLSmall.textContent = `ω_c(hor X) = ${Math.abs(omegaC(z, h)).toExponential(1)} · ω_c(ver X) = ${omegaC(z, v).toFixed(3)} i`;
  }

  function updateRight(): void {
    const theta = parseFloat(th.value);
    clearGroup(torusR);
    // a few fibres for the torus
    for (let k = 0; k < 16; k++) {
      torusR.add(fibreMesh(section1(fromPolar(theta, (TAU * k) / 16))!, null, 0.008, new THREE.Color(0x3a4560)));
    }
    const flat = connSel.value === 'flat';
    const curve = (a0: number) => (flat ? chartFlatCurve(theta, a0) : horizontalTorusCurve(theta, a0));
    const NC = 10;
    for (let k = 0; k < NC; k++) {
      const c = curve((TAU * k) / NC);
      const pts: Vec3[] = [];
      for (let i = 0; i <= 240; i++) pts.push(stereographic(c((TAU * i) / 240)));
      const col = new THREE.Color(k === 0 ? 0xf0a35e : 0x69d58c);
      torusR.add(coloredTube(pts, pts.map(() => col), k === 0 ? 0.03 : 0.014, false));
    }
    // start and end of the highlighted curve
    const c0 = curve(0);
    const s = ball(0.07, 0xffffff);
    setPos(s, stereographic(c0(0)));
    const e = ball(0.07, 0xf0a35e);
    setPos(e, stereographic(c0(TAU)));
    torusR.add(s, e);
    setPos(pBallR, stereographic(z0()));

    const slope = flat ? 0 : -potential1Phi(theta);
    hudRBig.textContent = `dα/dφ = ${slope.toFixed(3)}`;
    hudRSmall.textContent = flat
      ? 'horizontal curves close up'
      : `after one turn the curve misses by Δα = −π(1 − cos θ) = ${(TAU * slope).toFixed(3)}`;
  }

  function updateAll(): void {
    updateLeft();
    updateRight();
  }
  th.addEventListener('input', updateAll);
  al.addEventListener('input', updateAll);
  eSl.addEventListener('input', updateLeft);
  bSl.addEventListener('input', updateLeft);
  connSel.addEventListener('change', updateRight);
  updateAll();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
