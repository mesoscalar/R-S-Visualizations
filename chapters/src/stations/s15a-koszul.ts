/**
 * Station 1.5a — the covariant derivative on TS² (Def. 1.5.2, Prop. 1.5.3,
 * 1.5.4, Rem. 1.5.5, Prop. 1.5.11; (1.5.8)), computed two ways: by the local
 * formula in a frame, and as the derivative of parallel transport (Prop. 1.7.17).
 *
 * Left: S² with a vector field V, a point m, a direction X and the geodesic
 * γ(t); at m, V(γ(t)) transported back (green), the difference quotient
 * (orange) and ∇_X V (red). Right: the tangent plane at m with the two terms
 * of (1.5.8) tip to tail in the chosen frame.
 */
import * as THREE from 'three';
import { fromPolar, polarAngles, sectionN, sectionS, type Vec3 } from '@rsvis/math';
import {
  curvatureR,
  geodesic,
  gradField,
  nablaExtrinsic,
  nablaLocal,
  nablaTerms,
  rotationField,
  transportedBack,
  type Field,
  type Section,
} from '../math/koszul';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, fibonacciSphere, makeArrow, onTap, setArrow } from './three-helpers';

const FIELDS: Record<string, { label: string; V: Field }> = {
  rot: { label: 'V: rotation about a tilted axis', V: rotationField([0.35, 0.2, 0.9]) },
  height: { label: 'V: gradient of the height z', V: gradField([0, 0, 1], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
  saddle: {
    label: 'V: gradient of x² − y² + 0.4z',
    V: gradField([0, 0, 0.4], [[1, 0, 0], [0, -1, 0], [0, 0, 0]]),
  },
};
const FRAMES: Record<string, { label: string; sec: Section }> = {
  N: { label: 'frame s_N', sec: sectionN },
  S: { label: 'frame s_S', sec: sectionS },
};
/** Arrow scale for V and its derivatives in the 3D pane. */
const SCALE = 0.3;

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

function select(opts: Record<string, { label: string }>): HTMLSelectElement {
  const s = document.createElement('select');
  for (const [k, o] of Object.entries(opts)) {
    const op = document.createElement('option');
    op.value = k;
    op.textContent = o.label;
    s.appendChild(op);
  }
  return s;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (s: number, a: ArrayLike<number>): Vec3 => [s * a[0], s * a[1], s * a[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3) => Math.hypot(...a);

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const fieldSel = select(FIELDS);
  const frameSel = select(FRAMES);
  const [lpsi, psiS] = slider('direction of X', -Math.PI, Math.PI, 0.6);
  const [lt, tS] = slider('t', 0.02, 1.2, 0.7);
  const play = el('button', '', '▶ shrink t');
  controls.append(fieldSel, lpsi, lt, play, frameSel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S²: V, the geodesic γ — tap to move m'));
  paneR.appendChild(
    el('div', 'pane-label', 'T_mS²: blue + purple = red ∇_X V (1.5.8)'),
  );
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['1.5a']));

  const scene = createScenePane(paneL, { cameraPos: [2.5, -2.3, 1.7], up: [0, 0, 1] });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }),
  );
  sphere.geometry.rotateX(Math.PI / 2);
  scene.scene.add(sphere);
  const grid = fibonacciSphere(160) as Vec3[];
  const fieldArrows = grid.map(() => makeArrow(0x55607a));
  for (const a of fieldArrows) scene.scene.add(a);
  const pathGroup = new THREE.Group();
  scene.scene.add(pathGroup);
  const mBall = ball(0.035, 0xffffff);
  const gBall = ball(0.03, 0x69d58c);
  scene.scene.add(mBall, gBall);
  const aVm = makeArrow(0xffffff);
  const aVg = makeArrow(0xb8c0d0);
  const aBack = makeArrow(0x69d58c);
  const aQuot = makeArrow(0xf0a35e);
  const aNab = makeArrow(0xff5c5c);
  const aX = makeArrow(0x5ec8f0);
  scene.scene.add(aVm, aVg, aBack, aQuot, aNab, aX);

  let m: Vec3 = fromPolar(1.0, -0.8);

  function drawField(): void {
    const V = FIELDS[fieldSel.value].V;
    grid.forEach((p, k) => setArrow(fieldArrows[k], scl(1.003, p), scl(0.6 * SCALE, V(p))));
  }

  /** X: unit vector at angle ψ in the s_N frame at m. */
  function direction(): Vec3 {
    const f = sectionN(m)!;
    const psi = parseFloat(psiS.value);
    return [0, 1, 2].map((i) => Math.cos(psi) * f.u1[i] + Math.sin(psi) * f.u2[i]) as Vec3;
  }

  interface State {
    X: Vec3;
    Vm: Vec3;
    nab: Vec3;
    quot: Vec3;
    dxi: Vec3;
    conn: Vec3;
    e1: Vec3;
    e2: Vec3;
    /** largest arrow over both frames, so switching frames does not rescale the picture */
    big: number;
  }
  let state: State | null = null;

  function update(): void {
    const V = FIELDS[fieldSel.value].V;
    const sec = FRAMES[frameSel.value].sec;
    const t = parseFloat(tS.value);
    const X = direction();
    const Vm = V(m);
    const gt = geodesic(m, X, t);
    const back = transportedBack(V, m, X, t);
    const quot = scl(1 / t, sub(back, Vm));
    const nab = nablaLocal(V, m, X);
    const { dxi, conn } = nablaTerms(V, m, X, 1e-5, sec);
    const f = sec(m)!;
    const terms = Object.values(FRAMES).flatMap(({ sec: q }) => Object.values(nablaTerms(V, m, X, 1e-5, q)));
    const big = Math.max(1, ...[Vm, nab, quot, ...terms].map(norm));
    state = { X, Vm, nab, quot, dxi, conn, e1: f.u1, e2: f.u2, big };

    clearGroup(pathGroup);
    const pts: Vec3[] = [];
    for (let k = 0; k <= 60; k++) pts.push(scl(1.004, geodesic(m, X, (t * k) / 60)));
    pathGroup.add(coloredTube(pts, pts.map(() => new THREE.Color(0x69d58c)), 0.008, false));
    setPos(mBall, m);
    setPos(gBall, gt);
    setArrow(aX, m, scl(0.35, X));
    setArrow(aVm, m, scl(SCALE, Vm));
    setArrow(aVg, gt, scl(SCALE, V(gt)));
    setArrow(aBack, m, scl(SCALE, back));
    setArrow(aQuot, m, scl(SCALE, quot));
    setArrow(aNab, m, scl(SCALE, nab));

    // Prop. 1.5.11 at m with Killing fields X̂ = (m×X)×·, Ŷ = (−X)×· whose values at m are X and JX = m×X
    const JX = cross(m, X);
    const R = curvatureR(rotationField(cross(m, X)), rotationField(scl(-1, X)), V, m);
    const pred = sub(scl(dot(JX, Vm), X), scl(dot(X, Vm), JX));
    hudBig.textContent = `|orange − red| = ${norm(sub(quot, nab)).toFixed(4)}`;
    hudSmall.textContent =
      `|∇_X V| = ${norm(nab).toFixed(4)} · (1.5.8) vs tangential D_X V: ${norm(sub(nab, nablaExtrinsic(V, m, X))).toExponential(1)} · ` +
      `R(X,JX)V vs ⟨JX,V⟩X − ⟨X,V⟩JX: ${norm(sub(R, pred)).toExponential(1)}`;
    drawPlane();
  }

  function drawPlane(): void {
    if (!state) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const W = paneR.clientWidth;
    const H = paneR.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // screen axes: the s_N frame at m (fixed, so switching frames visibly moves only the frame-dependent pieces)
    const ref = sectionN(m)!;
    const s = (0.32 * Math.min(W, H)) / state.big;
    const cx = W / 2;
    const cy = H / 2 + 30;
    const P = (v: Vec3): [number, number] => [cx + s * dot(v, ref.u1), cy - s * dot(v, ref.u2)];
    const arrow = (from: Vec3, v: Vec3, color: string, width: number, dash: number[] = []) => {
      const [x0, y0] = P(from);
      const [x1, y1] = P([from[0] + v[0], from[1] + v[1], from[2] + v[2]]);
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1) return;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      const a = Math.atan2(y1 - y0, x1 - x0);
      const hl = Math.min(10, 0.35 * len);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
      ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
    };
    const O: Vec3 = [0, 0, 0];
    ctx.strokeStyle = '#232a3b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, s, 0, 2 * Math.PI);
    ctx.stroke();
    const e1 = scl(0.5, state.e1);
    const e2 = scl(0.5, state.e2);
    arrow(O, e1, '#4a5570', 1.5);
    arrow(O, e2, '#4a5570', 1.5);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#8a93a6';
    const [l1x, l1y] = P(scl(1.15, e1));
    const [l2x, l2y] = P(scl(1.15, e2));
    ctx.fillText('e₁', l1x - 6, l1y + 4);
    ctx.fillText('e₂', l2x - 6, l2y + 4);
    arrow(O, scl(0.5, state.X), '#5ec8f0', 1, [3, 3]);
    arrow(O, state.Vm, '#ffffff', 1.5);
    arrow(O, state.dxi, '#5e8cf0', 3);
    arrow(state.dxi, state.conn, '#b07af0', 3);
    arrow(O, state.quot, '#f0a35e', 1.5, [5, 4]);
    arrow(O, state.nab, '#ff5c5c', 2);
    ctx.fillStyle = '#8a93a6';
    ctx.fillText('white V(m) · dashed cyan X · grey: the chosen frame', 12, H - 12);
  }

  let anim = 0;
  play.addEventListener('click', () => {
    anim = 1;
    tS.value = '1.2';
  });
  scene.onFrame((dt) => {
    if (!anim) return;
    const t = parseFloat(tS.value) * Math.exp(-1.2 * dt);
    if (t <= 0.02) anim = 0;
    tS.value = String(Math.max(0.02, t));
    update();
  });

  onTap(scene, sphere, (pt) => {
    const [th, ph] = polarAngles([pt.x, pt.y, pt.z]);
    m = fromPolar(Math.max(0.15, Math.min(th, Math.PI - 0.15)), ph);
    update();
  });
  fieldSel.addEventListener('change', () => {
    drawField();
    update();
  });
  frameSel.addEventListener('change', update);
  psiS.addEventListener('input', update);
  tS.addEventListener('input', () => {
    anim = 0;
    update();
  });
  const ro = new ResizeObserver(drawPlane);
  ro.observe(paneR);
  drawField();
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
