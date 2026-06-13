# CLAUDE.md — bundle (forthcoming instrument)

**Status: scaffold only. The full spec for this subproject has not arrived yet.**

Do **not** build features, widgets, or math here until the spec is provided. For
now this is a minimal Vite + TypeScript skeleton that builds to a placeholder
page served at `/R-S-Visualizations/bundle/`.

When the spec arrives, a session working here must read, in order:

1. the **root** `/CLAUDE.md` (shared conventions for the whole monorepo), then
2. **this** file (which the spec will expand).

Shared, framework-agnostic math lives in the `@rsvis/math` workspace package and
is already wired as a dependency — import it as `import { … } from '@rsvis/math'`
rather than copying primitives in. Anything genuinely reusable you write should be
proposed for promotion into `@rsvis/math` (with its own tests) rather than kept
local.
