/**
 * Widget 6 — BPST instanton density (renderer).
 *
 * 3D slice x₄ = const of the normalised topological charge density, rendered
 * as an additive point cloud (opacity ∝ density). Sliders: scale ρ (the
 * noncompact moduli direction — watch the squeeze) and the slice position x₄.
 * The charge readout, recomputed live by radial quadrature, never leaves 1.
 */
import * as THREE from 'three';
import { sliceGrid, slicePeak, totalCharge, type Vec4 } from '../math/instanton';
import { captionBlock } from '../latex';
import { createScenePane, el } from './three-helpers';

const GRID = 31; // odd: grid contains the centre
const HALF = 1.9;

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controlsBar = el('div', 'controls');
  const rhoLabel = el('label', '', 'scale ρ');
  const rhoSlider = document.createElement('input');
  rhoSlider.type = 'range';
  rhoSlider.min = '0.25';
  rhoSlider.max = '1.5';
  rhoSlider.step = '0.01';
  rhoSlider.value = '0.8';
  rhoLabel.appendChild(rhoSlider);
  const x4Label = el('label', '', 'slice x₄');
  const x4Slider = document.createElement('input');
  x4Slider.type = 'range';
  x4Slider.min = '-1.5';
  x4Slider.max = '1.5';
  x4Slider.step = '0.01';
  x4Slider.value = '0';
  x4Label.appendChild(x4Slider);
  controlsBar.append(rhoLabel, x4Label);

  // ---------- pane ----------
  const panes = el('div', 'panes');
  const pane = el('div', 'pane');
  panes.appendChild(pane);
  pane.appendChild(el('div', 'pane-label', 'Charge density on the slice x₄ = const'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big', '');
  const hudSmall = el('div', 'small', '');
  hud.append(hudBig, hudSmall);
  pane.appendChild(hud);

  const caption = captionBlock(
    'BPST one-instanton: normalised topological charge density ' +
      '$q(x) = \\tfrac{6}{\\pi^2}\\,\\rho^4/(|x-a|^2+\\rho^2)^4$ with ' +
      '$\\int_{\\mathbb{R}^4} q\\,d^4x = 1$ for every scale $\\rho$ ' +
      '(analytic check: $\\int d^4x\\,(|x|^2+\\rho^2)^{-4} = \\pi^2/6\\rho^4$). Shrink $\\rho$: the ' +
      'density spikes like $\\rho^{-4}$ yet the charge readout never moves — the noncompact ' +
      'direction of the instanton moduli space. The same integer will be the second Chern ' +
      'number of the gauge field in Ch. 6. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  const scenePane = createScenePane(pane, { cameraPos: [2.8, 2.2, 3.6], maxDistance: 20 });

  // ---------- point cloud ----------
  const centre: Vec4 = [0, 0, 0, 0];
  const count = GRID * GRID * GRID;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  {
    let idx = 0;
    const step = (2 * HALF) / (GRID - 1);
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        for (let k = 0; k < GRID; k++) {
          positions[idx * 3] = -HALF + i * step;
          positions[idx * 3 + 1] = -HALF + j * step;
          positions[idx * 3 + 2] = -HALF + k * step;
          idx++;
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.085,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  scenePane.scene.add(new THREE.Points(geo, mat));

  // faint box for scale reference
  scenePane.scene.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * HALF, 2 * HALF, 2 * HALF)),
      new THREE.LineBasicMaterial({ color: 0x232a3b }),
    ),
  );

  const hot = new THREE.Color(0xf0a35e);
  const cold = new THREE.Color(0x10131c);

  function update(): void {
    const rho = parseFloat(rhoSlider.value);
    const x4 = parseFloat(x4Slider.value);
    const g = sliceGrid(centre, rho, x4, HALF, GRID);
    // normalise against the through-centre peak so the ρ-squeeze is visible as
    // shrinking support (NOT renormalised per slice — honesty over prettiness)
    const peak0 = slicePeak(centre, rho, centre[3]);
    const col = geo.getAttribute('color') as THREE.BufferAttribute;
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = Math.min(1, Math.pow(g.values[i] / peak0, 0.45)); // gamma for visibility
      tmp.copy(cold).lerp(hot, t);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    col.needsUpdate = true;
    const charge = totalCharge(rho);
    hudBig.textContent = `∫ q d⁴x = ${charge.toFixed(8)}`;
    hudSmall.textContent = `peak density ∝ ρ⁻⁴ = ${(slicePeak(centre, rho, x4)).toFixed(3)} at ρ = ${rho.toFixed(2)}`;
  }

  rhoSlider.addEventListener('input', update);
  x4Slider.addEventListener('input', update);
  update();

  return () => scenePane.dispose();
}
