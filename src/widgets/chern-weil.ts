/**
 * Widget 2 — Chern–Weil on the monopole bundle (renderer).
 *
 * Sphere heat-mapped by the curvature area density ρ of the perturbed
 * connection A_± + Σ λ_i a_i; sliders slosh the density around dramatically
 * while the readout c₁ = (1/2π)∫F, recomputed live by quadrature, stays
 * pinned at the integer n.
 */
import * as THREE from 'three';
import { chernNumber, curvatureAreaDensity, PERTURBATIONS } from '../math/monopole';
import { captionBlock, renderMath } from '../latex';
import { createScenePane, el } from './three-helpers';

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controlsBar = el('div', 'controls');

  const nLabel = el('label', '', 'charge n');
  const nSelect = document.createElement('select');
  for (let n = -2; n <= 3; n++) {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    if (n === 1) opt.selected = true;
    nSelect.appendChild(opt);
  }
  nLabel.appendChild(nSelect);
  controlsBar.appendChild(nLabel);

  const lambdas = PERTURBATIONS.map(() => 0);
  const sliders: HTMLInputElement[] = [];
  PERTURBATIONS.forEach((p, i) => {
    const label = el('label');
    const tex = el('span');
    renderMath(tex, `$\\lambda_{${i + 1}}\\,(${p.latex.replace(/^a_\d+ = /, '')})$`);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-2';
    slider.max = '2';
    slider.step = '0.01';
    slider.value = '0';
    slider.addEventListener('input', () => {
      lambdas[i] = parseFloat(slider.value);
      update();
    });
    label.append(tex, slider);
    controlsBar.appendChild(label);
    sliders.push(slider);
  });

  const resetBtn = el('button', '', 'reset a = 0');
  resetBtn.addEventListener('click', () => {
    sliders.forEach((s, i) => {
      s.value = '0';
      lambdas[i] = 0;
    });
    update();
  });
  controlsBar.appendChild(resetBtn);

  // ---------- panes ----------
  const panes = el('div', 'panes');
  const pane = el('div', 'pane');
  panes.appendChild(pane);
  pane.appendChild(
    el('div', 'pane-label', 'Curvature density ρ of F + da  (orange +, blue −)'),
  );
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big', '');
  const hudSmall = el('div', 'small', '');
  hud.append(hudBig, hudSmall);
  pane.appendChild(hud);

  const caption = captionBlock(
    'Charge-$n$ monopole connection in two patches, $A_\\pm = \\tfrac{n}{2}(\\pm 1 - ' +
      '\\cos\\theta)\\,d\\phi$, with curvature $F = \\tfrac{n}{2}\\sin\\theta\\,d\\theta\\wedge d\\phi$. ' +
      'The sliders add a global 1-form: $A \\mapsto A + a$, $F \\mapsto F + da$ with ' +
      '$a = \\sum_i \\lambda_i\\, u_i\\,dv_i$ built from global functions on $S^2$. The density sloshes, ' +
      'but $\\int_{S^2} da = 0$ by Stokes, so $c_1 = \\tfrac{1}{2\\pi}\\int_{S^2} F = n$: ' +
      'topology is the conserved quantity of this game. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  // ---------- 3D ----------
  const pane3d = createScenePane(pane, { cameraPos: [0, 1.4, 3.6] });
  const geo = new THREE.SphereGeometry(1, 160, 80);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05 });
  pane3d.scene.add(new THREE.Mesh(geo, mat));

  const neg = new THREE.Color(0x4a7bd0);
  const mid = new THREE.Color(0x141927);
  const posC = new THREE.Color(0xf0a35e);
  const tmp = new THREE.Color();

  function paint(n: number): void {
    const pos = geo.attributes.position;
    const col = geo.attributes.color as THREE.BufferAttribute;
    // normalise by the max |ρ| over a coarse scan so the map always uses full range
    let maxAbs = 1e-9;
    for (let a = 0; a <= 24; a++) {
      for (let b = 0; b < 48; b++) {
        const v = Math.abs(curvatureAreaDensity(n, lambdas, (Math.PI * a) / 24, (2 * Math.PI * b) / 48));
        if (v > maxAbs) maxAbs = v;
      }
    }
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const theta = Math.acos(Math.max(-1, Math.min(1, y))); // y-up
      const phi = Math.atan2(-z, x);
      const rho = curvatureAreaDensity(n, lambdas, theta, phi);
      const t = Math.max(-1, Math.min(1, rho / maxAbs));
      if (t >= 0) tmp.copy(mid).lerp(posC, t);
      else tmp.copy(mid).lerp(neg, -t);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    col.needsUpdate = true;
  }

  function update(): void {
    const n = parseInt(nSelect.value, 10);
    // 48x96 quadrature is exact-to-roundoff for these trig-polynomial densities
    // and costs ~25k evaluations — fine on every slider input.
    const c1 = chernNumber(n, lambdas, 48, 96);
    hudBig.textContent = `c₁ = ${c1.toFixed(8)}`;
    hudSmall.textContent = `pinned at n = ${n} while the density moves`;
    paint(n);
  }

  nSelect.addEventListener('change', update);
  update();

  return () => pane3d.dispose();
}
