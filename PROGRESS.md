# PROGRESS — R&S Vol. 2 visual companion

Working branch: `claude/charming-volta-8l8bit`. Live site (once Pages is enabled):
`https://<user>.github.io/R-S-Visualizations/`.

> **⚠ One manual step for you:** enable GitHub Pages in repo **Settings → Pages →
> Source: GitHub Actions**, then re-run the "publish" job (or push anything).
> Automatic enablement from CI was attempted (`configure-pages` with
> `enablement: true`) and is impossible: the workflow token gets
> *"Resource not accessible by integration"* — creating the Pages site needs
> repo-admin rights. Until you click it, the **test** job is the CI signal that
> matters (it is green); only the **publish** job fails.

## Status board

| # | Widget | Kernel | Tests | Renderer | Notes |
|---|--------|--------|-------|----------|-------|
| — | Scaffold (utils, gallery, CI) | ✅ | ✅ 24/24 | ✅ skeleton | |
| 1 | Clutching laboratory | ✅ | ✅ 6/6 | ✅ | hue-vortex sphere; see caveats |
| 2 | Chern–Weil monopole | ✅ | ✅ 6/6 | ✅ | quadrature exact-to-roundoff |
| 3 | Hopf bundle | ✅ | ✅ 6/6 | ✅ | σ = −1 measured; see caveats |
| 4 | Parallel transport | ✅ | ✅ 8/8 | ✅ | incl. full Gauss–Bonnet cross-check |
| 5 | Degree / π₃(SU(2)) | ✅ | ✅ 5/5 | ✅ | QMC inverse-CDF bug found & fixed |
| 6 | BPST instanton | ✅ | ✅ 5/5 | ✅ | 4D scheme cross-check from measured convergence |
| 7 | Möbius band | ✅ | ✅ 4/4 | ✅ | mostly visual, per spec |

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

## Widget 2 — Chern–Weil on the monopole bundle

- **Kernel** `src/math/monopole.ts`: $A_\pm = \frac{n}{2}(\pm 1-\cos\theta)d\phi$;
  perturbations realised as global 1-forms $a = u\,dv$ with $u,v$ restrictions of
  polynomials in $(x,y,z)$ — guaranteed smooth at the poles — giving
  $(da)_{\theta\phi} = u_\theta v_\phi - u_\phi v_\theta$, all simplified by hand
  (5-element basis: $z\,dx$, $x\,dy$, $xy\,dz$, $z^2dy$, $(x^2{-}y^2)dz$).
- **Decision log:** the spec's example family `d(cos kθ cos mφ)` is exact
  ($d\circ d = 0$), which would not slosh the density at all; the intent
  ("density sloshes, integer pinned") requires non-closed global 1-forms, hence
  the $u\,dv$ basis above. Stokes ($\int_{S^2} da = 0$) is asserted per basis
  element to 1e-12.
- **Test results** (all green):
  - Scheme check $\int_{S^2}dA = 4\pi$: error < 1e-12 (spec asked first).
  - $c_1 = n$, zero perturbation, $n=-2..3$: spec 1e-8, actual < 1e-12
    (constant density — GL×trapezoid exact up to roundoff).
  - 20 seeded random $\lambda \in [-2,2]^5$: spec 1e-6, actual < 1e-11
    (densities are low-degree trig polynomials, the 64×128 rule is exact for them).
  - $A_+ - A_- = n\,d\phi$ across the overlap (transition is pure gauge).
- **Renderer** `src/widgets/chern-weil.ts`: vertex-coloured diverging heatmap
  (orange = positive, blue = negative density, dark = 0, auto-normalised), five
  λ-sliders with KaTeX labels, n selector, live c₁ readout to 8 decimals
  recomputed by 48×96 quadrature on every slider input (~25k evals, instant).
- **Rendering caveats:** heatmap contrast at small |λ| (density nearly constant
  ⇒ nearly uniform orange — correct but undramatic until sliders move); the φ
  parametrisation seam should be invisible since density is smooth in φ.

## Widget 3 — Hopf bundle: fibers, connection, holonomy

- **Kernel** `src/math/hopf.ts`: Hopf map and its exact (quadratic) differential;
  structural shortcut — with $q\in S^3$ a quaternion, left multiplication gives the
  orthonormal tangent frame $\{iq, jq, kq\}$ in which $iq$ is vertical and
  $\{jq,kq\}$ horizontal for $\omega = \mathrm{Im}\langle z, dz\rangle$, and $dh$
  is **conformal with factor 2** on the horizontal space (asserted to 1e-12), so the
  lift ODE needs no linear solve: $\dot z = \tfrac14 (dh(jq)\!\cdot\!\dot p)\,jq +
  \tfrac14 (dh(kq)\!\cdot\!\dot p)\,kq$. Lift integration: shared RK4 +
  renormalisation each step. Stereographic projection from pole $(0,0,0,1)$;
  polygonal Gauss linking double sum.
- **Holonomy sign:** determined numerically (lift around CCW latitude circles,
  ratio phase/(Ω/2) = −1.000000000000 across θ₀ ∈ {0.2, 0.5, 1.0}), then
  hard-coded `HOLONOMY_SIGN = -1` with comment, per spec.
- **Test results** (spec items a–d, all green):
  - (a) max over the whole path: $||z|-1| < 10^{-12}$ (renorm), base-tracking
    error $< 10^{-9}$ — actual ≈ 1e-13 at h = 2π/4000 (RK4 global ~h⁴).
  - (b) octant triangle: |phase − (−π/4)| < 1e-6 (actual ~1e-12).
  - (c) phase/Ω = −1/2 to 1e-6 for θ₀ = 0.05, 0.1, 0.2 (exact theory: equality
    for all circles; deviation is pure truncation).
  - (d) Gauss linking of fiber pairs = 1 ± 1e-4 at M = 512 (measured O(M⁻²):
    1.2e-4 at M = 256), rounds to exactly 1, three distinct base-point pairs.
- **Renderer** `src/widgets/hopf.ts`: draggable base point (raycast onto sphere,
  orbit controls suspended during drag), latitude-circle loop with radius slider
  or octant-triangle preset, animated 7 s traversal with white lift trail in the
  stereographic view, phase-coloured fiber tube (hue = fiber coordinate α),
  live Δ readout vs. predicted σΩ/2, orange mismatch arc drawn along the fiber at
  completion, 10-fiber linked-family toggle (canonical Hopf picture).
- **Decision log:** the base point is clamped ≥ 0.25 rad from the south pole —
  that fiber passes through the projection pole and its image is an unbounded
  line; noted in the caption. The live Δ during traversal is measured against the
  reference section over the *current* base point (gauge-dependent but
  pedagogically the natural dial); the final readout is the genuine holonomy.
- **Rendering caveats:** trail-line rebuild per frame is O(idx) — acceptable at 2400
  samples; fiber family near-tangency for adjacent hues; whether the mismatch arc
  sweeps the visually "short" way around the fiber for |Δ| > π is untested.

## Widget 4 — Parallel transport and holonomy on surfaces

- **Kernel** `src/math/surfaces.ts`: five surfaces (sphere, cylinder, torus,
  catenoid, plane) with analytic first/second derivatives; **generic** Gauss
  curvature from fundamental forms (no hard-coded K in the math path); extrinsic
  transport ODE $\dot X = -\langle X,\dot N\rangle N$ with $\dot N$ analytic via
  the normalised-cross-product derivative; geodesic flow via the
  first-fundamental-form 2×2 system; joint geodesic+Jacobi integration
  ($J'' = -KJ$); $\int\!\!\int K\,dA$ over parameter ellipses (GL × trapezoid).
- **Test results** (spec a–d plus extras, all green):
  - Generic K vs analytic closed forms on all five surfaces: < 1e-12.
  - (a) wiggly torus loop: |X| drift AND tangency drift < 1e-9 (actual ~1e-12;
    no projection applied — conservation is measured, not enforced).
  - (b) octant triangle holonomy = +π/2 = excess to 1e-6 (sign measured: CCW
    traversal, outward normal ⇒ +∫K dA; actual error ~5e-15).
  - (c) cylinder around-loop with axial wiggle: holonomy < 1e-9; plane: < 1e-12
    (N constant ⇒ ODE trivially zero).
  - (d) sphere Jacobi J = sin t to 1e-6 (actual 8e-15 at h ≈ 7e-4).
  - **Gauss–Bonnet beyond triangles:** transport holonomy = ∫∫K dA (mod 2π) for
    parameter ellipses on sphere/torus/catenoid to 1e-6 — the widget's live
    "predicted vs measured" readout is itself under test.
  - Geodesics: metric speed conserved (FD-limited check at 1e-4); equator great
    circle stays planar to 1e-12.
- **Renderer** `src/widgets/transport.ts`: K-heatmap surface (same diverging
  palette as Widget 2), transported orthonormal frame (blue X, green N×X, grey
  ghost of the start vector), loop-size slider, live holonomy vs ∫∫K dA readout,
  "around the cylinder!" punchline button (predicted 0), geodesic spray mode
  (14 unit-speed geodesics fanned in metric angle, animated front).
- **Rendering caveats:** double-sided surface shading on the catenoid neck;
  spray paths may exit the chart on non-periodic surfaces (clamping not
  enforced — paths simply extend; mathematically fine, visually may pierce);
  arrow scale fixed at 0.45 regardless of surface size.

## Widget 5 — Degree and π₃(SU(2)) ≅ ℤ

- **Kernel** `src/math/degree.ts`: degree integrand $\det Df$ by central finite
  differences along geodesics in the left-translation frames $\{iq,jq,kq\}$
  (consistent orientation source & target; h = 1e-5 balances $O(h^2)$ truncation
  ≈ 1e-10 against rounding ≈ 1e-11). Estimators: product-GL quadrature on
  hyperspherical coordinates, seeded plain MC with σ/√N error bars, deterministic
  Halton QMC (inverse-CDF in χ). Newton preimage solver in tangent frames with
  geodesic damping; closed-form preimage branches of circles under $q\mapsto q^n$
  (via $\exp(u(\psi + 2\pi k)/n)$); Newton continuation tracer for perturbed maps.
- **Debug log (the kind worth recording):** the first QMC implementation used
  Newton for the χ inverse-CDF; $F'=\tfrac{2}{\pi}\sin^2\chi$ vanishes at the
  endpoints, Newton silently diverged for small $u$, and the estimator carried a
  systematic +0.55 bias at every N (degree 3.55 ≠ 3 — caught precisely because
  the answer must be an integer). Replaced with 48-step bisection: errors fell to
  3.4e-4 (N=50k), 4.0e-5 (N=200k), the expected (log N)³/N behaviour.
- **Test results** (spec a–c, all green):
  - (a) quadrature deg $f_n$, $n=1,2,3$: spec 1e-3, actual 5e-11…1.2e-9; QMC at
    stated N = 200,000: error 4.0e-5 < 1e-3.
  - (a′) plain MC (seed 99, N=1e5): 1.9969 ± 0.0063 — within 1σ of 2, error bar
    asserted honest (1e-4 < σ < 0.05).
  - (b) perturbed $f_2$ (eps = 0.15, 0.35): degree 2 to 1e-3 (actual 2.9e-8).
  - (c) preimage counts 1/2/3 exactly (60 seeded Newton starts, dedup at 1e-4),
    each root maps back to the target to 1e-9.
  - Foliation: closed-form branches map back onto the circle to 1e-12;
    continuation closes up on the perturbed map to 1e-6.
- **Renderer** `src/widgets/degree.ts`: n preimage curves of a great circle
  through the (fixed, regular) target as hue-coded tubes in stereographic ℝ³;
  white dots = the n preimages of the target itself; homotopy slider re-traces
  curves by Newton continuation; readouts: quadrature degree (6 decimals) plus an
  independent MC estimate with error bar.
- **Rendering caveats:** for n=1 the single curve may look unremarkable (correct);
  continuation at eps=0.4 occasionally takes visibly polygonal corners at 200
  samples; degree recompute is on slider release ('change'), not live drag.

## Widget 6 — BPST instanton density

- **Kernel** `src/math/instanton.ts`: density, radial reduction
  $\int q\,d^4x = 2\pi^2\int_0^\infty q(r)r^3dr$ (shared `integrateR4Radial`),
  independent full-4D tensor-GL cross-check with the rational tail map
  $x = s/(1-s^2)$ per axis, slice sampling with exact-centre grids.
- **Test results** (all green):
  - Analytic check $\int d^4x\,(|x|^2+\rho^2)^{-4} = \pi^2/6\rho^4$ for
    $\rho = \tfrac12, 1, 2$: error < 1e-10 (relative; roundoff-level).
  - Total charge = 1: spec 1e-4, actual < 1e-10, for ρ ∈ {0.3, 0.5, 1, 1.7, 3}.
  - 4D scheme cross-check (offset centre, no radial trick): measured geometric
    convergence 7.2e-5 / 1.1e-6 / 9.6e-8 / 1.6e-8 at n = 16/24/32/40 per axis;
    test runs n = 32 against 1e-6 (10× margin).
  - ρ-squeeze: peak scales exactly ×16 when ρ halves; charge unchanged to 1e-10.
  - Slice argmax = centre exactly; max value = analytic `slicePeak` to 1e-14.
- **Renderer** `src/widgets/instanton.ts`: 31³ additive point cloud; colour
  normalised against the *through-centre* peak for the current ρ (so moving the
  x₄ slider genuinely dims the slice — not per-slice renormalised), γ = 0.45
  for visibility; ρ and x₄ sliders; live charge readout via radial quadrature.
- **Rendering caveats:** additive blending on a 31³ cloud may bloom on bright
  screens; point size fixed (no perspective-density compensation).

## Widget 7 — Möbius band as the nontrivial ℤ/2-bundle

- **Kernel** `src/math/mobius.ts`: cylinder & Möbius embeddings and fiber
  directions; antiperiodic sections via half-integer harmonics (these are
  *exactly* the continuous sections of the Möbius band); robust bisected zero
  finding; Čech ℤ/2 class as the product of transition signs with the
  coboundary action.
- **Test results** (trivial by design, per spec): $m(u+2\pi, t) = m(u, -t)$ and
  cylinder periodicity to 1e-12; 50 seeded random antiperiodic sections all have
  an odd number ≥ 1 of zeros; the cylinder's nonvanishing section confirmed;
  Čech class invariant under 40 random coboundaries, cylinder (+1) ≠ Möbius (−1).
- **Renderer** `src/widgets/mobius.ts`: side-by-side bands, chart arcs in
  blue/orange with seams coloured by transition sign (green +1, red −1 — the
  Möbius band has one of each), comb slider moving a section: 48 fiber arrows
  per band, the cylinder's never vanish, the Möbius band's forced zero tracked
  live by bisection and marked with a red dot.
- **Rendering caveats:** arrows at near-zero length are clamped to 0.02 for
  visibility (the red dot, not arrow length, marks the true zero); seam colour
  bands are painted by u-interval, so their widths are approximate.

## Tolerance rationale (scaffold)

Stated next to each test in-code; summary: machine-precision claims (1e-12…1e-14)
are made only where the quadrature/algebra is exact-up-to-roundoff (GL on
polynomials, constants on spheres, quaternion identities); truncation-limited
claims follow from measured convergence order (RK4 order ≈ 4.0 measured).

## Viewing guide (final)

All seven widgets are built, tested and wired into the gallery. `npm test`:
**64/64 green**; `npm run build`: green. Ordered by the task spec's priority —
what to eyeball first on each:

1. **Clutching laboratory** — drag a control point of the Hopf preset slowly
   through the red origin cross: the readout should freeze everywhere else and
   jump exactly ±1 at the crossing. Check the south-pole hue vortex matches n
   (rotate the sphere south-up; camera starts tilted that way).
2. **Chern–Weil monopole** — slam all five sliders around: the heatmap should
   slosh dramatically while c₁ holds all 8 displayed decimals. Switch n and
   confirm the readout follows the selector instantly.
3. **Hopf bundle** — press ▶ on the default latitude loop: white trail should
   spiral in the right pane and end visibly displaced along the fiber; the Δ
   readout should match the predicted σΩ/2 line to ~6 decimals. Then toggle
   "show fiber family" — the canonical linked-circles picture. Octant preset:
   Δ = −0.785398.
4. **Surface transport** — sphere: run transport, watch blue/green frame end
   rotated against the grey ghost; readout vs ∫K dA line should agree.
   Cylinder: press "around the cylinder!" — holonomy 0.000000 is the punchline.
   Spray mode on the sphere: geodesics should refocus at the antipode.
5. **Degree / π₃(SU(2))** — n = 3: three linked tubes, three white dots; drag
   the homotopy slider: tubes deform, "deg" readout stays 3.000000.
6. **BPST instanton** — pull ρ down to 0.25: the cloud collapses to a bright
   point but ∫q stays 1.00000000. Slide x₄ away from 0: the whole slice dims
   (deliberately not renormalised per slice).
7. **Möbius band** — comb slider: red dot slides around the band but never
   leaves; cylinder arrows never die. One green and one red seam on the Möbius
   band, two green on the cylinder.

**Honest notes on what is unpolished:**
- All rendering-level caveats are listed per widget above; none affect the
  verified math. The biggest visual risks: dial orientation in Widget 1,
  mismatch-arc "long way round" in Widget 3 when |Δ| > π, and additive-blend
  bloom in Widget 6.
- Touch: pointer events + pinch (OrbitControls) are wired everywhere, hit
  targets ≥ ~30 px, but none of it has been exercised on a real device.
- No Berry-phase stretch widget (spec marked it "true stretch"); polish budget
  went to test depth instead (e.g. the arbitrary-loop Gauss–Bonnet test and the
  4D quadrature cross-check, both beyond the spec's minimums).
- Widget 1's curve editor only drags existing control points (no point
  insertion); the presets give 8–24 points, which is plenty to cross the origin.

## Test summary

64 tests, all green, < 5 s wall time. Worst measured numerical errors vs spec:

| Claim | Spec tol | Measured |
|---|---|---|
| winding(zⁿ) = n, 400 pts | exact | exact (raw < 1e-12) |
| c₁ = n, 20 perturbations | 1e-6 | < 1e-11 |
| Hopf lift on S³ / over γ | 1e-9 | ~1e-15 / ~1e-13 |
| octant holonomy = π/4 | 1e-6 | ~1e-12 |
| fiber linking = 1 | (integer) | ±1e-4 at M=512 |
| transport norm/tangency | 1e-9 | ~1e-12 |
| sphere Jacobi = sin t | 1e-6 | 8e-15 |
| deg fₙ = n | 1e-3 | 1.2e-9 (quad), 4e-5 (QMC N=2·10⁵) |
| instanton charge = 1 | 1e-4 | < 1e-10 |
