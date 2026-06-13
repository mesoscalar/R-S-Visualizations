# CLAUDE.md — R-S-Visualizations monorepo (shared conventions)

This repository is a monorepo of sibling projects that share a common,
framework-agnostic math kernel:

```
/CLAUDE.md          ← this file: conventions shared by ALL subprojects
/math/              ← @rsvis/math: pure TS math kernel + its own vitest suite
/gallery/           ← R&S Vol. 2 visual companion (Vite + TS + Three.js)
/bundle/            ← forthcoming instrument (scaffold only; spec pending)
```

It is an npm-workspaces monorepo: one root `package.json` lists the workspaces,
one root `package-lock.json`, one hoisted `node_modules`. Install once at the
root with `npm ci` (or `npm install`).

> **Read order — non-negotiable.** Before working in any subproject, read **this
> root `CLAUDE.md`** AND that subproject's own `CLAUDE.md` (e.g.
> `/gallery/CLAUDE.md`, `/bundle/CLAUDE.md`). The root holds the shared rules;
> each subproject's file holds its specifics and may sharpen — but not relax —
> what is here.

## Shared ground rules

1. **Verification-first. The mathematics must be verified numerically.** Every
   project's geometric/numeric core lives in pure TypeScript with no DOM/WebGL/
   Three.js imports, and ships with vitest tests asserting the relevant theorems
   at stated tolerances. The rendering/UI layer is a thin consumer of that
   kernel. **A feature whose kernel tests do not pass does not exist.**

2. **The oracle is `npm test` + `npm run build`.** Both must be green before any
   feature is reported complete. **Never weaken a tolerance to make a test
   pass** — if a test fails persistently, the math is wrong; debug the math and
   record the investigation in the relevant `PROGRESS.md`.

3. **Small verified increments.** Work one unit at a time: kernel → tests green →
   consumer/renderer → commit. Do not scaffold many features ahead of their
   tests. Commit after each green build; keep a commit history that tells a
   coherent, reviewable story.

4. **Numerical hygiene.** Shared primitives — ODE integrators (RK4 / adaptive
   RKF45), quadrature, quaternion/group algebra, winding number, seeded RNG —
   live in **`@rsvis/math`**, not copied into subprojects. Fix seeds in tests.
   Choose every tolerance from a convergence/roundoff argument, not vibes, and
   state that rationale in a comment next to the tolerance.

5. **Shared code belongs in `@rsvis/math`.** Import it as
   `import { … } from '@rsvis/math'`. If you write something genuinely reusable
   and framework-agnostic in a subproject, promote it into `@rsvis/math` (with
   its own tests) rather than leaving a private copy. Keep `@rsvis/math` free of
   any DOM/WebGL/Three.js dependency.

6. **No heavy frameworks.** Vite + TypeScript is the baseline for the web
   subprojects; project-specific runtime deps (e.g. Three.js, KaTeX) are declared
   in that subproject. No React, no state libraries, no CSS frameworks.

7. **Code style.** TypeScript `strict`; match the surrounding file's style and
   idiom. Comment to state a constraint or a tolerance rationale the code cannot
   show — not to narrate what the next line does.

## Progress journals

Each subproject maintains its own `PROGRESS.md` (status, test results with actual
numerical errors vs tolerance, rendering caveats that could not be verified, and
a viewing guide). A root `PROGRESS.md` records monorepo-level state: structure,
what lives where, and cross-cutting decisions.

## Deployment

One GitHub Actions workflow (`.github/workflows/pages.yml`) tests the whole
monorepo and publishes a single GitHub Pages site with the projects at parallel
paths: a static landing page (`/landing/index.html`) at the root, the gallery
under `/gallery/`, and `bundle` under `/bundle/`. Pages must be enabled once by a human in
repo Settings → Pages → Source: GitHub Actions, and the `github-pages`
environment only deploys from the default branch (`main`).
