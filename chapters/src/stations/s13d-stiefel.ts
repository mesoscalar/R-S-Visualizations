/**
 * Station 1.3d — the canonical connection of the Stiefel bundle
 * (Ex. 1.3.19, Ex. 1.3.20, Rem. 1.3.21; (1.3.17)–(1.3.19)).
 *
 * The oriented Stiefel bundle S_R(2,3) → G̃_R(2,3) ≅ S² is O⁺(S²) ≅ SO(3)
 * (Station 1.1c) with a = [u1 | u2 | x]. A frame is carried around a latitude:
 * horizontally for ω_c = uᵀdu (no spin), plus an adjustable spin. The panel
 * on the right shows θ(ȧ) = aᵀȧ ∈ so(3) split as 𝔥 ⊕ 𝔪: the 𝔥-block is ω_c.
 */
import * as THREE from 'three';
import { actSO2, dot3, frameAngle, sectionN, transportFrame, type Frame, type Vec3 } from '@rsvis/math';
import { captionBlock } from '../latex';
import { ball, setPos } from './hopf-draw';
import { createScenePane, el, makeArrow, setArrow } from './three-helpers';

const TAU = 2 * Math.PI;
const NSTEP = 720;

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

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const [lTh, th] = slider('latitude θ₀', 0.2, 2.9, 1.0);
  const [lT, tt] = slider('position t', 0, TAU, 1.5);
  const [lS, sp] = slider('extra spin', -1.5, 1.5, 0);
  const play = el('button', '', '▶ go around');
  controls.append(lTh, lT, lS, play);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Frame carried around a latitude (orange u₁, cyan u₂); ghost: the start frame'));
  paneR.appendChild(el('div', 'pane-label', 'θ(ȧ) = aᵀȧ ∈ so(3) = 𝔥 ⊕ 𝔪 at the current point'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);
  const matBox = el('div', 'matbox');
  paneR.appendChild(matBox);

  const caption = captionBlock(
    'For a reductive homogeneous space $G\\to G/H$, $\\mathfrak g = \\mathfrak h\\oplus\\mathfrak m$ with $\\mathrm{Ad}(H)\\mathfrak m\\subset\\mathfrak m$, the ' +
      'left-invariant distribution $L_a(\\mathfrak m)$ is a connection with form $\\omega_0 = \\mathrm{pr}_{\\mathfrak h}\\circ\\theta$, ' +
      '$\\theta = a^{-1}da$ (Ex. 1.3.19). For the Stiefel bundle this is the canonical connection $\\omega_c = \\mathrm{pr}_{\\mathfrak u(k)}\\circ\\theta$, ' +
      'which in matrix terms is $\\omega_c = u^\\dagger du$ (Ex. 1.3.20, (1.3.19)). Here $k = 2$, $n = 3$, oriented: $a = [u_1\\,|\\,u_2\\,|\\,x]\\in SO(3)$ and ' +
      'the base is the sphere of unit normals — the frame bundle of Station 1.1c again. The right panel shows $\\theta(\\dot a) = a^{\\mathsf T}\\dot a$: ' +
      'its upper-left $2\\times 2$ block is $\\omega_c(\\dot a)$, the rest is the $\\mathfrak m$-part $\\left[\\begin{smallmatrix}0&-T^{\\mathsf T}\\\\T&0\\end{smallmatrix}\\right]$. ' +
      'Horizontal motion (spin 0) has $\\omega_c = 0$ and only $T\\neq0$, as Rem. 1.3.21 says at $p_0$ — the book prints $T$ as ' +
      '"$((n-k)\\times n)$", but the block shape forces $(n-k)\\times k$. Horizontal for $\\omega_c$ means "the frame does not spin about the normal": ' +
      'this is Levi-Civita transport on $S^2$ (Ch. 2), and after one turn the frame comes back rotated by $2\\pi(1-\\cos\\theta_0)$, the enclosed ' +
      'area — holonomy, previewing §1.7. The connection is invariant under left translations of $SO(3)$ (tested).',
  );
  container.append(controls, panes, caption);

  const scene = createScenePane(paneL, { cameraPos: [2.4, -2.6, 1.8], up: [0, 0, 1] });
  scene.scene.add(
    new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 })),
  );
  const loopLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8a93a6 }));
  scene.scene.add(loopLine);
  const xMark = ball(0.035, 0xffffff);
  const a1 = makeArrow(0xf0a35e);
  const a2 = makeArrow(0x6ec6fe);
  const g1 = makeArrow(0x7a5a3a);
  const g2 = makeArrow(0x3a6680);
  scene.scene.add(xMark, a1, a2, g1, g2);

  let path: Frame[] = [];
  let theta0 = 1.0;
  const xOf = (t: number): Vec3 => [Math.sin(theta0) * Math.cos(t), Math.sin(theta0) * Math.sin(t), Math.cos(theta0)];
  const xDot = (t: number): Vec3 => [-Math.sin(theta0) * Math.sin(t), Math.sin(theta0) * Math.cos(t), 0];

  function rebuild(): void {
    theta0 = parseFloat(th.value);
    path = transportFrame(xOf, xDot, sectionN(xOf(0))!, 0, TAU, NSTEP);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 128; k++) pts.push(new THREE.Vector3(...xOf((TAU * k) / 128)).multiplyScalar(1.005));
    loopLine.geometry.dispose();
    loopLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const f0 = path[0];
    setArrow(g1, f0.x, f0.u1.map((c) => c * 0.35));
    setArrow(g2, f0.x, f0.u2.map((c) => c * 0.35));
  }

  function update(): void {
    const t = parseFloat(tt.value);
    const spin = parseFloat(sp.value);
    const k = Math.min(NSTEP, Math.round((t / TAU) * NSTEP));
    const tk = (TAU * k) / NSTEP;
    const g = path[k];
    const f = actSO2(g, spin * tk);
    setPos(xMark, f.x);
    setArrow(a1, f.x, f.u1.map((c) => c * 0.35));
    setArrow(a2, f.x, f.u2.map((c) => c * 0.35));

    // ȧ exactly: ġ_i = −(g_i·ẋ)x for the horizontal frame, then the spin b(spin·t)
    const xd = xDot(tk);
    const gd1 = g.x.map((c) => -dot3(g.u1, xd) * c) as Vec3;
    const gd2 = g.x.map((c) => -dot3(g.u2, xd) * c) as Vec3;
    const c = Math.cos(spin * tk);
    const s = Math.sin(spin * tk);
    const ud1 = [0, 1, 2].map((i) => c * gd1[i] + s * gd2[i] + spin * f.u2[i]) as Vec3;
    const ud2 = [0, 1, 2].map((i) => -s * gd1[i] + c * gd2[i] - spin * f.u1[i]) as Vec3;
    const a = [f.u1, f.u2, f.x];
    const ad = [ud1, ud2, xd];
    // X_rc = a_r · ȧ_c
    const X = [0, 1, 2].map((r) => [0, 1, 2].map((cc) => dot3(a[r], ad[cc])));
    const cell = (r: number, cc: number) => {
      const h = r < 2 && cc < 2;
      const v = X[r][cc];
      return `<td class="${h ? 'hblk' : 'mblk'}">${(Math.abs(v) < 5e-13 ? 0 : v).toFixed(3)}</td>`;
    };
    matBox.innerHTML =
      `<table class="mat">${[0, 1, 2].map((r) => `<tr>${[0, 1, 2].map((cc) => cell(r, cc)).join('')}</tr>`).join('')}</table>` +
      `<div class="matlegend"><span class="hblk">■</span> 𝔥 = so(2): ω_c(ȧ) = u₂·u̇₁ = ${X[1][0].toFixed(3)}` +
      `<br><span class="mblk">■</span> 𝔪: T = (x·u̇₁, x·u̇₂) = (${X[2][0].toFixed(3)}, ${X[2][1].toFixed(3)})</div>`;

    const end = path[NSTEP];
    const hol = frameAngle(path[0], end);
    const area = TAU * (1 - Math.cos(theta0));
    hudBig.textContent = `turn after one loop: ${(((hol % TAU) + TAU) % TAU).toFixed(4)}`;
    hudSmall.textContent = `2π(1 − cos θ₀) mod 2π = ${(area % TAU).toFixed(4)} (horizontal transport, spin 0)`;
  }

  let anim = 0;
  play.addEventListener('click', () => {
    cancelAnimationFrame(anim);
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(TAU, ((performance.now() - t0) / 6000) * TAU);
      tt.value = String(t);
      update();
      if (t < TAU) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  });
  th.addEventListener('input', () => {
    rebuild();
    update();
  });
  tt.addEventListener('input', update);
  sp.addEventListener('input', update);
  rebuild();
  update();

  return () => {
    cancelAnimationFrame(anim);
    scene.dispose();
  };
}
