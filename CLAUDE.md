# CLAUDE.md — R&S Vol. 2 visual companion

You are building an interactive visualization suite in this repo, specified in
`TASK_RSVIS.md`. Read it fully before writing anything. You are running in a cloud VM;
the user will review your work asynchronously via the PR, GitHub Pages, and
`PROGRESS.md` — assume zero mid-session human input.

## Ground rules

1. **You cannot see the visuals. Therefore the mathematics must be verified
   numerically.** Every widget's geometric core lives in a pure TypeScript module with
   no DOM/WebGL imports, and ships with vitest tests asserting the theorems listed in
   the task spec at stated tolerances. The rendering layer is a thin consumer of the
   math kernel. A widget without passing kernel tests does not exist.
2. **The oracle is `npm test` + `npm run build`.** Both must be green before any
   feature is reported complete. Never weaken a tolerance to make a test pass; if a
   test fails persistently, the math is wrong — debug the math, and log the
   investigation in `PROGRESS.md`.
3. **Small verified increments.** One widget at a time: kernel → tests green → renderer
   → wire into gallery → commit. Do not scaffold all widgets at once.
4. **No heavy frameworks.** Vite + TypeScript + Three.js (and optionally lil-gui for
   controls). No React, no state libraries, no CSS frameworks. Each widget is a module
   exporting `mount(container: HTMLElement)`; the gallery is a hand-rolled index page
   that lazy-loads widgets.
5. **Numerical hygiene.** All ODE integration via a shared RK4 with step-size control
   (or RKF45); all quadrature via shared utilities; seeds fixed in tests; tolerances
   chosen from convergence analysis, not vibes — state the rationale in a comment next
   to each tolerance.
6. **Mathematical notation in UI and docs:** LaTeX via KaTeX (cheap, static). Each
   widget's panel includes a short caption: the definition being visualized, the
   theorem being demonstrated, and a pointer to the relevant R&S section number left
   as `§TODO` placeholders for the user to fill in (do not guess section numbers).

## Setup expectations

The VM has node/npm preinstalled. `npm create vite@latest` (vanilla-ts template) or a
hand-written equivalent; `npm i three katex`, dev-deps `vitest`, types as needed. If a
package install is blocked by the network proxy, log it in `PROGRESS.md` and vendor a
minimal substitute rather than stalling (e.g. KaTeX can be dropped entirely in favor of
plain HTML math as a fallback; Three.js cannot — if Three is unreachable, abort with a
clear report).

## Deployment

Add a GitHub Actions workflow (`.github/workflows/pages.yml`) that builds the site and
publishes `dist/` to GitHub Pages on push to the working branch. Note in `PROGRESS.md`
that the user must enable Pages in repo Settings → Pages → Source: GitHub Actions
(one click, you cannot do it for them). Ensure the Vite `base` path is set correctly
for project pages (`/<repo-name>/`).

## Progress journal

Maintain `PROGRESS.md`: per widget — status, test results with actual numerical errors
achieved vs tolerance, known rendering caveats you could not verify (camera framing,
colors, z-fighting), and anything the user should eyeball first. Final section: a
viewing guide ordered by the task spec's priority, and honest notes on what is unpolished.

## End-of-session deliverables

1. `npm test` and `npm run build` green; gallery page linking all completed widgets.
2. Pages workflow in place; `PROGRESS.md` complete per above.
3. Commit history telling a coherent widget-by-widget story.
