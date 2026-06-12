/**
 * Widget 7 — Möbius band as the nontrivial Z/2-bundle (renderer).
 *
 * Cylinder (left) vs Möbius band (right) over S¹. Both are glued from two
 * chart arcs (blue / orange); the two overlap seams are coloured by the
 * transition sign: green = +1, red = −1 (cylinder: +1, +1; Möbius: +1, −1 —
 * Čech class = product = ±1). The comb slider moves a continuous section:
 * on the cylinder the arrows never die; on the Möbius band a zero (red dot)
 * is forced, wherever you comb.
 */
import * as THREE from 'three';
import {
  antiperiodicSection,
  cylinderFiberDir,
  cylinderPoint,
  mobiusFiberDir,
  mobiusPoint,
  zeroCrossings,
} from '../math/mobius';
import { captionBlock } from '../latex';
import { createScenePane, el } from './three-helpers';

const NU = 200;
const NT = 12;

export function mount(container: HTMLElement): () => void {
  const controlsBar = el('div', 'controls');
  const combLabel = el('label', '', 'comb the section');
  const combSlider = document.createElement('input');
  combSlider.type = 'range';
  combSlider.min = '0';
  combSlider.max = String(2 * Math.PI);
  combSlider.step = '0.02';
  combSlider.value = '0.8';
  combLabel.appendChild(combSlider);
  controlsBar.append(combLabel);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Cylinder: transitions +1, +1 — class +1 (trivial)'));
  paneR.appendChild(el('div', 'pane-label', 'Möbius: transitions +1, −1 — class −1 (nontrivial)'));
  const hudL = el('div', 'hud');
  const hudLBig = el('div', 'big', '');
  hudL.appendChild(hudLBig);
  paneL.appendChild(hudL);
  const hudR = el('div', 'hud');
  const hudRBig = el('div', 'big', '');
  const hudRSmall = el('div', 'small', '');
  hudR.append(hudRBig, hudRSmall);
  paneR.appendChild(hudR);

  const caption = captionBlock(
    'Both bands are glued from two trivial pieces over overlapping arcs of $S^1$ with ' +
      'transition functions $\\pm 1$ (seams: green $= +1$, red $= -1$); the isomorphism class is ' +
      'the product of the signs — the Čech class in $H^1(S^1, \\mathbb{Z}/2) \\cong \\mathbb{Z}/2$, ' +
      'invariant under re-trivialisation. Sections of the Möbius band are antiperiodic, ' +
      '$f(u + 2\\pi) = -f(u)$, so combing a nonvanishing section is impossible: drag the slider ' +
      'and watch the forced zero (red dot) — it moves, but never disappears. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  const sceneL = createScenePane(paneL, { cameraPos: [0, 2.2, 3.2] });
  const sceneR = createScenePane(paneR, { cameraPos: [0, 2.2, 3.2] });

  // chart colouring: chart 1 on (-3pi/4, 3pi/4), chart 2 on (pi/4, 7pi/4);
  // overlaps near u = pi/2 (transition +1 on both bands) and u = 3pi/2
  // (cylinder +1, Möbius -1).
  const CH1 = new THREE.Color(0x39517e);
  const CH2 = new THREE.Color(0x8a5a32);
  const PLUS = new THREE.Color(0x2e7d4f);
  const MINUS = new THREE.Color(0xa03030);

  function chartColor(u: number, mobius: boolean): THREE.Color {
    const um = ((u % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const inOverlap1 = Math.abs(um - Math.PI / 2) < 0.28;
    const inOverlap2 = Math.abs(um - (3 * Math.PI) / 2) < 0.28;
    if (inOverlap1) return PLUS;
    if (inOverlap2) return mobius ? MINUS : PLUS;
    // chart 1 covers (3pi/2, 2pi] u [0, pi/2): the arc through u = 0
    return um > Math.PI / 2 && um < (3 * Math.PI) / 2 ? CH2 : CH1;
  }

  function buildBand(
    scene: THREE.Scene,
    point: (u: number, t: number) => [number, number, number],
    mobius: boolean,
  ): void {
    const positions = new Float32Array((NU + 1) * (NT + 1) * 3);
    const colors = new Float32Array((NU + 1) * (NT + 1) * 3);
    const indices: number[] = [];
    for (let i = 0; i <= NU; i++) {
      const u = (2 * Math.PI * i) / NU;
      const col = chartColor(u, mobius);
      for (let j = 0; j <= NT; j++) {
        const t = -1 + (2 * j) / NT;
        const idx = (i * (NT + 1) + j) * 3;
        positions.set(point(u, t), idx);
        colors.set([col.r, col.g, col.b], idx);
        if (i < NU && j < NT) {
          const a = i * (NT + 1) + j;
          const b = (i + 1) * (NT + 1) + j;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    );
    scene.add(mesh);
  }

  buildBand(sceneL.scene, (u, t) => cylinderPoint(u, t), false);
  buildBand(sceneR.scene, (u, t) => mobiusPoint(u, t), true);

  // ---------- section arrows ----------
  const M = 48;
  const arrowsL: THREE.ArrowHelper[] = [];
  const arrowsR: THREE.ArrowHelper[] = [];
  for (let k = 0; k < M; k++) {
    const aL = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(),
      0.3,
      0x69d58c,
      0.08,
      0.05,
    );
    const aR = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(),
      0.3,
      0x69d58c,
      0.08,
      0.05,
    );
    sceneL.scene.add(aL);
    sceneR.scene.add(aR);
    arrowsL.push(aL);
    arrowsR.push(aR);
  }
  const zeroMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xe05c5c }),
  );
  sceneR.scene.add(zeroMarker);

  function update(): void {
    const phase = parseFloat(combSlider.value);
    // Möbius section: half-integer harmonic combed by the slider
    const fM = antiperiodicSection([
      { a: Math.cos(phase), b: Math.sin(phase) },
      { a: 0.25 * Math.sin(2 * phase), b: 0 },
    ]);
    // cylinder section: nonvanishing whatever the comb does
    const fC = (u: number) => 0.8 + 0.35 * Math.cos(u + phase);
    for (let k = 0; k < M; k++) {
      const u = (2 * Math.PI * k) / M;
      // cylinder
      const pC = cylinderPoint(u, 0);
      const dC = cylinderFiberDir(u);
      const vC = fC(u);
      arrowsL[k].position.set(pC[0], pC[1], pC[2]);
      arrowsL[k].setDirection(new THREE.Vector3(dC[0], dC[1], dC[2]).normalize().multiplyScalar(Math.sign(vC) || 1));
      arrowsL[k].setLength(Math.max(0.02, 0.45 * Math.abs(vC)), 0.07, 0.045);
      // Möbius
      const pM = mobiusPoint(u, 0);
      const dM = mobiusFiberDir(u);
      const vM = fM(u);
      arrowsR[k].position.set(pM[0], pM[1], pM[2]);
      arrowsR[k].setDirection(new THREE.Vector3(dM[0], dM[1], dM[2]).normalize().multiplyScalar(Math.sign(vM) || 1));
      arrowsR[k].setLength(Math.max(0.02, 0.45 * Math.abs(vM)), 0.07, 0.045);
    }
    const zeros = zeroCrossings(fM, 1024);
    if (zeros.length > 0) {
      const p = mobiusPoint(zeros[0], 0);
      zeroMarker.position.set(p[0], p[1], p[2]);
    }
    hudLBig.textContent = 'min |s| > 0 ✓';
    hudRBig.textContent = `${zeros.length} forced zero${zeros.length > 1 ? 's' : ''}`;
    hudRSmall.textContent = 'sections are antiperiodic — IVT forces a zero';
  }

  combSlider.addEventListener('input', update);
  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
