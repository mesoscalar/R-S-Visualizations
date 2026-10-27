/**
 * Station 1.3c — every principal bundle admits a connection, and connections
 * form an affine space (Prop. 1.3.7, Rem. 1.3.8; (1.3.8)).
 *
 * Left: the torus of Hopf fibres over a latitude with the horizontal curves of
 * ω_t = (1 − t) ω_c + t ω_PU. Right: the slope a_t(θ) = ω_t(∂_φ) of those
 * curves for every latitude — the connections differ, the endpoints do not.
 */
import * as THREE from 'three';
import { actU1, fromPolar, section1, stereographic, type Vec3 } from '@rsvis/math';
import { partition, torusSlope } from '../math/affine-connections';
import { captionBlock } from '../latex';
import { ball, fibreMesh, setPos } from './hopf-draw';
import { clearGroup, coloredTube, createScenePane, el } from './three-helpers';

const TAU = 2 * Math.PI;

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
  const [lt, tS] = slider('t: ω_c → ω_PU', 0, 1, 1);
  const [lth, thS] = slider('latitude θ₀', 0.25, 2.6, 1.3);
  const [llo, loS] = slider('cutoffs: lo', -0.95, 0.5, -0.6);
  const [lhi, hiS] = slider('hi', -0.5, 0.95, 0.2);
  controls.append(lt, lth, llo, lhi);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Horizontal curves of ω_t on the torus over θ₀ (orange: one curve, start ○ / end ●)'));
  paneR.appendChild(el('div', 'pane-label', 'slope a_t(θ) = ω_t(∂_φ): miss after one turn = −2π a_t'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);
  const canvas = document.createElement('canvas');
  paneR.appendChild(canvas);

  const caption = captionBlock(
    'Prop. 1.3.7 builds a connection on any principal bundle by gluing: each trivialization $\\chi_i$ gives the flat connection whose ' +
      'horizontal spaces are tangent to $\\chi_i^{-1}(U_i\\times\\{1\\})$ and its translates (1.3.8) — here $\\tilde\\omega_i = \\kappa_i^*\\theta$ — ' +
      'and a partition of unity $f_1 + f_2 = 1$, $\\mathrm{supp}\\,f_i\\subset U_i$, glues them to $\\omega_{PU} = f_1\\tilde\\omega_1 + f_2\\tilde\\omega_2$. ' +
      'The proof only needs conditions 2 and 3 of Prop. 1.3.5, which survive convex combinations; so does the whole segment ' +
      '$\\omega_t = (1-t)\\,\\omega_c + t\\,\\omega_{PU}$, and $\\omega_{PU}-\\omega_c = \\pi^*\\beta$ is horizontal and invariant — connections form an ' +
      'affine space over $\\Omega^1_{\\mathrm{Ad},\\mathrm{hor}}(P,\\mathfrak g)$ (Rem. 1.3.8), which for $U(1)$ is $\\Omega^1(S^2, i\\mathbb R)$. ' +
      'On the torus over a latitude the horizontal curves of $\\omega_{PU}$ are flat ($\\alpha$ = const) where $f_1 = 1$, twist by a full turn where $f_2 = 1$, ' +
      'and interpolate in between; move the cutoffs to see the twist concentrate. The right panel shows why something is conserved: ' +
      'every curve $a_t(\\theta)$ runs from 0 at the north pole to 1 at the south pole, whatever $t$ and the cutoffs. That fixed total twist is the ' +
      'degree of $\\rho_{12}$ (Station 1.1b) — curvature (§1.4) and the Chern number (Ch. 4) will say it as $\\frac{i}{2\\pi}\\int F = \\pm1$.',
  );
  container.append(controls, panes, caption);

  const scene = createScenePane(paneL, { cameraPos: [3.6, -4.0, 3.0], up: [0, 0, 1], maxDistance: 40 });
  const torus = new THREE.Group();
  scene.scene.add(torus);

  function params(): { t: number; th: number; lo: number; hi: number } {
    let lo = parseFloat(loS.value);
    let hi = parseFloat(hiS.value);
    if (hi - lo < 0.1) {
      // keep lo < hi so the partition is well defined
      if (document.activeElement === loS) lo = hi - 0.1;
      else hi = lo + 0.1;
      loS.value = String(lo);
      hiS.value = String(hi);
    }
    return { t: parseFloat(tS.value), th: parseFloat(thS.value), lo, hi };
  }

  function draw3D(): void {
    const { t, th, lo, hi } = params();
    clearGroup(torus);
    for (let k = 0; k < 16; k++) {
      torus.add(fibreMesh(section1(fromPolar(th, (TAU * k) / 16))!, null, 0.008, new THREE.Color(0x3a4560)));
    }
    const slope = -torusSlope(t, th, lo, hi);
    for (let k = 0; k < 10; k++) {
      const a0 = (TAU * k) / 10;
      const pts: Vec3[] = [];
      for (let i = 0; i <= 240; i++) {
        const ph = (TAU * i) / 240;
        pts.push(stereographic(actU1(section1(fromPolar(th, ph))!, a0 + slope * ph)));
      }
      const col = new THREE.Color(k === 0 ? 0xf0a35e : 0x69d58c);
      torus.add(coloredTube(pts, pts.map(() => col), k === 0 ? 0.03 : 0.014, false));
    }
    const s = ball(0.07, 0xffffff);
    setPos(s, stereographic(section1(fromPolar(th, 0))!));
    const e = ball(0.07, 0xf0a35e);
    setPos(e, stereographic(actU1(section1(fromPolar(th, TAU))!, slope * TAU)));
    torus.add(s, e);
    hudBig.textContent = `a_t(θ₀) = ${(-slope).toFixed(4)}`;
    hudSmall.textContent = `miss after one turn: −2π a_t = ${(TAU * slope).toFixed(4)}`;
  }

  function drawPlot(): void {
    const { t, th, lo, hi } = params();
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
    const pad = { l: 46, r: 18, t: 50, b: 34 };
    const X = (q: number) => pad.l + (q / Math.PI) * (W - pad.l - pad.r);
    const Y = (v: number) => pad.t + ((1.1 - v) / 1.2) * (H - pad.t - pad.b);
    ctx.strokeStyle = '#232a3b';
    for (const v of [0, 0.5, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(v));
      ctx.lineTo(X(Math.PI), Y(v));
      ctx.stroke();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    for (const v of [0, 1]) ctx.fillText(String(v), 18, Y(v) + 4);
    ctx.fillText('north θ = 0', X(0), H - 12);
    ctx.fillText('south π', X(Math.PI) - 48, H - 12);
    const curve = (f: (q: number) => number, color: string, width: number, dash: number[] = []) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const q = (Math.PI * i) / 200;
        if (i === 0) ctx.moveTo(X(q), Y(f(q)));
        else ctx.lineTo(X(q), Y(f(q)));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const { f2 } = partition(lo, hi);
    curve((q) => f2(Math.cos(q)), '#e07ad8', 1, [4, 4]);
    for (const s of [0, 0.25, 0.5, 0.75, 1]) curve((q) => torusSlope(s, q, lo, hi), '#3a4560', 1.2);
    curve((q) => torusSlope(t, q, lo, hi), '#69d58c', 2.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(th), Y(1.1));
    ctx.lineTo(X(th), Y(-0.1));
    ctx.stroke();
    ctx.fillStyle = '#e07ad8';
    ctx.fillText('f₂ (dashed)', X(Math.PI) - 80, Y(0.55));
    ctx.fillStyle = '#69d58c';
    ctx.fillText(`a_t, t = ${t.toFixed(2)}`, X(0) + 8, Y(1.02));
  }

  function update(): void {
    draw3D();
    drawPlot();
  }
  for (const s of [tS, thS, loS, hiS]) s.addEventListener('input', update);
  const ro = new ResizeObserver(drawPlot);
  ro.observe(paneR);
  update();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
