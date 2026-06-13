# TASK: R&S Vol. 2 visual companion

Goal: a static web app (Vite + TypeScript + Three.js) — a gallery of interactive
widgets visualizing the geometry of Rudolph & Schmidt, *Differential Geometry and
Mathematical Physics, Part II* (fibre bundles, connections, classification,
characteristic classes). The user has finished Chs. 1–2 (bundles/connections, linear
connections/Riemannian geometry) and is entering Chs. 3–4 (homotopy classification,
characteristic classes) — so the classification and Chern–Weil widgets are the
priority; build in the order listed.

Every widget = pure math kernel (`src/math/…`, no DOM/WebGL imports) + vitest tests
asserting the stated theorems + thin Three.js renderer (`src/widgets/…`) + gallery
entry. Shared utilities first: RK4/RKF45 integrator, quaternion algebra, spherical and
ℝ⁴ quadrature (product Gauss–Legendre or adaptive), winding-number computation.

Conventions: $S^3 = \{(z_1,z_2)\in\mathbb{C}^2 : |z_1|^2+|z_2|^2=1\}$, unit quaternions
identified with $SU(2)$. State all tolerances with a one-line convergence rationale.

---

## Widget 1 — Clutching laboratory (Ch. 3 centerpiece)

**Math.** Principal $U(1)$-bundles (equiv. complex line bundles) over $S^2$ are
classified by the homotopy class of the transition function on the equator:
$[S^1, U(1)] = \pi_1(U(1)) \cong \mathbb{Z}$ via winding number.

**Interaction.** The user draws a closed curve $c: S^1 \to \mathbb{C}^\times$ in a 2D
panel (the punctured plane, deformation-retracting onto $U(1)$ — draw the retraction as
a faint guide circle). Live readout: the winding number
$n = \frac{1}{2\pi}\oint d(\arg c)$, computed by summing principal-branch argument
increments along the polyline. Beside it, a 3D panel shows the bundle being built: two
hemispherical caps carrying a phase texture, glued along the equator with the mismatch
$c(\phi)$ animated as a rotating phase dial around the equator. Dragging control points
deforms the loop continuously: $n$ is frozen unless the curve crosses the origin, at
which moment it jumps — homotopy invariance and its failure made tactile. Preset
buttons: $z \mapsto z^n$ for $n = -2,\dots,3$ ($n=1$ labelled "Hopf").

**Tests.** (a) winding of $z\mapsto z^n$ sampled at 400 points equals $n$ exactly for
$|n|\le 5$; (b) invariance under 50 random smooth perturbations bounded away from 0;
(c) deterministic origin-crossing deformation changes $n$ by exactly $\pm 1$;
(d) winding is independent of sample density (200 vs 2000 points) for Lipschitz curves.

## Widget 2 — Chern–Weil on the monopole bundle (Ch. 4 centerpiece)

**Math.** Charge-$n$ monopole connection on $S^2$, in the two standard patches:
$A_\pm = \tfrac{n}{2}(\pm 1 - \cos\theta)\,d\phi$, curvature
$F = dA_\pm = \tfrac{n}{2}\sin\theta\,d\theta\wedge d\phi$, and
$c_1 = \frac{1}{2\pi}\int_{S^2} F = n$. Deform the connection by a *global* 1-form
$a \in \Omega^1(S^2)$: $A \mapsto A + a$, $F \mapsto F + da$, and
$\int_{S^2} da = 0$ by Stokes — the integer cannot move.

**Interaction.** Sphere with a heatmap of the curvature density; sliders mix in a
small family of perturbations $a$ (e.g. $a = \lambda_1\, d(\cos k\theta\cos m\phi)$
terms plus non-exact-looking combinations built from global functions); the density
sloshes around dramatically while a large readout $\frac{1}{2\pi}\int F$ stays pinned
at the integer $n$ (selector for $n$). Caption: topology is the conserved quantity of
this game.

**Tests.** Quadrature of $\frac{1}{2\pi}\int F = n$ to $10^{-8}$ for $n=-2..3$ with
zero perturbation, and to $10^{-6}$ for 20 random perturbation settings; verify the
quadrature scheme on $\int_{S^2} dA_{\text{area}} = 4\pi$ first.

## Widget 3 — Hopf bundle: fibers, connection, holonomy (Ch. 1)

**Math.** Hopf map $h(z_1,z_2) = (2\,\mathrm{Re}(\bar z_1 z_2),\ 2\,\mathrm{Im}(\bar
z_1 z_2),\ |z_1|^2 - |z_2|^2) \in S^2$. Fiber through $z$: $\{e^{i\alpha}z\}$. Standard
connection $\omega = \mathrm{Im}(\bar z_1 dz_1 + \bar z_2 dz_2)$; horizontal lift of a
base curve $\gamma(t)$ solves $\dot z \perp iz$ (i.e. $\mathrm{Im}\langle z,\dot
z\rangle = 0$) with $h(z(t)) = \gamma(t)$. Holonomy around a closed loop enclosing
solid angle $\Omega$ is $e^{i\sigma\Omega/2}$ with a fixed orientation sign $\sigma$
(determine $\sigma$ once numerically, then hard-code with a comment).

**Interaction.** Left: $S^2$ with a draggable point and drawable loops. Right: $S^3$
stereographically projected to $\mathbb{R}^3$ — the fiber over the chosen point as a
glowing circle (preset showing several fibers as linked Villarceau-style circles, the
canonical Hopf picture). Animate the horizontal lift as the loop is traversed; display
the holonomy phase mismatch on the fiber.

**Tests.** (a) lift stays on $S^3$ and over $\gamma$ to $10^{-9}$ (project-and-renorm
RK4); (b) holonomy phase for a geodesic octant triangle ($\Omega = \pi/2$) equals
$\Omega/2 = \pi/4$ to $10^{-6}$; (c) phase scales linearly with area for small circles
(curvature = infinitesimal holonomy); (d) two distinct fibers have linking number 1
(compute the Gauss linking integral numerically).

## Widget 4 — Parallel transport and holonomy on surfaces (Chs. 1–2)

**Math.** Extrinsic formulation for an immersed surface with unit normal $N$:
transport of tangent $X$ along $\gamma$ solves $\dot X = -\langle X, \dot N\rangle N$;
geodesics solve $\ddot\gamma \parallel N$. Gauss–Bonnet: holonomy rotation angle
$=\int_{\text{enclosed}} K\,dA$ (= enclosed area on the unit sphere). Jacobi equation
on a surface: $J'' + K J = 0$.

**Interaction.** Surface picker (sphere, cylinder, torus, catenoid…); draw a loop,
watch a frame get transported, see the holonomy angle; geodesic spray from a point with
the Jacobi field rendered as the spreading of neighbors. The cylinder is the punchline
preset: visibly "curved", holonomy exactly zero — extrinsic bending is not curvature.

**Tests.** (a) $|X|$ preserved to $10^{-9}$; (b) sphere: holonomy of a spherical
triangle = spherical excess to $10^{-6}$; (c) cylinder and plane: holonomy $=0$ to
$10^{-9}$; (d) sphere Jacobi field along a unit-speed geodesic $= \sin t$ to $10^{-6}$.

## Widget 5 — Degree and $\pi_3(SU(2)) \cong \mathbb{Z}$ (Ch. 3 → Ch. 6 bridge)

**Math.** For unit quaternions, $f_n: q \mapsto q^n$ is a degree-$n$ map $S^3 \to S^3
\cong SU(2)$, representing $n \in \pi_3(SU(2))$ — the same integer that will be the
instanton number in Ch. 6. Degree numerically: $\deg f = \frac{1}{2\pi^2}\int_{S^3}
\det(Df|_{\text{o.n. frames}})\,dV$ (note $\mathrm{Vol}(S^3) = 2\pi^2$), via finite
differences of $f$ in an orthonormal tangent frame and quadrature/Monte Carlo with
error estimate.

**Interaction.** Hard to "see" a map $S^3\to S^3$ honestly; visualize via the
stereographic preimage foliation: pick a target point $p$, render the $n$ preimage
circles... (preimages of $f_n$ are $n$ points; instead render preimages of a *circle*
through $p$, giving linked curves whose count/linking encodes $n$). Slider for $n$,
plus an interpolation slider that deforms $f_1 \to$ a perturbed map, with the computed
degree readout staying locked — homotopy invariance again, one dimension up.

**Tests.** (a) numerical degree of $f_n = n \pm 10^{-3}$ (Monte Carlo with stated
sample count) for $n = 1,2,3$; (b) degree of a small smooth perturbation of $f_2$
still $2$; (c) regular-value preimage count of $f_n$ equals $n$ (root-finding from
random seeds, deduplicated).

## Widget 6 — BPST instanton density (Ch. 6 teaser)

**Math.** Normalized topological charge density of the one-instanton solution centered
at $a$ with scale $\rho$:
$q(x) = \frac{6}{\pi^2}\,\frac{\rho^4}{(|x-a|^2+\rho^2)^4}$, with
$\int_{\mathbb{R}^4} q\,d^4x = 1$ (analytic check:
$\int d^4x\,(|x|^2+\rho^2)^{-4} = \pi^2/6\rho^4$).

**Interaction.** Render a 3D slice ($x_4 = $ slider) as isosurfaces/volume cloud;
$\rho$ slider showing the scale-invariance squeeze (the density concentrates but the
charge readout stays 1 — the moduli direction that makes instanton moduli noncompact).

**Tests.** 4D quadrature of $q$ equals $1$ to $10^{-4}$ (radial reduction to 1D makes
this cheap: $\int q\,d^4x = 2\pi^2\int_0^\infty q(r)r^3\,dr$); slice renderer's sampled
max location equals $a$.

## Widget 7 — Möbius band as the nontrivial $\mathbb{Z}/2$-bundle (warmup, build last)

Cylinder vs Möbius over $S^1$ side by side; transition function $\pm 1$ on two
overlapping arcs; attempt to comb a nonvanishing section across the Möbius band and
watch the forced zero. Tests: trivial (orientation bookkeeping); this widget is
allowed to be mostly visual.

---

## Gallery & polish

Landing page: title, one-paragraph framing, widget cards ordered as above with the
theorem each demonstrates as the card subtitle. Dark background, restrained palette,
KaTeX captions. Controls must work on mobile touch (the user will open this on a
phone via GitHub Pages): pointer events, pinch zoom on 3D panels, generous hit targets
on draggable control points.

## Definition of done

`npm test` green (every tolerance above), `npm run build` green, Pages workflow
committed, `PROGRESS.md` viewing guide written. If time remains after all seven:
polish interactions on widgets 1–3 rather than adding new ones; then, only as a true
stretch, a Berry-phase variant of Widget 3 (spin-½ on a slowly driven Bloch sphere —
same math, physics costume).
