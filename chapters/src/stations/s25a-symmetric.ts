/**
 * Station 2.5a — S² and H² as symmetric spaces (Lemma 2.5.2, Prop. 2.5.10,
 * Rem. 2.5.14, Def. 2.5.15, Prop. 2.5.19, Ex. 2.5.27, Rem. 2.5.28).
 *
 * Left: the sphere or the hyperboloid (u₀ up), the origin o, the geodesic
 * exp(tM(x))·o, a flag near o with its mirror image under s_o and its image
 * under the transvection T_t, and a vector carried along by T_t.
 * Right: the matrices: x, y ∈ m, their bracket in h, and T_t = exp(tM(x)).
 */
import * as THREE from 'three';
import type { Vec3 } from '@rsvis/math';
import {
  ORIGIN,
  bracket,
  curvatureAtOrigin,
  expm,
  geodesic,
  killing,
  mPart,
  mv,
  symmetryAtOrigin,
  transportAlong,
  transvection,
  type M3,
  type V3,
} from '../math/symmetric-space';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el, makeArrow, setArrow } from './three-helpers';

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

/** A small flag in normal coordinates at o: a pole and a triangular pennant. */
const FLAG: [number, number][] = [
  [0.35, -0.15],
  [0.35, 0.45],
  [0.68, 0.33],
  [0.35, 0.21],
];

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const spaceSel = document.createElement('select');
  spaceSel.innerHTML = '<option value="1">S² = SO(3)/SO(2)</option><option value="-1">H² = SO₀(1,2)/SO(2)</option>';
  const [la, aS] = slider('direction of x', -Math.PI, Math.PI, 0.4);
  const [lt, tS] = slider('t', -2, 2, 1.1);
  const play = el('button', '', '▶ transvect');
  controls.append(spaceSel, la, lt, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'white flag; purple: s_o(flag); green: T_t(flag); orange: geodesic exp(tx)·o'));
  paneR.appendChild(el('div', 'pane-label', 'the Lie algebra side: g = h ⊕ m'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['2.5a']));

  const scene = createScenePane(paneL, { cameraPos: [0.8, -1.5, 3.1], cameraTarget: [0, 0, 0.3], up: [0, 0, 1], maxDistance: 30 });
  const surfGroup = new THREE.Group();
  scene.scene.add(surfGroup);
  const dyn = new THREE.Group();
  scene.scene.add(dyn);
  const vecArrow = makeArrow(0xff5c5c);
  const vecArrow0 = makeArrow(0xff5c5c);
  scene.scene.add(vecArrow, vecArrow0);

  let eps = 1;
  // display: (u₁, u₂, u₀) with u₀ up; the hyperboloid is shrunk to fit
  const disp = (u: ArrayLike<number>): Vec3 => {
    const s = eps > 0 ? 1 : 0.6;
    return [s * u[1], s * u[2], s * (u[0] - (eps > 0 ? 0 : 1))];
  };

  function buildSurface(): void {
    clearGroup(surfGroup);
    const geo = new THREE.BufferGeometry();
    const NR = 40;
    const NA = 64;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= NR; i++)
      for (let j = 0; j <= NA; j++) {
        const rho = eps > 0 ? (Math.PI * i) / NR : (1.7 * i) / NR;
        const a = (2 * Math.PI * j) / NA;
        const u = eps > 0 ? [Math.cos(rho), Math.sin(rho) * Math.cos(a), Math.sin(rho) * Math.sin(a)] : [Math.cosh(rho), Math.sinh(rho) * Math.cos(a), Math.sinh(rho) * Math.sin(a)];
        pos.push(...disp(u));
      }
    for (let i = 0; i < NR; i++)
      for (let j = 0; j < NA; j++) {
        const a = i * (NA + 1) + j;
        idx.push(a, a + NA + 1, a + 1, a + 1, a + NA + 1, a + NA + 2);
      }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    surfGroup.add(
      new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })),
    );
    const o = ball(0.04, 0xffffff);
    setPos(o, disp(ORIGIN));
    surfGroup.add(o);
  }

  const flagPts = (g: M3 | null, reflect = false): Vec3[] => {
    const pts: Vec3[] = [];
    for (let k = 0; k < FLAG.length; k++) {
      const a = FLAG[k];
      const b = FLAG[(k + 1) % FLAG.length];
      for (let i = 0; i <= 10; i++) {
        const v: [number, number] = [a[0] + ((b[0] - a[0]) * i) / 10, a[1] + ((b[1] - a[1]) * i) / 10];
        let u: V3 = mv(expm(mPart(eps, v)), ORIGIN);
        if (reflect) u = symmetryAtOrigin(u);
        if (g) u = mv(g, u);
        pts.push(disp(u).map((c) => c * 1.004) as Vec3);
      }
    }
    return pts;
  };

  function update(): void {
    const a = parseFloat(aS.value);
    const x: [number, number] = [Math.cos(a), Math.sin(a)];
    const t = parseFloat(tS.value);
    clearGroup(dyn);
    const geo: Vec3[] = [];
    for (let i = 0; i <= 120; i++) geo.push(disp(geodesic(eps, x, -2 + (4 * i) / 120)).map((c) => c * 1.003) as Vec3);
    dyn.add(coloredTube(geo, geo.map(() => new THREE.Color(0xf0a35e)), 0.01, false));
    const T = transvection(eps, x, t);
    const tube = (pts: Vec3[], c: number, r: number) => dyn.add(coloredTube(pts, pts.map(() => new THREE.Color(c)), r, true));
    tube(flagPts(null), 0xe6e9ef, 0.014);
    tube(flagPts(null, true), 0xb07af0, 0.014);
    tube(flagPts(T), 0x69d58c, 0.018);
    const gt = geodesic(eps, x, t);
    const p = ball(0.035, 0x69d58c);
    setPos(p, disp(gt));
    dyn.add(p);

    // a tangent vector at o at 45° to the geodesic, carried by dT_t
    const c45 = Math.SQRT1_2 * 0.5;
    const Y0 = mv(mPart(eps, [c45 * (x[0] - x[1]), c45 * (x[0] + x[1])]), ORIGIN);
    const Yt = mv(T, Y0);
    const sc = eps > 0 ? 1 : 0.6;
    setArrow(vecArrow0, disp(ORIGIN), [Y0[1] * sc, Y0[2] * sc, Y0[0] * sc]);
    setArrow(vecArrow, disp(gt), [Yt[1] * sc, Yt[2] * sc, Yt[0] * sc]);
    const ode = transportAlong(eps, x, Y0, t, 200);
    const err = Math.max(...[0, 1, 2].map((i) => Math.abs(ode[i] - Yt[i])));

    const y: [number, number] = [-x[1], x[0]];
    const R = curvatureAtOrigin(eps, x, y, y);
    const K = R[0] * x[0] + R[1] * x[1];
    hudBig.textContent = `K = ⟨F(x,y)y, x⟩ = ${K.toFixed(4)}`;
    hudSmall.textContent =
      `|dT_t·Y − (transport ODE)| = ${err.toExponential(1)} · Killing form on m: k(x,x) = ${killing(eps, mPart(eps, x), mPart(eps, x)).toFixed(3)}`;
    drawMatrices(x, y, t);
  }

  function drawMatrices(x: [number, number], y: [number, number], t: number): void {
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
    const mats: [string, M3, string][] = [
      ['x ∈ m', mPart(eps, x), 'λ(x) = −x'],
      ['y ∈ m', mPart(eps, y), 'y ⟂ x'],
      ['[x, y] ∈ h', bracket(mPart(eps, x), mPart(eps, y)), 'F(x,y) = −[x,y]'],
      [`T_t = exp(t x), t = ${t.toFixed(2)}`, expm(mPart(eps, [t * x[0], t * x[1]])), 'σ(T_t) = T_−t'],
    ];
    const cell = Math.min(40, (W - 80) / 6.5, (H - 130) / 6.4);
    const colW = (W - 20) / 2;
    mats.forEach(([label, M, note], k) => {
      const ox = 20 + (k % 2) * colW;
      const oy = 52 + Math.floor(k / 2) * (cell * 3 + 46);
      ctx.fillStyle = '#c9d1e0';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(label, ox, oy - 8);
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          const v = M[3 * i + j];
          const inH = i > 0 && j > 0;
          const inM = (i === 0) !== (j === 0);
          const a = Math.min(1, Math.abs(v));
          ctx.fillStyle = v >= 0 ? `rgba(240,163,94,${0.15 + 0.75 * a})` : `rgba(94,140,240,${0.15 + 0.75 * a})`;
          ctx.fillRect(ox + j * cell, oy + i * cell, cell - 2, cell - 2);
          ctx.strokeStyle = inH ? '#69d58c' : inM ? '#b07af0' : '#2a3247';
          ctx.strokeRect(ox + j * cell, oy + i * cell, cell - 2, cell - 2);
          ctx.fillStyle = '#0b0e14';
          ctx.font = '10px system-ui, sans-serif';
          ctx.fillText(v.toFixed(1), ox + j * cell + 3, oy + i * cell + cell / 2 + 3);
        }
      ctx.fillStyle = '#8a93a6';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(note, ox, oy + 3 * cell + 16);
    });
    ctx.fillStyle = '#8a93a6';
    ctx.fillText('green frame: the h-block (rotations fixing o) · purple: the m-blocks (tangent vectors at o)', 12, H - 12);
  }

  let anim = false;
  let dir = 1;
  play.addEventListener('click', () => {
    anim = !anim;
  });
  scene.onFrame((dt) => {
    if (!anim) return;
    let t = parseFloat(tS.value) + dir * 0.6 * dt;
    if (t > 2 || t < -2) {
      dir = -dir;
      t = Math.max(-2, Math.min(2, t));
    }
    tS.value = String(t);
    update();
  });
  spaceSel.addEventListener('change', () => {
    eps = parseInt(spaceSel.value, 10);
    buildSurface();
    update();
  });
  for (const s of [aS, tS]) s.addEventListener('input', update);
  const ro = new ResizeObserver(update);
  ro.observe(paneR);
  buildSurface();
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
