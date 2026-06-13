# CLAUDE.md — gallery (R&S Vol. 2 visual companion)

> **Read the root `/CLAUDE.md` first.** It holds the shared, monorepo-wide rules
> (verification-first kernels, the `npm test` + `npm run build` oracle, never
> weakening tolerances, small committed increments, numerical hygiene, and the
> `@rsvis/math` shared-package policy). This file covers only what is specific to
> the gallery; it does not repeat the shared rules.

This subproject is an interactive visualization suite specified in
`TASK_RSVIS.md` — read it fully before writing anything here. You are running in
a cloud VM; the user reviews asynchronously via the PR, GitHub Pages, and
`PROGRESS.md` — assume zero mid-session human input.

## Gallery-specific rules

- **You cannot see the visuals**, which is *why* the math is verified
  numerically (see the root rules). Concretely here: each widget's geometric core
  is a pure module (in `@rsvis/math` for shared primitives, or in
  `gallery/src/math/` for widget-specific kernels) with vitest tests asserting the
  theorems in `TASK_RSVIS.md`. The Three.js renderer is a thin consumer; a widget
  without passing kernel tests does not exist.
- **Architecture.** Vite + TypeScript + Three.js (optionally lil-gui). No React,
  no state libraries, no CSS frameworks. Each widget is a module exporting
  `mount(container: HTMLElement): () => void`; the gallery is a hand-rolled index
  page that lazy-loads widgets.
- **Shared math comes from `@rsvis/math`.** Integrators, quadrature, quaternion
  algebra, winding number, seeded RNG are imported from the workspace package —
  do not re-copy them into `gallery/src/math/`. Widget-specific kernels (clutching,
  monopole, hopf, surfaces, degree, instanton, mobius) live locally under
  `gallery/src/math/`.
- **Captions in the UI:** LaTeX via KaTeX (cheap, static). Each widget panel has a
  short caption — the definition visualized, the theorem demonstrated, and a
  pointer to the R&S section as a `§TODO` placeholder for the user to fill in (do
  not guess section numbers).
- **Setup fallback.** If a package install is blocked by the network proxy, log it
  in `PROGRESS.md` and vendor a minimal substitute rather than stalling (KaTeX may
  be dropped for plain HTML math; Three.js cannot — if Three is unreachable, abort
  with a clear report).

## Deployment specifics

The gallery is served at the **site root**, `https://<user>.github.io/R-S-Visualizations/`,
so its Vite `base` is `/R-S-Visualizations/`. The shared Pages workflow at the repo
root builds and deploys it (along with `bundle` under `/bundle/`). The user must
enable Pages once (Settings → Pages → Source: GitHub Actions); deployment runs only
from `main`.

## Progress journal

Maintain `gallery/PROGRESS.md`: per widget — status, test results with actual
numerical errors vs tolerance, rendering caveats you could not verify (camera
framing, colors, z-fighting), and what to eyeball first. Final section: a viewing
guide ordered by the task spec's priority and honest notes on what is unpolished.
