# PROGRESS — chapters (book-ordered companion to R&S Part II)

Live path (after merge to `main`): `https://mesoscalar.github.io/R-S-Visualizations/chapters/`

## Scope so far

Chapter 1, §§1.1–1.3 (book pp. 1–36, read from a user-supplied PDF of
pp. 1–36 + front matter; the PDF is not in the repo). The contents page lists
**every** numbered item of §§1.1–1.3 (64 items: kind, number, title, page,
paraphrased gist), and §§1.4–1.9 by their table-of-contents entry only.
All ten proposed stations are built: the first five ("A B F G H" in the
planning conversation, renamed by section) in PR #4, the other five in the
follow-up PR.

| Station | Section | Book items | Kernel | Tests |
|---|---|---|---|---|
| 1.1a The Hopf bundle and its trivializations | §1.1 | Def. 1.1.1, 1.1.5, Prop. 1.1.6, Ex. 1.1.20, Rem. 1.1.21 | `@rsvis/math` `hopf-book.ts` | 11 (in `math/test/hopf-book.test.ts`) |
| 1.1b Transition maps and Čech classes | §1.1 | Prop. 1.1.10, Thm. 1.1.11, Rem. 1.1.12, Cor. 1.1.13, Rem. 1.1.21; (1.1.5)–(1.1.7) | `src/math/cech.ts` | 5 |
| 1.1c Frame bundles | §1.1 | Ex. 1.1.4, Prop. 1.1.6, Ex. 1.1.14, 1.1.18, Def. 1.1.19 | `@rsvis/math` `frames.ts` | 9 (in `math/test/frames.test.ts`, shared with 1.3d) |
| 1.1d The Hopf family over R, C, H | §1.1 | Ex. 1.1.22, Rem. 1.1.23, Ex. 1.1.24, Rem. 1.1.25, Ex. 1.1.26 | `src/math/hopf-family.ts` (+ `@rsvis/math` `degree.ts`) | 5 |
| 1.2a Sections are equivariant functions | §1.2 | Ex. 1.2.4, Prop. 1.2.5, 1.2.6, 1.2.8, Rem. 1.2.15; (1.2.5), (1.2.8), (1.2.9) | `src/math/line-bundles.ts` | 7 |
| 1.2b A vector is a class [(frame, components)] | §1.2 | Def. 1.2.1, Rem. 1.2.3, Prop. 1.2.6, Rem. 1.2.9; (1.2.2), (1.2.3), (1.2.5) | `src/math/associated-tangent.ts` | 5 |
| 1.3a Horizontal and vertical | §1.3 | Lemma 1.3.1, Def. 1.3.2, Rem. 1.3.3, Def. 1.3.4, Prop. 1.3.5, Ex. 1.3.22, 1.3.23 | `src/math/connection-split.ts` | 6 |
| 1.3b Local representatives and gauge transformations | §1.3 | Rem. 1.3.10, Prop. 1.3.11, Cor. 1.3.12; (1.3.11), (1.3.14), (1.3.15) | `src/math/gauge.ts` | 5 |
| 1.3c The affine space of connections | §1.3 | Prop. 1.3.5, 1.3.7, Rem. 1.3.8; (1.3.8) | `src/math/affine-connections.ts` | 5 |
| 1.3d The canonical connection of the Stiefel bundle | §1.3 | Ex. 1.3.19, 1.3.20, Rem. 1.3.21; (1.3.17)–(1.3.19) | `@rsvis/math` `frames.ts` | (shared with 1.1c) |

Plus `test/manifest.test.ts` (3): consecutive numbering, page order, items
inside their section's page range, stations citing existing items of their own
section in book order, station ids of the form `<section><letter>`.

Not visualized (by design, low pictorial payoff): morphisms and pullbacks
(Def. 1.1.7, Rem. 1.1.8/1.1.9), fibre metrics (Def. 1.1.16, Rem. 1.1.17),
forms of type σ (Def. 1.2.10–Rem. 1.2.15 beyond the k = 0 case),
connections under morphisms (Prop. 1.3.13–Rem. 1.3.17). They appear in the
contents spine with their gists.

## Conventions (the book's, implemented verbatim)

- Hopf map f(z) = (2z̄₁z₂, |z₁|² − |z₂|²) (Rem. 1.1.21/1) — identical to the
  gallery's `hopfMap`, which is why that kernel could be promoted and reused.
- U₁ = S² ∖ {π(0,1)} = S² ∖ {south}, U₂ = S² ∖ {north}; κᵢ = zᵢ/|zᵢ|;
  sᵢ = χᵢ⁻¹(·, 1); s₂ is the book's g₊.
- ρ₁₂ = κ₁κ₂⁻¹ = e^{−iφ} in the standard azimuth φ. The book's loop γ̃(t) of
  Rem. 1.1.21/2 runs the equator with φ = −t, so ρ₁₂∘γ = e^{it} has degree +1
  as the book says. Stations report degrees **along γ** (1.1b) and say so;
  the zero count of 1.2a is w.r.t. the outward orientation of S² and equals −n.
- ω_c = z̄₁dz₁ + z̄₂dz₂ (Ex. 1.3.22), u(1) = iℝ-valued; kernels return the real
  coefficient a of ω = i·a.
- 𝒜₁ = (i/2)(1 − cos θ)dφ, 𝒜₂ = −(i/2)(1 + cos θ)dφ, 𝒜₂ = 𝒜₁ + ρ₁₂*θ with
  ρ₁₂*θ = −i dφ (Cor. 1.3.12 with (i, j) = (1, 2)).
- Frames (1.1c, 1.2b, 1.3d): Ex. 1.1.18 orders the columns [x | u₁ | u₂]
  (R^{n+1} = R ⊕ Rⁿ, SO(2) acting by diag(1, b)); the Stiefel picture of
  Ex. 1.3.20 orders them [u₁ | u₂ | x] (the k-frame first, U(k) the upper
  block). Same bundle, two column orders; each station uses the one its item uses.
  ω_c = uᵀdu is reported by its (2,1) entry u₂·du₁, so the generator
  b′(0) = [[0, −1], [1, 0]] has ω_c(A*) = +1.
- Frame sections s_N, s_S are the normalised coordinate frames of the two
  stereographic charts (s_S = M s_N M, M = rotation by π about the x-axis);
  their transition is ρ_NS = π + 2φ on the equator, degree 2.
- **Rem. 1.3.21 as printed** calls T "an arbitrary ((n − k) × n)-matrix"; the
  block matrix [[0, −T†], [T, 0]] forces (n − k) × k. Station 1.3d implements
  and states the latter.
- Quaternionic Hopf (1.1d): the base identification HP¹ ≅ S⁴ uses the
  book's map (B.1) in an appendix not supplied; the station avoids it by
  working on the slice (w, 1)/√2, which meets each fibre over the equator
  |q₁| = |q₂| exactly once.

## Measured errors vs tolerance

Worst cases over seeded random samples (2000 points for the algebraic
identities, 200 for the rest; `mulberry32(42)`), measured on this branch:

| Quantity | Measured max | Test tolerance | Rationale |
|---|---|---|---|
| f(sᵢ(m)) = m (sections over base) | 2.4e-13 | 1e-13·(1 + 1/(1 − \|t\|)) | sᵢ divide by √(1 ± t): conditioning ~1/(1 ∓ t) |
| κᵢ(p·a) = κᵢ(p)a (1.1.2) | 4.0e-16 | 1e-13 | a few flops on O(1) numbers |
| ρ₁₂ = e^{−iφ}; ρ₁₂(γ(t)) = e^{it} | 5.7e-16 | 1e-12 / 1e-13 | same |
| (1.1.7) ρ′₁₂ = ρ₁ρ₁₂ρ₂⁻¹ | 1.7e-15 | 1e-13 | same (equator: t = 0, well conditioned) |
| φ₁ = ρ₁₂ⁿφ₂ (Rem. 1.2.15) | 2.8e-15 | 1e-11 | products of ≤ 3 linear forms + perturbation |
| ω_c(hor X) = 0 (1.3.7) | 5.3e-16 | 1e-13 | bilinear |
| s₁*ω_c vs (i/2)(1 − cos θ)dφ (FD) | 5.6e-11 | 1e-8 (math), 1e-7 (chapters) | central difference h = 1e-5: h² + ε/h |
| gauge law 𝒜 ↦ 𝒜 + i dλ (FD) | 7.5e-10 | 1e-7 | two FDs, \|∇λ\| ≤ 8 |
| (1/2πi)∮𝒜₁ = (1 − cos θ)/2, any gauge | 2.2e-10 | 1e-7 | trapezoid is spectral; residual = FD error |
| frames orthonormal/oriented (s_N, \|z\| ≤ 0.95) | 4.9e-16 | 1e-13·(1 + 1/(1 − \|z\|)) | sections divide by 1 ± z |
| ρ_NS = π + 2φ on the equator | 1.5e-15 | 1e-13 | a few flops |
| (1.2.5) ξ_N = b(ρ_NS) ξ_S | 9.4e-16 | 1e-13 | same |
| ω_PU − ω_c = π*β (Rem. 1.3.8) | 1.4e-15 | 1e-13 · 400 | dφ carries 1/(x² + y²) ≤ 400 |
| torus slope of ω_t (FD) | 6.1e-11 | 1e-8 | central difference h = 1e-5 |
| κ_i(q·u) = κ_i(q)u, K = H | 5.0e-16 | 1e-13 | quaternion products |
| Stiefel/LC transport: one-turn angle vs 2π(1 − cos θ₀) | 1.5e-13 | 1e-9 | RK4, h = 2π/4000 |
| quaternionic degree under cochains (GL 32·32·64) | 4.4e-8 | 1e-4 | measured convergence 1e-1 → 1e-2 → 4e-8 over three grids |

Integer-valued checks are exact: signed crossing counts (1.1b, 180 random
cochains, n = −2..3), zero-index sums (1.2a, 56 random perturbations,
n = −3..3), each cross-checked against an independent winding-number count;
the frame transition degree 2 on three latitudes (1.1c); the index sum 2 of
40 random gradient fields (1.2b); deck shifts 2πn of lifted loops (1.1d).

## Investigations (recorded per the root rules)

1. **Section conditioning (1.1a).** The first run of the hopf-book tests
   failed one assertion at 1.1e-13 against a flat 1e-13. Not a wrong formula:
   sᵢ divides by √(1 ± t), so roundoff in t is amplified ~1/(1 ∓ t) near the
   excluded pole. The tolerance was restated as that conditioning bound
   (capped at 1000×), and the comment next to it says why.
2. **Zero counting (1.2a).** The first zero-locator took the winding of each
   (θ, φ) grid cell from its four corners. One random n = 3 section counted −2:
   near a zero in a neighbouring cell an edge turned arg Φ by more than π, and
   atan2 took the wrong branch. Fixed in the *method*: each edge is bisected
   until every step turns the argument by < π/4. The assertion is unchanged
   (exact integer).

3. **Frame-kernel tests (1.1c/1.3d), first run.** Two assertions failed, both in
   the test code: I expected ω_c(A*) = −1 for the generator of b(β), but
   b′(0) = [[0, −1], [1, 0]] has (2,1) entry +1, so ω_c(A*) = +1 = A as
   Prop. 1.3.5/2 demands; and one check read a column-stored matrix as
   row-major. Both fixed with comments; no tolerance touched.
4. **Degree tolerance (1.1d).** The first draft justified 1e-4 by an error
   figure attributed to the gallery that I had not checked. Replaced by
   measurements on the actual maps (table above).

## Rendering caveats (checked only by headless screenshots)

Every station was rendered once in headless Chromium (SwiftShader WebGL) with
no console errors, and the screenshots looked right. Not verified: touch
interaction on a real phone (tap-to-place uses a 6 px tap/drag threshold),
frame rate on low-end devices (1.2a and 1.3b recompute on every slider move;
1.3b measured ~35 ms per update in headless Chromium), and whether the
Fibonacci-sampled arrow field in 1.3b reads clearly at phone size.

- 1.1a: fibres near the south pole are huge in the projection; the base point
  is clamped to θ ≤ π − 0.05 and fibres are clipped at radius 9.
- 1.1b: steep section curves (cochain slopes up to |a| + 2|b| ≈ 12) look
  nearly vertical in the 2D square; that is real, not a wrap artefact
  (largest drawn step measured at 0.10 rad).
- 1.2a: the right pane can look busy with large |n|; zero markers come from
  the grid locator (cell centres), so they sit within ~0.04 rad of the zero.

- 1.1c: the π-ball picture of SO(3) identifies antipodal boundary points, so
  fibres appear as chords that jump across the boundary.
- 1.1d: the quaternionic degree is recomputed on slider *release*
  (~0.3 s for 65k quadrature nodes); the great-circle images update live.
- 1.3d: the latitude path is precomputed with 720 RK4 steps; the 𝔥/𝔪 matrix
  uses the exact derivative, so the 𝔥-block reads 0.000 for horizontal motion.

## What to look at first

1. **1.1b**: press "random cochains" a few times; crossings appear and
   disappear in ± pairs, while the degree readout doesn't move.
2. **1.2a**: n = −2, then push ε; watch zeros wander and pairs annihilate. Switch
   φ₁/φ₂ to see the n extra turns jump between poles.
3. **1.3b**: move the gauge sliders; the arrows reshape completely while the
   loop-integral dots stay pinned, one unit apart.
4. **1.3a**: drag "p along fibre" to see the horizontal disc ride along
   (equivariance); then switch connections on the right.
5. **1.3c**: slide t and the cutoffs; every slope curve on the right still
   runs from 0 to 1. Then **1.3d**: press "go around" with spin 0, then with spin.
6. **1.1c → 1.2b**: the frame fields each break at a pole; in 1.2b turn the frame
   and watch the components counter-rotate.
