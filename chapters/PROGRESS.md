# PROGRESS — chapters (book-ordered companion to R&S Part II)

Live path (after merge to `main`): `https://mesoscalar.github.io/R-S-Visualizations/chapters/`

## Scope so far

Chapter 1, §§1.1–1.3 (book pp. 1–36, read from a user-supplied PDF of
pp. 1–36 + front matter; the PDF is not in the repo). The contents page lists
**every** numbered item of §§1.1–1.3 (64 items: kind, number, title, page,
paraphrased gist), and §§1.4–1.9 by their table-of-contents entry only.
Five stations are built, the slate agreed with the user ("A B F G H" in the
planning conversation, renamed by section):

| Station | Section | Book items | Kernel | Tests |
|---|---|---|---|---|
| 1.1a The Hopf bundle and its trivializations | §1.1 | Def. 1.1.1, 1.1.5, Prop. 1.1.6, Ex. 1.1.20, Rem. 1.1.21 | `@rsvis/math` `hopf-book.ts` | 11 (in `math/test/hopf-book.test.ts`) |
| 1.1b Transition maps and Čech classes | §1.1 | Prop. 1.1.10, Thm. 1.1.11, Rem. 1.1.12, Cor. 1.1.13, Rem. 1.1.21; (1.1.5)–(1.1.7) | `src/math/cech.ts` | 5 |
| 1.2a Sections are equivariant functions | §1.2 | Ex. 1.2.4, Prop. 1.2.5, 1.2.6, 1.2.8, Rem. 1.2.15; (1.2.5), (1.2.8), (1.2.9) | `src/math/line-bundles.ts` | 7 |
| 1.3a Horizontal and vertical | §1.3 | Lemma 1.3.1, Def. 1.3.2, Rem. 1.3.3, Def. 1.3.4, Prop. 1.3.5, Ex. 1.3.22, 1.3.23 | `src/math/connection-split.ts` | 6 |
| 1.3b Local representatives and gauge transformations | §1.3 | Rem. 1.3.10, Prop. 1.3.11, Cor. 1.3.12; (1.3.11), (1.3.14), (1.3.15) | `src/math/gauge.ts` | 5 |

Plus `test/manifest.test.ts` (3): consecutive numbering, page order, items
inside their section's page range, stations citing existing items of their own
section in book order, station ids of the form `<section><letter>`.

Proposed but not built (cheapest next, since they share an SO(3) kernel):
frame bundles O⁺(S²) ≅ SO(3) (Ex. 1.1.14/1.1.18), vectors as classes
[(frame, components)] (Def. 1.2.1, Rem. 1.2.9/2), the Stiefel canonical
connection uᵀdu = pr_𝔥∘θ (Ex. 1.3.19/1.3.20). Also skippable: the
partition-of-unity connection (Prop. 1.3.7, Rem. 1.3.8) and the Hopf family
K = R, C, H (Ex. 1.1.22–1.1.26).

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

Integer-valued checks are exact: signed crossing counts (1.1b, 180 random
cochains, n = −2..3) and zero-index sums (1.2a, 56 random perturbations,
n = −3..3), each cross-checked against an independent winding-number count.

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

## What to look at first

1. **1.1b**: press "random cochains" a few times; crossings appear and
   disappear in ± pairs, while the degree readout doesn't move.
2. **1.2a**: n = −2, then push ε; watch zeros wander and pairs annihilate. Switch
   φ₁/φ₂ to see the n extra turns jump between poles.
3. **1.3b**: move the gauge sliders; the arrows reshape completely while the
   loop-integral dots stay pinned, one unit apart.
4. **1.3a**: drag "p along fibre" to see the horizontal disc ride along
   (equivariance); then switch connections on the right.
