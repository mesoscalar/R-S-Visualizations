/**
 * @rsvis/math — shared, framework-agnostic numerical kernel.
 *
 * Pure TypeScript: no DOM, WebGL, or Three.js imports anywhere in this package.
 * Both subprojects (gallery, bundle) import these primitives. Every export here
 * is covered by the vitest suite in math/test at stated tolerances.
 */
export * from './ode';
export * from './quaternion';
export * from './quadrature';
export * from './winding';
export * from './rng';
