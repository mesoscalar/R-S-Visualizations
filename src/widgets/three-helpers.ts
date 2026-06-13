/**
 * Shared Three.js boilerplate: one self-contained scene per pane with
 * camera, lights, orbit/touch controls, resize handling and a frame loop.
 * Widgets remain thin consumers of the math kernels.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface PaneOptions {
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
  fov?: number;
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
