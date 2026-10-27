/**
 * Shared Three.js boilerplate (copied from gallery/src/widgets/three-helpers.ts;
 * rendering code cannot live in the DOM-free @rsvis/math): one self-contained scene per pane with
 * camera, lights, orbit/touch controls, resize handling and a frame loop.
 * Widgets remain thin consumers of the math kernels.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface PaneOptions {
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
  fov?: number;
  /** Camera up vector; [0, 0, 1] lets scenes use the book's z-up coordinates directly. */
  up?: [number, number, number];
  background?: number;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export interface ScenePane {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  /** Register a per-frame callback (dt and elapsed time in seconds). */
  onFrame: (cb: (dt: number, t: number) => void) => void;
  dispose: () => void;
}

export function createScenePane(container: HTMLElement, opts: PaneOptions = {}): ScenePane {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background ?? 0x0b0e14);

  const camera = new THREE.PerspectiveCamera(
    opts.fov ?? 40,
    (container.clientWidth || 1) / (container.clientHeight || 1),
    0.01,
    100,
  );
  camera.position.set(...(opts.cameraPos ?? [0, 1.6, 4.2]));
  if (opts.up) camera.up.set(...opts.up);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = opts.enablePan ?? false;
  controls.minDistance = opts.minDistance ?? 1.2;
  controls.maxDistance = opts.maxDistance ?? 20;
  if (opts.cameraTarget) controls.target.set(...opts.cameraTarget);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8899ff, 0.4);
  fill.position.set(-3, -2, -2);
  scene.add(fill);

  const observer = new ResizeObserver(() => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  observer.observe(container);

  const frameCbs: Array<(dt: number, t: number) => void> = [];
  let raf = 0;
  let last = performance.now();
  const t0 = last;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const cb of frameCbs) cb(dt, (now - t0) / 1000);
    controls.update();
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const dispose = () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    controls.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { scene, camera, renderer, controls, onFrame: (cb) => frameCbs.push(cb), dispose };
}

/** Phase angle -> colour (full hue wheel), shared by 2D and 3D panels. */
export function phaseColor(alpha: number): THREE.Color {
  const h = (((alpha / (2 * Math.PI)) % 1) + 1) % 1;
  return new THREE.Color().setHSL(h, 0.72, 0.55);
}

/** Same hue wheel as a CSS colour string for 2D canvas drawing. */
export function phaseColorCss(alpha: number, lightness = 55): string {
  const h = ((((alpha / (2 * Math.PI)) % 1) + 1) % 1) * 360;
  return `hsl(${h.toFixed(1)}, 72%, ${lightness}%)`;
}

/** DOM helper: element with class and optional text. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/**
 * Tube along a polyline with per-vertex colours (THREE.TubeGeometry resamples
 * by arclength, which would decouple colours from the curve parameter).
 * Normals are propagated by projection (rotation-minimising), so the round
 * tube shows no twist artefacts.
 */
export function coloredTube(
  pts: ReadonlyArray<readonly [number, number, number]>,
  colors: ReadonlyArray<THREE.Color>,
  radius: number,
  closed: boolean,
  radial = 8,
): THREE.Mesh {
  const n = pts.length;
  const V = (i: number) => new THREE.Vector3(pts[i][0], pts[i][1], pts[i][2]);
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = closed ? V((i - 1 + n) % n) : V(Math.max(0, i - 1));
    const b = closed ? V((i + 1) % n) : V(Math.min(n - 1, i + 1));
    tangents.push(b.sub(a).normalize());
  }
  let normal = new THREE.Vector3(0, 0, 1);
  if (Math.abs(normal.dot(tangents[0])) > 0.9) normal.set(1, 0, 0);
  const rings = closed ? n + 1 : n;
  const pos = new Float32Array(rings * (radial + 1) * 3);
  const col = new Float32Array(rings * (radial + 1) * 3);
  const nrm = new Float32Array(rings * (radial + 1) * 3);
  for (let r = 0; r < rings; r++) {
    const i = r % n;
    const t = tangents[i];
    normal.sub(t.clone().multiplyScalar(normal.dot(t))).normalize();
    const binormal = new THREE.Vector3().crossVectors(t, normal);
    const c = V(i);
    for (let j = 0; j <= radial; j++) {
      const ang = (2 * Math.PI * j) / radial;
      const d = normal.clone().multiplyScalar(Math.cos(ang)).add(binormal.clone().multiplyScalar(Math.sin(ang)));
      const k = (r * (radial + 1) + j) * 3;
      pos.set([c.x + radius * d.x, c.y + radius * d.y, c.z + radius * d.z], k);
      nrm.set([d.x, d.y, d.z], k);
      col.set([colors[i].r, colors[i].g, colors[i].b], k);
    }
  }
  const idx: number[] = [];
  for (let r = 0; r < rings - 1; r++) {
    for (let j = 0; j < radial; j++) {
      const a = r * (radial + 1) + j;
      const b = (r + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
}

/** Remove and dispose every child of a group. */
export function clearGroup(g: THREE.Group): void {
  for (const child of [...g.children]) {
    g.remove(child);
    child.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }
}

/**
 * Tap-to-pick on a mesh: fires `onPick` with the hit point when a pointer goes
 * down and up within a few pixels (so orbit drags are not mistaken for taps).
 */
export function onTap(
  pane: ScenePane,
  target: THREE.Object3D,
  onPick: (p: THREE.Vector3) => void,
): void {
  const ray = new THREE.Raycaster();
  let down: { x: number; y: number } | null = null;
  const canvas = pane.renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    down = null;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)),
      pane.camera,
    );
    const hits = ray.intersectObject(target, false);
    if (hits.length) onPick(hits[0].point.clone());
  });
}

/** Roughly uniform points on S² (Fibonacci lattice). */
export function fibonacciSphere(n: number): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < n; k++) {
    const z = 1 - (2 * (k + 0.5)) / n;
    const r = Math.sqrt(1 - z * z);
    pts.push([r * Math.cos(ga * k), r * Math.sin(ga * k), z]);
  }
  return pts;
}

/** An arrow helper with a mutable target, sized for unit-sphere scenes. */
export function makeArrow(color: number): THREE.ArrowHelper {
  return new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.1, 0.06);
}

export function setArrow(
  a: THREE.ArrowHelper,
  from: ArrayLike<number>,
  vec: ArrayLike<number>,
): void {
  const len = Math.hypot(vec[0], vec[1], vec[2]);
  a.visible = len > 1e-6;
  if (!a.visible) return;
  a.position.set(from[0], from[1], from[2]);
  a.setDirection(new THREE.Vector3(vec[0], vec[1], vec[2]).normalize());
  a.setLength(len, Math.min(0.1, 0.4 * len), Math.min(0.06, 0.25 * len));
}
