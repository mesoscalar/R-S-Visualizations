/**
 * Widget 3 — Hopf bundle: fibers, connection, holonomy (renderer).
 *
 * Left: S² with a draggable base point and a loop (latitude circle of
 * adjustable radius about the point, or the geodesic octant triangle).
 * Right: S³ stereographically projected to R³ — the fiber over the point, an
 * optional family of linked fibers (the canonical Hopf picture), and the
 * animated horizontal lift of the loop with its holonomy phase mismatch.
 *
 * All mathematics from src/math/hopf.ts (tested kernel).
 */
import * as THREE from 'three';
import {
  circleSolidAngle,
  fiberPoint,
  geodesicArc,
  HOLONOMY_SIGN,
  holonomyPhase,
  horizontalLift,
  latitudeCircle,
  sectionOver,
  stereographic,
  type Vec3,
} from '../math/hopf';
import { qfromAxisAngle, qrotate, type Quat } from '../math/quaternion';
import { captionBlock } from '../latex';
import { createScenePane, el, phaseColor } from './three-helpers';

const MIN_SOUTH_DIST = 0.25; // keep base point off the south pole: its fiber passes through the projection pole

type Loop = { gamma: (s: number) => Vec3; gammaDot: (s: number) => Vec3; sMax: number; omega: number };

export function mount(container: HTMLElement): () => void {
  // ---------- controls ----------
  const controlsBar = el('div', 'controls');
  const circleBtn = el('button', 'active', 'latitude loop');
  const octantBtn = el('button', '', 'octant triangle');
  const thetaLabel = el('label', '', 'loop radius θ₀');
  const thetaSlider = document.createElement('input');
  thetaSlider.type = 'range';
  thetaSlider.min = '0.15';
  thetaSlider.max = '2.2';
  thetaSlider.step = '0.01';
  thetaSlider.value = '0.7';
  thetaLabel.appendChild(thetaSlider);
  const playBtn = el('button', '', '▶ traverse loop');
  const familyBtn = el('button', '', 'show fiber family');
  controlsBar.append(circleBtn, octantBtn, thetaLabel, playBtn, familyBtn);

  // ---------- panes ----------
  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);
  paneL.appendChild(el('div', 'pane-label', 'Base S² — drag the point, traverse the loop'));
  paneR.appendChild(el('div', 'pane-label', 'S³ → ℝ³ (stereographic) — fibers and horizontal lift'));

  const hudL = el('div', 'hud');
  const hudLBig = el('div', 'big', '');
  const hudLSmall = el('div', 'small', 'solid angle Ω');
  hudL.append(hudLBig, hudLSmall);
  paneL.appendChild(hudL);

  const hudR = el('div', 'hud');
  const hudRBig = el('div', 'big', '');
  const hudRSmall = el('div', 'small', '');
  hudR.append(hudRBig, hudRSmall);
  paneR.appendChild(hudR);

  const caption = captionBlock(
    'Hopf bundle $h: S^3 \\to S^2$, $h(z_1,z_2) = (2\\,\\mathrm{Re}(\\bar z_1 z_2),\\, ' +
      '2\\,\\mathrm{Im}(\\bar z_1 z_2),\\, |z_1|^2 - |z_2|^2)$, fibers $\\{e^{i\\alpha}z\\}$, with the ' +
      'standard connection $\\omega = \\mathrm{Im}(\\bar z_1 dz_1 + \\bar z_2 dz_2)$. Horizontal lifts ' +
      'satisfy $\\mathrm{Im}\\langle z, \\dot z\\rangle = 0$. Theorem: the holonomy of a loop enclosing ' +
      'solid angle $\\Omega$ is $e^{-i\\Omega/2}$ (sign fixed by our orientation, determined ' +
      'numerically). Any two distinct fibers are linked circles — Gauss linking number 1. ' +
      'The base point cannot be dragged onto the south pole: that fiber passes through the ' +
      'stereographic pole. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  // ---------- left: base sphere ----------
  const sceneL = createScenePane(paneL, { cameraPos: [1.6, 1.4, 2.6] });
  const baseSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x1b2233, roughness: 0.75, metalness: 0.05 }),
  );
  sceneL.scene.add(baseSphere);
  sceneL.scene.add(
    new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1.001, 24, 12)),
      new THREE.LineBasicMaterial({ color: 0x232a3b, transparent: true, opacity: 0.4 }),
    ),
  );

  const baseMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 24, 12),
    new THREE.MeshBasicMaterial({ color: 0x6ea8fe }),
  );
  sceneL.scene.add(baseMarker);

  const movingMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  movingMarker.visible = false;
  sceneL.scene.add(movingMarker);

  let loopLine: THREE.Line | null = null;

  // kernel [x,y,z] -> three.js y-up display coords (z up in math -> y up on screen)
  const toView = (p: Vec3) => new THREE.Vector3(p[0], p[2], -p[1]);
  const fromView = (v: THREE.Vector3): Vec3 => [v.x, -v.z, v.y];

  // ---------- right: stereographic S^3 ----------
  const sceneR = createScenePane(paneR, { cameraPos: [0, 2.2, 5.2], maxDistance: 40 });
  const fiberGroup = new THREE.Group();
  const familyGroup = new THREE.Group();
  familyGroup.visible = false;
  const liftGroup = new THREE.Group();
  sceneR.scene.add(fiberGroup, familyGroup, liftGroup);

  function tubeFromPoints(pts: Vec3[], color: THREE.Color | number, radius = 0.035): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      true,
    );
    const geo = new THREE.TubeGeometry(curve, Math.min(256, pts.length * 2), radius, 10, true);
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
  }

  function disposeGroup(g: THREE.Group): void {
    for (const child of [...g.children]) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material)?.dispose();
      g.remove(child);
    }
  }

  // ---------- state ----------
  let basePoint: Vec3 = [Math.sin(0.9), 0, Math.cos(0.9)];
  let loopKind: 'circle' | 'octant' = 'circle';
  let anim: { zs: Float64Array[]; ts: Float64Array; loop: Loop; start: number; z0: Float64Array } | null =
    null;

  function currentLoop(): Loop {
    if (loopKind === 'octant') {
      const X: Vec3 = [1, 0, 0];
      const Y: Vec3 = [0, 1, 0];
      const Z: Vec3 = [0, 0, 1];
      const sides = [geodesicArc(X, Y), geodesicArc(Y, Z), geodesicArc(Z, X)];
      return {
        sMax: 3,
        omega: Math.PI / 2,
        gamma: (s) => sides[Math.min(2, Math.floor(s))].gamma(s - Math.min(2, Math.floor(s))),
        gammaDot: (s) => sides[Math.min(2, Math.floor(s))].gammaDot(s - Math.min(2, Math.floor(s))),
      };
    }
    const th0 = parseFloat(thetaSlider.value);
    const { gamma, gammaDot } = latitudeCircle(th0);
    // rotate the +z latitude circle so its axis passes through basePoint
    const z: Vec3 = [0, 0, 1];
    const dotzp = basePoint[2];
    let q: Quat = [1, 0, 0, 0];
    if (dotzp < 0.99999) {
      const axis: [number, number, number] = [
        z[1] * basePoint[2] - z[2] * basePoint[1],
        z[2] * basePoint[0] - z[0] * basePoint[2],
        z[0] * basePoint[1] - z[1] * basePoint[0],
      ];
      q = qfromAxisAngle(axis, Math.acos(Math.max(-1, Math.min(1, dotzp))));
    }
    return {
      sMax: 2 * Math.PI,
      omega: circleSolidAngle(th0),
      gamma: (s) => qrotate(q, gamma(s)),
      gammaDot: (s) => qrotate(q, gammaDot(s)),
    };
  }

  function redrawLoop(): void {
    const loop = currentLoop();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) pts.push(toView(loop.gamma((i / 256) * loop.sMax)));
    if (loopLine) {
      loopLine.geometry.dispose();
      loopLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    } else {
      loopLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xf0a35e }),
      );
      sceneL.scene.add(loopLine);
    }
    hudLBig.textContent = `Ω = ${loop.omega.toFixed(4)}`;
    hudRSmall.textContent = `predicted σΩ/2 = ${((HOLONOMY_SIGN * loop.omega) / 2).toFixed(6)}`;
  }

  function redrawFiber(): void {
    disposeGroup(fiberGroup);
    const anchor = loopKind === 'octant' ? ([1, 0, 0] as Vec3) : basePoint;
    const z0 = sectionOver(anchor);
    // fiber tube coloured segment-wise by phase α — ties to the holonomy dial
    const SEGS = 48;
    for (let s = 0; s < SEGS; s++) {
      const pts: Vec3[] = [];
      for (let i = 0; i <= 6; i++) {
        const a = ((s + i / 6) / SEGS) * 2 * Math.PI;
        pts.push(stereographic(fiberPoint(z0, a)));
      }
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const geo = new THREE.TubeGeometry(curve, 12, 0.035, 8, false);
      fiberGroup.add(
        new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: phaseColor(((s + 0.5) / SEGS) * 2 * Math.PI) }),
        ),
      );
    }
    // start-phase marker
    const start = stereographic(z0);
    const startMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    startMarker.position.set(...start);
    fiberGroup.add(startMarker);
  }

  function redrawFamily(): void {
    disposeGroup(familyGroup);
    const N = 10;
    for (let i = 0; i < N; i++) {
      const phi = (2 * Math.PI * i) / N;
      const p: Vec3 = [Math.sin(1.1) * Math.cos(phi), Math.sin(1.1) * Math.sin(phi), Math.cos(1.1)];
      const z0 = sectionOver(p);
      const pts: Vec3[] = [];
      for (let k = 0; k < 96; k++) pts.push(stereographic(fiberPoint(z0, (2 * Math.PI * k) / 96)));
      familyGroup.add(tubeFromPoints(pts, phaseColor(phi), 0.02));
    }
  }

  // ---------- animation ----------
  let trailLine: THREE.Line | null = null;
  let mismatchArc: THREE.Mesh | null = null;

  function clearLift(): void {
    if (trailLine) {
      trailLine.geometry.dispose();
      (trailLine.material as THREE.Material).dispose();
      liftGroup.remove(trailLine);
      trailLine = null;
    }
    if (mismatchArc) {
      mismatchArc.geometry.dispose();
      (mismatchArc.material as THREE.Material).dispose();
      liftGroup.remove(mismatchArc);
      mismatchArc = null;
    }
    movingMarker.visible = false;
  }

  function startTraversal(): void {
    clearLift();
    const loop = currentLoop();
    const anchor = loopKind === 'octant' ? ([1, 0, 0] as Vec3) : loop.gamma(0);
    const z0 = Float64Array.from(sectionOver(anchor));
    const { ts, zs } = horizontalLift(loop.gammaDot, z0, 0, loop.sMax, 2400);
    anim = { zs, ts, loop, start: performance.now(), z0 };
    movingMarker.visible = true;
    playBtn.textContent = '⟳ traversing…';
  }

  const DURATION = 7000; // ms for one traversal

  sceneR.onFrame(() => {
    if (!anim) return;
    const frac = Math.min(1, (performance.now() - anim.start) / DURATION);
    const idx = Math.min(anim.zs.length - 1, Math.floor(frac * (anim.zs.length - 1)));
    const z = anim.zs[idx];
    // left marker
    const g = anim.loop.gamma(anim.ts[idx]);
    movingMarker.position.copy(toView(g));
    // right trail
    const trailPts: THREE.Vector3[] = [];
    const stride = Math.max(1, Math.floor(idx / 600));
    for (let i = 0; i <= idx; i += stride) {
      const w = stereographic(anim.zs[i]);
      trailPts.push(new THREE.Vector3(w[0], w[1], w[2]));
    }
    if (trailPts.length >= 2) {
      if (trailLine) {
        trailLine.geometry.dispose();
        trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPts);
      } else {
        trailLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(trailPts),
          new THREE.LineBasicMaterial({ color: 0xffffff }),
        );
        liftGroup.add(trailLine);
      }
    }
    // live phase relative to the reference section over the current base point
    const phase = holonomyPhase(sectionOver(g), z);
    hudRBig.textContent = `Δ = ${phase.toFixed(6)}`;
    if (frac >= 1) {
      const finalPhase = holonomyPhase(anim.z0, anim.zs[anim.zs.length - 1]);
      hudRBig.textContent = `Δ = ${finalPhase.toFixed(6)}`;
      // draw the mismatch arc along the fiber from phase 0 to Δ
      const pts: Vec3[] = [];
      const M = 64;
      for (let i = 0; i <= M; i++) {
        pts.push(stereographic(fiberPoint(anim.z0, (finalPhase * i) / M)));
      }
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      mismatchArc = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.055, 8, false),
        new THREE.MeshBasicMaterial({ color: 0xf0a35e }),
      );
      liftGroup.add(mismatchArc);
      playBtn.textContent = '▶ traverse loop';
      anim = null;
    }
  });

  // ---------- interactions ----------
  const raycaster = new THREE.Raycaster();
  let draggingBase = false;

  function pointerRay(e: PointerEvent): void {
    const rect = sceneL.renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(new THREE.Vector2(x, y), sceneL.camera);
  }

  sceneL.renderer.domElement.addEventListener('pointerdown', (e) => {
    if (loopKind === 'octant') return;
    pointerRay(e);
    const hits = raycaster.intersectObject(baseSphere);
    if (hits.length === 0) return;
    const p = fromView(hits[0].point.clone().normalize());
    const d = Math.acos(
      Math.max(-1, Math.min(1, p[0] * basePoint[0] + p[1] * basePoint[1] + p[2] * basePoint[2])),
    );
    if (d < 0.35) {
      draggingBase = true;
      sceneL.controls.enabled = false;
      e.preventDefault();
    }
  });
  sceneL.renderer.domElement.addEventListener('pointermove', (e) => {
    if (!draggingBase) return;
    pointerRay(e);
    const hits = raycaster.intersectObject(baseSphere);
    if (hits.length === 0) return;
    let p = fromView(hits[0].point.clone().normalize());
    // keep away from the south pole (fiber through the stereographic pole)
    if (p[2] < -1 + MIN_SOUTH_DIST) {
      const s = Math.hypot(p[0], p[1]) || 1e-9;
      const zc = -1 + MIN_SOUTH_DIST;
      const sc = Math.sqrt(1 - zc * zc) / s;
      p = [p[0] * sc, p[1] * sc, zc];
    }
    basePoint = p;
    clearLift();
    anim = null;
    update();
    e.preventDefault();
  });
  const endBaseDrag = () => {
    draggingBase = false;
    sceneL.controls.enabled = true;
  };
  sceneL.renderer.domElement.addEventListener('pointerup', endBaseDrag);
  sceneL.renderer.domElement.addEventListener('pointercancel', endBaseDrag);

  circleBtn.addEventListener('click', () => {
    loopKind = 'circle';
    circleBtn.classList.add('active');
    octantBtn.classList.remove('active');
    clearLift();
    anim = null;
    update();
  });
  octantBtn.addEventListener('click', () => {
    loopKind = 'octant';
    octantBtn.classList.add('active');
    circleBtn.classList.remove('active');
    clearLift();
    anim = null;
    update();
  });
  thetaSlider.addEventListener('input', () => {
    if (loopKind === 'circle') {
      clearLift();
      anim = null;
      update();
    }
  });
  playBtn.addEventListener('click', () => {
    if (!anim) startTraversal();
  });
  familyBtn.addEventListener('click', () => {
    familyGroup.visible = !familyGroup.visible;
    familyBtn.classList.toggle('active', familyGroup.visible);
    if (familyGroup.visible && familyGroup.children.length === 0) redrawFamily();
  });

  function update(): void {
    baseMarker.position.copy(toView(loopKind === 'octant' ? [1, 0, 0] : basePoint));
    redrawLoop();
    redrawFiber();
    hudRBig.textContent = 'Δ = —';
  }

  update();

  return () => {
    sceneL.dispose();
    sceneR.dispose();
  };
}
