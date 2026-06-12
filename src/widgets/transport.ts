/**
 * Widget 4 — parallel transport and holonomy on surfaces (renderer).
 *
 * Surface picker with Gauss-curvature heatmap; two modes:
 *  - transport: a frame is carried around a loop (parameter ellipse, or the
 *    "around the cylinder" punchline), live holonomy angle vs the
 *    Gauss–Bonnet prediction ∫∫K dA;
 *  - spray: geodesic fan from a point — Jacobi spreading made visible.
 *
 * All mathematics from src/math/surfaces.ts (tested kernel).
 */
import * as THREE from 'three';
import {
  gaussCurvature,
  geodesicFlow,
  holonomyAngle,
  integrateKOverEllipse,
  normalAt,
  SURFACES,
  transportOnSurface,
  unitSpeed,
  type Surface,
  type Vec3,
} from '../math/surfaces';
import { captionBlock } from '../latex';
import { createScenePane, el } from './three-helpers';

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controlsBar = el('div', 'controls');
  const surfSelect = document.createElement('select');
  for (const s of SURFACES) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    surfSelect.appendChild(opt);
  }
  const transportBtn = el('button', 'active', 'transport a frame');
  const sprayBtn = el('button', '', 'geodesic spray');
  const aroundBtn = el('button', '', 'around the cylinder!');
  aroundBtn.style.display = 'none';
  const sizeLabel = el('label', '', 'loop size / length');
  const sizeSlider = document.createElement('input');
  sizeSlider.type = 'range';
  sizeSlider.min = '0.15';
  sizeSlider.max = '1';
  sizeSlider.step = '0.01';
  sizeSlider.value = '0.5';
  sizeLabel.appendChild(sizeSlider);
  const playBtn = el('button', '', '▶ run');
  controlsBar.append(surfSelect, transportBtn, sprayBtn, aroundBtn, sizeLabel, playBtn);

  // ---------- pane ----------
  const panes = el('div', 'panes');
  const pane = el('div', 'pane');
  panes.appendChild(pane);
  pane.appendChild(el('div', 'pane-label', 'Surface heat-mapped by Gauss curvature K'));
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big', '');
  const hudSmall = el('div', 'small', '');
  hud.append(hudBig, hudSmall);
  pane.appendChild(hud);

  const caption = captionBlock(
    'Extrinsic parallel transport: $\\dot X = -\\langle X, \\dot N\\rangle N$; geodesics: ' +
      '$\\ddot\\gamma \\parallel N$. Gauss–Bonnet: the holonomy rotation after a loop equals ' +
      '$\\int_{\\text{enclosed}} K\\,dA$ — compare the measured angle with the live curvature ' +
      'integral. Punchline: the cylinder is visibly bent but $K = 0$ — transport around it ' +
      'returns the frame exactly; extrinsic bending is not curvature. In spray mode, ' +
      'neighbouring geodesics spread according to the Jacobi equation $J\'\' + KJ = 0$ ' +
      '(focusing where $K > 0$, spreading where $K < 0$). (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  const scenePane = createScenePane(pane, { cameraPos: [2.6, 2.0, 3.4], maxDistance: 25 });

  // ---------- surface mesh ----------
  let surface: Surface = SURFACES[0];
  let surfMesh: THREE.Mesh | null = null;
  let wire: THREE.LineSegments | null = null;

  const NU = 128;
  const NV = 64;

  function buildSurface(): void {
    if (surfMesh) {
      surfMesh.geometry.dispose();
      (surfMesh.material as THREE.Material).dispose();
      scenePane.scene.remove(surfMesh);
    }
    if (wire) {
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      scenePane.scene.remove(wire);
    }
    const [u0, u1] = surface.uRange;
    const [v0, v1] = surface.vRange;
    const positions = new Float32Array((NU + 1) * (NV + 1) * 3);
    const normals = new Float32Array((NU + 1) * (NV + 1) * 3);
    const colors = new Float32Array((NU + 1) * (NV + 1) * 3);
    const indices: number[] = [];
    // first pass: K range for the diverging palette
    let maxAbsK = 1e-9;
    for (let i = 0; i <= NU; i += 4) {
      for (let j = 0; j <= NV; j += 4) {
        const u = u0 + ((u1 - u0) * i) / NU;
        const v = v0 + ((v1 - v0) * j) / NV;
        maxAbsK = Math.max(maxAbsK, Math.abs(gaussCurvature(surface, u, v)));
      }
    }
    const neg = new THREE.Color(0x4a7bd0);
    const mid = new THREE.Color(0x222b3f);
    const pos = new THREE.Color(0xf0a35e);
    const tmp = new THREE.Color();
    for (let i = 0; i <= NU; i++) {
      for (let j = 0; j <= NV; j++) {
        const u = u0 + ((u1 - u0) * i) / NU;
        const v = v0 + ((v1 - v0) * j) / NV;
        const idx = (i * (NV + 1) + j) * 3;
        const p = surface.point(u, v);
        const n = normalAt(surface, u, v);
        positions.set(p, idx);
        normals.set(n, idx);
        const t = Math.max(-1, Math.min(1, gaussCurvature(surface, u, v) / maxAbsK));
        if (t >= 0) tmp.copy(mid).lerp(pos, t);
        else tmp.copy(mid).lerp(neg, -t);
        colors.set([tmp.r, tmp.g, tmp.b], idx);
        if (i < NU && j < NV) {
          const a = i * (NV + 1) + j;
          const b = (i + 1) * (NV + 1) + j;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    surfMesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    );
    scenePane.scene.add(surfMesh);
    wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x0b0e14, transparent: true, opacity: 0.12 }),
    );
    scenePane.scene.add(wire);
  }

  // ---------- dynamic objects ----------
  const dyn = new THREE.Group();
  scenePane.scene.add(dyn);
  let arrowX: THREE.ArrowHelper | null = null;
  let arrowY: THREE.ArrowHelper | null = null;
  let ghost: THREE.ArrowHelper | null = null;

  function clearDyn(): void {
    for (const child of [...dyn.children]) {
      child.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        mat?.dispose();
      });
      dyn.remove(child);
    }
    arrowX = arrowY = ghost = null;
  }

  // ---------- state ----------
  type Mode = 'transport' | 'spray' | 'around';
  let mode: Mode = 'transport';
  let anim: {
    kind: 'transport';
    loopPts: Vec3[];
    Xs: Vec3[];
    Ns: Vec3[];
    start: number;
    predicted: number | null;
    X0: Vec3;
    N0: Vec3;
  } | {
    kind: 'spray';
    paths: Vec3[][];
    dots: THREE.Mesh[];
    start: number;
  } | null = null;

  function loopCenter(): [number, number] {
    const [u0, u1] = surface.uRange;
    const [v0, v1] = surface.vRange;
    return [(u0 + u1) / 2, (v0 + v1) / 2];
  }

  function startTransport(): void {
    clearDyn();
    const size = parseFloat(sizeSlider.value);
    const [cu, cv] = loopCenter();
    const [u0, u1] = surface.uRange;
    const [v0, v1] = surface.vRange;
    let uv: (t: number) => [number, number];
    let uvDot: (t: number) => [number, number];
    let predicted: number | null = null;
    if (mode === 'around') {
      uv = (t) => [t, 0.4 * Math.sin(t)];
      uvDot = (t) => [1, 0.4 * Math.cos(t)];
      predicted = 0; // the punchline: K = 0 identically on the cylinder
    } else {
      // parameter ellipse, kept inside the chart
      const a = (size * (u1 - u0)) / 4;
      const b = (size * (v1 - v0)) / 4;
      uv = (t) => [cu + a * Math.cos(t), cv + b * Math.sin(t)];
      uvDot = (t) => [-a * Math.sin(t), b * Math.cos(t)];
      predicted = integrateKOverEllipse(surface, cu, cv, a, b);
    }
    const [su, sv] = uv(0);
    const ru = surface.ru(su, sv);
    const rn = Math.hypot(...ru);
    const X0: Vec3 = [ru[0] / rn, ru[1] / rn, ru[2] / rn];
    const N0 = normalAt(surface, su, sv);
    const STEPS = 2400;
    const Xs = transportOnSurface(surface, uv, uvDot, X0, 0, 2 * Math.PI, STEPS);
    const loopPts: Vec3[] = [];
    const Ns: Vec3[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const [u, v] = uv((2 * Math.PI * i) / STEPS);
      loopPts.push(surface.point(u, v));
      Ns.push(normalAt(surface, u, v));
    }
    // loop curve
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(loopPts.map((p) => new THREE.Vector3(...p))),
      new THREE.LineBasicMaterial({ color: 0xf0a35e }),
    );
    dyn.add(line);
    // ghost of the initial vector
    ghost = new THREE.ArrowHelper(
      new THREE.Vector3(...X0),
      new THREE.Vector3(...loopPts[0]),
      0.45,
      0x8a93a6,
      0.12,
      0.06,
    );
    dyn.add(ghost);
    arrowX = new THREE.ArrowHelper(
      new THREE.Vector3(...X0),
      new THREE.Vector3(...loopPts[0]),
      0.45,
      0x6ea8fe,
      0.14,
      0.07,
    );
    arrowY = new THREE.ArrowHelper(
      new THREE.Vector3().crossVectors(new THREE.Vector3(...N0), new THREE.Vector3(...X0)),
      new THREE.Vector3(...loopPts[0]),
      0.45,
      0x69d58c,
      0.14,
      0.07,
    );
    dyn.add(arrowX, arrowY);
    anim = { kind: 'transport', loopPts, Xs, Ns, start: performance.now(), predicted, X0, N0 };
    hudBig.textContent = 'transporting…';
    hudSmall.textContent =
      predicted !== null ? `Gauss–Bonnet predicts ∫K dA = ${predicted.toFixed(6)}` : '';
  }

  function startSpray(): void {
    clearDyn();
    const [cu, cv] = loopCenter();
    const T = 2.2 + 2.3 * parseFloat(sizeSlider.value);
    const M = 14;
    const ru = surface.ru(cu, cv);
    const rv = surface.rv(cu, cv);
    const dotv = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const Eu = dotv(ru, ru);
    const Fu = dotv(ru, rv);
    const Gu = dotv(rv, rv);
    const paths: Vec3[][] = [];
    const dots: THREE.Mesh[] = [];
    for (let k = 0; k < M; k++) {
      const alpha = (2 * Math.PI * k) / M;
      // direction in the tangent plane with metric angle alpha:
      // e1 = ru/√E, e2 = (rv − (F/E) ru) normalised
      const inv = 1 / Math.sqrt(Eu);
      const e1: Vec3 = [ru[0] * inv, ru[1] * inv, ru[2] * inv];
      const w: Vec3 = [
        rv[0] - (Fu / Eu) * ru[0],
        rv[1] - (Fu / Eu) * ru[1],
        rv[2] - (Fu / Eu) * ru[2],
      ];
      const wn = Math.hypot(...w);
      const e2: Vec3 = [w[0] / wn, w[1] / wn, w[2] / wn];
      const dir3: Vec3 = [
        Math.cos(alpha) * e1[0] + Math.sin(alpha) * e2[0],
        Math.cos(alpha) * e1[1] + Math.sin(alpha) * e2[1],
        Math.cos(alpha) * e1[2] + Math.sin(alpha) * e2[2],
      ];
      // convert to parameter velocities: [E F; F G](du,dv) = (<dir,ru>, <dir,rv>)
      const b1 = dotv(dir3, ru);
      const b2 = dotv(dir3, rv);
      const det = Eu * Gu - Fu * Fu;
      let du = (b1 * Gu - b2 * Fu) / det;
      let dv = (b2 * Eu - b1 * Fu) / det;
      [du, dv] = unitSpeed(surface, cu, cv, du, dv);
      const g = geodesicFlow(surface, cu, cv, du, dv, T, 900);
      paths.push(g.points);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(g.points.map((p) => new THREE.Vector3(...p))),
        new THREE.LineBasicMaterial({ color: 0x6ea8fe, transparent: true, opacity: 0.55 }),
      );
      dyn.add(line);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      dyn.add(dot);
      dots.push(dot);
    }
    anim = { kind: 'spray', paths, dots, start: performance.now() };
    hudBig.textContent = 'geodesic spray';
    hudSmall.textContent = 'neighbours spread per the Jacobi equation';
  }

  const DURATION = 7000;

  scenePane.onFrame(() => {
    if (!anim) return;
    const frac = Math.min(1, (performance.now() - anim.start) / DURATION);
    if (anim.kind === 'transport') {
      const idx = Math.min(anim.Xs.length - 1, Math.floor(frac * (anim.Xs.length - 1)));
      const p = new THREE.Vector3(...anim.loopPts[idx]);
      const X = anim.Xs[idx];
      const N = anim.Ns[idx];
      const Y = new THREE.Vector3().crossVectors(new THREE.Vector3(...N), new THREE.Vector3(...X));
      arrowX!.position.copy(p);
      arrowX!.setDirection(new THREE.Vector3(...X).normalize());
      arrowY!.position.copy(p);
      arrowY!.setDirection(Y.normalize());
      if (frac >= 1) {
        const angle = holonomyAngle(anim.X0, anim.Xs[anim.Xs.length - 1], anim.N0);
        hudBig.textContent = `holonomy = ${angle.toFixed(6)} rad`;
        if (anim.predicted !== null) {
          const wrapped = Math.atan2(Math.sin(anim.predicted), Math.cos(anim.predicted));
          hudSmall.textContent = `∫K dA = ${anim.predicted.toFixed(6)} (≡ ${wrapped.toFixed(6)} mod 2π)`;
        }
        anim = null;
      }
    } else {
      const ease = frac;
      for (let k = 0; k < anim.paths.length; k++) {
        const path = anim.paths[k];
        const idx = Math.min(path.length - 1, Math.floor(ease * (path.length - 1)));
        anim.dots[k].position.set(...path[idx]);
      }
      if (frac >= 1) anim = null;
    }
  });

  // ---------- wiring ----------
  function setMode(m: Mode): void {
    mode = m;
    transportBtn.classList.toggle('active', m === 'transport');
    sprayBtn.classList.toggle('active', m === 'spray');
    aroundBtn.classList.toggle('active', m === 'around');
    clearDyn();
    anim = null;
    hudBig.textContent = '';
    hudSmall.textContent = '';
  }
  transportBtn.addEventListener('click', () => setMode('transport'));
  sprayBtn.addEventListener('click', () => setMode('spray'));
  aroundBtn.addEventListener('click', () => {
    setMode('around');
    startTransport();
  });
  playBtn.addEventListener('click', () => {
    if (anim) return;
    if (mode === 'spray') startSpray();
    else startTransport();
  });
  surfSelect.addEventListener('change', () => {
    surface = SURFACES.find((s) => s.id === surfSelect.value)!;
    aroundBtn.style.display = surface.id === 'cylinder' ? '' : 'none';
    if (mode === 'around' && surface.id !== 'cylinder') mode = 'transport';
    clearDyn();
    anim = null;
    hudBig.textContent = '';
    hudSmall.textContent = '';
    buildSurface();
  });

  buildSurface();

  return () => scenePane.dispose();
}
