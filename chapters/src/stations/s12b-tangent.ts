/**
 * Station 1.2b — a tangent vector is a class [(frame, components)]
 * (Def. 1.2.1, Rem. 1.2.3, Prop. 1.2.6, Rem. 1.2.9; (1.2.2), (1.2.3), (1.2.5)).
 *
 * Left: S² with a vector field v and, at a tapped point x, a frame
 * f = s_N(x)·b(β) and the vector ι_f(ξ). Right: the component plane R² — the
 * components ξ of the same vector turn by −β as the frame turns by β, and the
 * chart components ξ_N, ξ_S differ by the rotation ρ_NS(x).
 */
import * as THREE from 'three';
import { actSO2, fromPolar, sectionN, sectionS, transitionNS, type Vec3 } from '@rsvis/math';
import { components, gradientField, iota, type Vec2 } from '../math/associated-tangent';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { ball, setPos } from './hopf-draw';
import { clearGroup, createScenePane, el, fibonacciSphere, makeArrow, onTap, setArrow } from './three-helpers';

const TAU = 2 * Math.PI;

const FIELDS: Record<string, { label: string; v: (x: Vec3) => Vec3 }> = {
  z: { label: '∇z (zeros at both poles)', v: gradientField([0, 0, 1], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
  x: { label: '∇x (zeros at ±e₁)', v: gradientField([1, 0, 0], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]) },
  q: {
    label: '∇(x² − y² + 0.4z) (four saddles & sources)',
    v: gradientField([0, 0, 0.4], [[1, 0, 0], [0, -1, 0], [0, 0, 0]]),
  },
};

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const fieldSel = document.createElement('select');
  for (const [k, f] of Object.entries(FIELDS)) {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = `v = ${f.label}`;
    fieldSel.appendChild(o);
  }
  const bl = el('label', '', 'rotate frame by b(β)');
  const beta = document.createElement('input');
  beta.type = 'range';
  beta.min = '0';
  beta.max = String(TAU);
  beta.step = '0.01';
  beta.value = '0.6';
  bl.appendChild(beta);
  controls.append(fieldSel, bl);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S²: field v (grey), frame f at x (orange u₁, cyan u₂), v(x) white — tap to move x'));
  paneR.appendChild(el('div', 'pane-label', 'Component plane R² ≅ fibre via ι_f'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  const canvas = document.createElement('canvas');
  paneR.appendChild(canvas);

  const caption = explainer(EXPLAINERS['1.2b']);
  container.append(controls, panes, caption);

  const scene = createScenePane(paneL, { cameraPos: [2.4, -2.4, 1.4], up: [0, 0, 1] });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 }),
  );
  scene.scene.add(sphere);
  const fieldGroup = new THREE.Group();
  scene.scene.add(fieldGroup);
  const xMark = ball(0.035, 0xffffff);
  const a1 = makeArrow(0xf0a35e);
  const a2 = makeArrow(0x6ec6fe);
  const av = makeArrow(0xffffff);
  scene.scene.add(xMark, a1, a2, av);
  const samples = fibonacciSphere(300);
  let x: Vec3 = fromPolar(0.9, 0.5);

  function drawField(): void {
    clearGroup(fieldGroup);
    const v = FIELDS[fieldSel.value].v;
    let maxN = 1e-9;
    for (const p of samples) maxN = Math.max(maxN, Math.hypot(...v(p)));
    for (const p of samples) {
      const w = v(p);
      const a = makeArrow(0x8a93a6);
      setArrow(a, p.map((c) => c * 1.005), w.map((c) => (0.13 * c) / maxN));
      fieldGroup.add(a);
    }
  }

  function draw2D(xi: Vec2, xiN: Vec2 | null, xiS: Vec2 | null, b: number): void {
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
    const cx = W / 2;
    const cy = H / 2 + 24;
    const R = Math.min(W, H - 90) * 0.38;
    const norm = Math.max(Math.hypot(...xi), 1e-9);
    const P = (v: Vec2): [number, number] => [cx + (R * v[0]) / norm, cy - (R * v[1]) / norm];
    // axes = the standard basis of R², i.e. the frame f itself under ι_f
    ctx.strokeStyle = '#232a3b';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();
    const axis = (dx: number, dy: number, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * R * 1.15, cy - dy * R * 1.15);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, cx + dx * R * 1.2, cy - dy * R * 1.2);
    };
    ctx.font = '13px system-ui, sans-serif';
    axis(1, 0, '#f0a35e', 'e₁ ↔ u₁');
    axis(0, 1, '#6ec6fe', 'e₂ ↔ u₂');
    // ξ for the rotated frame
    const [px, py] = P(xi);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`ξ = b(−β)·ξ_N`, px + 8, py - 6);
    // chart components and the transition arc ξ_S → ξ_N
    if (xiN && xiS) {
      for (const [v, c, l] of [
        [xiN, '#69d58c', 'ξ_N'],
        [xiS, '#e07ad8', 'ξ_S'],
      ] as const) {
        const [qx, qy] = P(v);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(qx, qy, 5, 0, TAU);
        ctx.fill();
        ctx.fillText(l, qx + 8, qy + 14);
      }
      const aS = Math.atan2(xiS[1], xiS[0]);
      const aN = Math.atan2(xiN[1], xiN[0]);
      let d = aN - aS;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      ctx.strokeStyle = '#8a93a6';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.55, -aS, -(aS + d), d > 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#8a93a6';
    ctx.fillText(`frame turned by β = ${(b / Math.PI).toFixed(2)}π`, 14, H - 14);
  }

  function update(): void {
    const v = FIELDS[fieldSel.value].v;
    setPos(xMark, x);
    const b = parseFloat(beta.value);
    const s = sectionN(x) ?? sectionS(x)!;
    const f = actSO2(s, b);
    const vx = v(x);
    const xi = components(f, vx);
    setArrow(a1, x, f.u1.map((c) => c * 0.35));
    setArrow(a2, x, f.u2.map((c) => c * 0.35));
    const n = Math.hypot(...vx);
    setArrow(av, x, iota(f, xi).map((c) => (c * 0.5) / Math.max(n, 1e-9)));
    const nN = sectionN(x);
    const nS = sectionS(x);
    const xiN = nN ? components(nN, vx) : null;
    const xiS = nS ? components(nS, vx) : null;
    draw2D(xi, xiN, xiS, b);
    const back = iota(f, xi);
    hudBig.textContent = `|ι_f(ξ) − v(x)| = ${Math.hypot(back[0] - vx[0], back[1] - vx[1], back[2] - vx[2]).toExponential(1)}`;
    const rho = transitionNS(x);
    hudSmall.textContent = rho === null ? 'x is a pole: one chart only' : `ξ_N = b(ρ_NS) ξ_S with ρ_NS(x) = ${(((rho % TAU) + TAU) % TAU / Math.PI).toFixed(2)}π`;
  }

  onTap(scene, sphere, (pt) => {
    const r = Math.hypot(pt.x, pt.y, pt.z);
    x = [pt.x / r, pt.y / r, pt.z / r];
    update();
  });
  fieldSel.addEventListener('change', () => {
    drawField();
    update();
  });
  beta.addEventListener('input', update);
  const ro = new ResizeObserver(update);
  ro.observe(paneR);
  drawField();
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
