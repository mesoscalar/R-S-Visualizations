/**
 * Widget 5 — degree and pi_3(SU(2)) ≅ Z (renderer).
 *
 * A map S³ → S³ cannot be drawn directly; instead we render the preimage
 * foliation: the preimage of a circle C through the target point p under
 * q ↦ qⁿ is n disjoint closed curves (stereographically projected), and the
 * preimages of p itself are n marked points, one per curve. An interpolation
 * slider deforms f_n through nonvanishing perturbations; the curves deform,
 * Newton continuation re-traces them, and the degree readout — recomputed by
 * quadrature on every change — stays locked at n.
 */
import * as THREE from 'three';
import {
  circleThrough,
  degreeMC,
  degreeQuadrature,
  findPreimages,
  mapPow,
  perturbedPow,
  powBranches,
  traceBranch,
  type MapS3,
} from '../math/degree';
import { stereographic } from '../math/hopf';
import { qpowInt, type Quat } from '../math/quaternion';
import { mulberry32 } from '../math/rng';
import { captionBlock } from '../latex';
import { createScenePane, el, phaseColor } from './three-helpers';

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controlsBar = el('div', 'controls');
  const nLabel = el('label', '', 'n');
  const nSelect = document.createElement('select');
  for (const n of [1, 2, 3]) {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    if (n === 2) opt.selected = true;
    nSelect.appendChild(opt);
  }
  nLabel.appendChild(nSelect);
  const epsLabel = el('label', '', 'deform f → f̃ (homotopy)');
  const epsSlider = document.createElement('input');
  epsSlider.type = 'range';
  epsSlider.min = '0';
  epsSlider.max = '0.4';
  epsSlider.step = '0.02';
  epsSlider.value = '0';
  epsLabel.appendChild(epsSlider);
  controlsBar.append(nLabel, epsLabel);

  // ---------- pane ----------
  const panes = el('div', 'panes');
  const pane = el('div', 'pane');
  panes.appendChild(pane);
  pane.appendChild(
    el('div', 'pane-label', 'Preimage f⁻¹(C) of a circle C through the target — n linked closed curves'),
  );
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big', '');
  const hudSmall = el('div', 'small', '');
  hud.append(hudBig, hudSmall);
  pane.appendChild(hud);

  const caption = captionBlock(
    'For unit quaternions, $f_n : q \\mapsto q^n$ is a degree-$n$ map $S^3 \\to S^3 \\cong SU(2)$, ' +
      'representing $n \\in \\pi_3(SU(2)) \\cong \\mathbb{Z}$ — in Ch. 6 this same integer becomes the ' +
      'instanton number. Numerically $\\deg f = \\tfrac{1}{2\\pi^2}\\int_{S^3} \\det(Df)\\,dV$ ' +
      '(finite differences in an orthonormal frame; $\\mathrm{Vol}(S^3) = 2\\pi^2$). The white dots are ' +
      'the $n$ preimages of the target point; the tubes are the preimages of a circle through it. ' +
      'Drag the homotopy slider: the curves slosh, the integral does not — homotopy invariance, ' +
      'one dimension up from Widget 1. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  const scenePane = createScenePane(pane, { cameraPos: [0, 1.8, 4.6], maxDistance: 30 });
  const group = new THREE.Group();
  scenePane.scene.add(group);

  function clearGroup(): void {
    for (const child of [...group.children]) {
      child.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
      group.remove(child);
    }
  }

  // fixed regular target point (away from the critical values ±1)
  const targetP: Quat = qpowInt(
    [Math.cos(0.7), Math.sin(0.7) * 0.36, Math.sin(0.7) * 0.48, Math.sin(0.7) * 0.8],
    1,
  );
  const C = circleThrough(targetP);

  function currentMap(n: number, eps: number): MapS3 {
    return eps === 0 ? mapPow(n) : perturbedPow(n, eps);
  }

  function tube(pts: Array<[number, number, number]>, color: THREE.Color, radius: number): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(...p)),
      true,
    );
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.min(360, pts.length * 2), radius, 10, true),
      new THREE.MeshBasicMaterial({ color }),
    );
  }

  function rebuild(): void {
    const n = parseInt(nSelect.value, 10);
    const eps = parseFloat(epsSlider.value);
    clearGroup();
    const f = currentMap(n, eps);

    // branch curves
    let branches: Quat[][] | null = null;
    if (eps === 0) {
      branches = powBranches(C, n, 240);
    } else {
      // continuation from each preimage of C(0) under the perturbed map
      const roots = findPreimages(f, C(0), mulberry32(11), 60);
      if (roots.length === n) {
        const traced: Quat[][] = [];
        for (const r of roots) {
          const t = traceBranch(f, C, r, 200);
          if (t) traced.push(t);
        }
        if (traced.length === n) branches = traced;
      }
    }
    if (branches) {
      branches.forEach((branch, k) => {
        const pts = branch.map((q) => stereographic(q));
        group.add(tube(pts, phaseColor((2 * Math.PI * k) / branches!.length + 0.5), 0.045));
      });
      hudSmall.textContent = `${branches.length} preimage curve${branches.length > 1 ? 's' : ''} of C`;
    } else {
      hudSmall.textContent = 'curve tracking lost (deformation too strong)';
    }

    // preimages of the target point itself
    const pre = findPreimages(f, targetP, mulberry32(7), 60);
    for (const r of pre) {
      const dotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      dotMesh.position.set(...stereographic(r));
      group.add(dotMesh);
    }

    // degree readout: quadrature (fast at 24x24x48 — integrand is smooth)
    const d = degreeQuadrature(f, 24, 24, 48);
    const mc = degreeMC(f, 20_000, mulberry32(5));
    hudBig.textContent = `deg = ${d.toFixed(6)}`;
    hudSmall.textContent += `  ·  MC: ${mc.mean.toFixed(3)} ± ${mc.stderr.toFixed(3)} (N=2·10⁴)`;
  }

  nSelect.addEventListener('change', rebuild);
  epsSlider.addEventListener('change', rebuild);

  rebuild();

  return () => scenePane.dispose();
}
