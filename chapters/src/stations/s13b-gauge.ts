/**
 * Station 1.3b — local representatives and gauge transformations
 * ((1.3.11), Rem. 1.3.10, Prop. 1.3.11, Cor. 1.3.12; (1.3.14), (1.3.15)).
 *
 * Left: the potential 𝒜_i = s_i^*ω_c on S² as its dual vector field, for a
 * gauge-transformed section s_i·e^{iλ}; it blows up at the excluded pole.
 * Right: (1/2πi)∮𝒜 around every latitude, computed numerically from the
 * gauged sections — the curves do not move under gauge changes, and the gap
 * between the two charts is the integer −1 = deg ρ12 (along increasing φ).
 */
import * as THREE from 'three';
import { fromPolar, type Vec3 } from '@rsvis/math';
import {
  gaugedSection,
  gaugeFunction,
  loopIntegralOverTwoPi,
  potentialVector,
  type LocalSection,
} from '../math/gauge';
import { captionBlock } from '../latex';
import { clearGroup, createScenePane, el, fibonacciSphere } from './three-helpers';

const TAU = 2 * Math.PI;

function slider(label: string, min: number, max: number, value: number, step = 0.01): [HTMLLabelElement, HTMLInputElement] {
  const l = el('label', '', label);
  const s = document.createElement('input');
  s.type = 'range';
  s.min = String(min);
  s.max = String(max);
  s.step = String(step);
  s.value = String(value);
  l.appendChild(s);
  return [l, s];
}

export function mount(container: HTMLElement): () => void {
  const controls = el('div', 'controls');
  const chartSel = document.createElement('select');
  chartSel.innerHTML =
    '<option value="1">𝒜₁ = s₁*ω_c on U₁</option><option value="2">𝒜₂ = s₂*ω_c on U₂</option><option value="d">𝒜₂ − 𝒜₁ = ρ₁₂*θ on U₁∩U₂</option>';
  const [l1, c1] = slider('gauge λ: x', -2, 2, 0);
  const [l2, c2] = slider('yz', -2, 2, 0);
  const [l3, c3] = slider('x²−y²', -2, 2, 0);
  const [lt, th0] = slider('loop θ₀', 0.15, Math.PI - 0.15, 1.2);
  const reset = el('button', '', 'λ = 0');
  controls.append(chartSel, l1, l2, l3, reset, lt);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Potential as a vector field on S² (length/colour ∝ |𝒜|)'));
  paneR.appendChild(el('div', 'pane-label', '(1/2πi)∮𝒜 around the latitude θ, both charts'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big readout');
  const hudSmall = el('div', 'small readout');
  hud.append(hudBig, hudSmall);
  paneR.appendChild(hud);
  const canvas = document.createElement('canvas');
  paneR.appendChild(canvas);

  const caption = captionBlock(
    'A local section $s$ pulls the connection form down to the base: $\\mathcal A = s^*\\omega$ (1.3.11), a ' +
      '$\\mathfrak u(1) = i\\mathbb R$-valued 1-form — the gauge potential. For the book\'s sections, ' +
      '$\\mathcal A_1 = \\tfrac i2(1-\\cos\\theta)\\,d\\varphi$ on $U_1$ and $\\mathcal A_2 = -\\tfrac i2(1+\\cos\\theta)\\,d\\varphi$ on $U_2$: ' +
      'each is smooth on its chart and blows up at the pole the chart omits. Nothing is lost: by Prop. 1.3.11, ' +
      '$\\omega = \\mathrm{Ad}_{\\kappa^{-1}}\\pi^*\\mathcal A + \\kappa^*\\theta$ (1.3.14) rebuilds $\\omega$ from $\\mathcal A$ (tested at random points). ' +
      'Changing the section by a gauge function, $s\\mapsto s\\,e^{i\\lambda}$, changes $\\mathcal A \\mapsto \\mathcal A + i\\,d\\lambda$ — the sliders ' +
      'reshape the field drastically — and two charts always differ by $\\mathcal A_2 = \\mathcal A_1 + \\rho_{12}^*\\theta$ (Cor. 1.3.12, (1.3.15)), ' +
      'here $\\rho_{12}^*\\theta = -i\\,d\\varphi$ before gauging. On the right, the loop integrals are recomputed from the ' +
      'gauged sections at every slider move and do not budge ($d\\lambda$ is exact); the two curves stay exactly $1$ apart, ' +
      'because $\\oint\\rho_{12}^*\\theta = 2\\pi i\\,\\deg\\rho_{12} = -2\\pi i$ along increasing $\\varphi$ — the integer of Station 1.1b, ' +
      'now read off from the connection. (Curvature and the first Chern number come in §1.4 and Ch. 4.)',
  );
  container.append(controls, panes, caption);

  const scene = createScenePane(paneL, { cameraPos: [2.6, -2.6, 1.6], up: [0, 0, 1] });
  scene.scene.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 32), new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 })),
  );
  const arrows = new THREE.Group();
  const loopGroup = new THREE.Group();
  scene.scene.add(arrows, loopGroup);
  const samples = fibonacciSphere(420);

  let curves: { th: number[]; I1: number[]; I2: number[] } = { th: [], I1: [], I2: [] };

  function sections(): { s1: LocalSection; s2: LocalSection } {
    const lam = gaugeFunction(parseFloat(c1.value), parseFloat(c2.value), parseFloat(c3.value));
    // the gauge acts on the displayed chart; for the difference view, on chart 1 only
    const mode = chartSel.value;
    return {
      s1: gaugedSection(1, mode === '2' ? () => 0 : lam),
      s2: gaugedSection(2, mode === '2' ? lam : () => 0),
    };
  }

  function drawArrows(): void {
    clearGroup(arrows);
    const { s1, s2 } = sections();
    const mode = chartSel.value;
    const col = new THREE.Color();
    for (const m of samples) {
      const th = Math.acos(m[2]);
      if ((mode !== '2' && th > Math.PI - 0.12) || (mode !== '1' && th < 0.12)) continue;
      let a: Vec3;
      if (mode === '1') a = potentialVector(s1, m);
      else if (mode === '2') a = potentialVector(s2, m);
      else {
        const p = potentialVector(s1, m);
        const q = potentialVector(s2, m);
        a = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      }
      const mag = Math.hypot(...a);
      if (mag < 1e-6) continue;
      const len = 0.06 + 0.22 * Math.tanh(mag);
      col.setHSL(0.6 - 0.6 * Math.tanh(mag / 2), 0.8, 0.6);
      const arr = new THREE.ArrowHelper(
        new THREE.Vector3(...a).normalize(),
        new THREE.Vector3(m[0], m[1], m[2]).multiplyScalar(1.005),
        len,
        col.getHex(),
        0.35 * len,
        0.22 * len,
      );
      arrows.add(arr);
    }
  }

  function drawLoop(): void {
    clearGroup(loopGroup);
    const t = parseFloat(th0.value);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 128; k++) {
      const q = fromPolar(t, (TAU * k) / 128);
      pts.push(new THREE.Vector3(q[0], q[1], q[2]).multiplyScalar(1.01));
    }
    loopGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xf0a35e })));
  }

  function computeCurves(): void {
    const { s1, s2 } = sections();
    const th: number[] = [];
    const I1: number[] = [];
    const I2: number[] = [];
    for (let k = 1; k < 48; k++) {
      const t = (Math.PI * k) / 48;
      th.push(t);
      I1.push(loopIntegralOverTwoPi(s1, t, 128));
      I2.push(loopIntegralOverTwoPi(s2, t, 128));
    }
    curves = { th, I1, I2 };
  }

  function drawPlot(): void {
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
    const pad = { l: 46, r: 18, t: 84, b: 34 };
    const X = (t: number) => pad.l + (t / Math.PI) * (W - pad.l - pad.r);
    const Y = (v: number) => pad.t + ((1.1 - v) / 2.2) * (H - pad.t - pad.b); // v ∈ [−1.1, 1.1]
    ctx.strokeStyle = '#232a3b';
    ctx.lineWidth = 1;
    for (const v of [-1, -0.5, 0, 0.5, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(v));
      ctx.lineTo(X(Math.PI), Y(v));
      ctx.stroke();
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px system-ui, sans-serif';
    for (const v of [-1, 0, 1]) ctx.fillText(String(v), 14, Y(v) + 4);
    ctx.fillText('θ = 0', X(0) - 4, H - 12);
    ctx.fillText('π', X(Math.PI) - 6, H - 12);
    // analytic references (dashed)
    ctx.setLineDash([4, 4]);
    for (const [f, c] of [
      [(t: number) => 0.5 * (1 - Math.cos(t)), '#6ea8fe'],
      [(t: number) => -0.5 * (1 + Math.cos(t)), '#f0a35e'],
    ] as const) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      for (let k = 0; k <= 100; k++) {
        const t = (Math.PI * k) / 100;
        if (k === 0) ctx.moveTo(X(t), Y(f(t)));
        else ctx.lineTo(X(t), Y(f(t)));
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // numerical values from the gauged sections (dots)
    curves.th.forEach((t, k) => {
      ctx.fillStyle = '#6ea8fe';
      ctx.beginPath();
      ctx.arc(X(t), Y(curves.I1[k]), 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f0a35e';
      ctx.beginPath();
      ctx.arc(X(t), Y(curves.I2[k]), 3, 0, TAU);
      ctx.fill();
    });
    const t0 = parseFloat(th0.value);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(X(t0), Y(1.1));
    ctx.lineTo(X(t0), Y(-1.1));
    ctx.stroke();
    ctx.fillStyle = '#6ea8fe';
    ctx.fillText('chart 1', X(Math.PI) - 60, Y(0.95));
    ctx.fillStyle = '#f0a35e';
    ctx.fillText('chart 2', X(0) + 6, Y(-0.95) + 14);
  }

  function updateHud(): void {
    const t = parseFloat(th0.value);
    const { s1, s2 } = sections();
    const I1 = loopIntegralOverTwoPi(s1, t);
    const I2 = loopIntegralOverTwoPi(s2, t);
    hudBig.textContent = `∮𝒜₂ − ∮𝒜₁ = ${(I2 - I1).toFixed(6)} · 2πi`;
    hudSmall.textContent = `at θ₀: (1/2πi)∮𝒜₁ = ${I1.toFixed(6)}, (1/2πi)∮𝒜₂ = ${I2.toFixed(6)}`;
  }

  function full(): void {
    drawArrows();
    drawLoop();
    computeCurves();
    drawPlot();
    updateHud();
  }
  for (const s of [c1, c2, c3]) s.addEventListener('input', full);
  chartSel.addEventListener('change', full);
  reset.addEventListener('click', () => {
    for (const s of [c1, c2, c3]) s.value = '0';
    full();
  });
  th0.addEventListener('input', () => {
    drawLoop();
    drawPlot();
    updateHud();
  });
  const ro = new ResizeObserver(drawPlot);
  ro.observe(paneR);
  full();

  return () => {
    ro.disconnect();
    scene.dispose();
  };
}
