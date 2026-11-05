/**
 * Station 3.3a — principal bundles over spheres by clutching (Thm. 3.3.1,
 * Cor. 3.3.4, 3.3.5; Ex. 3.4.13).
 *
 * Left: S² as two trivial hemispheres glued along the equator by g : S¹ → U(1),
 * the equator coloured by the phase of g. Right: the clutching curve in C,
 * with U(1) as the unit circle. Readouts: winding, the Chern number from the
 * curvature of a connection on E_g, and the degree of the analogous SU(2)
 * clutching map S³ → SU(2) for a bundle over S⁴.
 */
import * as THREE from 'three';
import { chernNumber, clutchingCurve, minModulus, su2Clutching, su2Degree, winding } from '../math/clutching';
import { EXPLAINERS } from '../book/explainers';
import { explainer } from '../latex';
import { createScenePane, el, phaseColor } from './three-helpers';

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

const B: [number, number] = [0.6, 0.8];

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const nSel = document.createElement('select');
  nSel.innerHTML = [-2, -1, 0, 1, 2, 3].map((n) => `<option value="${n}" ${n === 1 ? 'selected' : ''}>n = ${n}</option>`).join('');
  const [la, aS] = slider('wiggle inside the group', 0, 3, 1.2);
  const [le, eS] = slider('push off the group ε', 0, 1.6, 0);
  controls.append(nSel, la, le);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'S² = two hemispheres glued along the equator by g'));
  paneR.appendChild(el('div', 'pane-label', 'the clutching curve in C; dashed: U(1)'));
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  paneR.appendChild(canvas);
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  const hudSU2 = el('div', 'small readout');
  hud.append(hudBig, hudSmall, hudSU2);
  paneR.appendChild(hud);
  container.append(controls, panes, explainer(EXPLAINERS['3.3a']));

  const scene = createScenePane(paneL, { cameraPos: [2.2, -2.4, 1.4], up: [0, 0, 1] });
  const geo = new THREE.SphereGeometry(1, 128, 64);
  geo.rotateX(Math.PI / 2);
  const cols = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  scene.scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })));

  const params = () => ({ n: parseInt(nSel.value, 10), A: parseFloat(aS.value), eps: parseFloat(eS.value) });

  function paintSphere(): void {
    const { n, A, eps } = params();
    const g = clutchingCurve(n, A, 3, eps, B);
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const z = pos.getZ(k);
      const f = Math.atan2(pos.getY(k), pos.getX(k));
      if (Math.abs(z) < 0.18) {
        const v = g.c(f);
        c.copy(phaseColor(Math.atan2(v[1], v[0])));
        // dim where the curve comes close to 0 (the phase is about to be undefined)
        c.multiplyScalar(Math.min(1, 0.3 + Math.hypot(...v)));
      } else c.set(z > 0 ? 0x2a3a5c : 0x5c3a2a);
      cols.set([c.r, c.g, c.b], 3 * k);
    }
    geo.attributes.color.needsUpdate = true;
  }

  function drawCurve(): void {
    const { n, A, eps } = params();
    const g = clutchingCurve(n, A, 3, eps, B);
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
    const s = Math.min(W * 0.5, H - 90) / 5.2;
    const cx = W * 0.3;
    const cy = H / 2 + 40;
    ctx.strokeStyle = '#3a4560';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, s, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 2.4 * s, cy);
    ctx.lineTo(cx + 2.4 * s, cy);
    ctx.moveTo(cx, cy - 2.4 * s);
    ctx.lineTo(cx, cy + 2.4 * s);
    ctx.stroke();
    const N = 600;
    for (let k = 0; k < N; k++) {
      const f0 = (2 * Math.PI * k) / N;
      const f1 = (2 * Math.PI * (k + 1)) / N;
      const a = g.c(f0);
      const b = g.c(f1);
      ctx.strokeStyle = `#${phaseColor(f0).getHexString()}`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + s * a[0], cy - s * a[1]);
      ctx.lineTo(cx + s * b[0], cy - s * b[1]);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fill();
    // inset: the unwrapped phase of g against φ — rises by 2πn, wiggles with the homotopy
    const gx0 = W * 0.58;
    const gw = W * 0.38;
    const gy0 = cy + 1.2 * s;
    const gh = 2.4 * s;
    ctx.strokeStyle = '#2a3247';
    ctx.strokeRect(gx0, gy0 - gh, gw, gh);
    let acc = Math.atan2(g.c(0)[1], g.c(0)[0]);
    let prev = acc;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 400; k++) {
      const v = g.c((2 * Math.PI * k) / 400);
      const a = Math.atan2(v[1], v[0]);
      let d = a - prev;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (k) acc += d;
      prev = a;
      pts.push([k / 400, acc / (2 * Math.PI)]);
    }
    const span = Math.max(1.2, ...pts.map((q) => Math.abs(q[1])));
    ctx.strokeStyle = '#e6e9ef';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    pts.forEach(([x, y], k) => {
      const X = gx0 + x * gw;
      const Y = gy0 - gh / 2 - (y / span) * (gh / 2);
      if (k) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    });
    ctx.stroke();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('arg g(φ)/2π, unwrapped, φ from 0 to 2π', gx0, gy0 + 16);
    ctx.fillText('0', cx + 8, cy + 16);
    ctx.fillText('colour = the angle φ along the equator', 12, H - 12);
    let near = Infinity;
    for (let k = 0; k < 2000; k++) near = Math.min(near, Math.hypot(...g.c((2 * Math.PI * k) / 2000)));
    const wd = winding(g.c);
    hudBig.textContent = `winding = ${wd.toFixed(3)}`;
    hudSmall.textContent =
      near < 1e-3
        ? 'the curve passes through 0: g = c/|c| is undefined, and this is no longer a bundle'
        : `Chern number (i/2π)∫𝓕 = ${chernNumber(g.w).toFixed(6)} · closest approach to 0: ${near.toFixed(3)}`;
  }

  let su2Timer = 0;
  function su2(): void {
    const { n, eps } = params();
    hudSU2.textContent = 'SU(2) over S⁴: computing the degree of q ↦ normalize(qⁿ + εp)…';
    window.clearTimeout(su2Timer);
    su2Timer = window.setTimeout(() => {
      const d = su2Degree(su2Clutching(n, eps), 32, 32, 64);
      const m = minModulus(n, eps);
      hudSU2.textContent = `SU(2) over S⁴: degree of q ↦ normalize(qⁿ + εp) = ${d.toFixed(4)} · min |qⁿ + εp| ≈ ${m.toFixed(3)}${m < 0.15 ? ' (near-singular: the quadrature is unreliable here)' : ''}`;
    }, 250);
  }

  function update(): void {
    paintSphere();
    drawCurve();
  }
  nSel.addEventListener('change', () => {
    update();
    su2();
  });
  aS.addEventListener('input', update);
  eS.addEventListener('input', update);
  eS.addEventListener('change', su2);
  const ro = new ResizeObserver(drawCurve);
  ro.observe(paneR);
  update();
  su2();

  return () => {
    window.clearTimeout(su2Timer);
    ro.disconnect();
    scene.dispose();
  };
}
