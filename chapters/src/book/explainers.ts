/**
 * Station explainers: the text under each picture, kept apart from the
 * rendering code so it can be edited as prose. Each has four parts —
 * what is on screen, things to try, the idea (built up in steps, citing the
 * book), and where it leads. Math is inline TeX between $…$ (KaTeX);
 * String.raw keeps backslashes literal (never write "$" directly before "{").
 */

export interface Explainer {
  /** What is on screen, panel by panel. */
  see: string;
  /** Concrete experiments, each with what to notice. */
  tryIt: string[];
  /** The mathematics, a few short paragraphs, citing items by number. */
  idea: string[];
  /** Where this leads (later stations, sections, chapters). */
  ahead?: string;
}

const r = String.raw;

export const EXPLAINERS: Record<string, Explainer> = {
  '1.1a': {
    see: r`Left: the base $S^2 \cong \mathbb CP^1$ with a white point $m$. Right: the total space $S^3$, squeezed into ordinary space by stereographic projection. The thick coloured circle is the fibre $\pi^{-1}(m)$; the thin grey circles are the fibres over the rest of $m$'s latitude. The red vertical line and the blue unit circle are the fibres over the two poles.`,
    tryIt: [
      r`Tap the sphere to move $m$. Every point of $S^2$ has a whole circle above it, and different circles never meet: $S^3$ is a disjoint union of circles, one for each point of $S^2$.`,
      r`Drag $\alpha$. The green point $p = \chi_i^{-1}(m, e^{i\alpha})$ slides around the fibre and its colour changes in step. The colour is the group coordinate $\kappa_i(p) \in U(1)$ that the chart assigns to $p$.`,
      r`Switch charts. The same circle is recoloured by a constant turn of the colour wheel: a different choice of where "$1 \in U(1)$" sits on the fibre.`,
      r`Choose chart $\chi_2$ and press "$m \to \pi(1,0)$". The readout says $p \notin \pi^{-1}(U_2)$: chart 2 cannot see the fibre over the north pole.`,
    ],
    idea: [
      r`A principal bundle is a space with a free group action that looks, locally, like a product $U \times G$ (Def. 1.1.1). "Locally" is the whole point. For the Hopf bundle the identification $\chi_i(p) = (\pi(p), \kappa_i(p))$ with $\kappa_i = z_i/|z_i|$ only works over $U_i$, where $z_i \neq 0$ (Ex. 1.1.20). The rule $\kappa_i(p\cdot a) = \kappa_i(p)\,a$ (1.1.2) says that moving along the fibre by $a$ changes the chart's group coordinate by exactly $a$.`,
      r`A trivialization and a section are the same data (Prop. 1.1.6). The section is $s_i(m) = \chi_i^{-1}(m, 1)$, the point of each fibre where $\kappa_i = 1$ (white for $s_1$, orange for $s_2$). Conversely, $\kappa_i(p)$ is "how far $p$ is from $s_i(\pi(p))$" along its fibre. A trivialization over all of $S^2$ would be a section over all of $S^2$; the Hopf bundle has none.`,
      r`The base $\mathbb CP^1$ is identified with $S^2$ by $f(z) = (2\bar z_1 z_2,\ |z_1|^2 - |z_2|^2)$ (Rem. 1.1.21/1). The book inverts this map with $g_+$, which is exactly our section $s_2$.`,
    ],
    ahead: r`Two charts colour the same fibre differently. Comparing the colourings gives the transition map $\rho_{12} = \kappa_1\kappa_2^{-1}$, the subject of Station 1.1b.`,
  },

  '1.1b': {
    see: r`Over the equator of $S^2$ the fibres sweep out a torus. Left: that torus cut open into a square. The horizontal coordinate is $\varphi$, the position on the equator; the vertical one is $\alpha = \arg\kappa_1$, the position on the fibre as measured by chart 1. Right: the same torus inside $S^3$ (Hopf case only). White curve: the section $s_1$; orange: $s_2$.`,
    tryIt: [
      r`With the cochains at zero, the white curve is the flat line $\alpha = 0$ (that is what $\kappa_1(s_1) = 1$ means). The orange curve, whose height is $\arg\rho_{12}$, climbs once around. They cross exactly once.`,
      r`Press "random cochains" a few times. Both curves wiggle and crossings appear and disappear, always in pairs of opposite sign. The degree readout never changes.`,
      r`Pick $\rho_{12} = e^{-in\varphi}$ in the menu: the orange curve now winds $n$ times, and $|n|$ crossings survive every deformation.`,
    ],
    idea: [
      r`Once local trivializations are chosen, what remains is how they disagree. The transition map $\rho_{12}(m) = \kappa_1(p)\kappa_2(p)^{-1}$ compares the two charts' group coordinates of the same point. It does not depend on which $p$ over $m$ you use (1.1.5). Here the two section curves meet exactly where $\rho_{12} = 1$.`,
      r`Trivializations are not unique. Re-choosing chart $i$ by a function $\rho_i : U_i \to U(1)$ (a 0-cochain) moves $s_i$ to $s_i\rho_i^{-1}$ and replaces $\rho_{12}$ by $\rho_1\rho_{12}\rho_2^{-1}$ (1.1.7). Thm. 1.1.11 says this is the only freedom: two bundles are isomorphic exactly when their transition maps differ this way. So, up to isomorphism, a bundle is nothing but its transition map modulo cochains, a class in Čech cohomology $\check H^1(S^2, U(1))$ (Rem. 1.1.12, Cor. 1.1.13).`,
      r`What survives the cochains? Each $U_i$ is a disc, so $\rho_i$ restricted to the equator is a contractible loop and cannot change the winding number of $\rho_{12}$. That winding number is the signed crossing count you see. Conversely, any cocycle builds some bundle (Prop. 1.1.10), so every integer occurs.`,
      r`Signs: the book's loop $\gamma$ (Rem. 1.1.21/2) runs the equator with $\varphi = -t$. Counted along $\gamma$, the Hopf bundle has degree $+1$, as the book states.`,
    ],
    ahead: r`Only $n = \pm1$ has total space $S^3$, so the 3D view shows just the Hopf case. The same integers come back as forced zeros of sections in Station 1.2a.`,
  },

  '1.1c': {
    see: r`Left: $S^2$ covered by a field of orthonormal frames (orange $u_1$, cyan $u_2$), with one frame highlighted at the point $x$ you tap. Right: the total space, all oriented orthonormal frames of $S^2$. It is the rotation group $SO(3)$, drawn as a ball of radius $\pi$: a point of the ball is a rotation axis scaled by the rotation angle, and opposite points on the boundary are the same rotation. The white curve is the fibre over $x$, all the frames at $x$.`,
    tryIt: [
      r`Drag $\beta$. The frame at $x$ turns within its tangent plane (the right action of $SO(2)$), and the green dot runs along the white fibre in $SO(3)$.`,
      r`With $s_N$, look near the south pole (with $s_S$, near the north pole). The frame field spins wildly; it is singular there.`,
      r`Tap around: the readout $\rho_{NS}$ is the angle between the two frame fields at $x$.`,
    ],
    idea: [
      r`A frame at $x$ is an ordered basis of $T_xS^2$ (Ex. 1.1.14). Keeping only oriented orthonormal ones gives a principal $SO(2)$-bundle $O^+(S^2)$ (Ex. 1.1.18, Def. 1.1.19). A frame $(u_1, u_2)$ at $x$ completes $x$ to an orthonormal basis of $\mathbb R^3$, so the matrix $[x\,|\,u_1\,|\,u_2]$ identifies $O^+(S^2)$ with $SO(3)$. Turning the frame becomes right multiplication by $\mathrm{diag}(1, b)$ (Ex. 1.1.18). This is also the homogeneous bundle $SO(3) \to SO(3)/SO(2) = S^2$ of Ex. 1.1.4/4.`,
      r`Each frame field is a local section, and by Prop. 1.1.6 a global one would trivialize the bundle. None exists: a frame field with no singular point would comb the hairy ball. The obstruction shows up in the transition map, $\rho_{NS} = \pi + 2\varphi$ along the equator, which has degree 2.`,
    ],
    ahead: r`Compare the Hopf bundle's degree 1 (Station 1.1b). The 2 is the Euler number of $S^2$, and $SO(3) \cong S^3/\{\pm1\}$. Station 1.2b builds the tangent bundle from this frame bundle, and Station 1.3d puts a connection on it.`,
  },

  '1.1d': {
    see: r`Left, first mode: the real member of the family, a circle covering a circle twice, drawn as the edge of a Möbius band running around its core. Left, second mode: the universal cover $\mathbb R \to S^1$ as a helix. Right: the quaternionic member, shown through its transition map $\rho_{12}: S^3 \to Sp(1) \cong S^3$ and what it does to a few great circles.`,
    tryIt: [
      r`Real mode: drag $s$. The two white points $\pm x$ make up one fibre. The base circle is coloured by $\rho_{12}$: green ($+1$) on one arc of $U_1\cap U_2$, red ($-1$) on the other.`,
      r`Universal-cover mode: set the winding $n$. The lift of the loop climbs $n$ turns of the helix.`,
      r`Quaternionic panel: move the cochain sliders. The great circles bend; when you release a slider the degree is recomputed, and it stays 1.`,
    ],
    idea: [
      r`One recipe gives all the Hopf bundles. Take unit vectors $(q_1, q_2) \in \mathbb K^2$, let the unit sphere of $\mathbb K$ act on the right, and set $\kappa_i = q_i/|q_i|$, $\rho_{12} = \kappa_1\kappa_2^{-1}$, exactly as in Ex. 1.1.20. These are the Stiefel bundles $S_{\mathbb K}(1,2) \to \mathbb KP^1$ (Ex. 1.1.24, Rem. 1.1.25): $S^1 \to \mathbb RP^1$ with $O(1) = \{\pm1\}$, $S^3 \to S^2$ with $U(1)$, and $S^7 \to S^4$ with $Sp(1) \cong SU(2)$ (Ex. 1.1.22).`,
      r`$\mathbb K = \mathbb R$: the overlap $U_1 \cap U_2$ has two pieces, with $\rho_{12} = +1$ on one and $-1$ on the other. Re-choosing charts can only flip the sign on all of $U_1$ or all of $U_2$, which changes both arcs alike, so the mismatch can't be removed. The double cover is connected, hence nontrivial.`,
      r`$\mathbb K = \mathbb H$: over the "equator" $|q_1| = |q_2|$, the points $(w, 1)/\sqrt2$ meet each fibre exactly once, and there $\rho_{12} = w$. So the transition map is the identity $S^3 \to S^3$, of degree 1, and by the criterion of Rem. 1.1.21/2 the bundle is nontrivial (Rem. 1.1.23/1). Cochains (1.1.7) deform the map but cannot change its degree.`,
      r`The universal cover is a principal bundle too, with the discrete group $\pi_1(M)$ as structure group (Ex. 1.1.26). Lifting a loop of winding $n$ to the helix ends $n$ turns higher: the group element acts by the deck shift $t \mapsto t + 2\pi n$.`,
    ],
    ahead: r`The degree of the quaternionic transition map returns in Ch. 6 as the instanton number.`,
  },

  '1.2a': {
    see: r`Left: the base $S^2$ coloured by a section of the line bundle $L_n$. Hue is phase and brightness is size (dark means near zero); green and red dots mark zeros of index $+1$ and $-1$. Right: fibres in $S^3$ coloured by the phase of the same section, seen as a function $\tilde\Phi$ on $S^3$. White circles are fibres where it vanishes.`,
    tryIt: [
      r`Follow any coloured fibre on the right: the hue turns $-n$ times around it. That built-in twist is what makes $\tilde\Phi$ a section rather than an arbitrary function.`,
      r`Tap the sphere to move a zero. Then raise $\varepsilon$: zeros wander, and pairs of opposite index are created or annihilated, but $\Sigma\,\mathrm{ind}$ stays $-n$.`,
      r`Set $n = 0$ and push $\varepsilon$ past 2. A $+$ and a $-$ zero appear and can disappear again: on a trivial bundle nothing forces zeros.`,
      r`Switch between $\varphi_1$ and $\varphi_2$: the extra $n$ turns of hue jump from the south pole to the north pole.`,
    ],
    idea: [
      r`From the Hopf bundle and the representation $\sigma_n(e^{i\alpha}) = e^{in\alpha}$ of $U(1)$ on $\mathbb C$ we build the associated line bundle $L_n = S^3\times_{U(1)}\mathbb C$. Prop. 1.2.6 makes its sections concrete: they are functions $\tilde\Phi: S^3 \to \mathbb C$ with $\tilde\Phi(p\cdot a) = \sigma_n(a)^{-1}\tilde\Phi(p)$ (1.2.9), so the values along each fibre are fixed up to a prescribed twist. For a representation the correspondence is linear (Prop. 1.2.8).`,
      r`Composing with a local section gives an ordinary function $\varphi_i = \tilde\Phi \circ s_i$ on $U_i$ (Rem. 1.2.15/3). On the overlap, $\varphi_1 = \rho_{12}^{\,n}\varphi_2$: the transition map of $L_n$ is $\sigma_n\circ\rho_{12}$ (1.2.5). Around the equator $\rho_{12}^{\,n}$ winds $-n$ times, so the windings of $\varphi_1$ and $\varphi_2$ there differ by $-n$, and by the argument principle the zeros of every section have total index $-n$. For $n \neq 0$, every section vanishes somewhere.`,
      r`The examples are built from linear forms. $\ell_r(z) = u_2 z_1 - u_1 z_2$ vanishes exactly on the fibre over $r$ and has $n = -1$. Products of $|n|$ of them (conjugated when $n > 0$) are sections of $L_n$ vanishing over chosen points, and $\varepsilon$ adds a perturbation with the same twist. A product of sections of $L_m$ and $L_n$ is a section of $L_{m+n} = L_m\otimes L_n$ (Ex. 1.2.4/3).`,
    ],
    ahead: r`$L_n$ is also associated with the principal bundle $P[\lambda_n]$, $\lambda_n(a) = a^n$ ((1.2.8), Prop. 1.2.5), whose cocycle is $\rho_{12}^{\,n}$: the integer of Station 1.1b. Indices are counted with the outward orientation of $S^2$.`,
  },

  '1.2b': {
    see: r`Left: a vector field $v$ on $S^2$ (grey) and, at the point $x$ you tap, a frame $f$ (orange $u_1$, cyan $u_2$) and the vector $v(x)$ (white). Right: the coordinate plane $\mathbb R^2$ of that frame. The white arrow is $\xi$, the components of $v(x)$ in $f$. The green and pink dots are its components in the two chart frames $s_N$ and $s_S$.`,
    tryIt: [
      r`Drag $\beta$ to rotate the frame. On the left only the frame moves; on the right the components rotate the opposite way. Same vector, new coordinates.`,
      r`Tap different points. The dashed arc from $\xi_S$ to $\xi_N$ is the transition rotation $\rho_{NS}(x)$.`,
      r`Try all three fields: each vanishes somewhere ($\nabla z$ at both poles).`,
    ],
    idea: [
      r`Def. 1.2.1 builds a bundle with fibre $F$ from a principal bundle $P$: take pairs $(p, f)$ and identify $(p\cdot a,\ a^{-1}f) \sim (p, f)$. With $P$ the frame bundle and $F = \mathbb R^2$ rotated by $SO(2)$, the class of (frame, components) is the tangent vector $\iota_f(\xi) = \xi^1u_1 + \xi^2u_2$ (1.2.2). The identification is exactly the slider experiment: $\iota_{f\cdot b}(b^{-1}\xi) = \iota_f(\xi)$ (1.2.3). Hence $TS^2 \cong O^+(S^2)\times_{SO(2)}\mathbb R^2$; in general, every vector bundle is associated with its frame bundle (Rem. 1.2.9/2).`,
      r`A vector field becomes a function on the frame bundle, $\tilde\Phi(f) = (v\cdot u_1,\ v\cdot u_2)$, with $\tilde\Phi(f\cdot b) = b^{-1}\tilde\Phi(f)$ (Prop. 1.2.6). Local sections turn it into chart components $\xi_N$ and $\xi_S$, related by the rotation $\rho_{NS}$ (1.2.5).`,
      r`$\rho_{NS}$ has degree 2 (Station 1.1c), so the windings of the components around the equator always differ by 2. Every vector field on $S^2$ therefore has total index 2: the Poincaré–Hopf theorem, read off a transition map.`,
    ],
    ahead: r`It is the same mechanism as Station 1.2a, with the frame bundle's degree 2 in place of Hopf's degree 1.`,
  },

  '1.3a': {
    see: r`Left: a point $p$ of $S^3$ (stereographic) on its grey fibre. The pink line is the vertical direction $V_p$, along the fibre. The green disc is the horizontal plane $\Gamma_p$ chosen by the connection $\omega_c$. The white arrow $X$ is split into its horizontal part (green, in the disc) and its vertical part (pink, along the fibre). Right: the fibres over $p$'s latitude form a torus; the green curves on it are horizontal.`,
    tryIt: [
      r`Tilt and turn $X$. The two parts always land in the disc and on the line, and $\omega_c(\mathrm{hor}\,X)$ reads 0 to machine precision.`,
      r`Drag "p along fibre". The disc travels with $p$: the group action carries the connection along.`,
      r`Right panel: follow the orange curve once around. It doesn't close; it comes back shifted along the fibre by $-\pi(1-\cos\theta)$. Switch to the flat connection and the curves close.`,
    ],
    idea: [
      r`Every principal bundle has a canonical vertical direction at each point: the tangent to the fibre, spanned by the Killing fields $A^*_p = \tfrac{d}{dt}\,p\cdot\exp(tA)$ (Lemma 1.3.1). For $U(1)$ it is $ip$. There is no canonical horizontal direction. A connection is exactly a choice of complement $\Gamma_p$, made compatibly with the group: $\Gamma_{p\cdot a} = \Psi_a'\Gamma_p$ (Def. 1.3.2).`,
      r`The choice is recorded by a $\mathfrak g$-valued 1-form that measures the vertical part, $\omega_p(X) = (\Psi'_p)^{-1}(\mathrm{ver}\,X)$ (Def. 1.3.4). So $\ker\omega = \Gamma$ and $\omega(A^*) = A$ (Prop. 1.3.5), and every vector splits as $X = \mathrm{hor}\,X + \mathrm{ver}\,X$ with $\mathrm{ver}\,X = \Psi'_p(\omega(X))$ ((1.3.2), (1.3.7)). On the Hopf bundle, $\omega_c = \bar z_1dz_1 + \bar z_2dz_2$ (Ex. 1.3.22) makes $\Gamma_p$ the orthogonal complement of the fibre in $\mathbb R^4$. Stereographic projection preserves angles, so the disc is drawn round.`,
      r`On the torus, in chart 1, $\omega_c = i(d\alpha + \tfrac12(1-\cos\theta)\,d\varphi)$ (Station 1.3b), so horizontal curves climb with slope $-\tfrac12(1-\cos\theta)$. The flat form $\kappa_1^*\theta = i\,d\alpha$ has horizontal curves $\alpha = $ const, exactly the picture of $\omega = d\alpha$ on the product bundle $S^2\times U(1)$ (Ex. 1.3.23). On the Hopf bundle that form exists only over $U_1$: it is a chart's flat connection, not a global one.`,
    ],
    ahead: r`Horizontal curves that fail to close are holonomy (§1.7). That no flat connection exists on all of $S^3$ is curvature (§1.4).`,
  },

  '1.3b': {
    see: r`Left: the gauge potential $\mathcal A = s^*\omega_c$, a 1-form on $S^2$, drawn as its dual vector field (length and colour grow with $|\mathcal A|$). Right: for each latitude $\theta$, the loop integral $\frac{1}{2\pi i}\oint\mathcal A$ around it. The dots are computed numerically from the current sections; the dashed curves are the exact formulas.`,
    tryIt: [
      r`Compare $\mathcal A_1$ and $\mathcal A_2$: each is tame on its own chart and blows up at the pole that chart leaves out.`,
      r`Move the gauge sliders. The arrows rearrange completely; the dots on the right don't move.`,
      r`Pick "$\mathcal A_2 - \mathcal A_1$": the difference is a pure-gauge field circling the axis, and the gap between the two loop integrals stays exactly $-1\cdot 2\pi i$.`,
    ],
    idea: [
      r`The connection lives on the total space, but physics is done on the base. A local section $s$ pulls $\omega$ down to $\mathcal A = s^*\omega$ (1.3.11), a Lie-algebra-valued 1-form on $U$: the gauge potential. For the book's sections, $\mathcal A_1 = \tfrac i2(1-\cos\theta)\,d\varphi$ on $U_1$ and $\mathcal A_2 = -\tfrac i2(1+\cos\theta)\,d\varphi$ on $U_2$.`,
      r`Passing to $\mathcal A$ loses nothing: Prop. 1.3.11 rebuilds $\omega = \mathrm{Ad}_{\kappa^{-1}}\pi^*\mathcal A + \kappa^*\theta$ (1.3.14). The price is that $\mathcal A$ depends on $s$. Changing the section by $s\mapsto s\,e^{i\lambda}$ changes $\mathcal A\mapsto\mathcal A + i\,d\lambda$, and the two charts' potentials are related by the gauge transformation law $\mathcal A_2 = \mathcal A_1 + \rho_{12}^*\theta$ (Cor. 1.3.12, (1.3.15)). Before any gauge change, $\rho_{12}^*\theta = -i\,d\varphi$.`,
      r`Gauge-invariant quantities survive. $d\lambda$ is exact, so loop integrals don't change. The two charts' integrals differ by $\oint\rho_{12}^*\theta = 2\pi i\,\deg\rho_{12} = -2\pi i$ (taking $\varphi$ increasing): the integer of Station 1.1b, now read off the connection.`,
    ],
    ahead: r`Differentiating $\mathcal A$ gives the curvature (§1.4); integrating that over $S^2$ gives the first Chern number (Ch. 4).`,
  },

  '1.3c': {
    see: r`Left: the torus of fibres over a latitude $\theta_0$ and the horizontal curves of the connection $\omega_t$. The orange curve is one of them (○ where it starts, ● where it is after one turn). Right: the slope $a_t(\theta)$ of these curves at every latitude, for several values of $t$ (grey) and the current $t$ (green); dashed pink is the cutoff function $f_2$.`,
    tryIt: [
      r`$t = 0$ is the canonical $\omega_c$ and $t = 1$ is the glued connection $\omega_{PU}$. Slide between them and watch the curves change.`,
      r`Move the cutoffs lo and hi. For $\omega_{PU}$ the twist concentrates in the band where $f_2$ rises from 0 to 1.`,
      r`Watch the ends of the green curve on the right: 0 at the north pole and 1 at the south pole, for every $t$ and every cutoff.`,
    ],
    idea: [
      r`Why does every principal bundle have a connection (Prop. 1.3.7)? Locally it is easy. A trivialization $\chi_i$ gives a flat connection whose horizontal spaces are tangent to the slices $\chi_i^{-1}(U_i\times\{a\})$ (1.3.8); here its form is $\kappa_i^*\theta$. Glue these with a partition of unity $f_1 + f_2 = 1$, $\mathrm{supp}\,f_i\subset U_i$, to get $\omega_{PU} = f_1\,\kappa_1^*\theta + f_2\,\kappa_2^*\theta$.`,
      r`It works because the two defining properties, $\omega(A^*) = A$ and equivariance (Prop. 1.3.5/2–3), survive combinations whose weights sum to 1. The same argument makes $\omega_t = (1-t)\,\omega_c + t\,\omega_{PU}$ a connection for every $t$. The difference of two connections, $\omega_{PU} - \omega_c = \pi^*\beta$, is horizontal and equivariant, so connections form an affine space modelled on $\Omega^1_{\mathrm{Ad},\mathrm{hor}}(P,\mathfrak g)$ (Rem. 1.3.8). For $U(1)$ that is just the 1-forms on $S^2$.`,
      r`On the torus over $\theta$, in chart 1, $\omega_t(\partial_\varphi) = a_t(\theta)$, and horizontal curves have slope $-a_t$. However the connection is chosen, $a_t(0) = 0$ and $a_t(\pi) = 1$: the total twist from pole to pole is fixed.`,
    ],
    ahead: r`That fixed total is the degree of $\rho_{12}$ (Station 1.1b). In §1.4 and Ch. 4 it becomes the integral of the curvature, the Chern number.`,
  },

  '1.3d': {
    see: r`Left: a frame (orange $u_1$, cyan $u_2$) carried around a circle of latitude; the faint arrows are where it started. Right: the matrix $a^{\mathsf T}\dot a \in \mathfrak{so}(3)$ for the moving frame $a = [u_1\,|\,u_2\,|\,x]$. The orange $2\times2$ block is the connection $\omega_c$; the blue entries form the remaining part $T$.`,
    tryIt: [
      r`Press "go around" with spin 0. The orange block stays exactly 0, so the frame moves without spinning, yet it comes back rotated (see the readout).`,
      r`Add spin. Now the orange block is nonzero: that is the vertical part, which $\omega_c$ measures.`,
      r`Change the latitude. The rotation on return equals the enclosed area, $2\pi(1-\cos\theta_0)$.`,
    ],
    idea: [
      r`A homogeneous space $G\to G/H$ is reductive if $\mathfrak g = \mathfrak h\oplus\mathfrak m$ with $\mathrm{Ad}(H)\,\mathfrak m\subset\mathfrak m$. It then carries a natural connection: declare the $\mathfrak m$-directions horizontal. Its form is $\omega_0 = \mathrm{pr}_{\mathfrak h}\circ\theta$, the $\mathfrak h$-part of the Maurer–Cartan form $\theta = a^{-1}da$ (Ex. 1.3.19).`,
      r`The Stiefel bundle of $k$-frames in $\mathbb K^n$ is of this kind. Its canonical connection $\omega_c = \mathrm{pr}_{\mathfrak u(k)}\circ\theta$ is, in matrix form, simply $\omega_c = u^\dagger du$ (Ex. 1.3.20, (1.3.19)). Here $k = 2$ and $n = 3$, real and oriented: $a = [u_1\,|\,u_2\,|\,x]\in SO(3)$, and the base is the sphere of unit normals $x$, so this is again the frame bundle of Station 1.1c. The matrix on the right is $\theta(\dot a)$: its upper $2\times2$ block is $\omega_c(\dot a)$, and the rest is the $\mathfrak m$-part $\left[\begin{smallmatrix}0&-T^{\mathsf T}\\T&0\end{smallmatrix}\right]$ of Rem. 1.3.21.`,
      r`Horizontal ($\omega_c = 0$) means $u_2\cdot\dot u_1 = 0$: the frame does not rotate about the normal. That is Levi-Civita parallel transport on $S^2$ (Ch. 2), and around a closed loop it leaves the frame rotated by the enclosed area.`,
    ],
    ahead: r`That rotation is holonomy (§1.7). A note on the book: Rem. 1.3.21 prints $T$ as "$((n-k)\times n)$", but the block shape forces $(n-k)\times k$.`,
  },
  '1.4a': {
    see: r`Left: $S^2$ coloured by the curvature density of the chosen connection (brighter = more curvature), with a green coordinate rectangle. Right: in $S^3$, the grey curve is $s_1\circ\gamma$, an arbitrary lift of the rectangle, and the green curve is its horizontal lift. The white ○ and orange ● mark where the horizontal lift starts and ends; both lie on the same grey fibre.`,
    tryIt: [
      r`With $\omega_c$, change the size and position of the rectangle. The ratio gap/area reads $-0.5$ every time: the round Hopf connection has the same curvature everywhere.`,
      r`Switch to $\omega_{PU}$ (the glued connection of Station 1.3c). Now the ratio depends on where the rectangle sits: near the poles it is 0, and in the band where the partition of unity switches over it is large.`,
      r`Switch to the flat connection $\kappa_1^*\theta$. The gap is exactly 0: horizontal lifts of closed loops close up.`,
    ],
    idea: [
      r`Curvature is the derivative of the connection form, tested only on horizontal vectors: $\Omega = D_\omega\omega$, where $D_\omega\alpha = d\alpha(\mathrm{hor}\,\cdot, \dots, \mathrm{hor}\,\cdot)$ (Def. 1.4.1, 1.4.6). Its meaning is in Rem. 1.4.7. For horizontal vector fields $X, Y$, the bracket $[X,Y]$ has vertical part $-\Psi'(\Omega(X,Y))$ (1.4.5): move horizontally along $X$, then $Y$, then back along both, and you return displaced along the fibre by about $\Omega(X,Y)$ times the area. By the Frobenius theorem, horizontal surfaces exist (the distribution is integrable) exactly when $\Omega = 0$; such connections are called flat.`,
      r`The structure equation (Prop. 1.4.9) reads $d\omega = -\tfrac12[\omega,\omega] + \Omega$. For the abelian group $U(1)$ the bracket vanishes, so $\Omega = d\omega$. Locally $\mathcal F = s^*\Omega = d\mathcal A + \tfrac12[\mathcal A,\mathcal A] = d\mathcal A$ ((1.4.16)–(1.4.17)). For $\omega_c$, $\mathcal A_1 = \tfrac i2(1-\cos\theta)\,d\varphi$ gives $\mathcal F = \tfrac i2\sin\theta\,d\theta\wedge d\varphi$, which is $\tfrac i2$ times the area form (the complex half of Exercise 1.4.2). Both charts give the same $\mathcal F$, because $\mathcal F_j = \mathrm{Ad}_{\rho_{ij}^{-1}}\mathcal F_i$ (1.4.19) and $\mathrm{Ad}$ is trivial for $U(1)$.`,
      r`By Stokes, the gap after going once around the rectangle is $-\oint\mathcal A = -\iint\mathcal F$. That is the readout, and the tests check it to $10^{-8}$ for all three connections. Different connections spread the curvature differently over $S^2$, but its total is always $\int_{S^2}\mathcal F = 2\pi i$.`,
    ],
    ahead: r`The gap is the holonomy of a small loop, the subject of §1.7 (Station 1.7a). Station 1.4b computes a non-abelian curvature, where the bracket term is no longer zero, and in Ch. 4 the total $\tfrac{i}{2\pi}\int\mathcal F$ becomes the Chern number.`,
  },
  '1.7a': {
    see: r`Left: a loop $\gamma$ on $S^2$ and the moving point $\gamma(t)$. Right: in $S^3$, the grey curve is the arbitrary lift $\tilde\gamma = s_1\circ\gamma$ and the green curve is the horizontal lift $\gamma^h$. At time $t$, the orange arc along the fibre is the correction $g(t) = e^{i\alpha(t)}$ that carries $\tilde\gamma(t)$ to $\gamma^h(t)$. The white ○ and orange ● mark where $\gamma^h$ starts and ends.`,
    tryIt: [
      r`Press run. The orange arc grows and shrinks as the curve goes around. At the end, ● sits on the starting fibre, rotated by the holonomy.`,
      r`Compare the readouts: the holonomy equals $-\tfrac12\times$ the area enclosed by the loop, for any centre and radius.`,
      r`Tick "uneven speed". The loop is traversed at a wildly varying rate, yet the endpoint is the same: parallel transport does not depend on the parametrisation.`,
      r`Choose the figure eight. Its two lobes are traversed in opposite senses, so their areas count with opposite signs; with zero asymmetry the holonomy vanishes.`,
    ],
    idea: [
      r`A horizontal lift of a curve $\gamma$ in $M$ is a curve in $P$ over $\gamma$ whose velocity is always horizontal (Def. 1.7.1). Prop. 1.7.2 builds it in the most hands-on way. Start from any lift $\tilde\gamma$ (here $s_1\circ\gamma$) and slide it along the fibres by a group-valued $g(t)$ chosen so that the result is horizontal. The condition is the ODE $\mathrm{Ad}_{g^{-1}}\omega(\dot{\tilde\gamma}) = -g^{-1}\dot g$. For $U(1)$ it reads $\dot\alpha = -\omega(\dot{\tilde\gamma})$, so $g(t) = \exp(-\int\mathcal A)$. This is exactly how the station computes, and it agrees to $10^{-8}$ with an independent RK4 integration on $S^3$.`,
      r`Following the lifts from every starting point defines parallel transport $\hat\gamma: \pi^{-1}(\gamma(0))\to\pi^{-1}(\gamma(1))$ (Def. 1.7.4). It is compatible with the group action, with concatenation and with reversal (Lemma 1.7.3), and independent of the parametrisation (Rem. 1.7.5); all of these are tested. For a closed loop it returns to the starting fibre and moves points by a group element: the holonomy. All holonomies at a point form the holonomy group (Def. 1.7.6).`,
      r`For $\omega_c$, Stokes turns $-\oint\mathcal A$ into $-\iint\mathcal F = -\tfrac12\times$ (enclosed area), since $\mathcal F$ is $\tfrac i2$ times the area form (Station 1.4a). Letting the loop grow sweeps the holonomy through every angle, so the holonomy group of the Hopf connection is all of $U(1)$.`,
    ],
    ahead: r`Station 1.7b asks which points can be reached by horizontal paths, which leads to the holonomy bundle and the Ambrose–Singer theorem.`,
  },
  '1.7b': {
    see: r`Right: green dots are the endpoints of hundreds of random horizontal paths in $S^3$, all starting at the white point $p_0$, so they sample the set of points reachable from $p_0$. The grey circle is the fibre through $p_0$. Left: the start $m_0$ on $S^2$ and three of the random walks. The orange curve is a "lasso" path to a target point you choose, and on the right its horizontal lift lands exactly on the white target in that fibre.`,
    tryIt: [
      r`With $\omega_c$, watch the cloud grow. It doesn't stay on any surface: it thickens in every direction. The readout $R$ drops from 1 toward 0 as the endpoints' fibre phases spread out.`,
      r`Switch to the flat connection. However many paths you add, the cloud stays on one smooth surface, and $R = 1$ exactly.`,
      r`Tap the sphere to choose a target base point and drag $\beta$ to choose a point on its fibre. With $\omega_c$, the lasso's lift always lands on it: every point of $S^3$ can be reached horizontally.`,
      r`Lengthen the paths: the cloud spreads faster.`,
    ],
    idea: [
      r`Call two points equivalent if a horizontal curve joins them. The class of $p_0$ is the holonomy bundle $P_{p_0}(\Gamma)$ (Def. 1.7.13). Prop. 1.7.12 shows it is a reduction of $P$ to the holonomy group, and that $\Gamma$ restricts to it. It is the smallest reduction the connection lives on (Rem. 1.7.14), and $\Gamma$ is irreducible exactly when $P_{p_0} = P$.`,
      r`The Ambrose–Singer theorem (Thm. 1.7.15) says what decides the size of the holonomy: its Lie algebra is spanned by the curvature values $\Omega_p(X, Y)$ on the holonomy bundle. The Hopf curvature is never zero, so it spans $\mathfrak u(1)$. The holonomy group is then all of $U(1)$, and the reachable set is all of $S^3$. The lasso makes this concrete: walk to $m$, then go once around a circle whose area produces exactly the missing phase (Station 1.7a).`,
      r`For a flat connection the curvature spans nothing, so the restricted holonomy is trivial. The holonomy bundles are then coverings of the base, and over a simply connected region they are copies of it (Rem. 1.7.16/2–3): here, the leaf $\kappa_1 = $ const. The same theorem gives Exercise 1.7.6(b): the reductive connection on $SO(3)\to S^2$ (Station 1.3d) has curvature $\neq 0$ and holonomy $SO(2)$.`,
      r`The holonomy principle (Prop. 1.7.20) turns holonomy into a statement about sections: parallel sections of $P\times_G F$ correspond to vectors of $F$ fixed by the holonomy group. With holonomy $SO(2)$ on $S^2$ no nonzero tangent vector is fixed, so $S^2$ has no parallel vector fields.`,
    ],
    ahead: r`Parallel transport also gives back the covariant derivative (Prop. 1.7.17): Station 1.5a computes $\nabla$ both ways.`,
  },
  '1.5a': {
    see: r`Left: a tangent vector field $V$ on $S^2$ (grey arrows), a point $m$ (white) and a direction $X$ (cyan). The green arc is the great circle $\gamma$ leaving $m$ along $X$, run for time $t$. At $m$ you see $V(m)$ (white), the value $V(\gamma(t))$ carried back to $m$ by parallel transport (green), the difference quotient between the two (orange) and the covariant derivative $\nabla_X V$ (red). Right: the tangent plane at $m$. The blue and purple arrows are the two terms of the local formula (1.5.8), placed tip to tail. They add up to the red arrow.`,
    tryIt: [
      r`Press "shrink t". As $t \to 0$ the orange quotient settles onto the red arrow, and the gap in the readout shrinks roughly in proportion to $t$. Parallel transport alone determines $\nabla$.`,
      r`Switch between the frames $s_N$ and $s_S$. The blue and purple arrows both jump, while their sum, the red arrow, does not move. Each term depends on the frame you pick; $\nabla_X V$ does not.`,
      r`Choose the rotation field and point $X$ along it. Rotations are symmetries of the sphere, yet $\nabla_X V$ is usually not zero: a Killing field is not parallel. In fact $S^2$ has no nonzero parallel field at all (Station 1.7b).`,
      r`Choose the gradient of the height and tap near a pole, where $V$ vanishes. There $\nabla_X V$ still exists and is the linearisation of the field at its zero.`,
    ],
    idea: [
      r`A connection on the frame bundle $SO(3)\to S^2$ (Stations 1.1c, 1.3d) induces a covariant derivative on the associated bundle $TS^2$ (Def. 1.5.2). It eats a vector field $V$ and a direction $X$ and returns a vector $\nabla_X V$ at the same point.`,
      r`To compute it, fix a local frame $e_\alpha$ induced by a section (here $s_N$, the normalised stereographic frame). Then $\nabla e_\alpha = \mathcal A^\beta{}_\alpha e_\beta$, where $\mathcal A$ is the local connection form, a $2\times 2$ antisymmetric matrix of 1-forms (Prop. 1.5.3).`,
      r`Write $V = \xi^\alpha e_\alpha$ and apply the Leibniz rule (Prop. 1.5.4). The result is (1.5.8): $\nabla_X V = (X\xi^\alpha)\,e_\alpha + \xi^\alpha\mathcal A^\beta{}_\alpha(X)\,e_\beta$. The first term (blue) differentiates the components. The second (purple) corrects for the frame turning as you move.`,
      r`Change the frame by a rotation $\rho$. The component term changes by a $d\rho$-piece, and $\mathcal A$ changes by exactly the opposite piece, so the sum is frame independent (Rem. 1.5.5). This is why the connection form $\mathcal A$ has to transform the way it does.`,
      r`For this connection the result is the Levi-Civita derivative of the round sphere: the tangential part of the ordinary derivative in $\mathbb R^3$. The second readout compares the two.`,
      r`The curvature $R(X,Y) = \nabla_X\nabla_Y - \nabla_Y\nabla_X - \nabla_{[X,Y]}$ (Prop. 1.5.11) measures how far covariant derivatives fail to commute. On the unit sphere it is $R(X,Y)V = \langle Y,V\rangle X - \langle X,V\rangle Y$: Gauss curvature 1. The last readout evaluates the commutator numerically and compares it with this.`,
    ],
    ahead: r`Prop. 1.7.17 (the orange arrow) is the converse picture: $\nabla$ is the infinitesimal version of parallel transport, and holonomy around small loops (Station 1.4a) is curvature integrated.`,
  },
  '1.6a': {
    see: r`A rank-2 vector bundle $E = S^1\times\mathbb R^2$ over a circle. Each fibre is drawn as a plane standing on the circle. The bundle carries a fibre metric $h$: in every fibre, the white ellipse is the set of $h$-unit vectors, and together these ellipses sweep out the translucent tube. The green and blue curves are the two vectors of a frame being parallel-transported around the circle. Right: the fibre at the current point $s$, seen face on.`,
    tryIt: [
      r`Press "go round" with the $h$-compatible connection. The frame vectors stay on the tube the whole way, and the readout $e^{\mathsf T} h e$ stays the identity. A frame that starts orthonormal stays orthonormal.`,
      r`Switch to the connection that is compatible only with the ordinary euclidean metric. Now the frame vectors leave the tube, and $e^{\mathsf T} h e$ drifts away from the identity. Set $\delta = 0$, so that $h$ is euclidean: the two connections now agree on what "orthonormal" means, and the drift disappears.`,
      r`With the compatible connection, move $\kappa$. The frame spins faster or slower inside the tube, but it never leaves it. Compatibility leaves exactly this freedom: an $\mathfrak{so}(2)$-valued term.`,
      r`On the right, the grey frame is arbitrary, and its Gram matrix $e^{\mathsf T}he$ is far from the identity. The purple frame $e\,(e^{\mathsf T}he)^{-1/2}$ is the nearest $h$-orthonormal frame. Every fibre contains such frames, and they form a single $O(2)$-orbit.`,
    ],
    idea: [
      r`Sending a frame $e$ to its Gram matrix $e^{\mathsf T}he$ is an equivariant map from the frame bundle to the positive definite matrices: $\tilde\Phi(e\,a) = a^{\mathsf T}\tilde\Phi(e)\,a$. $GL(2)$ acts transitively on positive definite matrices (Sylvester), and the stabiliser of $\mathbb 1$ is $O(2)$. So Prop. 1.6.2 applies: the level set $Q = \tilde\Phi^{-1}(\mathbb 1)$, the orthonormal frames, is a principal $O(2)$-subbundle (Ex. 1.6.6). Equivalently, by Cor. 1.6.5, a metric is a section of $L(E)\times_{GL(2)} GL(2)/O(2)$.`,
      r`Changing the reference point $f$ from $\mathbb 1$ to another inner product only conjugates the structure group (Rem. 1.6.3). Reductions are about choosing a pattern in each fibre, not about which one.`,
      r`A connection on $L(E)$ reduces to $Q$ if its horizontal spaces are tangent to $Q$ (Def. 1.6.9). Prop. 1.6.10 turns this into a differential equation: the defining map $\tilde\Phi$ must be parallel, $\nabla h = 0$. Written out, this is the metric-compatibility rule (1.6.7): $X\,h(\Phi_1,\Phi_2) = h(\nabla_X\Phi_1,\Phi_2) + h(\Phi_1,\nabla_X\Phi_2)$ (Ex. 1.6.12).`,
      r`In the trivial frame of $\mathbb R^2$, with $\nabla\Phi = \Phi' + A\Phi$, the rule becomes $h' = A^{\mathsf T}h + hA$. Its general solution is $A = \tfrac12 h^{-1}h' + \kappa\,h^{-1}J$: a canonical part, plus a free skew part. The euclidean connection $A = \kappa J$ solves this only when $h' = 0$.`,
      r`For a compatible connection the holonomy around the circle lies in $SO(h)$: a rotation of $h$-orthonormal frames, read off in the second readout. It depends on $\kappa$ and on how far the ellipse's axes turn.`,
    ],
    ahead: r`§1.7 shows that every connection has a smallest reduction, its holonomy bundle (Station 1.7b), and that a connection is irreducible exactly when that bundle is all of $P$.`,
  },
  '1.8a': {
    see: r`A connection on the trivial $SU(2)$-bundle over the plane. Its local form $\mathcal A = \mathcal A_x dx + \mathcal A_y dy$ takes values in $\mathfrak{su}(2)$, which we draw as $\mathbb R^3$ via $\mathfrak{su}(2)\cong\operatorname{Im}\mathbb H$. Left: at each grid point, an arrow in this internal space shows $\mathcal A_x$, $\mathcal A_y$ or the curvature $\mathcal F_{xy}$. Grey arrows are the original; coloured arrows are after a gauge transformation $\rho_\tau$. Right: the internal space again. The curve is the parallel transport $g(t)$ around the green loop, drawn by its vector part. The dot at its end is the holonomy.`,
    tryIt: [
      r`Show $\mathcal F$ and sweep $\tau$. Every red arrow turns, but none of them changes length, and the readout confirms that $|\mathcal F|$ is unchanged. A gauge transformation acts on curvature by a pointwise rotation, $\mathrm{Ad}_{\rho^{-1}}$.`,
      r`Show $\mathcal A_x$ instead and sweep again. Now the arrows also grow and shrink: the extra term $\rho^{-1}d\rho$ is not a rotation. The potential is not a tensor; only the curvature is.`,
      r`On the right, the orange holonomy moves as $\tau$ changes, but it stays on the blue sphere. Its distance from the centre is fixed by $\operatorname{tr}\,\mathrm{Hol}$, which the readout shows is unchanged. That trace is the Wilson loop, a gauge-invariant observable.`,
      r`Make $\rho$ wilder. The potential can be scrambled as much as you like, but the curvature lengths and the Wilson loop do not move.`,
    ],
    idea: [
      r`A gauge transformation is a vertical automorphism $\vartheta$ of $P$: it moves points only within their fibres (Rem. 1.8.1). By Prop. 1.8.3 it is the same thing as an equivariant map $u: P\to G$, $\vartheta(p) = p\cdot u(p)$. In a local section $s$ it becomes a function $\rho = u\circ s$ on the base (Rem. 1.8.6); here, $\rho = e^{\alpha i}e^{\beta j}e^{\gamma k}$ with angle functions scaled by $\tau$.`,
      r`Pulling back by $\vartheta$ gives (1.8.7) and (1.8.8): $\vartheta^*\omega = \mathrm{Ad}_{u^{-1}}\omega + u^*\theta$ and $\vartheta^*\Omega = \mathrm{Ad}_{u^{-1}}\Omega$. For matrix groups these read $u^{-1}\omega u + u^{-1}du$ and $u^{-1}\Omega u$. On local representatives, $\mathcal A\mapsto\rho^{-1}\mathcal A\rho + \rho^{-1}d\rho$ and $\mathcal F\mapsto\rho^{-1}\mathcal F\rho$ (Rem. 1.8.8).`,
      r`Unlike the $U(1)$ case of Station 1.3b, $\mathrm{Ad}$ is no longer trivial, so even $\mathcal F$ changes. It changes only by conjugation, though, which in $\mathfrak{su}(2)\cong\mathbb R^3$ is a rotation. The curvature is computed from $\mathcal F = d\mathcal A + \tfrac12[\mathcal A\wedge\mathcal A]$, so the commutator term $[\mathcal A_x,\mathcal A_y]$ matters here.`,
      r`Holonomy transforms by conjugation, $\mathrm{Hol}' = \rho(x_0)^{-1}\,\mathrm{Hol}\,\rho(x_0)$, because the new section starts at a different point of the fibre over $x_0$. Conjugation keeps the trace, so $\operatorname{tr}\,\mathrm{Hol}$ is gauge invariant. For small loops, $\mathrm{Hol}\approx 1 - \text{area}\cdot\mathcal F$, which is how the pointwise law for $\mathcal F$ and the conjugation law for $\mathrm{Hol}$ fit together.`,
    ],
    ahead: r`These transformation laws are why Yang–Mills theory is built from $\operatorname{tr}(\mathcal F\wedge{\star}\mathcal F)$ and Wilson loops. For a curvature that is self-dual, see the quaternionic Hopf bundle in Station 1.4b.`,
  },
};
