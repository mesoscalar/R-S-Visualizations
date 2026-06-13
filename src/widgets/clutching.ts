/**
 * Widget 1 — Clutching laboratory (renderer).
 *
 * Left pane: the user deforms a closed loop c : S^1 -> C^* by dragging control
 * points; live winding-number readout. Right pane: the U(1)-bundle over S^2
 * assembled from two caps; the southern cap is coloured by the phase of the
 * transition function, so the clutching class appears as an n-fold hue vortex
 * at the south pole, and a rotating dial on the equator animates the mismatch.
 *
 * All mathematics comes from src/math/clutching + src/math/winding.
 */
import * as THREE from 'three';
import {
  catmullRomClosed,
  insertPointNearest,
  presetControls,
  removePoint,
  transitionAngles,
  type Pt,
} from '../math/clutching';
import { windingNumber } from '../math/winding';
import { captionBlock } from '../latex';
import { createScenePane, el, phaseColor, phaseColorCss } from './three-helpers';

const WORLD = 2.6; // half-extent of the drawing plane in C

export function mount(container: HTMLElement): () => void {
  // ---------- layout ----------
  const controlsBar = el('div', 'controls');
  const presetLabel = el('span', 'footnote', 'Presets  z ↦ zⁿ :');
  controlsBar.appendChild(presetLabel);
  const presetButtons: HTMLButtonElement[] = [];
  for (let n = -2; n <= 3; n++) {
    const b = el('button', '', n === 1 ? '1 (Hopf)' : String(n));
    b.addEventListener('click', () => setPreset(n));
    controlsBar.appendChild(b);
    presetButtons.push(b);
  }
  const addBtn = el('button', '', '✚ add points');
  let addMode = false;
  addBtn.addEventListener('click', () => {
    addMode = !addMode;
    addBtn.classList.toggle('active', addMode);
  });
  controlsBar.appendChild(addBtn);

  const panes = el('div', 'panes');
  const paneL = el('div', 'pane');
  const paneR = el('div', 'pane');
  panes.append(paneL, paneR);

  paneL.appendChild(
    el('div', 'pane-label', 'Transition loop c : S¹ → ℂ✕  (drag points · ✚ to add · double-tap to remove)'),
  );
  const hud = el('div', 'hud');
  const hudBig = el('div', 'big', 'n = 1');
  const hudSmall = el('div', 'small', '');
  hud.append(hudBig, hudSmall);
  paneL.appendChild(hud);

  paneR.appendChild(
    el('div', 'pane-label', 'Bundle glued from two caps — hue = phase of g(φ) = c(φ)/|c(φ)|'),
  );

  const caption = captionBlock(
    'Clutching construction: a principal $U(1)$-bundle over $S^2$ is glued from trivial ' +
      'bundles over the two caps by a transition function $g$ on the equatorial overlap; the ' +
      'plane shown is $\\mathbb{C}^\\times$, which deformation-retracts onto $U(1)$ (faint guide circle). ' +
      'Theorem: isomorphism classes correspond to $[S^1, U(1)] = \\pi_1(U(1)) \\cong \\mathbb{Z}$ via the ' +
      'winding number $n = \\tfrac{1}{2\\pi}\\oint d(\\arg c)$. Drag freely: $n$ is homotopy-invariant ' +
      'and only jumps when the loop is forced through the origin — the moment $c$ leaves ' +
      '$\\mathbb{C}^\\times$. The hue vortex at the south pole has charge $n$. (R&S §TODO)',
  );

  container.append(controlsBar, panes, caption);

  // ---------- state ----------
  let ctrl: Pt[] = presetControls(1);
  let samples: Pt[] = [];
  let angles: Float64Array = new Float64Array(0);
  let lastN = 1;

  // ---------- 2D editor ----------
  const canvas = document.createElement('canvas');
  paneL.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const sizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, paneL.clientWidth * dpr);
    canvas.height = Math.max(1, paneL.clientHeight * dpr);
    draw2d();
  };
  const obs = new ResizeObserver(sizeCanvas);
  obs.observe(paneL);

  const toScreen = (p: Pt): [number, number] => {
    const s = Math.min(canvas.width, canvas.height) / (2 * WORLD);
    return [canvas.width / 2 + p[0] * s, canvas.height / 2 - p[1] * s];
  };
  const toWorld = (x: number, y: number): Pt => {
    const s = Math.min(canvas.width, canvas.height) / (2 * WORLD);
    return [(x - canvas.width / 2) / s, (canvas.height / 2 - y) / s];
  };

  function draw2d(): void {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const s = Math.min(w, h) / (2 * WORLD);

    // axes
    ctx.strokeStyle = 'rgba(138,147,166,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // guide circle U(1) — the deformation retract of C^*
    ctx.strokeStyle = 'rgba(110,168,254,0.25)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // the origin — the forbidden point of C^*
    ctx.strokeStyle = '#e05c5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const r0 = 7 * (window.devicePixelRatio > 1 ? 2 : 1);
    ctx.moveTo(w / 2 - r0, h / 2 - r0);
    ctx.lineTo(w / 2 + r0, h / 2 + r0);
    ctx.moveTo(w / 2 - r0, h / 2 + r0);
    ctx.lineTo(w / 2 + r0, h / 2 - r0);
    ctx.stroke();

    // the loop, coloured by the phase of c(t) — same hue wheel as the sphere
    const m = samples.length;
    ctx.lineWidth = 3 * (window.devicePixelRatio > 1 ? 1.6 : 1);
    for (let i = 0; i < m; i++) {
      const a = samples[i];
      const b = samples[(i + 1) % m];
      ctx.strokeStyle = phaseColorCss(angles[i]);
      ctx.beginPath();
      ctx.moveTo(...toScreen(a));
      ctx.lineTo(...toScreen(b));
      ctx.stroke();
    }

    // direction arrowhead at the start point
    if (m > 4) {
      const p = toScreen(samples[0]);
      const q = toScreen(samples[3]);
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const L = 12 * (window.devicePixelRatio > 1 ? 1.6 : 1);
      ctx.fillStyle = '#d7dce6';
      ctx.beginPath();
      ctx.moveTo(q[0], q[1]);
      ctx.lineTo(q[0] - L * Math.cos(ang - 0.45), q[1] - L * Math.sin(ang - 0.45));
      ctx.lineTo(q[0] - L * Math.cos(ang + 0.45), q[1] - L * Math.sin(ang + 0.45));
      ctx.fill();
    }

    // control points (generous targets)
    const rr = 8 * (window.devicePixelRatio > 1 ? 1.8 : 1);
    for (const p of ctrl) {
      const [x, y] = toScreen(p);
      ctx.fillStyle = '#11151f';
      ctx.strokeStyle = '#6ea8fe';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  // ---------- 3D bundle view ----------
  const pane3d = createScenePane(paneR, { cameraPos: [0, -2.2, 3.4] });
  const sphereGeo = new THREE.SphereGeometry(1, 160, 80);
  const colors = new Float32Array(sphereGeo.attributes.position.count * 3);
  sphereGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sphereMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.65,
    metalness: 0.05,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  pane3d.scene.add(sphere);

  // equator seam
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(1.001, 0.012, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x232a3b }),
  );
  seam.rotation.x = Math.PI / 2; // torus default lies in xy; rotate into xz (equator, y-up)
  pane3d.scene.add(seam);

  // mismatch dial: reference hand (cap-N phase zero) + transition hand (rotated by arg c)
  const dial = new THREE.Group();
  const refHand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8),
    new THREE.MeshBasicMaterial({ color: 0x8a93a6 }),
  );
  refHand.position.y = 0.15;
  const gHandMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const gHand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8), gHandMat);
  gHand.position.y = 0.17;
  const gHandPivot = new THREE.Group();
  gHandPivot.add(gHand);
  const dialRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.008, 6, 48),
    new THREE.MeshBasicMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.5 }),
  );
  dial.add(refHand, gHandPivot, dialRing);
  pane3d.scene.add(dial);

  const angleAt = (phi: number): number => {
    if (angles.length === 0) return 0;
    const i = Math.round((((phi / (2 * Math.PI)) % 1) + 1) * angles.length) % angles.length;
    return angles[i];
  };

  pane3d.onFrame((_dt, t) => {
    const phi = (0.35 * t) % (2 * Math.PI);
    // equator point in y-up coordinates; "north tangent" is +y
    const rhat = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi)); // -sin: phi runs counter-clockwise seen from +y
    dial.position.copy(rhat.clone().multiplyScalar(1.02));
    // orient dial: local y stays world-y (reference phase 0), local z = radial out
    dial.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rhat);
    const a = angleAt(phi);
    gHandPivot.rotation.z = a; // rotate transition hand about the radial axis
    gHandMat.color.copy(phaseColor(a));
  });

  function paintSphere(): void {
    const pos = sphereGeo.attributes.position;
    const col = sphereGeo.attributes.color as THREE.BufferAttribute;
    const northern = new THREE.Color(0x33415e);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // y-up: northern cap is y > 0
      const z = pos.getZ(i);
      if (y >= 0) {
        tmp.copy(northern);
      } else {
        const phi = Math.atan2(-z, x); // matches dial parametrisation
        tmp.copy(phaseColor(angleAt(phi)));
        // dim slightly towards the pole so the vortex core reads as a point
        const fade = 0.75 + 0.25 * (1 + y); // y in [-1, 0]
        tmp.multiplyScalar(fade);
      }
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    col.needsUpdate = true;
  }

  // ---------- shared update ----------
  function recompute(flash = true): void {
    const per = Math.max(24, Math.ceil(480 / ctrl.length));
    samples = catmullRomClosed(ctrl, per);
    angles = transitionAngles(samples);
    const res = windingNumber(samples);
    hudBig.textContent = `n = ${res.n}`;
    hudSmall.textContent = `∮ d(arg c)/2π = ${res.raw.toFixed(7)}`;
    if (res.minRadius < 0.05) {
      hudBig.style.color = '#e05c5c';
      hudSmall.textContent = 'loop touching the origin — class undefined';
    } else if (res.n !== lastN && flash) {
      hudBig.style.color = '#f0a35e';
      setTimeout(() => (hudBig.style.color = ''), 450);
    } else {
      hudBig.style.color = '';
    }
    lastN = res.n;
    draw2d();
    paintSphere();
  }

  function setPreset(n: number): void {
    ctrl = presetControls(n);
    presetButtons.forEach((b, i) => b.classList.toggle('active', i === n + 2));
    recompute(false);
  }

  // ---------- dragging ----------
  let dragIdx = -1;
  const hitRadius = () => 30 * Math.min(window.devicePixelRatio, 2);

  const eventXY = (e: PointerEvent): [number, number] => {
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    return [(e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr];
  };

  // double-tap-to-remove bookkeeping: a second tap on the same control point
  // within this window deletes it (works for mouse double-click and touch).
  let lastTapTime = 0;
  let lastTapIdx = -1;
  const DOUBLE_TAP_MS = 350;

  const nearestCtrl = (x: number, y: number): number => {
    let best = -1;
    let bestD = hitRadius();
    ctrl.forEach((p, i) => {
      const [px, py] = toScreen(p);
      const d = Math.hypot(px - x, py - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = eventXY(e);
    const hit = nearestCtrl(x, y);

    // double-tap on an existing point removes it (min 3 enforced by the kernel)
    const now = performance.now();
    if (hit >= 0 && hit === lastTapIdx && now - lastTapTime < DOUBLE_TAP_MS) {
      const next = removePoint(ctrl, hit);
      if (next.length !== ctrl.length) {
        ctrl = next;
        dragIdx = -1;
        lastTapIdx = -1;
        recompute();
        e.preventDefault();
        return;
      }
    }
    lastTapTime = now;
    lastTapIdx = hit;

    if (hit >= 0) {
      dragIdx = hit;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // add-mode: clicking empty space inserts a vertex on the nearest edge and
    // immediately begins dragging it, so the user draws by placing points
    if (addMode) {
      const w = toWorld(x, y);
      w[0] = Math.max(-WORLD, Math.min(WORLD, w[0]));
      w[1] = Math.max(-WORLD, Math.min(WORLD, w[1]));
      const res = insertPointNearest(ctrl, w);
      ctrl = res.ctrl;
      dragIdx = res.index;
      lastTapIdx = res.index;
      canvas.setPointerCapture(e.pointerId);
      recompute();
      e.preventDefault();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragIdx < 0) return;
    const [x, y] = eventXY(e);
    const p = toWorld(x, y);
    p[0] = Math.max(-WORLD, Math.min(WORLD, p[0]));
    p[1] = Math.max(-WORLD, Math.min(WORLD, p[1]));
    ctrl[dragIdx] = p;
    recompute();
    e.preventDefault();
  });
  const endDrag = () => (dragIdx = -1);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---------- init ----------
  setPreset(1);
  sizeCanvas();

  return () => {
    obs.disconnect();
    pane3d.dispose();
  };
}
