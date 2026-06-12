# PROGRESS — R&S Vol. 2 visual companion

Working branch: `claude/charming-volta-8l8bit`. Live site (once Pages is enabled):
`https://<user>.github.io/R-S-Visualizations/`.

> **⚠ One manual step for you:** enable GitHub Pages in repo **Settings → Pages →
> Source: GitHub Actions**. The deploy workflow (`.github/workflows/pages.yml`) runs on
> every push to the working branch and will publish automatically once that is set.

## Status board

| # | Widget | Kernel | Tests | Renderer | Notes |
|---|--------|--------|-------|----------|-------|
| — | Scaffold (utils, gallery, CI) | ✅ | ✅ 24/24 | ✅ skeleton | |
| 1 | Clutching laboratory | ✅ | ✅ 6/6 | ✅ | hue-vortex sphere; see caveats |
| 2 | Chern–Weil monopole | — | — | — | |
| 3 | Hopf bundle | — | — | — | |
| 4 | Parallel transport | — | — | — | |
| 5 | Degree / π₃(SU(2)) | — | — | — | |
| 6 | BPST instanton | — | — | — | |
| 7 | Möbius band | — | — | — | |

## Scaffold (committed first, per ground rules)

- **Stack:** Vite 5 + TypeScript (vanilla, hand-rolled scaffold), Three.js, KaTeX,
  vitest. No frameworks. `npm test`, `npm run build` both green.
- **Shared math utilities** (`src/math/`, pure modules, no DOM/WebGL):
  - `ode.ts` — classical RK4 (fixed step, with optional post-step projection for
    manifold ODEs) and adaptive RKF45 with PI-free standard step control
    (`h ← 0.9 h (tol/err)^{1/5}`, clamped ×[0.2, 5]).
    Tests: e¹ to 1e-11 with h=1e-3 (global error ~h⁴); measured convergence order
    on the harmonic oscillator = 4.0 ± 0.3; RKF45 hits analytic solutions to 1e-8 at
    tol 1e-10.
  - `quaternion.ts` — Hamilton product, conjugate, integer powers (binary
    exponentiation), exp/log, axis-angle, vector rotation. Convention
    `q = w + xi + yj + zk ↔ (z₁, z₂) = (w+ix, y+iz)`, matching the task's
    S³ ⊂ ℂ² convention. Tests: i·j=k table exact; associativity & norm
    multiplicativity to 1e-12 over 100 seeded random triples; exp∘log = id to 1e-12.
  - `quadrature.ts` — Gauss–Legendre (Newton on Pₙ, cached), GL on intervals,
    periodic trapezoid (spectral for periodic smooth integrands — used for all φ
    integrals), product rules on S² (GL in cos θ × trapezoid in φ) and S³
    (hyperspherical), and the ℝ⁴ radial reduction `∫ g(|x|)d⁴x = 2π² ∫ g r³ dr`
    with rational map r = s/(1−s) for the infinite tail.
    Tests: GL exact at degree 2n−1 to 1e-14; ∫_{S²}1 = 4π to 1e-13;
    ∫_{S³}1 = 2π² to 1e-12; BPST normalisation ∫(r²+1)⁻⁴ = π²/6 to 1e-12.
  - `winding.ts` — winding number of closed polylines via principal-branch
    argument increments (atan2 of cross/dot — exact for polygons missing the
    origin). Tests: ±1 circles, 0 for non-enclosing, square path.
  - `rng.ts` — mulberry32 seeded PRNG + Box–Muller + uniform S³ sampling, so all
    randomised tests and Monte Carlo runs are reproducible.
- **Gallery skeleton:** hash-routed landing page with the seven widget cards
  (theorem subtitles in KaTeX); unbuilt widgets shown greyed-out "in progress";
  widgets lazy-loaded via dynamic import.
- **Deploy:** `.github/workflows/pages.yml` — `npm ci && npm test && npm run build`,
  publishes `dist/` via `actions/deploy-pages`. Vite `base` set to
  `/R-S-Visualizations/`.

## Widget 1 — Clutching laboratory

- **Kernel** `src/math/clutching.ts` (+ shared `winding.ts`): closed Catmull–Rom
  spline through draggable control points; presets tracing $z^n$; deterministic
  origin-crossing family (circle centred at $(2-2s,0)$, crossing at $s=1/2$);
  perturbed circles $e^{int}(1+p(t))$ with $\sum|p| < 1$ for invariance tests.
- **Test results** (spec items a–d, all green):
  - (a) winding of $z^n$ at 400 samples = n **exactly** (integer), raw float drift
    < 1e-12 (pure roundoff: polygon winding is an exact integer sum of atan2 terms),
    all $|n| \le 5$.
  - (b) 50 seeded random smooth perturbations with $|c| \ge 0.3$: winding unchanged
    in every trial.
  - (c) origin-crossing family: winding constant (0) on $s\in[0,0.45]$, constant (1)
    on $s\in[0.55,1]$, jump exactly +1.
  - (d) 13 Lipschitz curves: winding at 200 samples == winding at 2000 samples.
  - Bonus: spline interpolates control points to 1e-12; preset polygons reproduce
    nominal winding through the spline.
- **Renderer** `src/widgets/clutching.ts`: 2D canvas loop editor (pointer events,
  ~30 px hit targets, drag clamped to the visible plane) with live $n$ readout, raw
  $\oint d\arg c/2\pi$ diagnostic, origin crosshair + faint $U(1)$ guide circle;
  3D sphere with the **southern cap coloured by the transition phase** — the
  clutching integer appears as an n-fold hue vortex at the south pole — plus an
  equatorial dial animating the cap mismatch $g(\varphi)$, and the loop in the 2D
  panel coloured by the same hue wheel.
- **Decision log:** the spec's "phase texture on two caps" is realised as: northern
  cap = flat reference colour (its own trivialisation's phase 0), southern cap hue =
  $\arg c(\varphi)$ extended along meridians. This extension is exactly the
  obstruction picture: it is continuous at the pole iff $n = 0$.
- **Rendering caveats (unverified visually):** dial orientation sign vs. loop
  traversal direction; whether the hue seam sits at $\varphi = 0$ unobtrusively;
  z-fighting of the equator seam torus at radius 1.001 (should be fine);
  camera starts south-tilted ([0,-2.2,3.4]) so the vortex is visible on load.

## Tolerance rationale (scaffold)

Stated next to each test in-code; summary: machine-precision claims (1e-12…1e-14)
are made only where the quadrature/algebra is exact-up-to-roundoff (GL on
polynomials, constants on spheres, quaternion identities); truncation-limited
claims follow from measured convergence order (RK4 order ≈ 4.0 measured).

## Viewing guide (will be finalised at the end)

Nothing visual to check yet beyond the landing page: dark gallery with 7 cards,
KaTeX rendering in card subtitles, unbuilt cards greyed out.

## Rendering caveats I cannot verify

(I cannot see the visuals; will be listed per widget as they are built.)
